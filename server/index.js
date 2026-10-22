const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec, spawn } = require('child_process');
const uuidv4 = () => require('crypto').randomUUID();

const db = require('./db');
const {
  parseDocxToSections,
  generateRkpdBab2Template,
  exportSectionsToDocx,
  exportSingleSectionToDocx,
  parseSingleDocxToContent
} = require('./docxService');
const googleDriveService = require('./googleDriveService');
const { analyzeConsistency } = require('./consistencyService');
const { runComprehensiveConsistencyAnalysis } = require('./comprehensiveConsistencyService');

const app = express();
const PORT = process.env.PORT || 5000;
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// WebDAV & Office URI Protocol Handshake Middleware for Microsoft Word Desktop
app.use((req, res, next) => {
  if (req.url && (req.url.includes('/word-bridge') || req.url.includes('/word-bridge.docx'))) {
    res.setHeader('MS-Author-Via', 'DAV');
    res.setHeader('DAV', '1, 2');
    res.setHeader('Allow', 'OPTIONS, GET, HEAD, POST, PUT');
    res.setHeader('Public', 'OPTIONS, GET, HEAD, POST, PUT');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, PUT, POST');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id, If-Match, If-None-Match, Lock-Token');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  next();
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.raw({
  type: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream',
    'application/msword',
    'application/zip'
  ],
  limit: '50mb'
}));

// Setup file uploads safely (fallback to tmpdir in serverless)
const UPLOAD_DIR = isServerless ? path.join(os.tmpdir(), 'rkpd_uploads') : path.join(__dirname, '..', 'uploads');
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (e) {
  // Ignored in read-only environment
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4().substring(0, 6)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

// Middleware for checking and restoring routes on Vercel / serverless reverse proxy
app.use((req, res, next) => {
  // If Vercel rewrote URL to /api/index.js, restore from matched path header
  if (req.url.startsWith('/api/index.js') || req.url === '/api') {
    const realPath = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'];
    if (realPath) {
      req.url = realPath;
    }
  }
  // If URL lost /api prefix in rewrite, restore it
  if (!req.url.startsWith('/api') && (
    req.url.startsWith('/auth') ||
    req.url.startsWith('/stages') ||
    req.url.startsWith('/documents') ||
    req.url.startsWith('/users') ||
    req.url.startsWith('/sections') ||
    req.url.startsWith('/consistency') ||
    req.url.startsWith('/gdrive') ||
    req.url.startsWith('/chapters') ||
    req.url.startsWith('/rkpd-templates')
  )) {
    req.url = '/api' + req.url;
  }
  next();
});

// Middleware for checking current user from header or query param (for MS Word desktop)
app.use((req, res, next) => {
  const currentUserId = req.headers['x-user-id'] || req.query.token || req.query.userId || 'user_admin';
  req.currentUser = db.getUserById(currentUserId) || db.getUserById('user_admin');
  next();
});

// ================= AUTH API =================
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username / Email / Akun wajib diisi' });
    }

    const user = db.getUserByUsernameOrEmail(username);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Akun atau Pengguna tidak ditemukan' });
    }

    const expectedPassword = user.password || '12345@';
    if (password !== expectedPassword) {
      return res.status(401).json({ success: false, message: 'Password salah. Gunakan password default: 12345@' });
    }

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          opd: user.opd,
          email: user.email,
          color: user.color,
          reviewedChapters: user.reviewedChapters || []
        },
        token: user.id
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Gagal memproses login: ' + err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  if (!req.currentUser) {
    return res.status(401).json({ success: false, message: 'Sesi login tidak sah atau telah berakhir' });
  }
  const u = req.currentUser;
  res.json({
    success: true,
    data: {
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      opd: u.opd,
      email: u.email,
      color: u.color,
      reviewedChapters: u.reviewedChapters || []
    }
  });
});

app.post('/api/auth/change-password', (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = req.currentUser;
  if (!user) {
    return res.status(401).json({ success: false, message: 'Sesi login tidak sah' });
  }

  const currentPass = user.password || '12345@';
  if (oldPassword !== currentPass) {
    return res.status(400).json({ success: false, message: 'Password lama salah' });
  }

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ success: false, message: 'Password baru minimal 4 karakter' });
  }

  db.updateUser(user.id, { password: newPassword });
  res.json({ success: true, message: 'Password berhasil diubah' });
});

// ================= USERS API =================
app.get('/api/users', (req, res) => {
  res.json({ success: true, data: db.getUsers() });
});

app.post('/api/users', (req, res) => {
  const { name, username, role, opd, email, phone, color, reviewedChapters } = req.body;
  if (!name || !username) {
    return res.status(400).json({ success: false, message: 'Nama dan username wajib diisi' });
  }

  const newUser = {
    id: 'user_' + uuidv4().substring(0, 8),
    username,
    name,
    role: role || 'CONTRIBUTOR',
    opd: opd || 'Perangkat Daerah',
    email: email || '',
    phone: phone || '',
    color: color || '#2563eb',
    reviewedChapters: role === 'REVIEWER'
      ? (Array.isArray(reviewedChapters) && reviewedChapters.length > 0 ? reviewedChapters : ['BAB I'])
      : (role === 'ADMIN' ? ['BAB I', 'BAB II', 'BAB III', 'BAB IV', 'BAB V', 'BAB VI', 'BAB VII'] : [])
  };

  db.addUser(newUser);
  res.json({ success: true, data: newUser });
});

app.put('/api/users/:id', (req, res) => {
  const { name, username, role, opd, email, phone, color, reviewedChapters } = req.body;
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (username !== undefined) updateData.username = username;
  if (role !== undefined) updateData.role = role;
  if (opd !== undefined) updateData.opd = opd;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (color !== undefined) updateData.color = color;
  if (reviewedChapters !== undefined) updateData.reviewedChapters = reviewedChapters;

  const updated = db.updateUser(req.params.id, updateData);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
  }

  db.addLog({
    documentId: 'SYSTEM',
    userId: req.currentUser.id,
    userName: req.currentUser.name,
    action: 'UPDATE_USER',
    details: `Memperbarui data pengguna: "${updated.name}" (${updated.role})`
  });

  res.json({ success: true, data: updated });
});

// Update Reviewers for a specific Chapter (Level Bab)
app.put('/api/chapters/:chapterCode/reviewers', (req, res) => {
  if (req.currentUser.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Hanya Admin yang berhak menugaskan Reviewer pada Bab' });
  }
  const chapterCode = req.params.chapterCode.toUpperCase();
  const { reviewerUserIds } = req.body;
  if (!Array.isArray(reviewerUserIds)) {
    return res.status(400).json({ success: false, message: 'reviewerUserIds harus berupa array ID pengguna' });
  }

  db.getUsers().forEach(u => {
    if (u.role === 'REVIEWER') {
      const currentChapters = u.reviewedChapters || [];
      const shouldReview = reviewerUserIds.includes(u.id);
      let nextChapters = [...currentChapters];
      if (shouldReview && !currentChapters.includes(chapterCode)) {
        nextChapters.push(chapterCode);
      } else if (!shouldReview && currentChapters.includes(chapterCode)) {
        nextChapters = nextChapters.filter(c => c !== chapterCode);
      }
      db.updateUser(u.id, { reviewedChapters: nextChapters });
    }
  });

  res.json({
    success: true,
    message: `Reviewer untuk ${chapterCode} berhasil diperbarui`,
    data: db.getUsers().filter(u => u.role === 'REVIEWER')
  });
});

