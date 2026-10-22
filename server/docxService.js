const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const cheerio = require('cheerio');
const docx = require('docx');
const uuidv4 = () => require('crypto').randomUUID();

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType
} = docx;

/**
 * Enhance and format Word HTML to preserve official government document styling:
 * - Kop Lampiran Perbup (right-aligned header)
 * - Signature block (right-aligned with signature space)
 * - Paraf Koordinasi table (exact width, cyan border)
 */
function enhanceWordHtml(html) {
  const $ = cheerio.load(html, null, false);

  // 1. Detect & Format Kop Lampiran (LAMPIRAN PERATURAN BUPATI CILACAP)
  const lampiranParas = [];
  $('p').each((i, el) => {
    const text = $(el).text().trim();
    if (
      text === 'LAMPIRAN' ||
      text.includes('PERATURAN BUPATI CILACAP') ||
      text.startsWith('NOMOR') ||
      text === 'TENTANG' ||
      text.includes('RENCANA KERJA PEMERINTAH DAERAH')
    ) {
      lampiranParas.push(el);
    }
  });

  if (lampiranParas.length >= 3) {
    const kopHtml = `
      <div class="kop-lampiran-perbup" style="margin-left: auto; width: 340px; margin-bottom: 28pt; font-weight: bold; font-size: 11pt; line-height: 1.35; text-align: left; text-transform: uppercase;">
        ${lampiranParas.map(el => `<div style="margin-bottom: 2pt;">${$(el).html()}</div>`).join('')}
      </div>
    `;
    $(lampiranParas[0]).before(kopHtml);
    lampiranParas.forEach(el => $(el).remove());
  }

  // 2. Detect & Format Signature Block (Plt. BUPATI CILACAP ... AMMY AMALIA FATMA SURYA)
  $('p').each((i, el) => {
    const text = $(el).text().trim();
    if (text.includes('BUPATI CILACAP')) {
      const nextEl = $(el).next('p');
      const bupatiName = nextEl ? nextEl.text().trim() : '';

      if (bupatiName.includes('AMMY') || bupatiName.length > 5) {
        const sigHtml = `
          <div class="signature-perbup-block" style="margin-left: auto; width: 320px; text-align: center; margin-top: 32pt; margin-bottom: 24pt;">
            <p style="margin: 0; font-weight: bold; font-size: 12pt; text-align: center;">${text}</p>
            <div style="height: 60pt;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12pt; text-decoration: underline; text-align: center;">${bupatiName}</p>
          </div>
        `;
        $(el).before(sigHtml);
        $(el).remove();
        if (nextEl) nextEl.remove();
      }
    }
  });

  // 3. Detect & Format Paraf Koordinasi Table (J A B A T A N | PARAF)
  $('table').each((i, el) => {
    const tableText = $(el).text();
    if (tableText.includes('PARAF') && tableText.includes('J A B A T A N')) {
      $(el).addClass('table-paraf-koordinasi');
      $(el).attr('style', 'width: 320px; border-collapse: collapse; margin-top: 16pt; margin-bottom: 24pt; font-size: 9.5pt; border: 1.5px solid #00b0f0;');
      
      $(el).find('tr').each((rIdx, rEl) => {
        const isHeader = rIdx === 0;
        $(rEl).find('td, th').each((cIdx, cEl) => {
          if (cIdx === 0) {
            $(cEl).attr('style', `border: 1px solid #00b0f0; padding: 4px 8px; width: 230px; text-align: ${isHeader ? 'center' : 'left'}; font-weight: ${isHeader ? 'bold' : 'normal'};`);
          } else {
            $(cEl).attr('style', `border: 1px solid #00b0f0; padding: 4px 8px; width: 90px; text-align: center; font-weight: ${isHeader ? 'bold' : 'normal'};`);
          }
        });
      });
    }
  });

  return $.html();
}

/**
 * Parse an uploaded DOCX file into structured sections (Bab, Sub-Bab, Narasi)
 * Mengikuti struktur hirarki penomoran Microsoft Word (Heading 1 s.d. Heading 5)
 */
