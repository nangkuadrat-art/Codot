const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const templateDir = path.join(__dirname, '..', 'Template');

async function analyzeAllTemplates() {
  const files = fs.readdirSync(templateDir).filter(f => f.endsWith('.docx'));
  const report = {};

  for (const fileName of files) {
    const filePath = path.join(templateDir, fileName);
    const buffer = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(buffer);

    const docReport = {
      fileName,
      styles: {},
      sections: [],
      fontUsage: {},
      fontSizeUsage: {},
      headers: [],
      footers: [],
      tables: []
    };

    // 1. Analyze styles.xml
    if (zip.file('word/styles.xml')) {
      const stylesXml = await zip.file('word/styles.xml').async('text');
      const docDefMatch = stylesXml.match(/<w:docDefaults>[\s\S]*?<\/w:docDefaults>/);
      if (docDefMatch) {
        const fontMatch = docDefMatch[0].match(/w:ascii=\"([^\"]+)\"/);
        const szMatch = docDefMatch[0].match(/<w:sz\s+w:val=\"(\d+)\"/);
        docReport.styles.defaultFont = fontMatch ? fontMatch[1] : 'Unknown';
        docReport.styles.defaultSizePt = szMatch ? (parseInt(szMatch[1]) / 2) : 12;
      }
    }

    // 2. Analyze Headers and Footers (header1.xml, header2.xml, footer1.xml, etc.)
    const zipEntries = Object.keys(zip.files);
    for (const entry of zipEntries) {
      if (entry.startsWith('word/header') && entry.endsWith('.xml')) {
        const hXml = await zip.file(entry).async('text');
        // Extract text
        const textRuns = hXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
        const cleanText = textRuns.map(t => t.replace(/<[^>]+>/g, '')).join(' ').trim();
        const szMatches = hXml.match(/<w:sz\s+w:val=\"(\d+)\"/g) || [];
        const fontMatches = hXml.match(/w:ascii=\"([^\"]+)\"/g) || [];
        const alignMatch = hXml.match(/<w:jc\s+w:val=\"([^\"]+)\"/);
        docReport.headers.push({
          file: entry,
          text: cleanText,
          alignment: alignMatch ? alignMatch[1] : 'left',
          fontSizesPt: [...new Set(szMatches.map(s => {
            const m = s.match(/val=\"(\d+)\"/);
            return m ? (parseInt(m[1]) / 2) + 'pt' : null;
          }))],
          fonts: [...new Set(fontMatches.map(f => {
            const m = f.match(/w:ascii=\"([^\"]+)\"/);
            return m ? m[1] : null;
          }))]
        });
      }

      if (entry.startsWith('word/footer') && entry.endsWith('.xml')) {
        const fXml = await zip.file(entry).async('text');
        const textRuns = fXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
        const cleanText = textRuns.map(t => t.replace(/<[^>]+>/g, '')).join(' ').trim();
        const hasPageNum = fXml.includes('w:instr="PAGE"') || fXml.includes('PAGE') || fXml.includes('NUMPAGES');
        const szMatches = fXml.match(/<w:sz\s+w:val=\"(\d+)\"/g) || [];
        const fontMatches = fXml.match(/w:ascii=\"([^\"]+)\"/g) || [];
        const alignMatch = fXml.match(/<w:jc\s+w:val=\"([^\"]+)\"/);
        docReport.footers.push({
          file: entry,
          text: cleanText,
          hasPageNumber: hasPageNum,
          alignment: alignMatch ? alignMatch[1] : 'right',
          fontSizesPt: [...new Set(szMatches.map(s => {
            const m = s.match(/val=\"(\d+)\"/);
            return m ? (parseInt(m[1]) / 2) + 'pt' : null;
          }))],
          fonts: [...new Set(fontMatches.map(f => {
            const m = f.match(/w:ascii=\"([^\"]+)\"/);
            return m ? m[1] : null;
          }))]
        });
      }
    }

    // 3. Analyze document.xml
    if (zip.file('word/document.xml')) {
      const docXml = await zip.file('word/document.xml').async('text');

      // Sections (sectPr)
      const sectMatches = docXml.match(/<w:sectPr[^>]*>[\s\S]*?<\/w:sectPr>/g) || [];
      sectMatches.forEach((sect, idx) => {
        const orientMatch = sect.match(/w:orient=\"([^\"]+)\"/);
        const wMatch = sect.match(/w:w=\"(\d+)\"/);
        const hMatch = sect.match(/w:h=\"(\d+)\"/);
        const pgMarMatch = sect.match(/<w:pgMar\s+([^>]*)\/>/);

        const orient = orientMatch ? orientMatch[1] : 'portrait';
        const wDxa = wMatch ? parseInt(wMatch[1]) : 11906;
        const hDxa = hMatch ? parseInt(hMatch[1]) : 16838;

        let margins = {};
        if (pgMarMatch) {
          const top = pgMarMatch[1].match(/w:top=\"(\d+)\"/);
          const bottom = pgMarMatch[1].match(/w:bottom=\"(\d+)\"/);
          const left = pgMarMatch[1].match(/w:left=\"(\d+)\"/);
          const right = pgMarMatch[1].match(/w:right=\"(\d+)\"/);
          margins = {
            topDxa: top ? parseInt(top[1]) : 0,
            bottomDxa: bottom ? parseInt(bottom[1]) : 0,
            leftDxa: left ? parseInt(left[1]) : 0,
            rightDxa: right ? parseInt(right[1]) : 0,
            topCm: top ? (parseInt(top[1]) * 2.54 / 1440).toFixed(2) : '0',
            bottomCm: bottom ? (parseInt(bottom[1]) * 2.54 / 1440).toFixed(2) : '0',
            leftCm: left ? (parseInt(left[1]) * 2.54 / 1440).toFixed(2) : '0',
            rightCm: right ? (parseInt(right[1]) * 2.54 / 1440).toFixed(2) : '0'
          };
        }

        docReport.sections.push({
          sectionIndex: idx + 1,
          orientation: orient,
          widthDxa: wDxa,
          heightDxa: hDxa,
          widthMm: Math.round(wDxa * 25.4 / 1440),
          heightMm: Math.round(hDxa * 25.4 / 1440),
          margins
        });
      });

      // Inline Font Family Usage
      const allFonts = docXml.match(/w:ascii=\"([^\"]+)\"/g) || [];
      allFonts.forEach(f => {
        const m = f.match(/w:ascii=\"([^\"]+)\"/);
        if (m) {
          docReport.fontUsage[m[1]] = (docReport.fontUsage[m[1]] || 0) + 1;
        }
      });

      // Inline Font Size Usage
      const allSizes = docXml.match(/<w:sz\s+w:val=\"(\d+)\"/g) || [];
      allSizes.forEach(s => {
        const m = s.match(/val=\"(\d+)\"/);
        if (m) {
          const pt = (parseInt(m[1]) / 2) + 'pt';
          docReport.fontSizeUsage[pt] = (docReport.fontSizeUsage[pt] || 0) + 1;
        }
      });

      // Analyze Tables
      const tblMatches = docXml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) || [];
      tblMatches.forEach((tbl, tIdx) => {
        const tblWMatch = tbl.match(/<w:tblW\s+([^>]*)\/>/);
        const gridCols = tbl.match(/<w:gridCol\s+[^>]*\/>/g) || [];
        const rows = tbl.match(/<w:tr[\s>]/g) || [];
        const tblSizes = tbl.match(/<w:sz\s+w:val=\"(\d+)\"/g) || [];
        const tblFontSizes = [...new Set(tblSizes.map(s => {
          const m = s.match(/val=\"(\d+)\"/);
          return m ? (parseInt(m[1]) / 2) + 'pt' : null;
        }))];

        // Is there a header row (tblHeader)?
        const hasTblHeader = tbl.includes('<w:tblHeader/>') || tbl.includes('<w:tblHeader />');

        // Extract sample text from first row
        const firstTrMatch = tbl.match(/<w:tr[\s>][\s\S]*?<\/w:tr>/);
        const headerText = firstTrMatch ? (firstTrMatch[0].match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join(' | ').substring(0, 80) : '';

        docReport.tables.push({
          tableIndex: tIdx + 1,
          rowCount: rows.length,
          columnCount: gridCols.length,
          tblW: tblWMatch ? tblWMatch[1] : 'auto',
          fontSizes: tblFontSizes,
          hasRepeatHeader: hasTblHeader,
          headerSample: headerText
        });
      });
    }

    report[fileName] = docReport;
  }

  // Save report
  fs.writeFileSync(
    path.join(__dirname, '..', 'data', 'deep_docx_typography_layout_report.json'),
    JSON.stringify(report, null, 2),
    'utf-8'
  );
  console.log('Report saved to data/deep_docx_typography_layout_report.json');

  // Print high level summary
  console.log('\n======================================================');
  console.log('SUMMARY OF OFFICIAL TEMPLATES:');
  for (const [fn, r] of Object.entries(report)) {
    console.log(`\n📄 ${fn}:`);
    console.log(`   Default Font: ${r.styles.defaultFont || 'N/A'}, Size: ${r.styles.defaultSizePt || 'N/A'}pt`);
    console.log(`   Fonts in use:`, Object.keys(r.fontUsage).slice(0, 4));
    console.log(`   Font Sizes:`, Object.keys(r.fontSizeUsage));
    console.log(`   Sections: ${r.sections.length} section(s):`);
    r.sections.forEach(s => {
      console.log(`     - Sec ${s.sectionIndex}: ${s.orientation.toUpperCase()} (${s.widthMm}x${s.heightMm}mm), Margins: L:${s.margins.leftCm}cm, R:${s.margins.rightCm}cm, T:${s.margins.topCm}cm, B:${s.margins.bottomCm}cm`);
    });
    console.log(`   Headers: ${r.headers.length}, Footers: ${r.footers.length}`);
    if (r.headers.length) {
      console.log(`     Sample Header: "${r.headers[0].text.substring(0, 70)}..." (${r.headers[0].fontSizesPt.join(',')})`);
    }
    if (r.footers.length) {
      console.log(`     Sample Footer: "${r.footers[0].text.substring(0, 70)}..." (HasPageNum: ${r.footers[0].hasPageNumber}, ${r.footers[0].fontSizesPt.join(',')})`);
    }
    console.log(`   Tables: ${r.tables.length} table(s). Max cols: ${Math.max(...r.tables.map(t => t.columnCount), 0)}`);
  }
}

analyzeAllTemplates().catch(console.error);
