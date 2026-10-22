const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const mammoth = require('mammoth');
const cheerio = require('cheerio');

const templateDir = path.join(__dirname, '../Template');

const BAB_FILES = [
  { docId: 'doc_bab_i', fileName: 'RKPD 2027 PERBUP - BAB I (08.07).docx', roman: 'I', title: 'RKPD 2027 PERBUP - BAB I' },
  { docId: 'doc_bab_ii', fileName: 'RKPD 2027 PERBUP - BAB II (17.07) .docx', roman: 'II', title: 'RKPD 2027 PERBUP - BAB II' },
  { docId: 'doc_bab_iii', fileName: 'RKPD 2027 PERBUP - BAB III (10.07).docx', roman: 'III', title: 'RKPD 2027 PERBUP - BAB III' },
  { docId: 'doc_bab_iv', fileName: 'RKPD 2027 PERBUP - BAB IV (17.07).docx', roman: 'IV', title: 'RKPD 2027 PERBUP - BAB IV' },
  { docId: 'doc_bab_v', fileName: 'RKPD 2027 PERBUP - BAB V (16.07).docx', roman: 'V', title: 'RKPD 2027 PERBUP - BAB V' },
  { docId: 'doc_bab_vi', fileName: 'RKPD 2027 PERBUP - BAB VI (17.07).docx', roman: 'VI', title: 'RKPD 2027 PERBUP - BAB VI' },
  { docId: 'doc_bab_vii', fileName: 'RKPD 2027 PERBUP - BAB VII (09.07).docx', roman: 'VII', title: 'RKPD 2027 PERBUP - BAB VII' }
];

