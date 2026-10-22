const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const cheerio = require('cheerio');

const templateDir = path.join(__dirname, 'Template');

async function studyAllTemplates() {
  const files = fs.readdirSync(templateDir).filter(f => f.endsWith('.docx'));
  console.log(`Found ${files.length} template files:`);

  const summary = [];

  for (const file of files) {
    const filePath = path.join(templateDir, file);
    const stat = fs.statSync(filePath);
    console.log(`\n======================================================`);
    console.log(`Analyzing: ${file} (${(stat.size / 1024).toFixed(1)} KB)`);

    try {
      const result = await mammoth.convertToHtml({ path: filePath });
      const html = result.value;
      const $ = cheerio.load(html);

      // Find Headings
      const headings = [];
      $('h1, h2, h3, h4').each((i, el) => {
        const tag = el.tagName.toLowerCase();
        const text = $(el).text().trim().replace(/\s+/g, ' ');
        if (text) {
          headings.push({ tag, text });
        }
      });

      // Count tables & paragraphs
      const tableCount = $('table').length;
      const pCount = $('p').length;
      const first500 = $('body').text().trim().substring(0, 300).replace(/\s+/g, ' ');

      console.log(`- Total Paragraf: ${pCount}`);
      console.log(`- Total Tabel: ${tableCount}`);
      console.log(`- Headings Ditemukan: ${headings.length}`);
      console.log(`- Sample Teks Awal: "${first500}..."`);
      console.log(`- Struktur Headings Utama:`);
      headings.slice(0, 15).forEach(h => {
        console.log(`   [${h.tag.toUpperCase()}] ${h.text}`);
      });
      if (headings.length > 15) {
        console.log(`   ... dan ${headings.length - 15} heading lainnya`);
      }

      summary.push({
        file,
        sizeKb: (stat.size / 1024).toFixed(1),
        pCount,
        tableCount,
        headingCount: headings.length,
        headings
      });
    } catch (err) {
      console.error(`Error analyzing ${file}:`, err.message);
    }
  }

  // Save summary JSON for deep inspection
  fs.writeFileSync(
    path.join(__dirname, 'data', 'template_study_summary.json'),
    JSON.stringify(summary, null, 2),
    'utf-8'
  );
  console.log('\nAnalisis selesai! Disimpan ke data/template_study_summary.json');
}

studyAllTemplates();