async function parseDocxToSections(filePath, documentId) {
  const mammothOptions = {
    styleMap: [
      "p[style-name='Heading 1'] => h1:fresh",
      "p[style-name='Heading 2'] => h2:fresh",
      "p[style-name='Heading 3'] => h3:fresh",
      "p[style-name='Heading 4'] => h4:fresh",
      "p[style-name='Heading 5'] => h5:fresh",
      "p[style-name='Heading 6'] => h6:fresh"
    ]
  };

  const result = await mammoth.convertToHtml({ path: filePath }, mammothOptions);
  const rawHtml = result.value;
  const html = enhanceWordHtml(rawHtml);
  const $ = cheerio.load(html);

  // Deteksi Bab (1 s.d 7) dari nama file (BUKAN full path agar tidak terbentur nama folder induk)
  const fileName = path.basename(filePath);
  let chapterNum = 1;
  const romanMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7 };
  const numToRoman = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII' };
  const chapMatch = fileName.match(/BAB\s+([IVXLCDM\d]+)/i);
  if (chapMatch) {
    const rawChap = chapMatch[1].toUpperCase();
    chapterNum = romanMap[rawChap] || parseInt(rawChap, 10) || 1;
  }
  const romanChapter = numToRoman[chapterNum] || 'I';

  const sections = [];
  let currentSection = null;
  let orderIndex = 1;
  let pendingIntroElements = [];

  let idxL2 = 0;
  let idxL3 = 0;
  let idxL4 = 0;
  let idxL5 = 0;

  // We walk through top-level elements of body
  const bodyChildren = $('body').children();

  function finalizeCurrentSection() {
    if (currentSection) {
      currentSection.content = currentSection.contentElements.join('').trim();
      delete currentSection.contentElements;
      sections.push(currentSection);
      currentSection = null;
    }
  }

  bodyChildren.each((i, el) => {
    const tagName = el.tagName ? el.tagName.toLowerCase() : '';
    const text = $(el).text().trim();
    const elementHtml = $.html(el);

    if (!text && tagName !== 'table') {
      if (currentSection) currentSection.contentElements.push(elementHtml);
      else pendingIntroElements.push(elementHtml);
      return;
    }

    // Tabel adalah konten naskah, tidak boleh dijadikan sub-bab baru
    if (tagName === 'table') {
      if (currentSection) currentSection.contentElements.push(elementHtml);
      else pendingIntroElements.push(elementHtml);
      return;
    }

    // Abaikan jika hanya berupa keterangan gambar atau tabel (jangan dijadikan sub-bab)
    if (/^(Gambar|Tabel|Bagan|Grafik)\s+\d/i.test(text)) {
      if (currentSection) currentSection.contentElements.push(elementHtml);
      else pendingIntroElements.push(elementHtml);
      return;
    }

    const startsWithBab = /^BAB\s+[IVXLCDM\d]+/i.test(text);
    const startsWithNum4 = /^\d+\.\d+\.\d+\.\d+\.?\s+/.test(text);
    const startsWithNum3 = /^\d+\.\d+\.\d+\.?\s+/.test(text);
    const startsWithNum2 = /^\d+\.\d+\.?\s+/.test(text);
    const startsWithItemParen = /^\d+\)\s+/.test(text);

    let detectedLevel = null;
    let code = '';
    let title = text;

    if (tagName === 'h1' || startsWithBab) {
      detectedLevel = 1;
      idxL2 = 0; idxL3 = 0; idxL4 = 0; idxL5 = 0;
      const m = text.match(/^(BAB\s+[IVXLCDM\d]+)[:\.\s-]*(.*)$/i);
      if (m) {
        const rawNum = m[1].replace(/BAB\s*/i, '').trim().toUpperCase();
        const numVal = romanMap[rawNum] || parseInt(rawNum, 10) || chapterNum;
        code = `BAB ${numToRoman[numVal] || romanChapter}`;
        title = m[2] ? m[2].trim() : text;
      } else {
        code = `BAB ${romanChapter}`;
        title = text;
      }
    } else if (tagName === 'h2' || (startsWithNum2 && !startsWithNum3 && !startsWithNum4)) {
      detectedLevel = 2;
      idxL2++;
      idxL3 = 0; idxL4 = 0; idxL5 = 0;
      const m = text.match(/^(\d+\.\d+)[:\.\s-]*(.*)$/);
      code = m ? m[1].trim() : `${chapterNum}.${idxL2}`;
      title = m && m[2] ? m[2].trim() : text;
    } else if (tagName === 'h3' || (startsWithNum3 && !startsWithNum4)) {
      detectedLevel = 3;
      idxL3++;
      idxL4 = 0; idxL5 = 0;
      const m = text.match(/^(\d+\.\d+\.\d+)[:\.\s-]*(.*)$/);
      code = m ? m[1].trim() : `${chapterNum}.${idxL2 || 1}.${idxL3}`;
      title = m && m[2] ? m[2].trim() : text;
    } else if (tagName === 'h4' || startsWithNum4) {
      detectedLevel = 4;
      idxL4++;
      idxL5 = 0;
      const m = text.match(/^(\d+\.\d+\.\d+\.\d+\.?)[:\s-]*(.*)$/);
      code = m ? m[1].trim() : `${chapterNum}.${idxL2 || 1}.${idxL3 || 1}.${idxL4}.`;
      title = m && m[2] ? m[2].trim() : text;
    } else if (tagName === 'h5' || startsWithItemParen) {
      detectedLevel = 5;
      idxL5++;
      const m = text.match(/^(\d+\))[:\s-]*(.*)$/);
      code = m ? m[1].trim() : `${idxL5})`;
      title = m && m[2] ? m[2].trim() : text;
    }

    if (detectedLevel !== null && text.length > 0) {
      finalizeCurrentSection();

      // Bersihkan title dari tabulasi atau nomor halaman di akhir (misal: "Penggunaan Lahan \t 10")
      title = title.replace(/\t\d+$/, '').replace(/^\s*[:\.-]\s*/, '').trim();

      const initialElements = pendingIntroElements.length > 0 ? [...pendingIntroElements, elementHtml] : [elementHtml];
      pendingIntroElements = [];

      currentSection = {
        id: 'sec_' + uuidv4().substring(0, 8),
        documentId,
        order: orderIndex++,
        level: detectedLevel,
        code: code,
        title: title || `Bagian ${orderIndex}`,
        contentElements: initialElements,
        assignedUserIds: [],
        status: 'DRAFT',
        isLocked: false,
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      if (currentSection) {
        currentSection.contentElements.push(elementHtml);
      } else {
        pendingIntroElements.push(elementHtml);
      }
    }
  });

  finalizeCurrentSection();

  // If no sections were found (empty document or plain text), create fallback section
  if (sections.length === 0) {
    sections.push({
      id: 'sec_' + uuidv4().substring(0, 8),
      documentId,
      order: 1,
      level: 1,
      code: `BAB ${romanChapter}`,
      title: 'Naskah Dokumen',
      content: pendingIntroElements.join('').trim() || html || '<p>Dokumen belum memiliki konten narasi.</p>',
      assignedUserIds: [],
      status: 'DRAFT',
      isLocked: false,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  sections.fullHtml = html;
  return sections;
}

/**
 * Generate standard template for RKPD BAB II with pre-configured sections and OPD assignees
 */
function generateRkpdBab2Template(documentId) {
  const sections = [
    {
      id: 'sec_rkpd_bab2',
      documentId,
      order: 1,
      level: 1,
      code: 'BAB II',
      title: 'GAMBARAN UMUM KONDISI DAERAH DAN EVALUASI HASIL RKPD',
      content: '<p>Bab ini memuat gambaran menyeluruh mengenai kondisi umum daerah serta evaluasi terhadap hasil pelaksanaan RKPD periode sebelumnya. Penyusunan bagian ini mengacu pada ketentuan Permendagri Nomor 86 Tahun 2017 untuk memberikan potret objektif atas capaian kinerja pembangunan, dinamika indikator makro, serta isu-isu strategis yang dihadapi daerah.</p>',
      assignedUserIds: ['user_admin'],
      status: 'APPROVED',
      isLocked: false,
      comments: []
    },
    {
      id: 'sec_rkpd_2_1',
      documentId,
      order: 2,
      level: 2,
      code: '2.1',
      title: 'Kondisi Umum Daerah',
      content: '<p>Analisis kondisi umum daerah mencakup telaah terhadap aspek geografi dan demografi, aspek kesejahteraan masyarakat, aspek pelayanan umum, serta aspek daya saing daerah guna melihat potensi, tantangan, dan daya dukung lingkungan dalam perencanaan pembangunan daerah ke depan.</p>',
      assignedUserIds: ['user_admin', 'user_ppm'],
      status: 'IN_PROGRESS',
      isLocked: false,
      comments: []
    },
    {
      id: 'sec_rkpd_2_1_1',
      documentId,
      order: 3,
      level: 3,
      code: '2.1.1',
      title: 'Aspek Geografi dan Demografi',
      content: '<p><strong>A. Karakteristik Lokasi dan Wilayah Administrasi</strong></p><p>Kabupaten terletak pada posisi strategis di bagian selatan pulau Jawa, dengan luas wilayah administratif yang terbagi ke dalam berbagai kecamatan dan desa/kelurahan. Wilayah ini memiliki karakteristik bentang alam yang bervariasi mulai dari dataran rendah pesisir, perbukitan, hingga kawasan pegunungan.</p><table border="1" style="width: 100%; border-collapse: collapse; margin-top: 10px;"><thead><tr style="background-color: #f1f5f9;"><th style="padding: 8px; border: 1px solid #cbd5e1;">No</th><th style="padding: 8px; border: 1px solid #cbd5e1;">Indikator Kewilayahan</th><th style="padding: 8px; border: 1px solid #cbd5e1;">Satuan</th><th style="padding: 8px; border: 1px solid #cbd5e1;">Keterangan / Kondisi</th></tr></thead><tbody><tr><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">1</td><td style="padding: 8px; border: 1px solid #cbd5e1;">Luas Wilayah Daratan</td><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">Km²</td><td style="padding: 8px; border: 1px solid #cbd5e1;">2.138,50 Km²</td></tr><tr><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">2</td><td style="padding: 8px; border: 1px solid #cbd5e1;">Jumlah Kecamatan</td><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">Kecamatan</td><td style="padding: 8px; border: 1px solid #cbd5e1;">24 Kecamatan</td></tr><tr><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">3</td><td style="padding: 8px; border: 1px solid #cbd5e1;">Jumlah Desa/Kelurahan</td><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">Desa</td><td style="padding: 8px; border: 1px solid #cbd5e1;">269 Desa dan 15 Kelurahan</td></tr></tbody></table><p style="margin-top: 10px;"><strong>B. Dinamika Kependudukan</strong></p><p>Jumlah penduduk berdasarkan data registrasi dan proyeksi BPS tercatat terus mengalami pertumbuhan dengan struktur piramida penduduk yang berada pada fase bonus demografi, di mana proporsi penduduk usia produktif mendominasi.</p>',
      assignedUserIds: ['user_ppm'],
      status: 'IN_PROGRESS',
      isLocked: false,
      comments: [
        {
          id: 'c1',
          authorName: 'Dr. Joko Susanto (Reviewer)',
          authorRole: 'REVIEWER',
          text: 'Mohon cantumkan sumber data BPS tahun terbaru pada tabel kewilayahan dan cantumkan rasio ketergantungan (dependency ratio).',
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 'sec_rkpd_2_1_2',
      documentId,
      order: 4,
      level: 3,
      code: '2.1.2',
      title: 'Aspek Kesejahteraan Masyarakat dan Penanggulangan Kemiskinan',
      content: '<p>Kesejahteraan masyarakat diukur melalui indikator makro ekonomi, angka kemiskinan, serta pemerataan pendapatan (Gini Ratio).</p><p>Laju Pertumbuhan Ekonomi (LPE) daerah menunjukkan tren pemulihan yang positif pasca pandemi, didukung oleh sektor industri pengolahan, pertanian, kehutanan dan perikanan, serta perdagangan besar dan eceran.</p><table border="1" style="width: 100%; border-collapse: collapse; margin-top: 10px;"><thead><tr style="background-color: #f1f5f9;"><th style="padding: 8px; border: 1px solid #cbd5e1;">Indikator</th><th style="padding: 8px; border: 1px solid #cbd5e1;">2023</th><th style="padding: 8px; border: 1px solid #cbd5e1;">2024</th><th style="padding: 8px; border: 1px solid #cbd5e1;">2025 (Estimasi)</th><th style="padding: 8px; border: 1px solid #cbd5e1;">Target 2026/2027</th></tr></thead><tbody><tr><td style="padding: 8px; border: 1px solid #cbd5e1;">Pertumbuhan Ekonomi (%)</td><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">5,23</td><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">5,45</td><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">5,60</td><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">5,75 - 6,10</td></tr><tr><td style="padding: 8px; border: 1px solid #cbd5e1;">Tingkat Kemiskinan (%)</td><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">11,02</td><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">10,35</td><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">9,80</td><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">&lt; 9,00</td></tr><tr><td style="padding: 8px; border: 1px solid #cbd5e1;">Gini Ratio</td><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">0,345</td><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">0,338</td><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">0,330</td><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">0,320</td></tr></tbody></table>',
      assignedUserIds: ['user_ekonomi'],
      status: 'REVIEW',
      isLocked: false,
      comments: []
    },
    {
      id: 'sec_rkpd_2_1_3',
      documentId,
      order: 5,
      level: 3,
      code: '2.1.3',
      title: 'Urusan Pelayanan Kesehatan dan Penurunan Stunting',
      content: '<p>Peningkatan derajat kesehatan masyarakat terus didorong melalui penguatan puskesmas, pemerataan tenaga medis, percepatan penurunan prevalensi stunting, serta jaminan kesehatan semesta (Universal Health Coverage/UHC).</p><p>Prevalensi stunting berdasarkan hasil Survei Kesehatan Indonesia (SKI) dan e-PPGBM menunjukkan penurunan yang signifikan dari tahun ke tahun berkat konvergensi intervensi spesifik dan intervensi sensitif yang melibatkan seluruh pemangku kepentingan lintas sektoral.</p><p><strong>Target Indikator Kesehatan Utama:</strong></p><ul><li>Angka Kematian Ibu (AKI): Ditargetkan di bawah 70 per 100.000 kelahiran hidup.</li><li>Angka Kematian Bayi (AKB): Ditargetkan di bawah 10 per 1.000 kelahiran hidup.</li><li>Cakupan Kepesertaan BPJS (UHC): Telah melampaui 98,2% dari total penduduk.</li><li>Prevalensi Balita Stunting: Ditargetkan mencapai target nasional di bawah 12%.</li></ul>',
      assignedUserIds: ['user_dinkes'],
      status: 'IN_PROGRESS',
      isLocked: false,
      comments: [
        {
          id: 'c2',
          authorName: 'Admin Bappeda (Koordinator)',
          authorRole: 'ADMIN',
          text: 'Dinas Kesehatan mohon masukkan tabel rincian data sebaran stunting per kecamatan dengan prioritas lokus merah.',
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: 'sec_rkpd_2_1_4',
      documentId,
      order: 6,
      level: 3,
      code: '2.1.4',
      title: 'Urusan Pelayanan Pendidikan dan Peningkatan SDM',
      content: '<p>Pembangunan urusan pendidikan difokuskan pada peningkatan aksesibilitas dan mutu layanan pendidikan dasar (SD dan SMP) serta pendidikan anak usia dini (PAUD), dengan indikator kunci Harapan Lama Sekolah (HLS) dan Rata-rata Lama Sekolah (RLS).</p><p>Angka Partisipasi Murni (APM) untuk jenjang SD dan SMP dipertahankan pada tingkat optimal, dengan komitmen penuntasan Program Wajib Belajar 12 Tahun serta penanganan Anak Tidak Sekolah (ATS) melalui program beasiswa dan pendidikan non-formal/kesetaraan.</p>',
      assignedUserIds: ['user_disdik'],
      status: 'DRAFT',
      isLocked: false,
      comments: []
    },
    {
      id: 'sec_rkpd_2_2',
      documentId,
      order: 7,
      level: 2,
      code: '2.2',
      title: 'Evaluasi Hasil Pelaksanaan RKPD Tahun Lalu',
      content: '<p>Evaluasi pelaksanaan RKPD tahun sebelumnya dilakukan untuk mengukur efektivitas program, kegiatan, dan sub-kegiatan perangkat daerah dalam mencapai sasaran indikator kinerja utama (IKU) maupun indikator kinerja daerah (IKD).</p><p>Secara umum, realisasi keuangan mencapai 94,85% dan realisasi fisik rata-rata mencapai 96,20%. Faktor pendorong keberhasilan antara lain komitmen pimpinan, integrasi sistem informasi SIPD, dan pengawasan berkala melalui rapat koordinasi pengendalian dan evaluasi.</p>',
      assignedUserIds: ['user_admin'],
      status: 'APPROVED',
      isLocked: true,
      comments: []
    }
  ];

  return sections.map(s => ({
    ...s,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
}

/**
 * Re-compile sections into a clean Microsoft Word (.docx) file
 */
async function exportSectionsToDocx(docMetadata, sections) {
  const children = [];

  // Title page / Cover Header
  children.push(
    new Paragraph({
      text: docMetadata.title || 'DOKUMEN PERENCANAAN DAERAH',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    new Paragraph({
      text: docMetadata.description || 'Pemerintah Kabupaten Cilacap - Badan Perencanaan Pembangunan Daerah',
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Tanggal Kompilasi: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
          italics: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 }
    })
  );

  // Iterate over sections in order
  for (const sec of sections) {
    let headingLevel = HeadingLevel.HEADING_1;
    if (sec.level === 2) headingLevel = HeadingLevel.HEADING_2;
    if (sec.level === 3) headingLevel = HeadingLevel.HEADING_3;
    if (sec.level >= 4) headingLevel = HeadingLevel.HEADING_4;

    const fullTitle = sec.code ? `${sec.code} ${sec.title}` : sec.title;

    // Add Section Heading
    children.push(
      new Paragraph({
        text: fullTitle,
        heading: headingLevel,
        spacing: { before: 300, after: 150 }
      })
    );

    // Convert section HTML content to DOCX elements
    if (sec.content) {
      const $ = cheerio.load(`<div>${sec.content}</div>`);
      
      // Process elements
      $('div').children().each((idx, el) => {
        const tagName = el.tagName ? el.tagName.toLowerCase() : '';
        const nodeText = $(el).text().trim();

        if (['p', 'div', 'blockquote'].includes(tagName)) {
          if (nodeText.length > 0) {
            // Build text runs with bold/italic parsing
            const runs = [];
            $(el).contents().each((_, child) => {
              if (child.type === 'text') {
                runs.push(new TextRun({ text: $(child).text() }));
              } else if (child.name === 'strong' || child.name === 'b') {
                runs.push(new TextRun({ text: $(child).text(), bold: true }));
              } else if (child.name === 'em' || child.name === 'i') {
                runs.push(new TextRun({ text: $(child).text(), italics: true }));
              } else if (child.name === 'u') {
                runs.push(new TextRun({ text: $(child).text(), underline: {} }));
              } else {
                runs.push(new TextRun({ text: $(child).text() }));
              }
            });

            children.push(
              new Paragraph({
                children: runs.length ? runs : [new TextRun({ text: nodeText })],
                spacing: { after: 120 }
              })
            );
          }
        } else if (tagName === 'ul' || tagName === 'ol') {
          $(el).find('li').each((liIdx, liEl) => {
            const liText = $(liEl).text().trim();
            if (liText) {
              children.push(
                new Paragraph({
                  children: [new TextRun({ text: liText })],
                  bullet: tagName === 'ul' ? { level: 0 } : undefined,
                  numbering: tagName === 'ol' ? { reference: 'default-numbering', level: 0 } : undefined,
                  spacing: { after: 80 }
                })
              );
            }
          });
        } else if (tagName === 'table') {
          const rows = [];
          $(el).find('tr').each((trIdx, trEl) => {
            const cells = [];
            $(trEl).find('th, td').each((tdIdx, cellEl) => {
              const cellText = $(cellEl).text().trim();
              const isHeader = cellEl.name === 'th' || trIdx === 0;

              cells.push(
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cellText,
                          bold: isHeader
                        })
                      ],
                      alignment: cellText.match(/^\d+/) ? AlignmentType.CENTER : AlignmentType.LEFT
                    })
                  ],
                  shading: isHeader ? { fill: 'E2E8F0' } : undefined,
                  margins: {
                    top: 100,
                    bottom: 100,
                    left: 150,
                    right: 150
                  }
                })
              );
            });

            if (cells.length > 0) {
              rows.push(new TableRow({ children: cells }));
            }
          });

          if (rows.length > 0) {
            children.push(
              new Table({
                rows: rows,
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE
                }
              }),
              new Paragraph({ text: '', spacing: { after: 120 } })
            );
          }
        } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
          children.push(
            new Paragraph({
              text: nodeText,
              heading: HeadingLevel.HEADING_4,
              spacing: { before: 150, after: 100 }
            })
          );
        }
      });
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children
      }
    ]
  });

  return await Packer.toBuffer(doc);
}

module.exports = {
  enhanceWordHtml,
  parseDocxToSections,
  generateRkpdBab2Template,
  exportSectionsToDocx
};
