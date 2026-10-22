const fs = require('fs');
const path = require('path');
const os = require('os');

const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = fs.existsSync(path.join(process.cwd(), 'data'))
  ? path.join(process.cwd(), 'data')
  : path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const TMP_DB_FILE = path.join(os.tmpdir(), 'rkpd_database.json');

// Ensure data directory exists if writable
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Ignored in read-only / serverless environment
}

const DEFAULT_USERS = [
  {
    id: 'user_admin',
    username: 'admin',
    name: 'Admin Bappeda (Koordinator)',
    role: 'ADMIN',
    opd: 'Bappeda - Sekretariat / Bidang PPEPD',
    email: 'admin@bappeda.go.id',
    color: '#4f46e5',
    password: '12345@',
    reviewedChapters: ['BAB I', 'BAB II', 'BAB III', 'BAB IV', 'BAB V', 'BAB VI', 'BAB VII']
  },
  {
    id: 'user_pandu',
    username: 'Pandu',
    name: 'Pandu Setiabudi',
    role: 'CONTRIBUTOR',
    opd: 'IKP - Kewilayahan',
    email: 'pandu@cilacapkab.go.id',
    color: '#0284c7',
    password: '12345@',
    reviewedChapters: []
  },
  {
    id: 'user_nabila',
    username: 'Nabila',
    name: 'Nabila Dezty Anggraeni',
    role: 'CONTRIBUTOR',
    opd: 'Progev - PP',
    email: 'nabila@cilacapkab.go.id',
    color: '#ec4899',
    password: '12345@',
    reviewedChapters: []
  },
  {
    id: 'user_dodo',
    username: 'Dodo',
    name: 'Dodo Riyatno',
    role: 'CONTRIBUTOR',
    opd: 'Sekretariat',
    email: 'dodo@cilacapkab.go.id',
    color: '#8b5cf6',
    password: '12345@',
    reviewedChapters: []
  },
  {
    id: 'user_anny',
    username: 'Anny',
    name: 'Anny Sutrisnawati',
    role: 'CONTRIBUTOR',
    opd: 'PPM - Pemb. Manusia',
    email: 'anny@cilacapkab.go.id',
    color: '#f59e0b',
    password: '12345@',
    reviewedChapters: []
  },
  {
    id: 'user_ahmad',
    username: 'Ahmad',
    name: 'Ahmad Maghfuri',
    role: 'CONTRIBUTOR',
    opd: 'Progev - PP',
    email: 'ahmad@cilacapkab.go.id',
    color: '#10b981',
    password: '12345@',
    reviewedChapters: []
  },
  {
    id: 'user_uci',
    username: 'Uci',
    name: 'Uci Nur Wijayanti',
    role: 'CONTRIBUTOR',
    opd: 'Progev - Datin',
    email: 'uci@cilacapkab.go.id',
    color: '#06b6d4',
    password: '12345@',
    reviewedChapters: []
  },
  {
    id: 'user_hadi',
    username: 'Hadi',
    name: 'Hadi Satriyo',
    role: 'REVIEWER',
    opd: 'Progev - Datin',
    email: 'hadi@cilacapkab.go.id',
    color: '#3b82f6',
    password: '12345@',
    reviewedChapters: ['BAB I', 'BAB II', 'BAB III', 'BAB IV', 'BAB V', 'BAB VI', 'BAB VII']
  },
  {
    id: 'user_sumaryanto',
    username: 'Sumaryanto',
    name: 'Sumaryanto',
    role: 'REVIEWER',
    opd: 'Progev - Dalev',
    email: 'sumaryanto@cilacapkab.go.id',
    color: '#6366f1',
    password: '12345@',
    reviewedChapters: ['BAB I', 'BAB II', 'BAB III', 'BAB IV', 'BAB V', 'BAB VI', 'BAB VII']
  },
  {
    id: 'user_ilyasa',
    username: 'Ilyasa',
    name: 'Ilyasa Suryaningpraja',
    role: 'REVIEWER',
    opd: 'Progev - PP',
    email: 'ilyasa@cilacapkab.go.id',
    color: '#0891b2',
    password: '12345@',
    reviewedChapters: ['BAB I', 'BAB II', 'BAB III', 'BAB IV', 'BAB V', 'BAB VI', 'BAB VII']
  },
  {
    id: 'user_jatmiko',
    username: 'Jatmiko',
    name: 'Jatmiko Rudiono',
    role: 'CONTRIBUTOR',
    opd: 'IKP - Infrastruktur',
    email: 'jatmiko@cilacapkab.go.id',
    color: '#f97316',
    password: '12345@',
    reviewedChapters: []
  },
  {
    id: 'user_widiyatno',
    username: 'Widiyatno',
    name: 'Widiyatno',
    role: 'CONTRIBUTOR',
    opd: 'IKP - Kewilayahan',
    email: 'widiyatno@cilacapkab.go.id',
    color: '#14b8a6',
    password: '12345@',
    reviewedChapters: []
  },
  {
    id: 'user_titin',
    username: 'Titin',
    name: 'Titin Indriati',
    role: 'CONTRIBUTOR',
    opd: 'IKP - Perekonomian',
    email: 'titin@cilacapkab.go.id',
    color: '#d97706',
    password: '12345@',
    reviewedChapters: []
  },
  {
    id: 'user_be',
    username: 'Be',
    name: 'Be Santoso Nugroho',
    role: 'CONTRIBUTOR',
    opd: 'IKP - SDA',
    email: 'be@cilacapkab.go.id',
    color: '#059669',
    password: '12345@',
    reviewedChapters: []
  },
  {
    id: 'user_huliman',
    username: 'Huliman',
    name: 'Huliman Hamid Ar Rasyi',
    role: 'CONTRIBUTOR',
    opd: 'PPM - Kesra',
    email: 'huliman@cilacapkab.go.id',
    color: '#9333ea',
    password: '12345@',
    reviewedChapters: []
  },
  {
    id: 'user_bina',
    username: 'Bina',
    name: 'Bina Mariana',
    role: 'CONTRIBUTOR',
    opd: 'PPM - Pemb. Manusia',
    email: 'bina@cilacapkab.go.id',
    color: '#db2777',
    password: '12345@',
    reviewedChapters: []
  },
  {
    id: 'user_heri',
    username: 'Heri',
    name: 'Heri Fitrianto',
    role: 'CONTRIBUTOR',
    opd: 'PPM - Pemerintahan',
    email: 'heri@cilacapkab.go.id',
    color: '#2563eb',
    password: '12345@',
    reviewedChapters: []
  },
  {
    id: 'user_sunarko',
    username: 'Sunarko',
    name: 'Sunarko',
    role: 'CONTRIBUTOR',
    opd: 'Sekretariat',
    email: 'sunarko@cilacapkab.go.id',
    color: '#475569',
    password: '12345@',
    reviewedChapters: []
  }
];