app.delete('/api/users/:id', (req, res) => {
  if (req.currentUser.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Hanya Admin yang berhak menghapus pengguna' });
  }

  try {
    const deleted = db.deleteUser(req.params.id);
    db.addLog({
      documentId: 'SYSTEM',
      userId: req.currentUser.id,
      userName: req.currentUser.name,
      action: 'DELETE_USER',
      details: `Menghapus pengguna: "${deleted.name}"`
    });

    res.json({ success: true, message: `Pengguna ${deleted.name} berhasil dihapus` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ================= 8 TAHAPAN RKPD API =================
app.get('/api/stages', (req, res) => {
  const stages = db.getStages();
  res.json({ success: true, data: stages });
});

app.get('/api/stages/current', (req, res) => {
  const activeStage = db.getActiveStage();
  res.json({ success: true, data: activeStage });
});

app.get('/api/stages/:id', (req, res) => {
  const stage = db.getStageById(req.params.id);
  if (!stage) {
    return res.status(404).json({ success: false, message: 'Tahapan tidak ditemukan' });
  }
  res.json({ success: true, data: stage });
});

// Admin Progress Tracking for a Stage
app.get('/api/stages/:id/tracking', (req, res) => {
  const trackingData = db.getStageProgressTracking(req.params.id);
  if (!trackingData) {
    return res.status(404).json({ success: false, message: 'Tahapan tidak ditemukan' });
  }
  res.json({ success: true, data: trackingData });
});

// Closing Stage and Roll Forward to next stage
app.post('/api/stages/:id/close', (req, res) => {
  if (req.currentUser.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Hanya Admin yang berhak melakukan Closing Tahapan' });
  }

  try {
    const { closingNotes } = req.body;
    const result = db.closeAndRollForward(req.params.id, {
      closedBy: req.currentUser.id,
      closedByName: req.currentUser.name,
      closingNotes: closingNotes || ''
    });

    db.addLog({
      documentId: 'ALL',
      userId: req.currentUser.id,
      userName: req.currentUser.name,
      action: 'STAGE_CLOSED_ROLL_FORWARD',
      details: `Closing Tahapan "${result.closedStage.title}". Seluruh dokumen (${result.rolledForwardDocsCount} dokumen) bergulir ke "${result.nextStage ? result.nextStage.title : 'Tahapan Selesai (Final)'}"`
    });

    res.json({
      success: true,
      message: `Tahapan "${result.closedStage.shortTitle}" berhasil ditutup dan naskah bergulir ke tahapan berikutnya!`,
      data: result
    });
  } catch (err) {
    console.error('Error closing stage:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// Reopen Stage
app.post('/api/stages/:id/reopen', (req, res) => {
  if (req.currentUser.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Hanya Admin yang berhak membuka kembali tahapan yang telah ditutup' });
  }

  try {
    const reopenedStage = db.reopenStage(req.params.id);
    db.addLog({
      documentId: 'ALL',
      userId: req.currentUser.id,
      userName: req.currentUser.name,
      action: 'STAGE_REOPENED',
      details: `Membuka kembali tahapan "${reopenedStage.title}"`
    });

    res.json({
      success: true,
      message: `Tahapan "${reopenedStage.shortTitle}" berhasil dibuka kembali.`,
      data: reopenedStage
    });
  } catch (err) {
    console.error('Error reopening stage:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// Seed templates into a stage
app.post('/api/stages/:id/seed-templates', async (req, res) => {
  try {
    const stageId = req.params.id;
    const stage = db.getStageById(stageId);
    if (!stage) {
      return res.status(404).json({ success: false, message: 'Tahapan tidak ditemukan' });
    }

    const importedDocs = await seedTemplatesForStage(stageId, req.currentUser);
    res.json({
      success: true,
      message: `Berhasil menginisialisasi ${importedDocs.length} Bab Dokumen RKPD ke ${stage.shortTitle}`,
      data: importedDocs
    });
  } catch (err) {
    console.error('Seed templates error:', err);
    res.status(500).json({ success: false, message: 'Gagal menginisialisasi template: ' + err.message });
  }
});

// ================= DOCUMENTS API =================
app.get('/api/documents', (req, res) => {
  const stageId = req.query.stageId || null;
  const docs = db.getDocuments(stageId);
  const user = req.currentUser;

  // Enrich with user-specific responsibility metadata (strip fullContentHtml for lightweight list)
  const enrichedDocs = docs.map(doc => {
    const { fullContentHtml, ...docMeta } = doc;
    const docSections = db.getSectionsByDocumentId(doc.id);
    const assignedSectionsCount = docSections.filter(s => (s.assignedUserIds || []).includes(user.id)).length;
    const isReviewerForThisDoc = user.role === 'ADMIN' || (user.role === 'REVIEWER' && (user.reviewedChapters || []).includes(doc.chapter));
    const isMyResponsibility = user.role === 'ADMIN'
      ? true
      : (user.role === 'REVIEWER' ? isReviewerForThisDoc : assignedSectionsCount > 0);

    return {
      ...docMeta,
      assignedSectionsCount,
      isReviewerForThisDoc,
      isMyResponsibility,
      isReadOnly: !isMyResponsibility
    };
  });

  res.json({ success: true, data: enrichedDocs });
});

app.post('/api/documents', (req, res) => {
  const { title, description } = req.body;
  const newDoc = {
    id: 'doc_' + uuidv4().substring(0, 8),
    title: title || 'Dokumen Tanpa Judul',
    description: description || '',
    createdBy: req.currentUser.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.addDocument(newDoc);
  db.addLog({
    documentId: newDoc.id,
    userId: req.currentUser.id,
    userName: req.currentUser.name,
    action: 'CREATE_DOC',
    details: `Membuat dokumen baru: "${newDoc.title}"`
  });

  res.json({ success: true, data: newDoc });
});

// Load standard RKPD BAB II Template
app.post('/api/documents/template-rkpd', (req, res) => {
  const docId = 'doc_' + uuidv4().substring(0, 8);
  const newDoc = {
    id: docId,
    title: 'RANCANGAN RKPD TAHUN 2027 - BAB II',
    description: 'Gambaran Umum Kondisi Daerah dan Evaluasi Kinerja Penyelenggaraan Pemerintahan Daerah',
    createdBy: req.currentUser.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.addDocument(newDoc);
  const templateSections = generateRkpdBab2Template(docId);
  db.addSectionsBatch(templateSections);

  db.addLog({
    documentId: docId,
    userId: req.currentUser.id,
    userName: req.currentUser.name,
    action: 'CREATE_FROM_TEMPLATE',
    details: `Membuat naskah dari Template Standar RKPD BAB II (${templateSections.length} bagian)`
  });

  res.json({ success: true, data: newDoc });
});

// ================= OFFICIAL RKPD TEMPLATES (BAB I - BAB VII) =================
const TEMPLATE_DIR = path.join(__dirname, '..', 'Template');

const CHAPTER_METADATA = {
  'RKPD 2027 PERBUP - BAB I (08.07).docx': {
    chapter: 'BAB I',
    title: 'PENDAHULUAN',
    desc: 'Latar Belakang, Dasar Hukum, Hubungan Antar Dokumen, Maksud & Tujuan, Sistematika RKPD',
    recommendedOpd: 'Bappeda (Bidang PPEPD & Sekretariat)'
  },
  'RKPD 2027 PERBUP - BAB II (17.07) .docx': {
    chapter: 'BAB II',
    title: 'GAMBARAN UMUM KONDISI DAERAH & EVALUASI RKPD',
    desc: 'Geografi, Demografi, Kesejahteraan Sosial, Urusan Pelayanan Dasar, Evaluasi Renja (222 Tabel Data)',
    recommendedOpd: 'Seluruh OPD / Dinas Teknis & Seluruh Bidang Bappeda'
  },
  'RKPD 2027 PERBUP - BAB III (10.07).docx': {
    chapter: 'BAB III',
    title: 'KERANGKA EKONOMI DAERAH DAN KEUANGAN DAERAH',
    desc: 'Arah Kebijakan Ekonomi Daerah, Proyeksi PAD, Belanja Daerah, dan TKDD',
    recommendedOpd: 'Bappeda (Bidang Perekonomian) & BPPKAD'
  },
  'RKPD 2027 PERBUP - BAB IV (17.07).docx': {
    chapter: 'BAB IV',
    title: 'SASARAN DAN PRIORITAS PEMBANGUNAN DAERAH',
    desc: 'Penyelarasan Prioritas Nasional (Asta Cita), Prioritas Jawa Tengah, Pokir DPRD, Isu Strategis Daerah',
    recommendedOpd: 'Bappeda (Bidang PPEPD & Bidang Terkait)'
  },
  'RKPD 2027 PERBUP - BAB V (16.07).docx': {
    chapter: 'BAB V',
    title: 'RENCANA KERJA DAN PENDANAAN DAERAH',
    desc: 'Proyeksi Pendanaan Rp 2,849 T, Matriks Program & Kegiatan Prioritas Urusan Daerah Tahun 2027',
    recommendedOpd: 'Bappeda (Bidang Anggaran/PPEPD) & Seluruh OPD'
  },
  'RKPD 2027 PERBUP - BAB VI (17.07).docx': {
    chapter: 'BAB VI',
    title: 'KINERJA PENYELENGGARAAN PEMERINTAHAN DAERAH',
    desc: 'Indikator Kinerja Utama (IKU), Indikator Kinerja Daerah (IKD), IKK LPPD, dan IUP 2027',
    recommendedOpd: 'Bappeda (Bidang Pengendalian & Evaluasi) & Inspektorat'
  },
  'RKPD 2027 PERBUP - BAB VII (09.07).docx': {
    chapter: 'BAB VII',
    title: 'PENUTUP',
    desc: 'Kaidah Pelaksanaan RKPD, Pedoman KUA-PPAS & APBD TA 2027, Komitmen Evaluasi',
    recommendedOpd: 'Tim Perumus Bappeda'
  }
};

async function seedTemplatesForStage(stageId, currentUser = { id: 'user_admin', name: 'Admin Bappeda (Koordinator)' }) {
  const files = Object.keys(CHAPTER_METADATA);
  const importedDocs = [];

  const assignmentsByChapter = {
    'BAB I': ['user_admin', 'user_pic_program'],
    'BAB II': [
      'user_pic_ikp',      // PIC Bidang IKP (Diskominfo)
      'user_pic_rinov',    // PIC Bidang Rinov (Bappeda)
      'user_pic_ppm',      // PIC Bidang PPM (Bappeda)
      'user_pic_program',  // PIC Bidang Program (PPEPD Bappeda)
      'user_dinkes',       // Dinas Kesehatan
      'user_disdik',       // Dinas Pendidikan
      'user_ekonomi'       // Bidang Ekonomi & SDA
    ],
    'BAB III': ['user_ekonomi', 'user_pic_program'],
    'BAB IV': ['user_admin', 'user_pic_rinov', 'user_pic_ppm'],
    'BAB V': ['user_pic_program', 'user_admin', 'user_ekonomi'],
    'BAB VI': ['user_reviewer', 'user_reviewer_apip', 'user_pic_program'],
    'BAB VII': ['user_admin']
  };

  for (const fileName of files) {
    const filePath = path.join(TEMPLATE_DIR, fileName);
    if (fs.existsSync(filePath)) {
      const meta = CHAPTER_METADATA[fileName];
      const docId = 'doc_' + uuidv4().substring(0, 8);
      const newDoc = {
        id: docId,
        stageId: stageId || 'stage_1',
        title: `RKPD 2027 PERBUP - ${meta.chapter}: ${meta.title}`,
        description: meta.desc,
        createdBy: currentUser.name,
        originalFilename: fileName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const parsedSections = await parseDocxToSections(filePath, docId);
      newDoc.fullContentHtml = parsedSections.fullHtml || '';

      const assignedUsers = assignmentsByChapter[meta.chapter] || ['user_admin'];
      parsedSections.forEach((sec, idx) => {
        sec.assignedUserIds = [assignedUsers[idx % assignedUsers.length]];
        // Sample workflow statuses for initial realism:
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

      db.addDocument(newDoc);
      db.addSectionsBatch(parsedSections);
      importedDocs.push(newDoc);
    }
  }

  db.addLog({
    documentId: 'ALL',
    userId: currentUser.id,
    userName: currentUser.name,
    action: 'SEED_TEMPLATES',
    details: `Inisialisasi naskah template 7 Bab RKPD ke Tahapan: ${stageId}`
  });

  return importedDocs;
}

app.get('/api/rkpd-templates', (req, res) => {
  try {
    if (!fs.existsSync(TEMPLATE_DIR)) {
      return res.json({ success: true, data: [] });
    }

    const files = fs.readdirSync(TEMPLATE_DIR).filter(f => f.endsWith('.docx'));
    const templates = files.map(fileName => {
      const filePath = path.join(TEMPLATE_DIR, fileName);
      const stat = fs.statSync(filePath);
      const meta = CHAPTER_METADATA[fileName] || {
        chapter: 'BAB',
        title: fileName.replace('.docx', ''),
        desc: 'Dokumen Perbup RKPD 2027',
        recommendedOpd: 'Bappeda'
      };

      return {
        fileName,
        chapter: meta.chapter,
        title: meta.title,
        desc: meta.desc,
        recommendedOpd: meta.recommendedOpd,
        sizeKb: (stat.size / 1024).toFixed(1),
        lastModified: stat.mtime.toISOString()
      };
    });

    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Import single chapter from Template folder
app.post('/api/rkpd-templates/import', async (req, res) => {
  try {
    const { fileName } = req.body;
    if (!fileName) {
      return res.status(400).json({ success: false, message: 'Nama file template harus diisi' });
    }

    const filePath = path.join(TEMPLATE_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File template tidak ditemukan' });
    }

    const meta = CHAPTER_METADATA[fileName] || {
      chapter: 'BAB',
      title: path.parse(fileName).name,
      desc: 'Naskah Resmi Perbup RKPD 2027'
    };

    const docId = 'doc_' + uuidv4().substring(0, 8);
    const newDoc = {
      id: docId,
      title: `RKPD 2027 PERBUP - ${meta.chapter}: ${meta.title}`,
      description: meta.desc,
      createdBy: req.currentUser.name,
      originalFilename: fileName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const parsedSections = await parseDocxToSections(filePath, docId);
    newDoc.fullContentHtml = parsedSections.fullHtml || '';
    db.addDocument(newDoc);
    db.addSectionsBatch(parsedSections);

    db.addLog({
      documentId: docId,
      userId: req.currentUser.id,
      userName: req.currentUser.name,
      action: 'IMPORT_TEMPLATE_CHAPTER',
      details: `Mengimpor naskah resmi ${meta.chapter} (${parsedSections.length} bagian naskah terurai)`
    });

    res.json({
      success: true,
      message: `Berhasil mengimpor ${meta.chapter} dengan ${parsedSections.length} bagian naskah`,
      data: newDoc
    });
  } catch (err) {
    console.error('Import chapter error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengimpor bab: ' + err.message });
  }
});

// Import all 7 chapters from Template folder
app.post('/api/rkpd-templates/import-all', async (req, res) => {
  try {
    const files = Object.keys(CHAPTER_METADATA);
    const importedDocs = [];

    for (const fileName of files) {
      const filePath = path.join(TEMPLATE_DIR, fileName);
      if (fs.existsSync(filePath)) {
        const meta = CHAPTER_METADATA[fileName];
        const docId = 'doc_' + uuidv4().substring(0, 8);
        const newDoc = {
          id: docId,
          title: `RKPD 2027 PERBUP - ${meta.chapter}: ${meta.title}`,
          description: meta.desc,
          createdBy: req.currentUser.name,
          originalFilename: fileName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const parsedSections = await parseDocxToSections(filePath, docId);
        newDoc.fullContentHtml = parsedSections.fullHtml || '';
        db.addDocument(newDoc);
        db.addSectionsBatch(parsedSections);
        importedDocs.push(newDoc);
      }
    }

    db.addLog({
      documentId: 'ALL',
      userId: req.currentUser.id,
      userName: req.currentUser.name,
      action: 'IMPORT_ALL_CHAPTERS',
      details: `Mengimpor paket naskah lengkap RKPD 2027 (Bab I s.d Bab VII - Total ${importedDocs.length} Dokumen)`
    });

    res.json({
      success: true,
      message: `Berhasil mengimpor paket naskah lengkap RKPD 2027 (${importedDocs.length} Bab Dokumen)`,
      data: importedDocs
    });
  } catch (err) {
    console.error('Import all chapters error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengimpor seluruh bab: ' + err.message });
  }
});

// ================= MICROSOFT WORD DESKTOP DIRECT INTEGRATION & AUTO-SYNC =================

/**
 * Resolve the matching original .docx template file for a document
 */
function resolveTemplateDocx(doc) {
  if (!doc) return null;
  
  // 1. Check if originalFilename is specified and exists
  if (doc.originalFilename) {
    const directPath = path.join(TEMPLATE_DIR, doc.originalFilename);
    if (fs.existsSync(directPath)) {
      return { fileName: doc.originalFilename, filePath: directPath };
    }
  }

  if (!fs.existsSync(TEMPLATE_DIR)) return null;

  // 2. Match by CHAPTER_METADATA and chapter code
  const chapter = doc.chapter || '';
  for (const [fn, meta] of Object.entries(CHAPTER_METADATA)) {
    if ((chapter && meta.chapter === chapter) || (chapter && fn.includes(chapter)) || (doc.title && doc.title.includes(meta.chapter))) {
      const p = path.join(TEMPLATE_DIR, fn);
      if (fs.existsSync(p)) {
        return { fileName: fn, filePath: p };
      }
    }
  }

  // 3. Fallback: match by BAB roman numeral in filename
  try {
    const files = fs.readdirSync(TEMPLATE_DIR).filter(f => f.endsWith('.docx') && !f.startsWith('~$'));
    for (const fn of files) {
      const chMatch = fn.match(/BAB\s+([IVXLCDM\d]+)/i);
      if (chMatch && doc.title && doc.title.toUpperCase().includes(chMatch[0].toUpperCase())) {
        return { fileName: fn, filePath: path.join(TEMPLATE_DIR, fn) };
      }
    }
  } catch (e) {}

  return null;
}

/**
 * Robust docx parsing with retry in case Word still holds an exclusive write lock
 */
async function safeParseDocxWithRetry(filePath, docId, maxRetries = 4, delayMs = 600) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await parseDocxToSections(filePath, docId);
    } catch (err) {
      const isLockError = err.code === 'EBUSY' || err.code === 'EACCES' || (err.message && err.message.includes('busy'));
      if (isLockError && attempt < maxRetries) {
        console.log(`[WORD AUTO-SYNC] File sedang disimpan oleh Word, mencoba membaca kembali dalam ${delayMs}ms (percobaan ${attempt}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Synchronize a modified .docx template file back into the Codot database
 */
async function syncTemplateFileToDatabase(fileName, docId, triggeredBy = 'Microsoft Word (Auto-Sync)') {
  const filePath = path.join(TEMPLATE_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File template "${fileName}" tidak ditemukan di folder Template/`);
  }

  const doc = db.data.documents.find(d => d.id === docId);
  if (!doc) {
    throw new Error(`Dokumen dengan ID "${docId}" tidak ditemukan`);
  }

  // Parse docx with formatting and section hierarchy preserved
  const parsedSections = await safeParseDocxWithRetry(filePath, docId);

  // Update document metadata
  doc.fullContentHtml = parsedSections.fullHtml || '';
  doc.originalFilename = fileName;
  doc.updatedAt = new Date().toISOString();

  // Merge parsed sections with existing sections to preserve OPD assignments, status, comments
  const existingSections = db.getSectionsByDocumentId(docId);

  if (existingSections.length > 0) {
    const existingByCode = new Map();
    existingSections.forEach(s => {
      if (s.code) existingByCode.set(s.code.trim().toUpperCase(), s);
      if (s.title) existingByCode.set(s.title.trim().toUpperCase(), s);
    });

    const updatedSections = [];
    const usedExistingIds = new Set();

    parsedSections.forEach((parsedSec, idx) => {
      const match = existingByCode.get(parsedSec.code?.trim().toUpperCase()) ||
                    existingByCode.get(parsedSec.title?.trim().toUpperCase()) ||
                    existingSections[idx];

      if (match && !usedExistingIds.has(match.id)) {
        usedExistingIds.add(match.id);
        match.content = parsedSec.content;
        match.code = parsedSec.code || match.code;
        match.title = parsedSec.title || match.title;
        match.level = parsedSec.level || match.level;
        match.order = idx + 1;
        match.orientation = parsedSec.orientation;
        match.tableFontSize = parsedSec.tableFontSize;
        match.hasTable = parsedSec.hasTable;
        match.maxTableColumns = parsedSec.maxTableColumns;
        match.updatedAt = new Date().toISOString();
        if (match.status === 'DRAFT') {
          match.status = 'IN_PROGRESS';
        }
        updatedSections.push(match);
      } else {
        parsedSec.order = idx + 1;
        parsedSec.assignedUserIds = existingSections[0]?.assignedUserIds || ['user_admin'];
        updatedSections.push(parsedSec);
      }
    });

    db.data.sections = db.data.sections.filter(s => s.documentId !== docId).concat(updatedSections);
  } else {
    db.addSectionsBatch(parsedSections);
  }

  db.addLog({
    documentId: docId,
    userId: 'user_admin',
    userName: triggeredBy,
    action: 'WORD_AUTOSYNC',
    details: `Perubahan file Word "${fileName}" otomatis disimpan ke server Codot (${parsedSections.length} bagian naskah diperbarui)`
  });

  db.save();
  return { doc, sectionCount: parsedSections.length };
}

// Live File Watcher on Template/ directory
let templateWatcherActive = false;
const debounceTimers = new Map();

function initTemplateWatcher() {
  if (templateWatcherActive || !fs.existsSync(TEMPLATE_DIR)) return;

  try {
    fs.watch(TEMPLATE_DIR, { persistent: true }, (eventType, filename) => {
      if (!filename || !filename.endsWith('.docx')) return;
      if (filename.startsWith('~$') || filename.startsWith('.')) return;

      if (debounceTimers.has(filename)) {
        clearTimeout(debounceTimers.get(filename));
      }

      const timer = setTimeout(async () => {
        debounceTimers.delete(filename);
        try {
          const fullPath = path.join(TEMPLATE_DIR, filename);
          if (!fs.existsSync(fullPath)) return;

          // Find which document corresponds to this filename
          const matchingDoc = db.data.documents.find(d => {
            if (d.originalFilename === filename) return true;
            const res = resolveTemplateDocx(d);
            return res && res.fileName === filename;
          });

          if (matchingDoc) {
            console.log(`⚡ [WORD AUTO-SYNC] Mendeteksi penyimpanan file Word: "${filename}"`);
            await syncTemplateFileToDatabase(filename, matchingDoc.id, 'Microsoft Word (Auto-Sync Live)');
            console.log(`✅ [WORD AUTO-SYNC] Dokumen "${matchingDoc.title}" berhasil disinkronkan ke server Codot`);
          }
        } catch (err) {
          console.error(`❌ [WORD AUTO-SYNC] Gagal sinkronisasi otomatis "${filename}":`, err.message);
        }
      }, 1200);

      debounceTimers.set(filename, timer);
    });

    templateWatcherActive = true;
    console.log(`👀 [WORD AUTO-SYNC] Live watcher aktif mengawasi folder Template/`);
  } catch (err) {
    console.error('Gagal mengaktifkan live file watcher:', err.message);
  }
}

// 1. Direct Open in Microsoft Word Desktop
app.post('/api/documents/:id/open-word-desktop', (req, res) => {
  try {
    const doc = db.getDocumentById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
    }

    const resolved = resolveTemplateDocx(doc);
    if (!resolved) {
      return res.status(404).json({ success: false, message: 'File Word (.docx) asli tidak ditemukan di folder Template/' });
    }

    // Ensure live watcher is active
    initTemplateWatcher();

    // Launch Microsoft Word desktop via Windows start command
    exec(`start "" "${resolved.filePath}"`, (err) => {
      if (err) {
        console.error('Gagal membuka Microsoft Word desktop:', err);
      }
    });

    db.addLog({
      documentId: doc.id,
      userId: req.currentUser.id,
      userName: req.currentUser.name,
      action: 'OPEN_WORD_DESKTOP',
      details: `Membuka naskah langsung di Microsoft Word Desktop: "${resolved.fileName}"`
    });

    res.json({
      success: true,
      message: `Membuka "${resolved.fileName}" di Microsoft Word Desktop. Setiap kali Anda menekan Ctrl+S di Word, perubahan langsung tersimpan ke server Codot!`,
      fileName: resolved.fileName,
      filePath: resolved.filePath,
      watcherActive: templateWatcherActive
    });
  } catch (err) {
    console.error('Open word desktop error:', err);
    res.status(500).json({ success: false, message: 'Gagal membuka Microsoft Word: ' + err.message });
  }
});

// 2. Manual Sync Trigger from Word File
app.post('/api/documents/:id/sync-word', async (req, res) => {
  try {
    const doc = db.getDocumentById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
    }

    const resolved = resolveTemplateDocx(doc);
    if (!resolved) {
      return res.status(404).json({ success: false, message: 'File Word asli tidak ditemukan di folder Template/' });
    }

    const result = await syncTemplateFileToDatabase(resolved.fileName, doc.id, `${req.currentUser.name} (Sinkronisasi Manual)`);

    res.json({
      success: true,
      message: `Naskah "${doc.title}" berhasil disinkronkan dari file "${resolved.fileName}" (${result.sectionCount} bagian naskah diperbarui)`,
      data: result.doc
    });
  } catch (err) {
    console.error('Manual sync word error:', err);
    res.status(500).json({ success: false, message: 'Gagal sinkronisasi dari Word: ' + err.message });
  }
});

// 3. Word File Metadata & Sync Status
app.get('/api/documents/:id/word-file-info', (req, res) => {
  try {
    const doc = db.getDocumentById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });

    const resolved = resolveTemplateDocx(doc);
    if (!resolved || !fs.existsSync(resolved.filePath)) {
      return res.json({ success: true, exists: false });
    }

    const stat = fs.statSync(resolved.filePath);
    res.json({
      success: true,
      exists: true,
      fileName: resolved.fileName,
      filePath: resolved.filePath,
      sizeKb: (stat.size / 1024).toFixed(1),
      lastModified: stat.mtime.toISOString(),
      watcherActive: templateWatcherActive
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Import existing sample docx from local folder 2027
app.post('/api/documents/import-sample', async (req, res) => {
  try {
    const samplePath = path.join(__dirname, '..', '..', '2027', 'RANCANGAN RKPD 2027 BAB II  (04.03).docx');
    if (!fs.existsSync(samplePath)) {
      return res.status(404).json({ success: false, message: 'File naskah RKPD di folder 2027 tidak ditemukan' });
    }

    const docId = 'doc_' + uuidv4().substring(0, 8);
    const newDoc = {
      id: docId,
      title: 'RANCANGAN RKPD 2027 BAB II (04.03)',
      description: 'Diimpor langsung dari arsip naskah Dinas Bappeda Kab Cilacap (7.74 MB)',
      createdBy: req.currentUser.name,
      originalFilename: 'RANCANGAN RKPD 2027 BAB II  (04.03).docx',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const parsedSections = await parseDocxToSections(samplePath, docId);
    newDoc.fullContentHtml = parsedSections.fullHtml || '';
    db.addDocument(newDoc);
    db.addSectionsBatch(parsedSections);

    db.addLog({
      documentId: docId,
      userId: req.currentUser.id,
      userName: req.currentUser.name,
      action: 'IMPORT_SAMPLE',
      details: `Mengimpor naskah langsung dari folder 2027 (${parsedSections.length} bagian naskah terurai)`
    });

    res.json({
      success: true,
      message: `Berhasil mengimpor naskah asli dengan ${parsedSections.length} bagian`,
      data: newDoc
    });
  } catch (err) {
    console.error('Import sample error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengimpor sampel: ' + err.message });
  }
});

// Import DOCX file and split into sections
app.post('/api/documents/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File Word (.docx) tidak ditemukan' });
    }

    const originalName = req.file.originalname;
    const filePath = req.file.path;
    const titleWithoutExt = path.parse(originalName).name;

    const docId = 'doc_' + uuidv4().substring(0, 8);
    const newDoc = {
      id: docId,
      title: titleWithoutExt,
      description: `Diimpor dari file "${originalName}" pada ${new Date().toLocaleString('id-ID')}`,
      createdBy: req.currentUser.name,
      originalFilename: originalName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Parse sections
    const parsedSections = await parseDocxToSections(filePath, docId);
    newDoc.fullContentHtml = parsedSections.fullHtml || '';
    db.addDocument(newDoc);
    db.addSectionsBatch(parsedSections);

    db.addLog({
      documentId: docId,
      userId: req.currentUser.id,
      userName: req.currentUser.name,
      action: 'IMPORT_DOCX',
      details: `Mengimpor dokumen "${originalName}" dan memecah menjadi ${parsedSections.length} bagian hierarki`
    });

    res.json({
      success: true,
      message: `Berhasil mengimpor dokumen dengan ${parsedSections.length} bagian naskah`,
      data: newDoc
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengimpor dokumen: ' + err.message });
  }
});

// Get Document details with Sections & Permissions
app.get('/api/documents/:id', (req, res) => {
  const doc = db.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
  }

  const sections = db.getSectionsByDocumentId(doc.id);
  const user = req.currentUser;
  const isStageClosed = doc.stage && doc.stage.status === 'CLOSED';

  // Enrich sections with permission metadata for current user
  const docChapter = doc.chapter || 'BAB I';
  const isReviewerForThisDoc = user.role === 'ADMIN' || (user.role === 'REVIEWER' && (user.reviewedChapters || []).includes(docChapter));
  const hasAssignedSections = sections.some(sec => (sec.assignedUserIds || []).includes(user.id));
  const isMyResponsibilityDoc = user.role === 'ADMIN'
    ? true
    : (user.role === 'REVIEWER' ? isReviewerForThisDoc : hasAssignedSections);
  const isDocReadOnly = !isMyResponsibilityDoc;

  const enrichedSections = sections.map(sec => {
    const isAssigned = (sec.assignedUserIds || []).includes(user.id);
    const isAdmin = user.role === 'ADMIN';

    // Editable if not closed, not locked, and user is assigned contributor or admin
    const canEdit = !isStageClosed && !sec.isLocked && (isAdmin || (user.role === 'CONTRIBUTOR' && isAssigned));
    // Can comment if admin, assigned reviewer for this Bab, or assigned contributor on their section
    const canComment = !isStageClosed && (isAdmin || isReviewerForThisDoc || (user.role === 'CONTRIBUTOR' && isAssigned));
    const canManagePermission = !isStageClosed && isAdmin;
    // Can change status if: admin, assigned reviewer for this Bab, or assigned contributor (non-approved) on their section
    const canChangeStatus = !isStageClosed && (isAdmin || isReviewerForThisDoc || (isAssigned && sec.status !== 'APPROVED'));
    const isReadOnly = !canEdit;

    return {
      ...sec,
      canEdit,
      canComment,
      canManagePermission,
      canChangeStatus,
      isAssigned,
      isReadOnly
    };
  });

  res.json({
    success: true,
    data: {
      ...doc,
      docChapter,
      isReviewerForThisDoc,
      hasAssignedSections,
      isMyResponsibility: isMyResponsibilityDoc,
      isDocReadOnly,
      isStageClosed,
      sections: enrichedSections
    }
  });
});

// Update Document Info
app.put('/api/documents/:id', (req, res) => {
  if (req.currentUser.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Hanya Admin yang berhak mengubah informasi dokumen' });
  }
  const { title, description, fullContentHtml } = req.body;
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (fullContentHtml !== undefined) updateData.fullContentHtml = fullContentHtml;

  const updated = db.updateDocument(req.params.id, updateData);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
  }
  res.json({ success: true, data: updated });
});

// Update Document Full HTML Content
app.put('/api/documents/:id/content', (req, res) => {
  if (req.currentUser.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Hanya Admin yang berhak menyimpan perubahan naskah dokumen utuh secara global. Kontributor silakan menyunting per sub-bab tugas Anda.'
    });
  }
  const { fullContentHtml } = req.body;
  if (fullContentHtml === undefined) {
    return res.status(400).json({ success: false, message: 'Konten tidak boleh kosong' });
  }
  const updated = db.updateDocument(req.params.id, { fullContentHtml });
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
  }
  res.json({ success: true, data: updated });
});

// Delete Document
app.delete('/api/documents/:id', (req, res) => {
  if (req.currentUser.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Hanya Admin yang berhak menghapus dokumen' });
  }
  db.deleteDocument(req.params.id);
  res.json({ success: true, message: 'Dokumen berhasil dihapus' });
});

// ================= SECTIONS API =================

// Add new manual section
app.post('/api/documents/:id/sections', (req, res) => {
  const { code, title, level, content, assignedUserIds } = req.body;
  const docId = req.params.id;

  const existingSections = db.getSectionsByDocumentId(docId);
  const order = existingSections.length + 1;

  const newSec = {
    id: 'sec_' + uuidv4().substring(0, 8),
    documentId: docId,
    order,
    level: level || 2,
    code: code || '',
    title: title || 'Bagian Baru',
    content: content || '<p>Tuliskan narasi bagian ini...</p>',
    assignedUserIds: assignedUserIds || [],
    status: 'DRAFT',
    isLocked: false,
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.addSection(newSec);
  db.addLog({
    documentId: docId,
    userId: req.currentUser.id,
    userName: req.currentUser.name,
    action: 'ADD_SECTION',
    details: `Menambahkan bagian baru: "${newSec.code} ${newSec.title}"`
  });

  res.json({ success: true, data: newSec });
});

// Get a comparison pair of Sections for Side-by-Side inspector
app.get('/api/sections/compare-pair', (req, res) => {
  const { secIdA, secIdB } = req.query;
  const secA = secIdA ? db.getSectionById(secIdA) : null;
  const secB = secIdB ? db.getSectionById(secIdB) : null;

  if (!secA && !secB) {
    return res.status(404).json({ success: false, message: 'Bagian naskah tidak ditemukan' });
  }

  const docA = secA ? db.getDocumentById(secA.documentId) : null;
  const docB = secB ? db.getDocumentById(secB.documentId) : null;

  res.json({
    success: true,
    data: {
      sourceA: secA ? {
        ...secA,
        documentTitle: docA ? docA.title : '',
        chapter: docA ? (docA.chapter || docA.title.match(/BAB [I|V|X]+/)?.[0] || 'BAB I') : 'BAB I'
      } : null,
      sourceB: secB ? {
        ...secB,
        documentTitle: docB ? docB.title : '',
        chapter: docB ? (docB.chapter || docB.title.match(/BAB [I|V|X]+/)?.[0] || 'BAB I') : 'BAB I'
      } : null
    }
  });
});

// Get single section details
app.get('/api/sections/:id', (req, res) => {
  const section = db.getSectionById(req.params.id);
  if (!section) {
    return res.status(404).json({ success: false, message: 'Bagian naskah tidak ditemukan' });
  }
  const doc = db.getDocumentById(section.documentId);
  res.json({
    success: true,
    data: {
      ...section,
      documentTitle: doc ? doc.title : '',
      chapter: doc ? (doc.chapter || doc.title.match(/BAB [I|V|X]+/)?.[0] || 'BAB I') : 'BAB I'
    }
  });
});

// Update Section Content (Save text/table)
app.put('/api/sections/:id/content', (req, res) => {
  const section = db.getSectionById(req.params.id);
  if (!section) {
    return res.status(404).json({ success: false, message: 'Bagian naskah tidak ditemukan' });
  }

  const user = req.currentUser;
  const isAdmin = user.role === 'ADMIN';
  const isAssigned = section.assignedUserIds.includes(user.id);

  if (section.isLocked && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Bagian ini sedang terkunci dan tidak dapat diubah' });
  }

  if (!isAdmin && !isAssigned) {
    return res.status(403).json({ success: false, message: 'Anda tidak memiliki hak akses untuk mengedit bagian ini' });
  }

  const { content, title, code, orientation, tableFontSize } = req.body;
  const updatePayload = {
    content: content !== undefined ? content : section.content,
    title: title || section.title,
    code: code !== undefined ? code : section.code,
    status: section.status === 'DRAFT' ? 'IN_PROGRESS' : section.status
  };
  if (orientation !== undefined) updatePayload.orientation = orientation;
  if (tableFontSize !== undefined) updatePayload.tableFontSize = tableFontSize;

  const updated = db.updateSection(section.id, updatePayload);

  db.addLog({
    documentId: section.documentId,
    userId: user.id,
    userName: user.name,
    action: 'EDIT_CONTENT',
    details: `Memperbarui narasi bagian "${section.code} ${section.title}"`
  });

  // Auto-sync to Google Drive in background if enabled
  if (googleDriveService.config.enabled && googleDriveService.config.autoSync) {
    setTimeout(async () => {
      try {
        await googleDriveService.sync(db, { exportSectionsToDocx });
      } catch (e) {
        console.error('Background GDrive auto-sync:', e.message);
      }
    }, 3000);
  }

  res.json({ success: true, data: updated });
});

// Update Section Permissions (Admin assigns users or locks/unlocks)
app.put('/api/sections/:id/permissions', (req, res) => {
  if (req.currentUser.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat mengatur hak akses penugasan' });
  }

  const section = db.getSectionById(req.params.id);
  if (!section) {
    return res.status(404).json({ success: false, message: 'Bagian tidak ditemukan' });
  }

  const { assignedUserIds, isLocked } = req.body;
  const updated = db.updateSection(section.id, {
    assignedUserIds: assignedUserIds !== undefined ? assignedUserIds : section.assignedUserIds,
    isLocked: isLocked !== undefined ? isLocked : section.isLocked
  });

  const assignedNames = (updated.assignedUserIds || [])
    .map(uid => db.getUserById(uid)?.name || uid)
    .join(', ');

  db.addLog({
    documentId: section.documentId,
    userId: req.currentUser.id,
    userName: req.currentUser.name,
    action: 'UPDATE_PERMISSION',
    details: `Mengatur hak akses "${section.code} ${section.title}": Ditugaskan kepada [${assignedNames || 'Tidak ada'}], Status Kunci: ${updated.isLocked ? 'Terkunci' : 'Terbuka'}`
  });

  res.json({ success: true, data: updated });
});

// Update Section Status (Draft -> In Progress -> Review -> Approved)
app.put('/api/sections/:id/status', (req, res) => {
  const section = db.getSectionById(req.params.id);
  if (!section) {
    return res.status(404).json({ success: false, message: 'Bagian tidak ditemukan' });
  }

  const { status } = req.body;
  const user = req.currentUser;
  const isAdmin = user.role === 'ADMIN';
  const doc = db.getDocumentById(section.documentId);
  const docChapter = doc?.chapter || 'BAB I';
  const isReviewerForDoc = user.role === 'REVIEWER' && (user.reviewedChapters || []).includes(docChapter);
  const isAssignedContributor = user.role === 'CONTRIBUTOR' && (section.assignedUserIds || []).includes(user.id);

  if (!isAdmin && !isReviewerForDoc && !isAssignedContributor) {
    return res.status(403).json({
      success: false,
      message: 'Anda tidak memiliki hak untuk mengubah status pada bagian ini (Mode Lihat Saja).'
    });
  }

  // Contributor can only change status of their assigned section to DRAFT, IN_PROGRESS, or REVIEW
  if (user.role === 'CONTRIBUTOR' && status === 'APPROVED') {
    return res.status(403).json({
      success: false,
      message: 'Hanya Admin atau Reviewer Bab yang berhak menyetujui (Approve) naskah.'
    });
  }

  // Validation for APPROVED status
  if (status === 'APPROVED') {
    const isAllowedToApprove = isAdmin || isReviewerForDoc;
    if (!isAllowedToApprove) {
      return res.status(403).json({
        success: false,
        message: `Hanya Admin atau Reviewer yang ditugaskan memantau ${docChapter} yang berhak menyetujui (Approve) naskah ini.`
      });
    }
  }

  // Auto-lock when approved, auto-unlock when returning to revision/draft
  let newIsLocked = section.isLocked;
  if (status === 'APPROVED') {
    newIsLocked = true;
  } else if (section.status === 'APPROVED') {
    newIsLocked = false;
  }
  if (req.body.isLocked !== undefined) {
    newIsLocked = req.body.isLocked;
  }

  const updated = db.updateSection(section.id, {
    status: status,
    isLocked: newIsLocked
  });

  db.addLog({
    documentId: section.documentId,
    userId: user.id,
    userName: user.name,
    action: 'STATUS_CHANGE',
    details: `Mengubah status "${section.code} ${section.title}" menjadi: ${status}`
  });

  res.json({ success: true, data: updated });
});

// Add comment/review note
app.post('/api/sections/:id/comments', (req, res) => {
  const section = db.getSectionById(req.params.id);
  if (!section) {
    return res.status(404).json({ success: false, message: 'Bagian tidak ditemukan' });
  }

  const doc = db.getDocumentById(section.documentId);
  const docChapter = doc?.chapter || 'BAB I';
  const user = req.currentUser;
  const isAdmin = user.role === 'ADMIN';
  const isReviewerForDoc = user.role === 'REVIEWER' && (user.reviewedChapters || []).includes(docChapter);
  const isAssignedContributor = user.role === 'CONTRIBUTOR' && (section.assignedUserIds || []).includes(user.id);

  if (!isAdmin && !isReviewerForDoc && !isAssignedContributor) {
    return res.status(403).json({
      success: false,
      message: user.role === 'REVIEWER'
        ? `Anda tidak ditugaskan sebagai Reviewer pada ${docChapter}. Bagian ini hanya untuk Anda lihat (Mode Lihat Saja).`
        : `Anda tidak ditugaskan pada sub-bab ini. Bagian ini hanya untuk Anda lihat (Mode Lihat Saja).`
    });
  }

  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Komentar tidak boleh kosong' });
  }

  const newComment = {
    id: 'c_' + uuidv4().substring(0, 6),
    authorId: req.currentUser.id,
    authorName: req.currentUser.name,
    authorRole: req.currentUser.role,
    authorOpd: req.currentUser.opd,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  const comments = [...(section.comments || []), newComment];
  db.updateSection(section.id, { comments });

  db.addLog({
    documentId: section.documentId,
    userId: req.currentUser.id,
    userName: req.currentUser.name,
    action: 'ADD_COMMENT',
    details: `Memberi catatan revisi pada "${section.code} ${section.title}": "${newComment.text.substring(0, 40)}..."`
  });

  res.json({ success: true, data: newComment });
});

// Export Document to Word (.docx)
app.get('/api/documents/:id/export', async (req, res) => {
  try {
    const doc = db.getDocumentById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan' });
    }

    const sections = db.getSectionsByDocumentId(doc.id);
    const buffer = await exportSectionsToDocx(doc, sections);

    const safeFilename = encodeURIComponent(doc.title.replace(/[/\\?%*:|"<>]/g, '_')) + '.docx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`);
    res.send(buffer);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengekspor dokumen: ' + err.message });
  }
});

// ================= MICROSOFT WORD DIRECT COLLABORATION BRIDGE =================

// Options handshake for WebDAV and Office URI scheme
app.options(['/api/word-bridge/:token/:id/:filename', '/api/word-bridge/:token/:id', '/api/sections/:id/word-bridge.docx'], (req, res) => {
  res.setHeader('MS-Author-Via', 'DAV');
  res.setHeader('DAV', '1, 2');
  res.setHeader('Allow', 'OPTIONS, GET, HEAD, POST, PUT');
  res.setHeader('Public', 'OPTIONS, GET, HEAD, POST, PUT');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, PUT, POST');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id, If-Match, If-None-Match, Lock-Token');
  res.status(200).end();
});

// Stream clean DOCX directly into Microsoft Word Desktop
const handleWordBridgeGet = async (req, res) => {
  try {
    const sectionId = req.params.id;
    const token = req.params.token || req.query.token || req.headers['x-user-id'] || 'user_admin';
    const section = db.getSectionById(sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Bagian naskah tidak ditemukan' });
    }

    const doc = db.getDocumentById(section.documentId) || { title: 'DOKUMEN RKPD' };
    const buffer = await exportSingleSectionToDocx(section, doc);

    const safeFilename = encodeURIComponent(`${section.code || 'Sec'}_${section.title}`.replace(/[/\\?%*:|"<>]/g, '_')) + '.docx';
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`);
    res.setHeader('MS-Author-Via', 'DAV');
    res.setHeader('DAV', '1, 2');
    res.setHeader('ETag', `"${section.updatedAt || Date.now()}"`);
    res.setHeader('Last-Modified', new Date(section.updatedAt || Date.now()).toUTCString());
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');

    if (req.method === 'HEAD') {
      res.setHeader('Content-Length', buffer.length);
      return res.status(200).end();
    }

    res.send(buffer);
  } catch (err) {
    console.error('Word bridge export error:', err);
    res.status(500).json({ success: false, message: 'Gagal membuka di Word: ' + err.message });
  }
};

app.get(['/api/word-bridge/:token/:id/:filename', '/api/word-bridge/:token/:id', '/api/sections/:id/word-bridge.docx'], handleWordBridgeGet);
app.head(['/api/word-bridge/:token/:id/:filename', '/api/word-bridge/:token/:id', '/api/sections/:id/word-bridge.docx'], handleWordBridgeGet);

// Save back from Microsoft Word Desktop (Ctrl + S)
const handleWordBridgePut = async (req, res) => {
  try {
    const sectionId = req.params.id;
    const token = req.params.token || req.query.token || req.headers['x-user-id'] || 'user_admin';
    const user = db.getUserById(token) || req.currentUser || db.getUserById('user_admin');

    const section = db.getSectionById(sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Bagian naskah tidak ditemukan' });
    }

    const isAdmin = user.role === 'ADMIN';
    if (section.isLocked && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Bagian ini terkunci' });
    }

    const docxBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
    if (!docxBuffer || docxBuffer.length === 0) {
      return res.status(400).json({ success: false, message: 'File Word kosong' });
    }

    const parsed = await parseSingleDocxToContent(docxBuffer);

    const updated = db.updateSection(section.id, {
      content: parsed.contentHtml || section.content,
      orientation: parsed.orientation,
      tableFontSize: parsed.tableFontSize,
      status: section.status === 'DRAFT' ? 'IN_PROGRESS' : section.status
    });

    db.addLog({
      documentId: section.documentId,
      userId: user.id,
      userName: user.name,
      action: 'EDIT_WORD_DESKTOP',
      details: `Menyimpan perubahan via Microsoft Word Desktop (Ctrl+S) pada "${section.code} ${section.title}"`
    });

    res.setHeader('MS-Author-Via', 'DAV');
    res.setHeader('DAV', '1, 2');
    res.setHeader('ETag', `"${Date.now()}"`);
    res.status(200).json({ success: true, message: 'Berhasil disimpan dari Microsoft Word', data: updated });
  } catch (err) {
    console.error('Word bridge save error:', err);
    res.status(500).json({ success: false, message: 'Gagal menyimpan perubahan Word: ' + err.message });
  }
};

app.put(['/api/word-bridge/:token/:id/:filename', '/api/word-bridge/:token/:id', '/api/sections/:id/word-bridge.docx'], handleWordBridgePut);

// Manual Upload / Re-import Word file for a section (Dropzone or Upload Button)
app.post('/api/sections/:id/reimport-word', upload.single('file'), async (req, res) => {
  try {
    const section = db.getSectionById(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Bagian naskah tidak ditemukan' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File Word (.docx) tidak ditemukan' });
    }

    const user = req.currentUser;
    const filePath = req.file.path;
    const parsed = await parseSingleDocxToContent(filePath);

    // Clean up uploaded file
    try { fs.unlinkSync(filePath); } catch (e) {}

    const updated = db.updateSection(section.id, {
      content: parsed.contentHtml || section.content,
      orientation: parsed.orientation,
      tableFontSize: parsed.tableFontSize,
      status: section.status === 'DRAFT' ? 'IN_PROGRESS' : section.status
    });

    db.addLog({
      documentId: section.documentId,
      userId: user.id,
      userName: user.name,
      action: 'IMPORT_WORD_SECTION',
      details: `Mengunggah pembaruan naskah dari file Word "${req.file.originalname}" ke "${section.code} ${section.title}"`
    });

    res.json({ success: true, message: 'Naskah berhasil disinkronkan dari file Word', data: updated });
  } catch (err) {
    console.error('Manual word import error:', err);
    res.status(500).json({ success: false, message: 'Gagal memproses file Word: ' + err.message });
  }
});

// Section Word Bridge Status (for frontend polling / live update)
app.get('/api/sections/:id/word-bridge-status', (req, res) => {
  const section = db.getSectionById(req.params.id);
  if (!section) return res.status(404).json({ success: false });
  res.json({
    success: true,
    data: {
      id: section.id,
      updatedAt: section.updatedAt,
      status: section.status,
      orientation: section.orientation,
      tableFontSize: section.tableFontSize
    }
  });
});

// Activity logs
app.get('/api/documents/:id/logs', (req, res) => {
  const logs = db.getLogsByDocumentId(req.params.id);
  res.json({ success: true, data: logs });
});

// ================= CROSS-CHAPTER CONSISTENCY AUDIT API =================
app.get('/api/consistency/check', (req, res) => {
  try {
    const stageId = req.query.stageId || db.getActiveStage()?.id || 'stage_1';
    const report = analyzeConsistency(stageId, db);
    res.json({ success: true, data: report });
  } catch (err) {
    console.error('Consistency check error:', err);
    res.status(500).json({ success: false, message: 'Gagal menganalisis konsistensi naskah: ' + err.message });
  }
});

// Comprehensive Universal Consistency Check (Tables, Narratives, Fuzzy >= 80%)
app.get('/api/consistency/comprehensive', (req, res) => {
  try {
    const stageId = req.query.stageId || db.getActiveStage()?.id || 'stage_1';
    const threshold = parseFloat(req.query.threshold) || 0.80;
    const report = runComprehensiveConsistencyAnalysis(stageId, db, threshold);
    res.json({ success: true, data: report });
  } catch (err) {
    console.error('Comprehensive consistency check error:', err);
    res.status(500).json({ success: false, message: 'Gagal pemindaian konsistensi menyeluruh: ' + err.message });
  }
});

// ================= GOOGLE DRIVE & CLOUD BACKUP API =================
app.get('/api/gdrive/config', (req, res) => {
  res.json({ success: true, data: googleDriveService.getConfig() });
});

app.post('/api/gdrive/config', (req, res) => {
  if (req.currentUser.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat mengubah konfigurasi Google Drive' });
  }
  const updated = googleDriveService.saveConfig(req.body);
  res.json({ success: true, data: googleDriveService.getConfig() });
});

app.post('/api/gdrive/sync', async (req, res) => {
  try {
    const docxService = { exportSectionsToDocx };
    const syncResult = await googleDriveService.sync(db, docxService);

    db.addLog({
      documentId: 'SYSTEM',
      userId: req.currentUser.id,
      userName: req.currentUser.name,
      action: 'GDRIVE_SYNC',
      details: `Sinkronisasi Google Drive: ${syncResult.syncedFiles.length} file berhasil dicadangkan`
    });

    res.json({ success: true, message: 'Sinkronisasi Google Drive berhasil', data: syncResult });
  } catch (err) {
    console.error('Google Drive sync error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/gdrive/backups', (req, res) => {
  const backups = googleDriveService.getBackupsList();
  res.json({ success: true, data: backups });
});

app.get('/api/gdrive/download-snapshot', (req, res) => {
  const dbData = db.data;
  const filename = `rkpd_snapshot_${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(dbData, null, 2));
});

// Restore database from snapshot file
app.post('/api/gdrive/restore', upload.single('backupFile'), (req, res) => {
  if (req.currentUser.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat memulihkan database' });
  }
  try {
    let parsedData = null;
    if (req.file) {
      const raw = fs.readFileSync(req.file.path, 'utf-8');
      parsedData = JSON.parse(raw);
    } else if (req.body.fileName) {
      const filePath = path.join(googleDriveService.config.syncFolderPath, req.body.fileName);
      if (fs.existsSync(filePath)) {
        parsedData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    }

    if (!parsedData || !parsedData.documents) {
      return res.status(400).json({ success: false, message: 'Format file cadangan tidak valid' });
    }

    db.data = {
      users: parsedData.users || db.data.users,
      documents: parsedData.documents || [],
      sections: parsedData.sections || [],
      logs: parsedData.logs || []
    };
    db.save();

    res.json({
      success: true,
      message: `Database berhasil dipulihkan (${db.data.documents.length} dokumen, ${db.data.sections.length} bagian naskah)`
    });
  } catch (err) {
    console.error('Restore error:', err);
    res.status(500).json({ success: false, message: 'Gagal memulihkan database: ' + err.message });
  }
});

// Catch-all API 404 handler (ensures json response instead of HTML)
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Endpoint API tidak ditemukan: ${req.method} ${req.originalUrl || req.url}` });
});

// Serve frontend static build
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global Express error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server: ' + (err.message || 'Unknown error') });
});

// Start server
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 RKPD Document Collaboration Server running on http://localhost:${PORT}`);

    // Inisialisasi Live Auto-Sync Watcher untuk Folder Template/
    initTemplateWatcher();

    // Auto-seed Stage 1 if database has 0 documents
    if (db.data.documents.length === 0) {
      console.log('📦 Inisialisasi otomatis naskah template 7 Bab RKPD ke Tahap 1...');
      seedTemplatesForStage('stage_1').then(docs => {
        console.log(`✅ Berhasil menginisialisasi ${docs.length} Bab Dokumen RKPD ke Tahap 1`);
      }).catch(err => {
        console.error('Gagal inisialisasi naskah otomatis:', err.message);
      });
    }
  });
}

module.exports = app;
