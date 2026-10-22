const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
    reviewedChapters: ['BAB I', 'BAB II', 'BAB III', 'BAB IV', 'BAB V', 'BAB VI', 'BAB VII']
  },
  {
    id: 'user_reviewer',
    username: 'reviewer_ahli',
    name: 'Dr. Joko Susanto (Reviewer Ahli)',
    role: 'REVIEWER',
    opd: 'Tim Ahli / Penjamin Mutu RKPD',
    email: 'reviewer@rkpd.go.id',
    color: '#0891b2',
    reviewedChapters: ['BAB I', 'BAB II', 'BAB IV']
  },
  {
    id: 'user_reviewer_apip',
    username: 'reviewer_apip',
    name: 'Drs. Hendro Wibowo (Reviewer APIP / Inspektorat)',
    role: 'REVIEWER',
    opd: 'Inspektorat Daerah Kabupaten Cilacap',
    email: 'inspektorat@cilacapkab.go.id',
    color: '#0284c7',
    reviewedChapters: ['BAB III', 'BAB V', 'BAB VI', 'BAB VII']
  },
  {
    id: 'user_pic_ikp',
    username: 'pic_ikp',
    name: 'PIC Bidang IKP (Diskominfo)',
    role: 'CONTRIBUTOR',
    opd: 'Diskominfo - Bidang Informasi & Komunikasi Publik',
    email: 'ikp@diskominfo.cilacapkab.go.id',
    color: '#059669',
    reviewedChapters: []
  },
  {
    id: 'user_pic_rinov',
    username: 'pic_rinov',
    name: 'PIC Bidang Rinov (Bappeda)',
    role: 'CONTRIBUTOR',
    opd: 'Bappeda - Bidang Riset & Inovasi Daerah',
    email: 'rinov@bappeda.cilacapkab.go.id',
    color: '#10b981',
    reviewedChapters: []
  },
  {
    id: 'user_pic_ppm',
    username: 'pic_ppm',
    name: 'PIC Bidang PPM (Bappeda)',
    role: 'CONTRIBUTOR',
    opd: 'Bappeda - Bidang Pemerintahan & Pembangunan Manusia',
    email: 'ppm@bappeda.cilacapkab.go.id',
    color: '#9333ea',
    reviewedChapters: []
  },
  {
    id: 'user_pic_program',
    username: 'pic_program',
    name: 'PIC Bidang Program (PPEPD Bappeda)',
    role: 'CONTRIBUTOR',
    opd: 'Bappeda - Bidang Perencanaan, Pengendalian & Evaluasi (PPEPD)',
    email: 'program@bappeda.cilacapkab.go.id',
    color: '#2563eb',
    reviewedChapters: []
  },
  {
    id: 'user_dinkes',
    username: 'dinkes',
    name: 'Dinas Kesehatan (dr. Siti Aminah)',
    role: 'CONTRIBUTOR',
    opd: 'Dinas Kesehatan',
    email: 'program@dinkes.go.id',
    color: '#14b8a6',
    reviewedChapters: []
  },
  {
    id: 'user_disdik',
    username: 'disdik',
    name: 'Dinas Pendidikan (Drs. Budi Santoso)',
    role: 'CONTRIBUTOR',
    opd: 'Dinas Pendidikan & Kebudayaan',
    email: 'perencanaan@disdik.go.id',
    color: '#d97706',
    reviewedChapters: []
  },
  {
    id: 'user_ekonomi',
    username: 'bappeda_ekonomi',
    name: 'Bidang Ekonomi & SDA (Ir. Agus Prasetyo)',
    role: 'CONTRIBUTOR',
    opd: 'Bappeda - Bidang Perekonomian & SDA',
    email: 'ekonomi@bappeda.go.id',
    color: '#dc2626',
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
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users?.length ? parsed.users : [...DEFAULT_USERS],
          stages: parsed.stages?.length ? parsed.stages : JSON.parse(JSON.stringify(DEFAULT_STAGES)),
          currentStageId: parsed.currentStageId || 'stage_1',
          documents: parsed.documents || [],
          sections: parsed.sections || [],
          logs: parsed.logs || []
        };

        // Ensure all default users exist
        let changed = false;
        DEFAULT_USERS.forEach(defUser => {
          const exists = this.data.users.find(u => u.id === defUser.id);
          if (!exists) {
            this.data.users.push({ ...defUser });
            changed = true;
          }
        });

        // Ensure every user has reviewedChapters
        this.data.users.forEach(u => {
          if (!u.reviewedChapters) {
            if (u.role === 'ADMIN') {
              u.reviewedChapters = ['BAB I', 'BAB II', 'BAB III', 'BAB IV', 'BAB V', 'BAB VI', 'BAB VII'];
            } else if (u.role === 'REVIEWER') {
              u.reviewedChapters = ['BAB I', 'BAB II', 'BAB IV'];
            } else {
              u.reviewedChapters = [];
            }
            changed = true;
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
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save DB:', err.message);
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
