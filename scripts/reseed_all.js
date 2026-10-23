const fs = require('fs');
const path = require('path');
const db = require('../server/db');
const { parseDocxToSections } = require('../server/docxService');

const TEMPLATE_DIR = path.join(__dirname, '..', 'Template');

const CHAPTER_METADATA = {
  'RKPD 2027 PERBUP - BAB I (08.07).docx': {
    id: 'doc_bab_i',
    chapter: 'BAB I',
    title: 'PENDAHULUAN',
    desc: 'Latar Belakang, Dasar Hukum, Hubungan Antar Dokumen, Maksud & Tujuan, Sistematika RKPD',
    recommendedOpd: 'Bappeda (Bidang PPEPD & Sekretariat)'
  },
  'RKPD 2027 PERBUP - BAB II (17.07) .docx': {
    id: 'doc_bab_ii',
    chapter: 'BAB II',
    title: 'GAMBARAN UMUM KONDISI DAERAH & EVALUASI RKPD',
    desc: 'Geografi, Demografi, Kesejahteraan Sosial, Urusan Pelayanan Dasar, Evaluasi Renja (222 Tabel Data)',
    recommendedOpd: 'Seluruh OPD / Dinas Teknis & Seluruh Bidang Bappeda'
  },
  'RKPD 2027 PERBUP - BAB III (10.07).docx': {
    id: 'doc_bab_iii',
    chapter: 'BAB III',
    title: 'KERANGKA EKONOMI DAERAH DAN KEUANGAN DAERAH',
    desc: 'Arah Kebijakan Ekonomi Daerah, Proyeksi PAD, Belanja Daerah, dan TKDD',
    recommendedOpd: 'Bappeda (Bidang Perekonomian) & BPPKAD'
  },
  'RKPD 2027 PERBUP - BAB IV (17.07).docx': {
    id: 'doc_bab_iv',
    chapter: 'BAB IV',
    title: 'SASARAN DAN PRIORITAS PEMBANGUNAN DAERAH',
    desc: 'Penyelarasan Prioritas Nasional (Asta Cita), Prioritas Jawa Tengah, Pokir DPRD, Isu Strategis Daerah',
    recommendedOpd: 'Bappeda (Bidang PPEPD & Bidang Terkait)'
  },
  'RKPD 2027 PERBUP - BAB V (16.07).docx': {
    id: 'doc_bab_v',
    chapter: 'BAB V',
    title: 'RENCANA KERJA DAN PENDANAAN DAERAH',
    desc: 'Proyeksi Pendanaan Rp 2,849 T, Matriks Program & Kegiatan Prioritas Urusan Daerah Tahun 2027',
    recommendedOpd: 'Bappeda (Bidang Anggaran/PPEPD) & Seluruh OPD'
  },
  'RKPD 2027 PERBUP - BAB VI (17.07).docx': {
    id: 'doc_bab_vi',
    chapter: 'BAB VI',
    title: 'KINERJA PENYELENGGARAAN PEMERINTAHAN DAERAH',
    desc: 'Indikator Kinerja Utama (IKU), Indikator Kinerja Daerah (IKD), IKK LPPD, dan IUP 2027',
    recommendedOpd: 'Bappeda (Bidang Pengendalian & Evaluasi) & Inspektorat'
  },
  'RKPD 2027 PERBUP - BAB VII (09.07).docx': {
    id: 'doc_bab_vii',
    chapter: 'BAB VII',
    title: 'PENUTUP',
    desc: 'Kaidah Pelaksanaan RKPD, Pedoman KUA-PPAS & APBD TA 2027, Komitmen Evaluasi',
    recommendedOpd: 'Tim Perumus Bappeda'
  }
};

const assignmentsByChapter = {
  'BAB I': ['user_admin', 'user_ahmad'],
  'BAB II': [
    'user_pandu',      // IKP - Kewilayahan
    'user_anny',       // PPM - Pemb. Manusia
    'user_nabila',     // Progev - PP
    'user_ahmad',      // Progev - PP
    'user_dodo',       // Sekretariat
    'user_uci'         // Progev - Datin
  ],
  'BAB III': ['user_ahmad', 'user_nabila'],
  'BAB IV': ['user_admin', 'user_pandu', 'user_anny'],
  'BAB V': ['user_nabila', 'user_admin', 'user_ahmad'],
  'BAB VI': ['user_hadi', 'user_sumaryanto'],
  'BAB VII': ['user_admin']
};

async function reseedAll() {
  console.log('🔄 Memulai pembersihan dan penyusunan ulang naskah 7 Bab RKPD...');

  const newDocs = [];
  const allSections = [];

  for (const [fileName, meta] of Object.entries(CHAPTER_METADATA)) {
    const filePath = path.join(TEMPLATE_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`File ${fileName} tidak ditemukan`);
      continue;
    }

    console.log(`⏳ Memproses ${meta.chapter}: ${fileName}...`);
    const docId = meta.id;
    const parsedSections = await parseDocxToSections(filePath, docId);

    const newDoc = {
      id: docId,
      stageId: 'stage_1',
      title: `RKPD 2027 PERBUP - ${meta.chapter}`,
      description: meta.desc,
      createdBy: 'Admin Bappeda (Koordinator)',
      originalFilename: fileName,
      fullContentHtml: parsedSections.fullHtml || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const assignedUsers = assignmentsByChapter[meta.chapter] || ['user_admin'];
    parsedSections.forEach((sec, idx) => {
      sec.assignedUserIds = [assignedUsers[idx % assignedUsers.length]];
      if (idx === 0) {
        sec.status = 'APPROVED';
        sec.isLocked = true;
      } else if (idx === 1) {
        sec.status = 'REVIEW';
      } else if (idx === 2) {
        sec.status = 'IN_PROGRESS';
      } else {
        sec.status = 'DRAFT';
      }
    });

    newDocs.push(newDoc);
    allSections.push(...parsedSections);
    console.log(`✅ ${meta.chapter}: Selesai dengan ${parsedSections.length} bagian naskah bersih.`);
  }

  // Update DB directly
  db.data.documents = newDocs;
  db.data.sections = allSections;
  db.save();

  console.log(`\n🎉 SELESAI! Database diperbarui dengan ${newDocs.length} dokumen dan total ${allSections.length} bagian naskah bersih.`);
}

reseedAll().catch(console.error);