function extractChapterCode(title) {
  if (!title) return 'BAB I';
  const match = title.match(/BAB\s+(I|II|III|IV|V|VI|VII)\b/i);
  return match ? `BAB ${match[1].toUpperCase()}` : 'BAB I';
}

const DEFAULT_STAGES = [
  {
    id: 'stage_1',
    number: 1,
    title: 'Tahapan Rancangan Awal Teknokratik (Bahan Konsultasi Publik)',
    shortTitle: '1. Ranwal Teknokratik (Bahan KP)',
    stageTag: 'RANCANGAN AWAL TEKNOKRATIK',
    description: 'Penyusunan naskah rancangan awal teknokratik sebagai bahan pelaksanaan forum Konsultasi Publik rancangan awal RKPD.',
    legalBasis: 'Permendagri No. 86/2017 Pasal 74 s/d 80',
    status: 'ACTIVE', // ACTIVE, CLOSED, LOCKED
    closedAt: null,
    closedBy: null,
    closedByName: null,
    closingNotes: null
  },
  {
    id: 'stage_2',
    number: 2,
    title: 'Tahapan Rancangan Awal (hasil konsultasi publik)',
    shortTitle: '2. Ranwal (Hasil KP)',
    stageTag: 'RANCANGAN AWAL PASCA KP',
    description: 'Penyempurnaan rancangan awal berdasarkan Berita Acara dan masukan Forum Konsultasi Publik serta verifikasi Ranwal Renja PD.',
    legalBasis: 'Permendagri No. 86/2017 Pasal 81 s/d 83',
    status: 'LOCKED',
    closedAt: null,
    closedBy: null,
    closedByName: null,
    closingNotes: null
  },
  {
    id: 'stage_3',
    number: 3,
    title: 'Rancangan (Bahan Musrenbang)',
    shortTitle: '3. Rancangan (Bahan Musrenbang)',
    stageTag: 'RANCANGAN BAHAN MUSRENBANG',
    description: 'Penyusunan dokumen Rancangan RKPD yang siap dipaparkan dan dibahas dalam Musrenbang RKPD Kabupaten.',
    legalBasis: 'Permendagri No. 86/2017 Pasal 84 s/d 90',
    status: 'LOCKED',
    closedAt: null,
    closedBy: null,
    closedByName: null,
    closingNotes: null
  },
  {
    id: 'stage_4',
    number: 4,
    title: 'Rancangan (Hasil Musrenbang)',
    shortTitle: '4. Rancangan (Hasil Musrenbang)',
    stageTag: 'RANCANGAN PASCA MUSRENBANG',
    description: 'Perumusan dan penyesuaian dokumen Rancangan RKPD berdasar hasil kesepakatan Berita Acara Musrenbang Kabupaten.',
    legalBasis: 'Permendagri No. 86/2017 Pasal 91 s/d 97',
    status: 'LOCKED',
    closedAt: null,
    closedBy: null,
    closedByName: null,
    closingNotes: null
  },
  {
    id: 'stage_5',
    number: 5,
    title: 'Rancangan Akhir (Bahan Reviu Inspektorat)',
    shortTitle: '5. Ran-Akhir (Bahan Reviu APIP)',
    stageTag: 'RAN-AKHIR BAHAN REVIU APIP',
    description: 'Penyusunan Rancangan Akhir RKPD untuk direviu oleh Aparat Pengawasan Intern Pemerintah (APIP / Inspektorat Daerah).',
    legalBasis: 'Permendagri No. 86/2017 Pasal 98 s/d 101',
    status: 'LOCKED',
    closedAt: null,
    closedBy: null,
    closedByName: null,
    closingNotes: null
  },
  {
    id: 'stage_6',
    number: 6,
    title: 'Rancangan Akhir (Bahan Fasilitasi)',
    shortTitle: '6. Ran-Akhir (Bahan Fasilitasi Prov)',
    stageTag: 'RAN-AKHIR BAHAN FASILITASI',
    description: 'Penyampaian Rancangan Akhir RKPD ke Gubernur Jawa Tengah melalui Bappeda Provinsi untuk proses fasilitasi rancangan akhir.',
    legalBasis: 'Permendagri No. 86/2017 Pasal 102 s/d 105',
    status: 'LOCKED',
    closedAt: null,
    closedBy: null,
    closedByName: null,
    closingNotes: null
  },
  {
    id: 'stage_7',
    number: 7,
    title: 'Rancangan Akhir',
    shortTitle: '7. Rancangan Akhir (Pasca Fasilitasi)',
    stageTag: 'RANCANGAN AKHIR FINAL',
    description: 'Penyempurnaan dokumen Rancangan Akhir pasca surat rekomendasi hasil fasilitasi Gubernur sebelum perumusan Perbup.',
    legalBasis: 'Permendagri No. 86/2017 Pasal 106 s/d 107',
    status: 'LOCKED',
    closedAt: null,
    closedBy: null,
    closedByName: null,
    closingNotes: null
  },
  {
    id: 'stage_8',
    number: 8,
    title: 'Perbup RKPD',
    shortTitle: '8. Perbup RKPD (Penetapan)',
    stageTag: 'PENETAPAN PERBUP RKPD',
    description: 'Naskah final Peraturan Bupati (Perbup) Penetapan RKPD Kabupaten Cilacap beserta lampiran lengkap Bab I s/d VII.',
    legalBasis: 'Permendagri No. 86/2017 Pasal 108 s/d 110',
    status: 'LOCKED',
    closedAt: null,
    closedBy: null,
    closedByName: null,
    closingNotes: null
  }
];

