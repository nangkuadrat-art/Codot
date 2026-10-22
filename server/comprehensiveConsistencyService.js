/**
 * Comprehensive Consistency Checker Engine for RKPD Documents
 * Pemindaian menyeluruh di SEMUA unsur:
 * 1. Antar Tabel (Table-to-Table Cross-Check)
 * 2. Antar Tabel dengan Narasi (Table-to-Narrative Cross-Check)
 * 3. Antar Narasi (Narrative-to-Narrative Cross-Check)
 * 4. Komparasi Kalimat Panjang vs Akronim (Acronym & Long-Phrase Cross-Check)
 * 5. Indikator Target vs Realisasi dengan Kemiripan Fuzzy >= 80%
 */

// Daftar Kecamatan Kabupaten Cilacap
const KECAMATAN_CILACAP = new Set([
  'dayeuhluhur', 'wanareja', 'majenang', 'cimanggu', 'karangpucung', 'sidareja',
  'gandrungmangu', 'kedungreja', 'patimuan', 'cipari', 'bantarsari', 'kawunganten',
  'jeruklegi', 'kesugihan', 'adipala', 'maos', 'sampang', 'kroya', 'binangun',
  'nusawungu', 'kampung laut', 'cilacap utara', 'cilacap tengah', 'cilacap selatan'
]);

// Kamus Akronim & Kalimat Panjang Resmi Perencanaan Daerah
const MAJOR_ACRONYM_CATALOG = [
  { acronym: 'IPM', longForm: 'Indeks Pembangunan Manusia', category: 'Indikator Makro' },
  { acronym: 'TPT', longForm: 'Tingkat Pengangguran Terbuka', category: 'Indikator Makro' },
  { acronym: 'LPE', longForm: 'Laju Pertumbuhan Ekonomi', category: 'Indikator Makro' },
  { acronym: 'PE', longForm: 'Pertumbuhan Ekonomi', category: 'Indikator Makro' },
  { acronym: 'PDRB', longForm: 'Produk Domestik Regional Bruto', category: 'Indikator Makro' },
  { acronym: 'IRB', longForm: 'Indeks Reformasi Birokrasi', category: 'Indikator Makro' },
  { acronym: 'IKP', longForm: 'Indeks Ketahanan Pangan', category: 'Indikator Makro' },
  { acronym: 'IKU', longForm: 'Indikator Kinerja Utama', category: 'Kinerja Daerah' },
  { acronym: 'IKD', longForm: 'Indikator Kinerja Daerah', category: 'Kinerja Daerah' },
  { acronym: 'IUP', longForm: 'Indikator Utama Pembangunan', category: 'Kinerja Daerah' },
  { acronym: 'SPM', longForm: 'Standar Pelayanan Minimal', category: 'Pelayanan Dasar' },
  { acronym: 'PAD', longForm: 'Pendapatan Asli Daerah', category: 'Keuangan Daerah' },
  { acronym: 'APBD', longForm: 'Anggaran Pendapatan dan Belanja Daerah', category: 'Keuangan Daerah' },
  { acronym: 'DAK', longForm: 'Dana Alokasi Khusus', category: 'Keuangan Daerah' },
  { acronym: 'DAU', longForm: 'Dana Alokasi Umum', category: 'Keuangan Daerah' },
  { acronym: 'DBHCHT', longForm: 'Dana Bagi Hasil Cukai Hasil Tembakau', category: 'Keuangan Daerah' },
  { acronym: 'RKPD', longForm: 'Rencana Kerja Pemerintah Daerah', category: 'Perencanaan' },
  { acronym: 'RPJMD', longForm: 'Rencana Pembangunan Jangka Menengah Daerah', category: 'Perencanaan' },
  { acronym: 'RPJPD', longForm: 'Rencana Pembangunan Jangka Panjang Daerah', category: 'Perencanaan' },
  { acronym: 'SPIP', longForm: 'Sistem Pengendalian Intern Pemerintah', category: 'Tata Kelola' },
  { acronym: 'RTLH', longForm: 'Rumah Tidak Layak Huni', category: 'Sosial & Permukiman' },
  { acronym: 'RTH', longForm: 'Ruang Terbuka Hijau', category: 'Lingkungan Hidup' },
  { acronym: 'PMT', longForm: 'Pemberian Makanan Tambahan', category: 'Kesehatan & Stunting' },
  { acronym: 'DTW', longForm: 'Daya Tarik Wisata', category: 'Perekonomian & Pariwisata' },
  { acronym: 'UMKM', longForm: 'Usaha Mikro Kecil dan Menengah', category: 'Perekonomian' },
  { acronym: 'KUB', longForm: 'Kelompok Usaha Bersama', category: 'Perekonomian' },
  { acronym: 'RPH', longForm: 'Rumah Pemotongan Hewan', category: 'Pertanian & Peternakan' },
  { acronym: 'Bappeda', longForm: 'Badan Perencanaan Pembangunan Daerah', category: 'Perangkat Daerah' },
  { acronym: 'Diskominfo', longForm: 'Dinas Komunikasi dan Informatika', category: 'Perangkat Daerah' },
  { acronym: 'Dinkes', longForm: 'Dinas Kesehatan', category: 'Perangkat Daerah' },
  { acronym: 'Disdik', longForm: 'Dinas Pendidikan', category: 'Perangkat Daerah' },
  { acronym: 'Dinsos', longForm: 'Dinas Sosial', category: 'Perangkat Daerah' },
  { acronym: 'DPUPR', longForm: 'Dinas Pekerjaan Umum dan Penataan Ruang', category: 'Perangkat Daerah' },
  { acronym: 'Disperkimta', longForm: 'Dinas Perumahan Kawasan Permukiman dan Pertanahan', category: 'Perangkat Daerah' },
  { acronym: 'Puskesmas', longForm: 'Pusat Kesehatan Masyarakat', category: 'Kesehatan' },
  { acronym: 'RSUD', longForm: 'Rumah Sakit Umum Daerah', category: 'Kesehatan' }
];

