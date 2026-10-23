const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const cheerio = require('cheerio');

const files = [
  { f: 'RKPD 2027 PERBUP - BAB I (08.07).docx', c: 1 },
  { f: 'RKPD 2027 PERBUP - BAB II (17.07) .docx', c: 2 },
  { f: 'RKPD 2027 PERBUP - BAB III (10.07).docx', c: 3 },
  { f: 'RKPD 2027 PERBUP - BAB IV (17.07).docx', c: 4 },
  { f: 'RKPD 2027 PERBUP - BAB V (16.07).docx', c: 5 },
  { f: 'RKPD 2027 PERBUP - BAB VI (17.07).docx', c: 6 },
  { f: 'RKPD 2027 PERBUP - BAB VII (09.07).docx', c: 7 }
];

async function testParser() {
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
    const sections = [];
    let current = null;
    let idxL2 = 0, idxL3 = 0, idxL4 = 0;

    const romanMap = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII' };
    const romanChapter = romanMap[item.c];

    $('body').children().each((_, el) => {
      const tagName = el.tagName ? el.tagName.toLowerCase() : '';
      const text = $(el).text().trim();

      if (!text || tagName === 'table') return;
      if (/^(Gambar|Tabel|Bagan|Grafik|Peta|Lampiran)\s+\d/i.test(text)) return;
      if (/\t\s*(IV|V|VI|VII|I|II|III|-|\d+)\b/i.test(text) || /\t\s*\d+$/i.test(text)) return;
      if (/^\d+[\.,]\d+\s*(jiwa|orang|ha|km|m|%|persen|Rp|tahun|ribu|juta|miliar|triliun)/i.test(text)) return;
      if (/^\d{2,}[\.,]\d+/.test(text)) return;
      if (/^(\d+\)|\([0-9]+\)|[a-z]\.|\([a-z]\))\s+/.test(text)) return;

      const startsWithBab = /^BAB\s+[IVXLCDM\d]+/i.test(text);
      const subChapRegex2 = new RegExp(`^${item.c}\\.\\d+\\.?\\s+[A-Za-z]`);
      const subChapRegex3 = new RegExp(`^${item.c}\\.\\d+\\.\\d+\\.?\\s+[A-Za-z]`);
      const subChapRegex4 = new RegExp(`^${item.c}\\.\\d+\\.\\d+\\.\\d+\\.?\\s+[A-Za-z]`);

      let detectedLevel = null;
      let code = '';
      let title = text;

      if (tagName === 'h1' || startsWithBab) {
        detectedLevel = 1;
        idxL2 = 0; idxL3 = 0; idxL4 = 0;
        code = `BAB ${romanChapter}`;
        const m = text.match(/^(BAB\s+[IVXLCDM\d]+)[:\.\s-]*(.*)$/i);
        title = m && m[2] ? m[2].trim() : text;
      } else if (tagName === 'h2' || (subChapRegex2.test(text) && !subChapRegex3.test(text) && !subChapRegex4.test(text))) {
        detectedLevel = 2;
        idxL2++; idxL3 = 0; idxL4 = 0;
        const m = text.match(/^(\d+\.\d+)[:\.\s-]*(.*)$/);
        code = m ? m[1].trim() : `${item.c}.${idxL2}`;
        title = m && m[2] ? m[2].trim() : text;
      } else if (tagName === 'h3' || (subChapRegex3.test(text) && !subChapRegex4.test(text))) {
        detectedLevel = 3;
        idxL3++; idxL4 = 0;
        const m = text.match(/^(\d+\.\d+\.\d+)[:\.\s-]*(.*)$/);
        code = m ? m[1].trim() : `${item.c}.${idxL2 || 1}.${idxL3}`;
        title = m && m[2] ? m[2].trim() : text;
      } else if (tagName === 'h4' || subChapRegex4.test(text)) {
        detectedLevel = 4;
        idxL4++;
        const m = text.match(/^(\d+\.\d+\.\d+\.\d+\.?)[:\s-]*(.*)$/);
        code = m ? m[1].trim() : `${item.c}.${idxL2 || 1}.${idxL3 || 1}.${idxL4}`;
        title = m && m[2] ? m[2].trim() : text;
      }

      if (detectedLevel !== null && text.length > 0) {
        if (current) sections.push(current);
        title = title.replace(/\t\d+$/, '').replace(/^\s*[:\.-]\s*/, '').trim();
        current = { level: detectedLevel, code, title };
      }
    });

    if (current) sections.push(current);

    console.log(`\n======================================================`);
    console.log(`Document: ${item.f} | Total Sections: ${sections.length}`);
    sections.forEach((s, i) => {
      console.log(`  ${i+1}. [L${s.level}] ${s.code} ${s.title}`);
    });
  }
}

testParser();
