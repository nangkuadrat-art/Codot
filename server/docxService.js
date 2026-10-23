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
  AlignmentType,
  PageOrientation,
  Header,
  Footer,
  PageNumber
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

      // Auto-detect table columns for orientation and typography
      let maxCols = 0;
      let hasTable = false;
      if (currentSection.content && currentSection.content.includes('<table')) {
        hasTable = true;
        const $sec = cheerio.load(currentSection.content);
        $sec('table').each((_, tbl) => {
          $sec(tbl).find('tr').each((__, row) => {
            const cols = $sec(row).find('th, td').length;
            if (cols > maxCols) maxCols = cols;
          });
        });
      }
      currentSection.orientation = maxCols >= 6 ? 'landscape' : 'portrait';
      currentSection.tableFontSize = maxCols >= 10 ? '8.5pt' : (maxCols >= 6 ? '9pt' : '10pt');
      currentSection.hasTable = hasTable;
      currentSection.maxTableColumns = maxCols;

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

    // Abaikan jika hanya berupa keterangan gambar, tabel, grafik, bagan, atau peta
    if (/^(Gambar|Tabel|Bagan|Grafik|Peta|Lampiran)\s+\d/i.test(text)) {
      if (currentSection) currentSection.contentElements.push(elementHtml);
      else pendingIntroElements.push(elementHtml);
      return;
    }

    // Abaikan baris Daftar Isi (TOC) yang memiliki tabulasi ke nomor halaman di akhir (misal: "...\t IV-2" atau "...\t 25")
    if (/\t\s*(IV|V|VI|VII|I|II|III|-|\d+)\b/i.test(text) || /\t\s*\d+$/i.test(text)) {
      if (currentSection) currentSection.contentElements.push(elementHtml);
      else pendingIntroElements.push(elementHtml);
      return;
    }

    // Abaikan angka acak atau statistik narasi (misal: "2.335 jiwa", "86.1 %", "28.937.635.297")
    if (/^\d+[\.,]\d+\s*(jiwa|orang|ha|km|m|%|persen|Rp|tahun|ribu|juta|miliar|triliun)/i.test(text)) {
      if (currentSection) currentSection.contentElements.push(elementHtml);
      else pendingIntroElements.push(elementHtml);
      return;
    }
    if (/^\d{2,}[\.,]\d+/.test(text)) {
      if (currentSection) currentSection.contentElements.push(elementHtml);
      else pendingIntroElements.push(elementHtml);
      return;
    }

    // Abaikan butir rincian narasi biasa (misal: "1) ...", "(1) ...", "a. ...")
    if (!['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName) && /^(\d+\)|\([0-9]+\)|[a-z]\.|\([a-z]\))\s+/.test(text)) {
      if (currentSection) currentSection.contentElements.push(elementHtml);
      else pendingIntroElements.push(elementHtml);
      return;
    }

    const startsWithBab = /^BAB\s+[IVXLCDM\d]+/i.test(text);
    const subChapRegex2 = new RegExp(`^${chapterNum}\\.\\d+\\.?\\s+[A-Za-z]`);
    const subChapRegex3 = new RegExp(`^${chapterNum}\\.\\d+\\.\\d+\\.?\\s+[A-Za-z]`);
    const subChapRegex4 = new RegExp(`^${chapterNum}\\.\\d+\\.\\d+\\.\\d+\\.?\\s+[A-Za-z]`);
    const subChapRegex5 = new RegExp(`^${chapterNum}\\.\\d+\\.\\d+\\.\\d+\\.\\d+\\.?\\s+[A-Za-z]`);

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
    } else if (tagName === 'h2' || (subChapRegex2.test(text) && !subChapRegex3.test(text) && !subChapRegex4.test(text) && !subChapRegex5.test(text))) {
      detectedLevel = 2;
      idxL2++;
      idxL3 = 0; idxL4 = 0; idxL5 = 0;
      const m = text.match(/^(\d+\.\d+)[:\.\s-]*(.*)$/);
      code = m ? m[1].trim() : `${chapterNum}.${idxL2}`;
      title = m && m[2] ? m[2].trim() : text;
    } else if (tagName === 'h3' || (subChapRegex3.test(text) && !subChapRegex4.test(text) && !subChapRegex5.test(text))) {
      detectedLevel = 3;
      idxL3++;
      idxL4 = 0; idxL5 = 0;
      const m = text.match(/^(\d+\.\d+\.\d+)[:\.\s-]*(.*)$/);
      code = m ? m[1].trim() : `${chapterNum}.${idxL2 || 1}.${idxL3}`;
      title = m && m[2] ? m[2].trim() : text;
    } else if (tagName === 'h4' || (subChapRegex4.test(text) && !subChapRegex5.test(text))) {
      detectedLevel = 4;
      idxL4++;
      idxL5 = 0;
      const m = text.match(/^(\d+\.\d+\.\d+\.\d+\.?)[:\s-]*(.*)$/);
      code = m ? m[1].trim() : `${chapterNum}.${idxL2 || 1}.${idxL3 || 1}.${idxL4}`;
      title = m && m[2] ? m[2].trim() : text;
    } else if (tagName === 'h5' || subChapRegex5.test(text)) {
      detectedLevel = 5;
      idxL5++;
      const m = text.match(/^(\d+\.\d+\.\d+\.\d+\.\d+\.?|[a-z]\.|\d+\))[:\s-]*(.*)$/i);
      code = m ? m[1].trim() : '';
      title = m && m[2] ? m[2].trim() : text;
    } else if (tagName === 'h6') {
      detectedLevel = 6;
      code = '';
      title = text;
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
/**
 * Helper to convert HTML elements to DOCX paragraphs / tables with exact typography
 */
function convertHtmlToDocxElements(html, isLandscape = false) {
  const elements = [];
  if (!html) return elements;

  const $ = cheerio.load(`<div>${html}</div>`);

  $('div').children().each((idx, el) => {
    const tagName = el.tagName ? el.tagName.toLowerCase() : '';
    const nodeText = $(el).text().trim();

    if (['p', 'div', 'blockquote'].includes(tagName)) {
      if (nodeText.length > 0) {
        const runs = [];
        $(el).contents().each((_, child) => {
          const t = $(child).text();
          if (!t) return;
          if (child.type === 'text') {
            runs.push(new TextRun({ text: t, font: 'Bookman Old Style', size: 24 }));
          } else if (child.name === 'strong' || child.name === 'b') {
            runs.push(new TextRun({ text: t, bold: true, font: 'Bookman Old Style', size: 24 }));
          } else if (child.name === 'em' || child.name === 'i') {
            runs.push(new TextRun({ text: t, italics: true, font: 'Bookman Old Style', size: 24 }));
          } else if (child.name === 'u') {
            runs.push(new TextRun({ text: t, underline: {}, font: 'Bookman Old Style', size: 24 }));
          } else {
            runs.push(new TextRun({ text: t, font: 'Bookman Old Style', size: 24 }));
          }
        });

        // Determine alignment
        let align = AlignmentType.JUSTIFIED;
        const style = $(el).attr('style') || '';
        if (style.includes('text-align: center') || $(el).hasClass('text-center')) {
          align = AlignmentType.CENTER;
        } else if (style.includes('text-align: right') || $(el).hasClass('text-right')) {
          align = AlignmentType.RIGHT;
        }

        elements.push(
          new Paragraph({
            children: runs.length ? runs : [new TextRun({ text: nodeText, font: 'Bookman Old Style', size: 24 })],
            alignment: align,
            spacing: { before: 0, after: 120, line: 288 } // 6pt after, 1.2 line spacing
          })
        );
      }
    } else if (tagName === 'ul' || tagName === 'ol') {
      $(el).find('li').each((liIdx, liEl) => {
        const liText = $(liEl).text().trim();
        if (liText) {
          elements.push(
            new Paragraph({
              children: [new TextRun({ text: liText, font: 'Bookman Old Style', size: 24 })],
              bullet: tagName === 'ul' ? { level: 0 } : undefined,
              numbering: tagName === 'ol' ? { reference: 'default-numbering', level: 0 } : undefined,
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 80, line: 288 }
            })
          );
        }
      });
    } else if (tagName === 'table') {
      const rows = [];
      let maxCols = 0;

      // First pass to determine max columns
      $(el).find('tr').each((_, trEl) => {
        const cols = $(trEl).find('th, td').length;
        if (cols > maxCols) maxCols = cols;
      });

      // Font size based on column density matching official Perbup
      const cellFontSize = maxCols >= 10 ? 17 : (maxCols >= 6 ? 18 : 20); // 8.5pt, 9pt, or 10pt

      $(el).find('tr').each((trIdx, trEl) => {
        const cells = [];
        const isHeaderRow = trIdx === 0 || $(trEl).find('th').length > 0;

        $(trEl).find('th, td').each((tdIdx, cellEl) => {
          const cellText = $(cellEl).text().trim();
          const isHeaderCell = cellEl.name === 'th' || isHeaderRow;
          const isNumeric = /^[0-9\.,\-\/%]+$/.test(cellText);

          cells.push(
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cellText,
                      bold: isHeaderCell,
                      font: 'Bookman Old Style',
                      size: cellFontSize
                    })
                  ],
                  alignment: isHeaderCell || isNumeric ? AlignmentType.CENTER : AlignmentType.LEFT,
                  spacing: { before: 20, after: 20 }
                })
              ],
              shading: isHeaderCell ? { fill: 'F1F5F9' } : undefined,
              margins: {
                top: 80,
                bottom: 80,
                left: 100,
                right: 100
              }
            })
          );
        });

        if (cells.length > 0) {
          rows.push(
            new TableRow({
              children: cells,
              tableHeader: isHeaderRow, // Repeat header row across pages ala Word
              cantSplit: true // Prevent row from splitting across page breaks
            })
          );
        }
      });

      if (rows.length > 0) {
        elements.push(
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
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: nodeText,
              bold: true,
              font: 'Bookman Old Style',
              size: tagName === 'h1' ? 28 : (tagName === 'h2' ? 24 : 22)
            })
          ],
          alignment: tagName === 'h1' ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { before: 180, after: 100 }
        })
      );
    }
  });

  return elements;
}