// Peta Sinonim Statis
const SYNONYM_MAP = {
  'ipm': 'indeks pembangunan manusia',
  'lpe': 'pertumbuhan ekonomi',
  'pe': 'pertumbuhan ekonomi',
  'tpt': 'tingkat pengangguran terbuka',
  'pad': 'pendapatan asli daerah',
  'pdrb': 'produk domestik regional bruto',
  'apbd': 'anggaran pendapatan belanja daerah',
  'irb': 'indeks reformasi birokrasi',
  'iku': 'indikator kinerja utama',
  'ikd': 'indikator kinerja daerah',
  'iup': 'indikator utama pembangunan',
  'kemiskinan': 'penduduk miskin',
  'stunting': 'prevalensi stunting',
  'tengkes': 'prevalensi stunting',
  'disdik': 'dinas pendidikan',
  'dinkes': 'dinas kesehatan',
  'disdukcapil': 'kependudukan dan pencatatan sipil',
  'aki': 'angka konsumsi ikan',
  'lpp': 'laju pertumbuhan penduduk',
  'rtlh': 'rumah tidak layak huni',
  'rth': 'ruang terbuka hijau',
  'pmt': 'pemberian makanan tambahan',
  'dtw': 'daya tarik wisata',
  'kub': 'kelompok usaha bersama',
  'rph': 'rumah pemotongan hewan',
  'spm': 'standar pelayanan minimal',
  'spip': 'sistem pengendalian intern pemerintah',
  'dbhcht': 'dana bagi hasil cukai hasil tembakau',
  'dak': 'dana alokasi khusus',
  'dau': 'dana alokasi umum',
  'umkm': 'usaha mikro kecil dan menengah'
};

const GENERIC_STANDALONE = new Set([
  'cilacap', 'jawa tengah', 'indonesia', 'jumlah', 'total', 'jumlah total', 'jumlah/ total',
  'laki-laki', 'perempuan', 'kabupaten', 'provinsi', 'nasional', 'no', 'sumber', 'uraian',
  'kegiatan', 'sub kegiatan', 'program', 'indikator', 'satuan', 'target', 'realisasi', 'capaian'
]);

const STOPWORDS = new Set([
  'pada', 'tahun', 'dan', 'yang', 'di', 'dari', 'untuk', 'dengan', 'ke', 'oleh',
  'sebesar', 'mencapai', 'target', 'realisasi', 'capaian', 'proyeksi', 'kabupaten',
  'cilacap', 'provinsi', 'jawa', 'tengah', 'angka', 'tingkat', 'jumlah', 'persentase',
  'nilai', 'rata', 'tabel', 'gambar', 'bab', 'uraian', 'indikator', 'satuan', 'data',
  'mengalami', 'menjadi', 'tercatat', 'sebanyak', 'adapun', 'dalam', 'secara', 'atas'
]);

/**
 * Pembangkit Akronim Otomatis dari Kalimat Panjang (Inisial kata huruf kapital)
 */