class Database {
  constructor() {
    this.data = {
      users: [...DEFAULT_USERS],
      stages: JSON.parse(JSON.stringify(DEFAULT_STAGES)),
      currentStageId: 'stage_1',
      documents: [],
      sections: [],
      logs: []
    };
    this.load();
  }

  load() {
    try {
      let sourceFile = DB_FILE;
      if (isServerless && fs.existsSync(TMP_DB_FILE)) {
        sourceFile = TMP_DB_FILE;
      }

      if (fs.existsSync(sourceFile)) {
        const raw = fs.readFileSync(sourceFile, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users?.length ? parsed.users : [...DEFAULT_USERS],
          stages: parsed.stages?.length ? parsed.stages : JSON.parse(JSON.stringify(DEFAULT_STAGES)),
          currentStageId: parsed.currentStageId || 'stage_1',
          documents: parsed.documents || [],
          sections: parsed.sections || [],
          logs: parsed.logs || []
        };

        // Clean up obsolete old users: ensure only current valid users exist
        let changed = false;
        const validIds = new Set(DEFAULT_USERS.map(u => u.id));
        const filteredUsers = this.data.users.filter(u => validIds.has(u.id));
        if (filteredUsers.length !== this.data.users.length) {
          this.data.users = filteredUsers;
          changed = true;
        }

        // Ensure all default users exist and have updated metadata
        DEFAULT_USERS.forEach(defUser => {
          const idx = this.data.users.findIndex(u => u.id === defUser.id);
          if (idx === -1) {
            this.data.users.push({ ...defUser });
            changed = true;
          } else {
            const existing = this.data.users[idx];
            if (existing.username !== defUser.username || existing.name !== defUser.name || existing.role !== defUser.role || existing.opd !== defUser.opd) {
              this.data.users[idx] = { ...defUser, password: existing.password || defUser.password };
              changed = true;
            }
          }
        });

        // Ensure every user has reviewedChapters
        this.data.users.forEach(u => {
          if (!u.reviewedChapters || u.reviewedChapters.length === 0) {
            if (u.role === 'ADMIN' || u.role === 'REVIEWER') {
              u.reviewedChapters = ['BAB I', 'BAB II', 'BAB III', 'BAB IV', 'BAB V', 'BAB VI', 'BAB VII'];
              changed = true;
            } else {
              u.reviewedChapters = [];
            }
          }
        });

        // Ensure every document has a stageId
        this.data.documents.forEach(doc => {
          if (!doc.stageId) {
            doc.stageId = 'stage_1';
            changed = true;
          }
        });
        if (changed) {
          this.save();
        }
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Failed to load DB, using fallback defaults:', err.message);
      this.save();
    }
  }

  save() {
    try {
      if (isServerless) {
        fs.writeFileSync(TMP_DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      } else {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      }
    } catch (err) {
      try {
        fs.writeFileSync(TMP_DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (tmpErr) {
        console.error('Failed to save DB in fallback tmpdir:', tmpErr.message);
      }
    }
  }

  // ================= USERS =================
  getUsers() {
    return this.data.users;
  }

  getUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  getUserByUsernameOrEmail(identifier) {
    if (!identifier) return null;
    const clean = String(identifier).trim().toLowerCase();
    return this.data.users.find(u =>
      (u.username && u.username.toLowerCase() === clean) ||
      (u.email && u.email.toLowerCase() === clean) ||
      (u.id && u.id.toLowerCase() === clean)
    );
  }

  addUser(user) {
    user.password = user.password || '12345@';
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id, updateData) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = {
        ...this.data.users[idx],
        ...updateData
      };
      this.save();
      return this.data.users[idx];
    }
    return null;
  }

  deleteUser(id) {
    if (id === 'user_admin') {
      throw new Error('Akun Admin Utama (user_admin) dilindungi dan tidak dapat dihapus');
    }
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) {
      throw new Error('Pengguna tidak ditemukan');
    }
    const removedUser = this.data.users[idx];
    this.data.users.splice(idx, 1);

    // Clean up assignments in sections
    this.data.sections.forEach(sec => {
      if (sec.assignedUserIds && sec.assignedUserIds.includes(id)) {
        sec.assignedUserIds = sec.assignedUserIds.filter(uid => uid !== id);
      }
    });

    this.save();
    return removedUser;
  }

  // ================= 8 TAHAPAN (STAGES) =================
  getStages() {
    const stagesList = this.data.stages && this.data.stages.length ? this.data.stages : DEFAULT_STAGES;
    return stagesList.map(stage => {
      const stageDocs = this.data.documents.filter(d => (d.stageId || 'stage_1') === stage.id);
      const docIds = stageDocs.map(d => d.id);
      const stageSections = this.data.sections.filter(s => docIds.includes(s.documentId));

      const totalSections = stageSections.length;
      const approvedSections = stageSections.filter(s => s.status === 'APPROVED').length;
      const reviewSections = stageSections.filter(s => s.status === 'REVIEW').length;
      const inProgressSections = stageSections.filter(s => s.status === 'IN_PROGRESS').length;
      const draftSections = stageSections.filter(s => !s.status || s.status === 'DRAFT').length;
      const progress = totalSections > 0 ? Math.round((approvedSections / totalSections) * 100) : 0;

      return {
        ...stage,
        totalDocs: stageDocs.length,
        totalSections,
        approvedSections,
        reviewSections,
        inProgressSections,
        draftSections,
        progress
      };
    });
  }

  getStageById(id) {
    const stages = this.getStages();
    return stages.find(s => s.id === id) || null;
  }

  getActiveStage() {
    const stages = this.getStages();
    return stages.find(s => s.status === 'ACTIVE') || stages[0];
  }

  setCurrentStageId(id) {
    this.data.currentStageId = id;
    this.save();
  }

  // Closing Stage & Roll Forward
  closeAndRollForward(stageId, { closedBy, closedByName, closingNotes }) {
    const stageIdx = (this.data.stages || []).findIndex(s => s.id === stageId);
    if (stageIdx === -1) {
      throw new Error(`Tahapan dengan ID ${stageId} tidak ditemukan.`);
    }

    const currentStage = this.data.stages[stageIdx];
    if (currentStage.status !== 'ACTIVE') {
      throw new Error(`Hanya tahapan aktif yang dapat ditutup (Closing). Status saat ini: ${currentStage.status}`);
    }

    // 1. Mark stage as CLOSED
    currentStage.status = 'CLOSED';
    currentStage.closedAt = new Date().toISOString();
    currentStage.closedBy = closedBy || 'user_admin';
    currentStage.closedByName = closedByName || 'Admin Bappeda';
    currentStage.closingNotes = closingNotes || '';

    // 2. Lock all sections belonging to documents in this stage
    const stageDocs = this.data.documents.filter(d => (d.stageId || 'stage_1') === currentStage.id);
    const docIds = stageDocs.map(d => d.id);
    this.data.sections.forEach(s => {
      if (docIds.includes(s.documentId)) {
        s.isLocked = true;
      }
    });

    // 3. Roll forward to next stage if exists
    let nextStage = null;
    const nextStageIdx = stageIdx + 1;
    let rolledForwardDocsCount = 0;

    if (nextStageIdx < this.data.stages.length) {
      nextStage = this.data.stages[nextStageIdx];
      nextStage.status = 'ACTIVE';
      this.data.currentStageId = nextStage.id;

      // Clone documents and sections to nextStage
      for (const doc of stageDocs) {
        const newDocId = 'doc_' + Math.random().toString(36).substring(2, 10);
        const clonedDoc = {
          ...doc,
          id: newDocId,
          stageId: nextStage.id,
          stageNumber: nextStage.number,
          parentDocId: doc.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.data.documents.push(clonedDoc);
        rolledForwardDocsCount++;

        const oldSections = this.getSectionsByDocumentId(doc.id);
        const clonedSections = oldSections.map(s => ({
          ...s,
          id: 'sec_' + Math.random().toString(36).substring(2, 10),
          documentId: newDocId,
          parentSectionId: s.id,
          status: 'DRAFT', // New stage starts ready for revision
          isLocked: false,
          comments: [], // Fresh review comments for the new stage
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        this.data.sections.push(...clonedSections);
      }
    }

    this.save();

    return {
      closedStage: currentStage,
      nextStage,
      rolledForwardDocsCount
    };
  }

  // Reopen stage (undo closing)
  reopenStage(stageId) {
    const stageIdx = (this.data.stages || []).findIndex(s => s.id === stageId);
    if (stageIdx === -1) {
      throw new Error('Tahapan tidak ditemukan');
    }

    const stage = this.data.stages[stageIdx];
    if (stage.status !== 'CLOSED') {
      throw new Error('Hanya tahapan yang sudah ditutup yang dapat dibuka kembali');
    }

    // Set this stage back to ACTIVE
    stage.status = 'ACTIVE';
    stage.closedAt = null;
    stage.closedBy = null;
    stage.closedByName = null;
    stage.closingNotes = null;
    this.data.currentStageId = stage.id;

    // Unlock its sections
    const stageDocs = this.data.documents.filter(d => (d.stageId || 'stage_1') === stage.id);
    const docIds = stageDocs.map(d => d.id);
    this.data.sections.forEach(s => {
      if (docIds.includes(s.documentId)) {
        s.isLocked = false;
      }
    });

    // If next stage was opened, lock it back and remove its cloned docs
    const nextStageIdx = stageIdx + 1;
    if (nextStageIdx < this.data.stages.length) {
      const nextStage = this.data.stages[nextStageIdx];
      nextStage.status = 'LOCKED';

      const nextDocs = this.data.documents.filter(d => d.stageId === nextStage.id);
      const nextDocIds = nextDocs.map(d => d.id);
      this.data.documents = this.data.documents.filter(d => d.stageId !== nextStage.id);
      this.data.sections = this.data.sections.filter(s => !nextDocIds.includes(s.documentId));
    }

    this.save();
    return stage;
  }

  // Admin Progress Tracking for a Stage
  getStageProgressTracking(stageId) {
    const stage = this.getStageById(stageId);
    if (!stage) return null;

    const stageDocs = this.data.documents.filter(d => (d.stageId || 'stage_1') === stage.id);
    const docIds = stageDocs.map(d => d.id);
    const stageSections = this.data.sections.filter(s => docIds.includes(s.documentId));

    // Users & OPD tracking
    const users = this.getUsers();
    const userTracking = users.map(user => {
      const userSections = stageSections.filter(s => s.assignedUserIds && s.assignedUserIds.includes(user.id));
      const totalAssigned = userSections.length;
      const approved = userSections.filter(s => s.status === 'APPROVED').length;
      const review = userSections.filter(s => s.status === 'REVIEW').length;
      const inProgress = userSections.filter(s => s.status === 'IN_PROGRESS').length;
      const draft = userSections.filter(s => !s.status || s.status === 'DRAFT').length;
      const pending = totalAssigned - approved;
      const isCompleted = totalAssigned > 0 && pending === 0;
      const progress = totalAssigned > 0 ? Math.round((approved / totalAssigned) * 100) : (totalAssigned === 0 ? 100 : 0);

      return {
        userId: user.id,
        name: user.name,
        opd: user.opd,
        role: user.role,
        color: user.color,
        totalAssigned,
        approved,
        review,
        inProgress,
        draft,
        pending,
        isCompleted,
        progress,
        sections: userSections.map(s => {
          const d = stageDocs.find(doc => doc.id === s.documentId);
          return {
            id: s.id,
            documentId: s.documentId,
            docTitle: d?.title || 'Dokumen',
            code: s.code,
            title: s.title,
            status: s.status || 'DRAFT',
            isLocked: s.isLocked
          };
        })
      };
    });

    const totalSections = stageSections.length;
    const approvedSections = stageSections.filter(s => s.status === 'APPROVED').length;
    const reviewSections = stageSections.filter(s => s.status === 'REVIEW').length;
    const inProgressSections = stageSections.filter(s => s.status === 'IN_PROGRESS').length;
    const draftSections = stageSections.filter(s => !s.status || s.status === 'DRAFT').length;
    const overallProgress = totalSections > 0 ? Math.round((approvedSections / totalSections) * 100) : 0;

    const detailedSections = stageSections.map(s => {
      const d = stageDocs.find(doc => doc.id === s.documentId);
      const assignees = (s.assignedUserIds || []).map(uid => this.getUserById(uid)).filter(Boolean);
      return {
        id: s.id,
        documentId: s.documentId,
        docTitle: d?.title || 'Dokumen',
        code: s.code,
        title: s.title,
        level: s.level,
        order: s.order,
        status: s.status || 'DRAFT',
        isLocked: s.isLocked,
        assignees,
        updatedAt: s.updatedAt
      };
    }).sort((a, b) => a.order - b.order);

    return {
      stage,
      totalDocs: stageDocs.length,
      totalSections,
      approvedSections,
      reviewSections,
      inProgressSections,
      draftSections,
      overallProgress,
      userTracking,
      detailedSections
    };
  }

  // ================= DOCUMENTS =================
  getDocuments(stageId = null) {
    const targetStageId = stageId || this.data.currentStageId || 'stage_1';
    return this.data.documents
      .filter(doc => (doc.stageId || 'stage_1') === targetStageId)
      .map(doc => {
        const docSections = this.data.sections.filter(s => s.documentId === doc.id);
        const totalSections = docSections.length;
        const approvedSections = docSections.filter(s => s.status === 'APPROVED').length;
        const reviewSections = docSections.filter(s => s.status === 'REVIEW').length;
        const inProgressSections = docSections.filter(s => s.status === 'IN_PROGRESS').length;
        const draftSections = docSections.filter(s => !s.status || s.status === 'DRAFT').length;
        const progress = totalSections > 0 ? Math.round((approvedSections / totalSections) * 100) : 0;
        
        const chapter = extractChapterCode(doc.title);
        const assignedReviewers = this.getUsers().filter(u => 
          (u.role === 'REVIEWER' || u.role === 'ADMIN') && (u.reviewedChapters || []).includes(chapter)
        ).map(u => ({ id: u.id, name: u.name, opd: u.opd, color: u.color, email: u.email }));

        return {
          ...doc,
          chapter,
          assignedReviewers,
          stageId: doc.stageId || 'stage_1',
          totalSections,
          approvedSections,
          reviewSections,
          inProgressSections,
          draftSections,
          progress
        };
      });
  }

  getDocumentById(id) {
    const doc = this.data.documents.find(d => d.id === id);
    if (!doc) return null;
    const stage = this.getStageById(doc.stageId || 'stage_1');
    const chapter = extractChapterCode(doc.title);
    const assignedReviewers = this.getUsers().filter(u => 
      (u.role === 'REVIEWER' || u.role === 'ADMIN') && (u.reviewedChapters || []).includes(chapter)
    ).map(u => ({ id: u.id, name: u.name, opd: u.opd, color: u.color, email: u.email }));

    return {
      ...doc,
      chapter,
      assignedReviewers,
      stage
    };
  }

  addDocument(doc) {
    if (!doc.stageId) {
      doc.stageId = this.data.currentStageId || 'stage_1';
    }
    this.data.documents.unshift(doc);
    this.save();
    return doc;
  }

  updateDocument(id, updateData) {
    const idx = this.data.documents.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.data.documents[idx] = {
        ...this.data.documents[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.data.documents[idx];
    }
    return null;
  }

  deleteDocument(id) {
    this.data.documents = this.data.documents.filter(d => d.id !== id);
    this.data.sections = this.data.sections.filter(s => s.documentId !== id);
    this.data.logs = this.data.logs.filter(l => l.documentId !== id);
    this.save();
  }

  // ================= SECTIONS =================
  getSectionsByDocumentId(docId) {
    return this.data.sections
      .filter(s => s.documentId === docId)
      .sort((a, b) => a.order - b.order);
  }

  getSectionById(id) {
    return this.data.sections.find(s => s.id === id);
  }

  addSection(section) {
    this.data.sections.push(section);
    this.save();
    return section;
  }

  addSectionsBatch(sections) {
    this.data.sections.push(...sections);
    this.save();
  }

  updateSection(id, updateData) {
    const idx = this.data.sections.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.data.sections[idx] = {
        ...this.data.sections[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.data.sections[idx];
    }
    return null;
  }

  deleteSection(id) {
    this.data.sections = this.data.sections.filter(s => s.id !== id);
    this.save();
  }

  // ================= ACTIVITY LOGS =================
  addLog(log) {
    this.data.logs.unshift({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      ...log
    });
    // Keep max 500 logs
    if (this.data.logs.length > 500) {
      this.data.logs = this.data.logs.slice(0, 500);
    }
    this.save();
  }

  getLogsByDocumentId(docId) {
    return this.data.logs.filter(l => l.documentId === docId);
  }
}

module.exports = new Database();
