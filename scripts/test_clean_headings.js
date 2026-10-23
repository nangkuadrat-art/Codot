const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const cheerio = require('cheerio');

function isRealHeading(tagName, text, chapterNum) {
  if (!text || text.length < 3 || text.length > 120) return false;
  // Ignore captions
  if (/^(Gambar|Tabel|Bagan|Grafik|Peta|Lampiran)\s+\d/i.test(text)) return false;
  // Ignore numbers with units or percentages or currency
  if (/^\d+[\.,]\d+\s*(jiwa|orang|ha|km|m|%|persen|Rp|tahun|ribu|juta|miliar|triliun)/i.test(text)) return false;
  if (/^\d{2,}[\.,]\d+/i.test(text)) return false; // numbers like 28.937 or 10.537
  // Ignore bullet list items
  if (/^(\d+\)|\([0-9]+\)|[a-z]\.|\([a-z]\))/i.test(text)) return false;

  // True heading tags from Word (Heading 1..4)
  if (['h1', 'h2', 'h3', 'h4'].includes(tagName)) {
    // Avoid short stray numbers
    if (/^[\d\.,\s%]+$/.test(text)) return false;
    // Avoid list items inside heading tags
    if (/^(\d+\)|\([0-9]+\)|[a-z]\.)/i.test(text)) return false;
    return true;
  }

  // BAB title in p
  if (/^BAB\s+[IVXLCDM\d]+/i.test(text)) {
    return true;
  }

  // Chapter sub-heading like 1.1 Latar Belakang, 2.1 Kondisi, 4.1 Permasalahan
  const subRegex = new RegExp(`^${chapterNum}\\.\\d+(\\.\\d+)?\\s+[A-Z]`);
  if (subRegex.test(text)) {
    return true;
  }

  return false;
}

const files = [
  { f: 'RKPD 2027 PERBUP - BAB I (08.07).docx', c: 1 },
  { f: 'RKPD 2027 PERBUP - BAB II (17.07) .docx', c: 2 },
  { f: 'RKPD 2027 PERBUP - BAB III (10.07).docx', c: 3 },
  { f: 'RKPD 2027 PERBUP - BAB IV (17.07).docx', c: 4 },
  { f: 'RKPD 2027 PERBUP - BAB V (16.07).docx', c: 5 },
  { f: 'RKPD 2027 PERBUP - BAB VI (17.07).docx', c: 6 },
  { f: 'RKPD 2027 PERBUP - BAB VII (09.07).docx', c: 7 }
];

(async () => {
  for (const item of files) {
    const p = path.join(__dirname, '..', 'Template', item.f);
    const res = await mammoth.convertToHtml({ path: p }, {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh"
      ]
    });
    const $ = cheerio.load(res.value);
    const headings = [];
    $('body').children().each((_, el) => {
      const tag = el.tagName ? el.tagName.toLowerCase() : '';
      const txt = $(el).text().trim();
      if (isRealHeading(tag, txt, item.c)) {
        headings.push({ tag, txt });
      }
    });

    console.log(`\n>>> ${item.f} (Found real sections: ${headings.length})`);
    headings.forEach((h, idx) => console.log(`   ${idx+1}. [${h.tag}] ${h.txt}`));
  }
})();