function generateAcronym(str) {
  if (!str) return '';
  const stop = new Set(['dan', 'yang', 'di', 'dari', 'ke', 'pada', 'untuk', 'atas', 'tentang', 'oleh', 'serta', 'dalam']);
  const words = str
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stop.has(w.toLowerCase()));
  if (words.length < 2) return '';
  return words.map(w => w[0].toUpperCase()).join('');
}

/**
 * Cek apakah dua string adalah pasangan Kalimat Panjang vs Akronim
 */
function isAcronymMatch(str1, str2) {
  if (!str1 || !str2) return false;
  const s1 = str1.trim().toUpperCase();
  const s2 = str2.trim().toUpperCase();
  if (s1 === s2) return true;

  const acr1 = generateAcronym(str1);
  const acr2 = generateAcronym(str2);

  if (acr1 && acr1 === s2) return true;
  if (acr2 && acr2 === s1) return true;
  if (acr1 && acr2 && acr1 === acr2) return true;

  // Cek pada kamus sinonim
  const norm1 = str1.toLowerCase().trim();
  const norm2 = str2.toLowerCase().trim();
  if (SYNONYM_MAP[norm1] === norm2 || SYNONYM_MAP[norm2] === norm1) return true;

  return false;
}

/**
 * Normalisasi teks untuk perbandingan fuzzy dengan ekspansi akronim
 */
function normalizeText(str) {
  if (!str) return '';
  let clean = str.toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Ganti akronim dengan kalimat panjang atau sebaliknya
  const words = clean.split(' ').map(w => SYNONYM_MAP[w] || w);
  return words.join(' ');
}

/**
 * Ambil kata kunci inti
 */
function getCoreKeywords(str) {
  const norm = normalizeText(str);
  return norm.split(' ').filter(w => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * Hitung kemiripan teks (Fuzzy Similarity) antara dua string (0.0 s/d 1.0)
 * Menggabungkan Ekstraksi Akronim, Token Jaccard, dan Bigram Dice
 */
function calculateSimilarity(str1, str2) {
  // Cek 1: Jika salah satu merupakan akronim dari yang lain -> 100% Cocok!
  if (isAcronymMatch(str1, str2)) {
    return 1.0;
  }

  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  // Cek Substring
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const minLen = Math.min(norm1.length, norm2.length);
    const maxLen = Math.max(norm1.length, norm2.length);
    if (minLen / maxLen >= 0.70) return Math.max(0.85, minLen / maxLen);
  }

  // Token Jaccard
  const words1 = getCoreKeywords(str1);
  const words2 = getCoreKeywords(str2);

  let tokenSim = 0.0;
  if (words1.length > 0 && words2.length > 0) {
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    let intersection = 0;
    for (const w of set1) {
      if (set2.has(w)) intersection++;
    }
    const union = new Set([...words1, ...words2]).size;
    tokenSim = intersection / union;
  }

  // Bigram Dice
  const getBigrams = s => {
    const bg = new Set();
    const compact = s.replace(/\s+/g, '');
    for (let i = 0; i < compact.length - 1; i++) {
      bg.add(compact.substring(i, i + 2));
    }
    return bg;
  };

  const bg1 = getBigrams(norm1);
  const bg2 = getBigrams(norm2);
  let bgMatch = 0;
  for (const b of bg1) {
    if (bg2.has(b)) bgMatch++;
  }
  const diceSim = (2 * bgMatch) / (bg1.size + bg2.size || 1);

  return Math.max(tokenSim, diceSim);
}

/**
 * Normalisasi nilai numerik untuk perbandingan ekuivalensi
 */
function parseNumericValue(valStr) {
  if (!valStr) return null;
  const str = String(valStr).trim().replace(/\s+/g, '');

  if (str.includes('-') || str.includes('–')) {
    const parts = str.split(/[-–]/).map(p => parseFloat(p.replace(/\./g, '').replace(',', '.')));
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      return {
        type: 'RANGE',
        min: Math.min(parts[0], parts[1]),
        max: Math.max(parts[0], parts[1]),
        raw: valStr
      };
    }
  }

  let cleaned = str.replace(/[^\d,\.-]/g, '');
  if (cleaned.length > 25) return { type: 'RAW', raw: valStr };
  if (/\b[a-zA-Z]{3,}\b/.test(valStr) && !/^(%|indeks|poin|jiwa|rupiah|rp|km|unit|orang|desa)$/i.test(valStr.trim())) {
    return { type: 'RAW', raw: valStr };
  }
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    cleaned = cleaned.replace(',', '.');
  }

  const num = parseFloat(cleaned);
  if (!isNaN(num)) {
    return {
      type: 'SINGLE',
      value: num,
      raw: valStr
    };
  }

  return { type: 'RAW', raw: valStr };
}

