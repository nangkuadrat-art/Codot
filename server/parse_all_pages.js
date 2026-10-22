const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const mammoth = require('mammoth');
const cheerio = require('cheerio');

const templateDir = path.join(__dirname, '../Template');

async function parseBabFile(fileName) {
  const filePath = path.join(templateDir, fileName);
  if (!fs.existsSync(filePath)) return null;

  const buffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buffer);
  let docXml = await zip.file('word/document.xml').async('text');

  // Roman chapter detection
  const romanMatch = fileName.match(/BAB\s+([IVXLCDM\d]+)/i);
  const romanChapter = romanMatch ? romanMatch[1].toUpperCase() : 'I';

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
  console.log(`${fileName} => parsed into ${rawPages.length} physical pages (Roman: ${romanChapter})`);

  return {
    fileName,
    romanChapter,
    pageCount: rawPages.length
  };
}

async function run() {
  const files = [
    'RKPD 2027 PERBUP - BAB I (08.07).docx',
    'RKPD 2027 PERBUP - BAB II (17.07) .docx',
    'RKPD 2027 PERBUP - BAB III (10.07).docx',
    'RKPD 2027 PERBUP - BAB IV (17.07).docx',
    'RKPD 2027 PERBUP - BAB V (16.07).docx',
    'RKPD 2027 PERBUP - BAB VI (17.07).docx',
    'RKPD 2027 PERBUP - BAB VII (09.07).docx'
  ];

  for (const f of files) {
    await parseBabFile(f);
  }
}

run();