/**
 * Re-compile sections into a clean Microsoft Word (.docx) file
 * Identical F4/Folio page setup, multi-section landscape/portrait, Bookman Old Style typography
 */
async function exportSectionsToDocx(docMetadata, sections) {
  const isBab2 = (docMetadata.title || '').includes('BAB II');

  // Running Header ala official Perbup
  const runningHeader = new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: 'RKPD Kabupaten Cilacap Tahun 2027',
            font: 'Bookman Old Style',
            size: 18,
            color: '666666'
          })
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 100 }
      })
    ]
  });

  // Running Footer ala official Perbup (RKPD Kabupaten Cilacap Tahun 2027  [Bab]-[Hal])
  const runningFooter = new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: 'RKPD Kabupaten Cilacap Tahun 2027',
            font: 'Bookman Old Style',
            size: 18
          }),
          new TextRun({
            text: '\t\tHal. ',
            font: 'Bookman Old Style',
            size: 18
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: 'Bookman Old Style',
            size: 18
          })
        ],
        alignment: AlignmentType.BOTH,
        spacing: { before: 100 }
      })
    ]
  });

  // Group consecutive sections by orientation
  const groupedSections = [];
  let currentGroup = null;

  for (const sec of sections) {
    const isLandscape = sec.orientation === 'landscape';
    if (!currentGroup || currentGroup.isLandscape !== isLandscape) {
      currentGroup = {
        isLandscape,
        sections: []
      };
      groupedSections.push(currentGroup);
    }
    currentGroup.sections.push(sec);
  }

  // If no sections, create a default portrait group
  if (groupedSections.length === 0) {
    groupedSections.push({ isLandscape: false, sections: [] });
  }

  const docSections = [];

  for (let gIdx = 0; gIdx < groupedSections.length; gIdx++) {
    const group = groupedSections[gIdx];
    const isLandscape = group.isLandscape;
    const children = [];

    // Title on very first section if compiling full document
    if (gIdx === 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: docMetadata.title || 'DOKUMEN PERENCANAAN DAERAH',
              bold: true,
              font: 'Bookman Old Style',
              size: 32 // 16pt
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 150 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: docMetadata.description || 'Pemerintah Kabupaten Cilacap - Badan Perencanaan Pembangunan Daerah',
              font: 'Bookman Old Style',
              size: 24 // 12pt
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        })
      );
    }

    // Add content for all sections in this orientation group
    for (const sec of group.sections) {
      let headingSize = 24; // 12pt
      let isBabHeader = sec.level === 1 || /^BAB\s+[IVXLCDM\d]+/i.test(sec.code || '');

      if (isBabHeader) headingSize = 28; // 14pt
      else if (sec.level >= 3) headingSize = 22; // 11pt

      const fullTitle = sec.code ? `${sec.code} ${sec.title}` : sec.title;

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: fullTitle,
              bold: true,
              font: 'Bookman Old Style',
              size: headingSize
            })
          ],
          alignment: isBabHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { before: 240, after: 120 }
        })
      );

      if (sec.content) {
        const bodyChildren = convertHtmlToDocxElements(sec.content, isLandscape);
        children.push(...bodyChildren);
      }
    }

    // Official F4 / Folio Dimensions & Margins
    // Folio Portrait: 216mm x 330mm (12240 x 18720 dxa)
    // Folio Landscape: 330mm x 216mm (18720 x 12240 dxa)
    const pageWidth = isLandscape ? 18720 : 12240;
    const pageHeight = isLandscape ? 12240 : 18720;

    const leftMarginDxa = isLandscape ? 1418 : (isBab2 ? 1985 : 2268); // 2.5cm landscape, 3.5cm Bab II, 4.0cm other
    const rightMarginDxa = isLandscape ? 1418 : (isBab2 ? 1191 : 1418); // 2.5cm landscape, 2.1cm Bab II, 2.5cm other
    const topMarginDxa = 1418; // 2.5cm
    const bottomMarginDxa = 1418; // 2.5cm

    docSections.push({
      properties: {
        page: {
          size: {
            width: pageWidth,
            height: pageHeight,
            orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT
          },
          margin: {
            top: topMarginDxa,
            bottom: bottomMarginDxa,
            left: leftMarginDxa,
            right: rightMarginDxa
          }
        }
      },
      headers: {
        default: runningHeader
      },
      footers: {
        default: runningFooter
      },
      children: children
    });
  }

  const doc = new Document({
    sections: docSections
  });

  return await Packer.toBuffer(doc);
}