async function processBab(babMeta) {
  const filePath = path.join(templateDir, babMeta.fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }

  const buffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buffer);
  let docXml = await zip.file('word/document.xml').async('text');

  // Tag alignments and page breaks
  let pageCounter = 1;
  docXml = docXml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (pXml) => {
    let pTag = pXml;
    const isRight = /<w:jc\s+w:val="right"/.test(pXml);
    const isCenter = /<w:jc\s+w:val="center"/.test(pXml);
    const hasBreak = /<w:lastRenderedPageBreak\/>|<w:br[^>]*type="page"[^>]*>/.test(pXml);

    let prefix = '';
    if (hasBreak) {
      pageCounter++;
      prefix += `<w:r><w:t>___PAGE_BREAK_${pageCounter}___</w:t></w:r>`;
    }
    if (isRight) {
      prefix += `<w:r><w:t>___ALIGN_RIGHT___</w:t></w:r>`;
    } else if (isCenter) {
      prefix += `<w:r><w:t>___ALIGN_CENTER___</w:t></w:r>`;
    }

    if (prefix) {
      pTag = pTag.replace(/(<w:p\b[^>]*>)/, `$1${prefix}`);
    }
    return pTag;
  });

  zip.file('word/document.xml', docXml);
  const modifiedBuffer = await zip.generateAsync({ type: 'nodebuffer' });

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

  const result = await mammoth.convertToHtml({ buffer: modifiedBuffer }, mammothOptions);
  let rawHtml = result.value;

  const rawPages = rawHtml.split(/___PAGE_BREAK_\d+___/);
  console.log(`Processing ${babMeta.fileName} (${rawPages.length} physical pages)...`);

  const pages = [];

  for (let idx = 0; idx < rawPages.length; idx++) {
    const rawPageHtml = rawPages[idx];
    const pageNum = idx + 1;
    const pageLabel = `${babMeta.roman}-${pageNum}`;

    const $ = cheerio.load(`<div>${rawPageHtml}</div>`, null, false);

    // Apply alignments
    $('p, h1, h2, h3, h4, h5, div').each((_, el) => {
      let t = $(el).html() || '';
      if (t.includes('___ALIGN_RIGHT___')) {
        $(el).html(t.replace(/___ALIGN_RIGHT___/g, ''));
        $(el).attr('style', ($(el).attr('style') || '') + '; text-align: right;');
      } else if (t.includes('___ALIGN_CENTER___')) {
        $(el).html(t.replace(/___ALIGN_CENTER___/g, ''));
        $(el).attr('style', ($(el).attr('style') || '') + '; text-align: center;');
      }
    });

    // Remove leftover markers
    $('*').each((_, el) => {
      const h = $(el).html() || '';
      if (h.includes('___ALIGN_')) {
        $(el).html(h.replace(/___ALIGN_[A-Z]+___/g, ''));
      }
    });

    // Format Page 1 Bab Header (Right aligned uppercase)
    if (pageNum === 1) {
      $('h4, h1, h2, p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.startsWith(`BAB ${babMeta.roman}`) || (text.includes(`BAB ${babMeta.roman}`) && text.length < 120)) {
          const lines = text.split(/[\r\n\t]+|<br\s*\/?>/i).filter(l => l.trim().length > 0);
          const babTitleHtml = lines.map(l => `<div style="font-size: 14pt; font-weight: bold; margin: 0; line-height: 1.25; text-transform: uppercase;">${l.trim()}</div>`).join('');
          $(el).replaceWith(`
            <div class="bab-header-right" style="text-align: right; margin-bottom: 24pt; font-family: 'Bookman Old Style', Georgia, serif;">
              ${babTitleHtml}
            </div>
          `);
        }
      });

      // Align colon list for Sebelah Utara, Selatan, Barat, Timur if present
      const boundaryParas = [];
      $('p').each((_, el) => {
        const t = $(el).text();
        if (t.includes('Sebelah Utara') || t.includes('Sebelah Selatan') || t.includes('Sebelah Barat') || t.includes('Sebelah Timur')) {
          boundaryParas.push(el);
        }
      });

      if (boundaryParas.length >= 4) {
        const boundaryHtml = `
          <table class="table-boundary-coords" style="width: 100%; border: none !important; margin: 8pt 0 14pt 0; border-collapse: collapse; font-family: 'Bookman Old Style', Georgia, serif; font-size: 12pt; line-height: 1.45;">
            <tbody>
              <tr>
                <td style="border: none !important; padding: 2px 0; width: 155px; vertical-align: top; white-space: nowrap;">Sebelah Utara</td>
                <td style="border: none !important; padding: 2px 4px; width: 16px; vertical-align: top; text-align: center;">:</td>
                <td style="border: none !important; padding: 2px 0; vertical-align: top;">Kabupaten Banyumas, Kabupaten Brebes dan Kabupaten Kuningan (Provinsi Jawa Barat)</td>
              </tr>
              <tr>
                <td style="border: none !important; padding: 2px 0; vertical-align: top; white-space: nowrap;">Sebelah Selatan</td>
                <td style="border: none !important; padding: 2px 4px; vertical-align: top; text-align: center;">:</td>
                <td style="border: none !important; padding: 2px 0; vertical-align: top;">Samudera Indonesia</td>
              </tr>
              <tr>
                <td style="border: none !important; padding: 2px 0; vertical-align: top; white-space: nowrap;">Sebelah Barat</td>
                <td style="border: none !important; padding: 2px 4px; vertical-align: top; text-align: center;">:</td>
                <td style="border: none !important; padding: 2px 0; vertical-align: top;">Kabupaten Ciamis, Kota Banjar dan Kabupaten Pangandaran (Provinsi Jawa Barat)</td>
              </tr>
              <tr>
                <td style="border: none !important; padding: 2px 0; vertical-align: top; white-space: nowrap;">Sebelah Timur</td>
                <td style="border: none !important; padding: 2px 4px; vertical-align: top; text-align: center;">:</td>
                <td style="border: none !important; padding: 2px 0; vertical-align: top;">Kabupaten Kebumen</td>
              </tr>
            </tbody>
          </table>
        `;
        $(boundaryParas[0]).before(boundaryHtml);
        boundaryParas.forEach(el => $(el).remove());
      }
    }

    // Format Sub-headings style
    $('h2').attr('style', 'font-size: 12pt; font-weight: bold; margin: 12pt 0 4pt 0; text-align: left; font-family: "Bookman Old Style", Georgia, serif;');
    $('h3').attr('style', 'font-size: 12pt; font-weight: bold; margin: 10pt 0 4pt 0; text-align: left; font-family: "Bookman Old Style", Georgia, serif;');
    $('h4').attr('style', 'font-size: 12pt; font-weight: bold; margin: 8pt 0 4pt 0; text-align: left; font-family: "Bookman Old Style", Georgia, serif;');
    $('h5').attr('style', 'font-size: 12pt; font-weight: bold; margin: 8pt 0 4pt 0; text-align: left; font-family: "Bookman Old Style", Georgia, serif;');

    // Center Gambar & Tabel Captions
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (/^Gambar\s+\d/i.test(text)) {
        $(el).attr('style', 'text-align: center; font-weight: bold; font-size: 11pt; margin-top: 10pt; margin-bottom: 12pt; line-height: 1.35; font-family: "Bookman Old Style", Georgia, serif;');
      } else if (/^Tabel\s+\d/i.test(text)) {
        $(el).attr('style', 'text-align: center; font-weight: bold; font-size: 11pt; margin-bottom: 6pt; margin-top: 12pt; line-height: 1.35; font-family: "Bookman Old Style", Georgia, serif;');
      } else if (/^Sumber\s*:/i.test(text)) {
        $(el).attr('style', 'font-size: 8.5pt; font-style: italic; margin-top: 4pt; margin-bottom: 10pt; text-align: left; color: #333333; font-family: "Bookman Old Style", Georgia, serif;');
      }
    });

    // Detect wide tables & orientation
    let maxCols = 0;
    $('table').each((_, tbl) => {
      if ($(tbl).hasClass('table-boundary-coords')) return;
      $(tbl).find('tr').each((__, r) => {
        const c = $(r).find('th, td').length;
        if (c > maxCols) maxCols = c;
      });
      $(tbl).attr('style', 'width: 100%; border-collapse: collapse; margin: 10pt 0; font-family: "Bookman Old Style", Georgia, serif;');
    });

    const isLandscape = maxCols >= 6;
    const orientation = isLandscape ? 'landscape' : 'portrait';
    const tableFontSize = maxCols >= 10 ? '8.5pt' : (maxCols >= 6 ? '9pt' : '10pt');

    // Extract outline headings for navigation
    const pageHeadings = [];
    $('h1, h2, h3, h4, h5, p').each((_, el) => {
      const text = $(el).text().trim();
      if (
        text.startsWith('BAB ') ||
        /^\d+\.\d+/.test(text) ||
        /^\d+\)/.test(text) ||
        /^[A-Z]\.\s+/.test(text) ||
        /^Gambar\s+\d/i.test(text) ||
        /^Tabel\s+\d/i.test(text)
      ) {
        pageHeadings.push({
          tag: el.tagName.toLowerCase(),
          text: text.substring(0, 100)
        });
      }
    });

    // Primary code and title
    let primaryCode = `Hal. ${pageLabel}`;
    let primaryTitle = `Halaman ${pageNum}`;
    if (pageHeadings.length > 0) {
      primaryTitle = pageHeadings[0].text;
      const mCode = primaryTitle.match(/^(\d+\.\d+(\.\d+)*|\d+\)|[A-Z]\.|BAB\s+[IVXLCDM\d]+|Gambar\s+\d+(\.\s*\d+)?|Tabel\s+\d+(\.\s*\d+)?)/i);
      if (mCode) {
        primaryCode = mCode[1];
        primaryTitle = primaryTitle.replace(primaryCode, '').replace(/^[:\.\s-]+/, '').trim();
      }
    }

    pages.push({
      id: `page_${babMeta.docId}_${pageNum}`,
      documentId: babMeta.docId,
      order: pageNum,
      pageNumber: pageNum,
      pageLabel: pageLabel,
      code: primaryCode,
      title: primaryTitle || `Halaman ${pageNum}`,
      headings: pageHeadings,
      orientation,
      tableFontSize,
      maxTableColumns: maxCols,
      content: $.html().trim(),
      status: 'DRAFT',
      isLocked: false,
      assignedUserIds: ['user_admin'],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return pages;
}

async function runAll() {
  const allSections = [];
  const dbPath = path.join(__dirname, '../data/database.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  for (const bab of BAB_FILES) {
    const babPages = await processBab(bab);
    allSections.push(...babPages);
    console.log(`✓ ${bab.title}: ${babPages.length} pages generated.`);
  }

  db.sections = allSections;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`\n🎉 SUCCESS! Generated ${allSections.length} authentic pages across all 7 Babs in database.json!`);
}

runAll();
