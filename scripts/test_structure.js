const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const cheerio = require('cheerio');

const files = [
  'RKPD 2027 PERBUP - BAB I (08.07).docx',
  'RKPD 2027 PERBUP - BAB II (17.07) .docx',
  'RKPD 2027 PERBUP - BAB III (10.07).docx',
  'RKPD 2027 PERBUP - BAB IV (17.07).docx',
  'RKPD 2027 PERBUP - BAB V (16.07).docx',
  'RKPD 2027 PERBUP - BAB VI (17.07).docx',
  'RKPD 2027 PERBUP - BAB VII (09.07).docx'
];

async function inspectFile(fn) {
  const filePath = path.join(__dirname, '..', 'Template', fn);
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

  const res = await mammoth.convertToHtml({ path: filePath }, mammothOptions);
  const $ = cheerio.load(res.value);

  const foundHeadings = [];
  $('h1, h2, h3, h4, h5, h6, p').each((_, el) => {
    const tagName = el.tagName.toLowerCase();
    const txt = $(el).text().trim();
    if (!txt) return;

    const isHeadingTag = tagName.startsWith('h');
    const isBab = /^BAB\s+[IVXLCDM\d]+/i.test(txt);
    const isSub = /^\d+\.\d+(\.\d+)*\s+[A-Za-z]/.test(txt);

    if (isHeadingTag || isBab || isSub) {
      if (txt.length < 120 && !/^\d+[\.,]\d+$/.test(txt)) {
        foundHeadings.push({ tag: tagName, text: txt });
      }
    }
  });

  console.log(`=== ${fn} (Headings: ${foundHeadings.length}) ===`);
  foundHeadings.slice(0, 15).forEach(h => console.log(`  [${h.tag}] ${h.text}`));
}

(async () => {
  for (const fn of files) {
    await inspectFile(fn);
  }
})();