/**
 * Export a single section as a complete standalone DOCX file for Direct Word Collaboration
 */
async function exportSingleSectionToDocx(section, docMetadata = {}) {
  const isLandscape = (section.orientation || 'portrait').toLowerCase() === 'landscape';
  const isBab2 = (docMetadata.title || '').includes('BAB II');

  const runningHeader = new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: 'RKPD Kabupaten Cilacap Tahun 2027',
            font: 'Bookman Old Style',
            size: 18,
            color: '666666'
          }),
          new TextRun({
            text: '\t\t' + (section.code ? `${section.code} ${section.title}` : (docMetadata.title || '')),
            font: 'Bookman Old Style',
            size: 18,
            color: '888888'
          })
        ],
        alignment: AlignmentType.BOTH,
        spacing: { after: 120 }
      })
    ]
  });

  const runningFooter = new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: 'RKPD Kabupaten Cilacap Tahun 2027',
            font: 'Bookman Old Style',
            size: 18
          }),
          new TextRun({
            text: '\t\tHal. ',
            font: 'Bookman Old Style',
            size: 18
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: 'Bookman Old Style',
            size: 18
          })
        ],
        alignment: AlignmentType.BOTH,
        spacing: { before: 120 }
      })
    ]
  });

  const children = [];

  // Opening Kop Lampiran if section order === 1
  if (section.order === 1) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'LAMPIRAN\nPERATURAN BUPATI CILACAP\nNOMOR        TAHUN 2026\nTENTANG\nRENCANA KERJA PEMERINTAH DAERAH KABUPATEN CILACAP TAHUN 2027',
            bold: true,
            font: 'Bookman Old Style',
            size: 21
          })
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 300 }
      })
    );
  }

  // Section Heading
  let headingSize = 24; // 12pt
  let isBabHeader = section.level === 1 || /^BAB\s+[IVXLCDM\d]+/i.test(section.code || '');
  if (isBabHeader) headingSize = 28; // 14pt
  else if (section.level >= 3) headingSize = 22; // 11pt

  const fullTitle = section.code ? `${section.code} ${section.title}` : section.title;
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: fullTitle,
          bold: true,
          font: 'Bookman Old Style',
          size: headingSize
        })
      ],
      alignment: isBabHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { before: 200, after: 140 }
    })
  );

  // Convert HTML content to docx elements
  if (section.content) {
    const bodyChildren = convertHtmlToDocxElements(section.content, isLandscape);
    children.push(...bodyChildren);
  }

  const pageWidth = isLandscape ? 18720 : 12240;
  const pageHeight = isLandscape ? 12240 : 18720;
  const leftMarginDxa = isLandscape ? 1418 : (isBab2 ? 1985 : 2268);
  const rightMarginDxa = isLandscape ? 1418 : (isBab2 ? 1191 : 1418);
  const topMarginDxa = 1418;
  const bottomMarginDxa = 1418;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: pageWidth,
              height: pageHeight,
              orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT
            },
            margin: {
              top: topMarginDxa,
              bottom: bottomMarginDxa,
              left: leftMarginDxa,
              right: rightMarginDxa
            }
          }
        },
        headers: { default: runningHeader },
        footers: { default: runningFooter },
        children: children
      }
    ]
  });

  return await Packer.toBuffer(doc);
}