function areValuesEquivalent(val1, val2) {
  const p1 = parseNumericValue(val1);
  const p2 = parseNumericValue(val2);

  if (!p1 || !p2) return false;

  if (p1.type === 'SINGLE' && p2.type === 'SINGLE') {
    return Math.abs(p1.value - p2.value) < 0.005;
  }

  if (p1.type === 'RANGE' && p2.type === 'RANGE') {
    return Math.abs(p1.min - p2.min) < 0.05 && Math.abs(p1.max - p2.max) < 0.05;
  }

  const s1 = String(val1).replace(/\s+/g, '').replace(',', '.');
  const s2 = String(val2).replace(/\s+/g, '').replace(',', '.');
  return s1 === s2;
}

/**
 * Ekstraksi Universal Data Point dari Seluruh Tabel HTML
 */
function extractTableDataPoints(sections, documents) {
  const dataPoints = [];

  sections.forEach(sec => {
    const doc = documents.find(d => d.id === sec.documentId);
    if (!doc) return;
    const chapter = doc.chapter || doc.title.match(/BAB [I|V|X]+/)?.[0] || 'BAB I';
    const content = sec.content || '';

    const captionMatch = content.match(/Tabel\s+[0-9]+[\.\s]+[0-9]+[^\<\n\r]{0,80}/i);
    const tableCaption = captionMatch ? captionMatch[0].replace(/<[^>]+>/g, '').trim() : `Tabel pada ${sec.title}`;

    const tables = content.match(/<table[\s\S]*?<\/table>/gi) || [];

    tables.forEach((tbl, tIdx) => {
      const rows = [...tbl.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(m => m[1]);
      if (rows.length < 2) return;

      let headerCells = [];
      let headerRowIndex = 0;

      for (let i = 0; i < Math.min(3, rows.length); i++) {
        const cells = [...rows[i].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)]
          .map(c => c[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim());
        if (cells.some(c => /\b(202\d|201\d|Target|Realisasi|Capaian|Proyeksi|RKPD)\b/i.test(c))) {
          headerCells = cells;
          headerRowIndex = i;
          break;
        }
      }

      const yearCols = [];
      headerCells.forEach((c, idx) => {
        const yMatch = c.match(/\b(201\d|202\d)\b/);
        if (yMatch) {
          const year = yMatch[1];
          const isTarget = ['2026', '2027'].includes(year) || /target|proyeksi/i.test(c);
          yearCols.push({ colIndex: idx, year, isTarget, label: c });
        } else if (/target|proyeksi/i.test(c)) {
          yearCols.push({ colIndex: idx, year: '2027', isTarget: true, label: c });
        }
      });

      rows.slice(headerRowIndex + 1).forEach((r, rIdx) => {
        const cells = [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
          .map(c => c[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim());

        if (cells.length < 2) return;

        let label = '';
        let unit = '';
        for (let ci = 0; ci < Math.min(3, cells.length); ci++) {
          const text = cells[ci];
          if (text && !/^\d+$/.test(text) && text.length > 2) {
            label = text;
            if (ci + 1 < cells.length && /^(%|indeks|poin|jiwa|rupiah|rp|km|unit|orang|desa)$/i.test(cells[ci + 1])) {
              unit = cells[ci + 1];
            }
            break;
          }
        }

        if (!label) return;

        let contextualLabel = label;
        const normLabel = label.toLowerCase();
        if (KECAMATAN_CILACAP.has(normLabel) || /^(laki-laki|perempuan|total|jumlah)$/i.test(normLabel)) {
          contextualLabel = `${tableCaption} - ${label}`;
        }

        if (yearCols.length > 0) {
          yearCols.forEach(yc => {
            if (yc.colIndex < cells.length) {
              const val = cells[yc.colIndex];
              if (val && /\d/.test(val) && !/^(\d{4}|no|\-)$/i.test(val) && val.length < 50 && !/(?:fokus|melalui|penguatan|kebijakan|pembinaan|perusahaan|sinkronisasi)\s+/i.test(val)) {
                dataPoints.push({
                  id: `dp_tbl_${sec.id}_r${rIdx}_c${yc.colIndex}`,
                  type: 'TABLE',
                  chapter,
                  docId: doc.id,
                  secId: sec.id,
                  secTitle: sec.title,
                  tableCaption,
                  label: contextualLabel,
                  displayLabel: label,
                  unit,
                  year: yc.year,
                  periodType: yc.isTarget ? 'TARGET' : 'REALISASI',
                  value: val,
                  contextSnippet: `${tableCaption} (${yc.label}): ${label} = ${val} ${unit}`.trim()
                });
              }
            }
          });
        }
      });
    });
  });

  return dataPoints;
}

/**
 * Ekstraksi Universal Data Point dari Narasi Teks
 */
function extractNarrativeDataPoints(sections, documents) {
  const dataPoints = [];

  sections.forEach(sec => {
    const doc = documents.find(d => d.id === sec.documentId);
    if (!doc) return;
    const chapter = doc.chapter || doc.title.match(/BAB [I|V|X]+/)?.[0] || 'BAB I';
    const content = sec.content || '';

    const narrativeOnly = content.replace(/<table[\s\S]*?<\/table>/gi, ' ');
    const clean = narrativeOnly.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

    const sentences = clean.split(/(?<=[.?!])\s+/);

    sentences.forEach((sent, sIdx) => {
      const yearMatch = sent.match(/\b(202[0-7])\b/);
      if (!yearMatch) return;
      const year = yearMatch[1];

      const pattern = /([A-Za-z\s]{4,45}?)\s+(?:pada\s+tahun\s+\d{4}|tahun\s+\d{4})?[^\d\.]{0,25}?(?:sebesar|mencapai|sebanyak|tercatat|target|ditargetkan|adalah)[^\d]{0,10}?(\d{1,3}[,\.]\d{1,2}(?:\s*[-–]\s*\d{1,3}[,\.]\d{1,2})?|\d{1,3}(?:\.\d{3}){2,4})\s*(persen|%|poin|indeks|juta|miliar|jiwa|ribu)?/gi;

      let m;
      while ((m = pattern.exec(sent)) !== null) {
        const rawLabel = m[1].trim();
        const val = m[2].trim();
        const unit = m[3] ? m[3].trim() : '';

        const coreWords = getCoreKeywords(rawLabel);

        if (coreWords.length >= 1 && rawLabel.length > 3) {
          const isTarget = ['2026', '2027'].includes(year) || /target|ditargetkan|proyeksi/i.test(sent);

          dataPoints.push({
            id: `dp_nar_${sec.id}_s${sIdx}`,
            type: 'NARRATIVE',
            chapter,
            docId: doc.id,
            secId: sec.id,
            secTitle: sec.title,
            tableCaption: 'Narasi Teks',
            label: rawLabel,
            displayLabel: rawLabel,
            unit,
            year,
            periodType: isTarget ? 'TARGET' : 'REALISASI',
            value: val,
            contextSnippet: sent.substring(Math.max(0, m.index - 20), Math.min(sent.length, m.index + 120))
          });
        }
      }
    });
  });

  return dataPoints;
}

/**
 * Analisis Khusus: Komparasi Kalimat Panjang vs Akronim
 * (Sebaran kemunculan, kepatuhan pengenalan pertama, serta keselarasan data yang melekat)
 */
function analyzeAcronymLongFormConsistency(sections, documents, allDataPoints = []) {
  const dynamicPairs = new Map();

  // 1. Masukkan Katalog Resmi Perencanaan Daerah
  MAJOR_ACRONYM_CATALOG.forEach(item => {
    dynamicPairs.set(item.acronym.toUpperCase(), {
      acronym: item.acronym,
      longForm: item.longForm,
      category: item.category
    });
  });

  // Pre-clean text seluruh 147 sub-bab satu kali untuk performa instan (<100ms)
  const preCleanedSections = sections.map(sec => {
    const doc = documents.find(d => d.id === sec.documentId);
    const chapter = doc?.chapter || doc?.title.match(/BAB [I|V|X]+/)?.[0] || 'BAB I';
    const text = (sec.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    return {
      docId: doc ? doc.id : '',
      secId: sec.id,
      secTitle: sec.title,
      chapter,
      text
    };
  });

  // 2. Deteksi otomatis pasangan dari naskah: Phrase (ACRONYM)
  const pattern = /([A-Z][a-zA-Z\s]{4,40})\s*\(([A-Z0-9]{2,8})\)/g;
  preCleanedSections.forEach(sec => {
    let m;
    while ((m = pattern.exec(sec.text)) !== null) {
      const full = m[1].trim();
      const acr = m[2].trim().toUpperCase();
      if (!dynamicPairs.has(acr) && full.length >= 6 && !/^(Tabel|Gambar|Lampiran|Bab|Pasal|Undang)$/i.test(full)) {
        const genAcr = generateAcronym(full);
        const firstLetters = full.split(/\s+/).map(w => w[0]).join('').toUpperCase();
        if (isAcronymMatch(full, acr) || (genAcr && (genAcr.includes(acr) || acr.includes(genAcr))) || firstLetters.includes(acr) || (acr.length >= 2 && full.toUpperCase().startsWith(acr[0]))) {
          dynamicPairs.set(acr, {
            acronym: acr,
            longForm: full,
            category: 'Ekstraksi Naskah'
          });
        }
      }
    }
  });

  const results = [];

  for (const [acrKey, pair] of dynamicPairs.entries()) {
    const regexAcr = new RegExp(`\\b${pair.acronym}\\b`, 'g');
    const regexLong = new RegExp(pair.longForm, 'gi');

    let acrCount = 0;
    let longCount = 0;
    const acrChapters = new Set();
    const longChapters = new Set();
    let firstMention = null;
    const snippets = [];

    preCleanedSections.forEach(sec => {
      const matchAcr = sec.text.match(regexAcr);
      if (matchAcr) {
        acrCount += matchAcr.length;
        acrChapters.add(sec.chapter);
      }

      const matchLong = sec.text.match(regexLong);
      if (matchLong) {
        longCount += matchLong.length;
        longChapters.add(sec.chapter);
      }

      if (!firstMention && (matchAcr || matchLong)) {
        const hasFormalDef = sec.text.includes(`${pair.longForm} (${pair.acronym})`) || sec.text.includes(`${pair.longForm} (${pair.acronym.toUpperCase()})`);
        firstMention = {
          chapter: sec.chapter,
          secTitle: sec.secTitle,
          docId: sec.docId,
          secId: sec.secId,
          hasFormalDefinition: hasFormalDef
        };
      }

      if (snippets.length < 2 && (matchAcr || matchLong)) {
        const idx = sec.text.indexOf(matchAcr ? pair.acronym : pair.longForm);
        snippets.push({
          chapter: sec.chapter,
          secTitle: sec.secTitle,
          docId: sec.docId,
          secId: sec.secId,
          text: sec.text.substring(Math.max(0, idx - 20), Math.min(sec.text.length, idx + 80))
        });
      }
    });

    if (acrCount === 0 && longCount === 0) continue;

    // Evaluasi data/angka yang melekat pada Akronim vs Kalimat Panjang
    const dataComparisons = [];
    const acrPoints = allDataPoints.filter(p => {
      const lbl = p.label.toUpperCase();
      return lbl === pair.acronym || lbl.includes(`(${pair.acronym})`);
    });

    const longPoints = allDataPoints.filter(p => {
      const lbl = p.label.toLowerCase();
      return lbl.includes(pair.longForm.toLowerCase());
    });

    acrPoints.forEach(pA => {
      longPoints.forEach(pB => {
        if (pA.year === pB.year && pA.periodType === pB.periodType && pA.id !== pB.id) {
          const numA = parseNumericValue(pA.value);
          const numB = parseNumericValue(pB.value);
          if (!numA || !numB || numA.type === 'RAW' || numB.type === 'RAW') return;

          const isEq = areValuesEquivalent(pA.value, pB.value);
          dataComparisons.push({
            year: pA.year,
            periodType: pA.periodType,
            acronymSource: {
              chapter: pA.chapter,
              secTitle: pA.secTitle,
              val: pA.value,
              unit: pA.unit,
              docId: pA.docId,
              secId: pA.secId
            },
            longFormSource: {
              chapter: pB.chapter,
              secTitle: pB.secTitle,
              val: pB.value,
              unit: pB.unit,
              docId: pB.docId,
              secId: pB.secId
            },
            isEquivalent: isEq,
            note: isEq
              ? `Nilai ${pair.acronym} & ${pair.longForm} konsisten sebesar ${pA.value}`
              : `Perbedaan angka: pada ${pair.acronym} tertulis ${pA.value}, sedangkan pada ${pair.longForm} tertulis ${pB.value}`
          });
        }
      });
    });

    let status = 'CONSISTENT';
    let statusLabel = 'Selaras & Terstandarisasi';
    if (dataComparisons.some(d => !d.isEquivalent)) {
      status = 'DISCREPANCY';
      statusLabel = 'Inkonsistensi Nilai Angka';
    } else if (firstMention && !firstMention.hasFormalDefinition && acrCount > 0 && longCount === 0) {
      status = 'ADVISORY';
      statusLabel = 'Hanya Singkatan (Perlu Nama Lengkap)';
    }

    results.push({
      acronym: pair.acronym,
      longForm: pair.longForm,
      category: pair.category,
      acrCount,
      longCount,
      acrChapters: [...acrChapters],
      longChapters: [...longChapters],
      firstMention,
      dataComparisons,
      snippets,
      status,
      statusLabel
    });
  }

  // Urutkan: Inkonsistensi data di atas, lalu berdasarkan frekuensi kemunculan
  results.sort((a, b) => {
    if (a.status === 'DISCREPANCY' && b.status !== 'DISCREPANCY') return -1;
    if (b.status === 'DISCREPANCY' && a.status !== 'DISCREPANCY') return 1;
    return (b.acrCount + b.longCount) - (a.acrCount + a.longCount);
  });

  return results;
}

/**
 * Universal Cross-Check Engine dengan Inverted Index In-Memory
 */
function performUniversalCrossCheck(allPoints, similarityThreshold = 0.80) {
  const validPoints = allPoints.filter(p => {
    const raw = (p.displayLabel || p.label).toLowerCase().trim();
    if (GENERIC_STANDALONE.has(raw)) return false;
    const core = getCoreKeywords(raw);
    return core.length >= 1 && raw.length >= 3;
  });

  validPoints.forEach(p => {
    p.norm = normalizeText(p.displayLabel || p.label);
    p.coreWords = p.norm.split(' ').filter(w => w.length > 2 && !STOPWORDS.has(w));
    p.generatedAcronym = generateAcronym(p.displayLabel || p.label);
  });

  const index = new Map();
  validPoints.forEach(p => {
    const period = `${p.year}_${p.periodType}`;
    p.coreWords.forEach(kw => {
      const key = `${period}::${kw}`;
      if (!index.has(key)) index.set(key, []);
      index.get(key).push(p);
    });
    // Juga indeks berdasarkan akronim jika ada
    if (p.generatedAcronym) {
      const acrKey = `${period}::acr::${p.generatedAcronym.toLowerCase()}`;
      if (!index.has(acrKey)) index.set(acrKey, []);
      index.get(acrKey).push(p);
    }
  });

  const comparisons = {
    tableToTable: [],
    tableToNarrative: [],
    narrativeToNarrative: []
  };

  const checkedPairs = new Set();

  for (const [key, candidates] of index.entries()) {
    if (candidates.length < 2) continue;

    for (let i = 0; i < candidates.length; i++) {
      const pA = candidates[i];

      for (let j = i + 1; j < candidates.length; j++) {
        const pB = candidates[j];

        if (pA.id === pB.id) continue;
        if (pA.secId === pB.secId && pA.type === pB.type && pA.tableCaption === pB.tableCaption) continue;

        const pairKey = [pA.id, pB.id].sort().join(':::');
        if (checkedPairs.has(pairKey)) continue;
        checkedPairs.add(pairKey);

        const sim = calculateSimilarity(pA.displayLabel || pA.label, pB.displayLabel || pB.label);

        if (sim >= similarityThreshold) {
          const isEquivalent = areValuesEquivalent(pA.value, pB.value);
          const simPercent = Math.round(sim * 100);

          const comparisonItem = {
            clusterLabel: pA.displayLabel || pA.label,
            year: pA.year,
            periodType: pA.periodType,
            similarityPercent: simPercent,
            isEquivalent,
            isAcronymMatched: isAcronymMatch(pA.displayLabel || pA.label, pB.displayLabel || pB.label),
            status: isEquivalent ? 'CONSISTENT' : 'DISCREPANCY',
            statusLabel: isEquivalent ? 'Selaras' : 'Inkonsistensi Nilai',
            sourceA: {
              type: pA.type,
              chapter: pA.chapter,
              docId: pA.docId,
              secId: pA.secId,
              secTitle: pA.secTitle,
              tableCaption: pA.tableCaption,
              label: pA.displayLabel || pA.label,
              value: pA.value,
              unit: pA.unit,
              snippet: pA.contextSnippet
            },
            sourceB: {
              type: pB.type,
              chapter: pB.chapter,
              docId: pB.docId,
              secId: pB.secId,
              secTitle: pB.secTitle,
              tableCaption: pB.tableCaption,
              label: pB.displayLabel || pB.label,
              value: pB.value,
              unit: pB.unit,
              snippet: pB.contextSnippet
            },
            discrepancyNote: isEquivalent
              ? `Nilai ${pA.displayLabel || pA.label} (${pA.periodType} ${pA.year}) selaras konsisten sebesar ${pA.value}.`
              : `Perbedaan nilai: "${pA.tableCaption} (${pA.chapter})" mencatat ${pA.value}, sedangkan "${pB.tableCaption} (${pB.chapter})" mencatat ${pB.value}.`
          };

          if (pA.type === 'TABLE' && pB.type === 'TABLE') {
            comparisons.tableToTable.push(comparisonItem);
          } else if (
            (pA.type === 'TABLE' && pB.type === 'NARRATIVE') ||
            (pA.type === 'NARRATIVE' && pB.type === 'TABLE')
          ) {
            comparisons.tableToNarrative.push(comparisonItem);
          } else if (pA.type === 'NARRATIVE' && pB.type === 'NARRATIVE') {
            comparisons.narrativeToNarrative.push(comparisonItem);
          }
        }
      }
    }
  }

  const sortFn = (a, b) => {
    if (a.isEquivalent === b.isEquivalent) {
      return b.similarityPercent - a.similarityPercent;
    }
    return a.isEquivalent ? 1 : -1;
  };

  comparisons.tableToTable.sort(sortFn);
  comparisons.tableToNarrative.sort(sortFn);
  comparisons.narrativeToNarrative.sort(sortFn);

  return {
    totalPairsChecked: checkedPairs.size,
    comparisons
  };
}

/**
 * Universal Comprehensive Consistency Analyzer
 */
function runComprehensiveConsistencyAnalysis(stageId, db, similarityThreshold = 0.80) {
  const documents = db.getDocuments ? db.getDocuments(stageId) : (db.documents || db.data?.documents || []);
  const docIds = documents.map(d => d.id);
  const allSections = db.data ? db.data.sections : (db.sections || []);
  const sections = allSections.filter(s => docIds.includes(s.documentId));

  const tableDataPoints = extractTableDataPoints(sections, documents);
  const narrativeDataPoints = extractNarrativeDataPoints(sections, documents);
  const allDataPoints = [...tableDataPoints, ...narrativeDataPoints];

  const crossCheckResults = performUniversalCrossCheck(allDataPoints, similarityThreshold);
  const acronymComparisons = analyzeAcronymLongFormConsistency(sections, documents, allDataPoints);

  const t2t = crossCheckResults.comparisons.tableToTable;
  const t2n = crossCheckResults.comparisons.tableToNarrative;
  const n2n = crossCheckResults.comparisons.narrativeToNarrative;

  const totalChecks = t2t.length + t2n.length + n2n.length;
  const totalDiscrepancies = 
    t2t.filter(x => !x.isEquivalent).length +
    t2n.filter(x => !x.isEquivalent).length +
    n2n.filter(x => !x.isEquivalent).length;

  const totalConsistent = totalChecks - totalDiscrepancies;
  const consistencyRate = totalChecks > 0 ? Math.round((totalConsistent / totalChecks) * 100) : 100;

  return {
    stageId,
    timestamp: new Date().toISOString(),
    similarityThreshold,
    metrics: {
      totalSectionsScanned: sections.length,
      totalTableDataPoints: tableDataPoints.length,
      totalNarrativeDataPoints: narrativeDataPoints.length,
      totalDataPointsExtracted: allDataPoints.length,
      totalChecksConducted: totalChecks,
      totalConsistent,
      totalDiscrepancies,
      consistencyRate,
      totalAcronymPairsTracked: acronymComparisons.length,
      breakdown: {
        tableToTableChecks: t2t.length,
        tableToTableDiscrepancies: t2t.filter(x => !x.isEquivalent).length,
        tableToNarrativeChecks: t2n.length,
        tableToNarrativeDiscrepancies: t2n.filter(x => !x.isEquivalent).length,
        narrativeToNarrativeChecks: n2n.length,
        narrativeToNarrativeDiscrepancies: n2n.filter(x => !x.isEquivalent).length
      }
    },
    comparisons: crossCheckResults.comparisons,
    acronymComparisons
  };
}

module.exports = {
  calculateSimilarity,
  generateAcronym,
  isAcronymMatch,
  normalizeText,
  getCoreKeywords,
  parseNumericValue,
  areValuesEquivalent,
  extractTableDataPoints,
  extractNarrativeDataPoints,
  performUniversalCrossCheck,
  analyzeAcronymLongFormConsistency,
  runComprehensiveConsistencyAnalysis
};