/**
 * Parse an updated single section DOCX (saved from Word desktop) back into clean HTML
 */
async function parseSingleDocxToContent(bufferOrPath) {
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

  const input = typeof bufferOrPath === 'string'
    ? { path: bufferOrPath }
    : { buffer: bufferOrPath };

  const result = await mammoth.convertToHtml(input, mammothOptions);
  let rawHtml = result.value || '';
  let html = enhanceWordHtml(rawHtml);

  const $ = cheerio.load(html, null, false);

  // Remove duplicate heading if the user didn't modify it or if it repeats the section title
  const firstChild = $('body').children().first();
  if (firstChild.is('h1, h2, h3, h4, h5, h6')) {
    firstChild.remove();
  }

  const cleanedContent = $('body').html() || $.html();

  // Detect tables & max columns for auto-orientation
  let maxCols = 0;
  let hasTable = false;
  $('table').each((_, tbl) => {
    hasTable = true;
    $(tbl).find('tr').each((__, row) => {
      const cols = $(row).find('th, td').length;
      if (cols > maxCols) maxCols = cols;
    });
  });

  const orientation = maxCols >= 6 ? 'landscape' : 'portrait';
  const tableFontSize = maxCols >= 10 ? '8.5pt' : (maxCols >= 6 ? '9pt' : '10pt');

  return {
    contentHtml: cleanedContent.trim(),
    orientation,
    tableFontSize,
    hasTable,
    maxTableColumns: maxCols
  };
}

module.exports = {
  enhanceWordHtml,
  parseDocxToSections,
  generateRkpdBab2Template,
  exportSectionsToDocx,
  exportSingleSectionToDocx,
  parseSingleDocxToContent
};
