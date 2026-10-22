// API Client for Co. (Codot) - Collaborative Document Tools

let activeUserId = localStorage.getItem('codot_active_user_id') || localStorage.getItem('rkpd_active_user_id') || '';

export function getActiveUserId() {
  return activeUserId;
}

export function setActiveUserId(id) {
  activeUserId = id || '';
  if (id) {
    localStorage.setItem('codot_active_user_id', id);
    localStorage.setItem('rkpd_active_user_id', id);
  } else {
    localStorage.removeItem('codot_active_user_id');
    localStorage.removeItem('rkpd_active_user_id');
    localStorage.removeItem('codot_auth_user');
  }
}

export function getSavedAuthUser() {
  try {
    const raw = localStorage.getItem('codot_auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setSavedAuthUser(user) {
  if (user) {
    localStorage.setItem('codot_auth_user', JSON.stringify(user));
    setActiveUserId(user.id);
  } else {
    setActiveUserId('');
  }
}

const getHeaders = (extra = {}) => ({
  'Content-Type': 'application/json',
  'x-user-id': activeUserId,
  ...extra
});

export const api = {
  // Authentication
  async login(username, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch('/api/auth/me', { headers: getHeaders() });
    return res.json();
  },

  async changePassword(oldPassword, newPassword) {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ oldPassword, newPassword })
    });
    return res.json();
  },

  // 8 Tahapan RKPD
  async getStages() {
    const res = await fetch('/api/stages', { headers: getHeaders() });
    return res.json();
  },

  async getActiveStage() {
    const res = await fetch('/api/stages/current', { headers: getHeaders() });
    return res.json();
  },

  async getStage(id) {
    const res = await fetch(`/api/stages/${id}`, { headers: getHeaders() });
    return res.json();
  },

  async getStageTracking(id) {
    const res = await fetch(`/api/stages/${id}/tracking`, { headers: getHeaders() });
    return res.json();
  },

  async closeStage(id, data = {}) {
    const res = await fetch(`/api/stages/${id}/close`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async reopenStage(id) {
    const res = await fetch(`/api/stages/${id}/reopen`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  async seedStageTemplates(id) {
    const res = await fetch(`/api/stages/${id}/seed-templates`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  // Users
  async getUsers() {
    const res = await fetch('/api/users', { headers: getHeaders() });
    return res.json();
  },

  async addUser(userData) {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  async updateUser(id, userData) {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  async deleteUser(id) {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  async updateChapterReviewers(chapterCode, reviewerUserIds) {
    const res = await fetch(`/api/chapters/${chapterCode}/reviewers`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ reviewerUserIds })
    });
    return res.json();
  },

  // Documents
  async getDocuments(stageId = null) {
    const url = stageId ? `/api/documents?stageId=${stageId}` : '/api/documents';
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },

  async getDocument(id) {
    const res = await fetch(`/api/documents/${id}`, { headers: getHeaders() });
    return res.json();
  },

  async createDocument(data) {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async createRkpdTemplate() {
    const res = await fetch('/api/documents/template-rkpd', {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  async getRkpdTemplates() {
    const res = await fetch('/api/rkpd-templates', { headers: getHeaders() });
    return res.json();
  },

  async importRkpdChapter(fileName) {
    const res = await fetch('/api/rkpd-templates/import', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fileName })
    });
    return res.json();
  },

  async importAllRkpdChapters() {
    const res = await fetch('/api/rkpd-templates/import-all', {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  async importSampleDocx() {
    const res = await fetch('/api/documents/import-sample', {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  async importDocx(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/documents/import', {
      method: 'POST',
      headers: {
        'x-user-id': activeUserId
      },
      body: formData
    });
    return res.json();
  },

  async updateDocument(id, data) {
    const res = await fetch(`/api/documents/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateDocumentContent(id, fullContentHtml) {
    const res = await fetch(`/api/documents/${id}/content`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ fullContentHtml })
    });
    return res.json();
  },

  async deleteDocument(id) {
    const res = await fetch(`/api/documents/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // Sections
  async getSection(secId) {
    const res = await fetch(`/api/sections/${secId}`, { headers: getHeaders() });
    return res.json();
  },

  async getComparisonPair(secIdA, secIdB) {
    const res = await fetch(`/api/sections/compare-pair?secIdA=${encodeURIComponent(secIdA || '')}&secIdB=${encodeURIComponent(secIdB || '')}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async addSection(docId, data) {
    const res = await fetch(`/api/documents/${docId}/sections`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateSectionContent(secId, data) {
    const res = await fetch(`/api/sections/${secId}/content`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateSectionPermissions(secId, data) {
    const res = await fetch(`/api/sections/${secId}/permissions`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateSectionStatus(secId, status) {
    const res = await fetch(`/api/sections/${secId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  async addComment(secId, text) {
    const res = await fetch(`/api/sections/${secId}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text })
    });
    return res.json();
  },

  // Microsoft Word Desktop Direct Collaboration Bridge
  getWordBridgeUrl(secId) {
    const origin = window.location.origin;
    return `${origin}/api/sections/${secId}/word-bridge.docx?token=${activeUserId || 'user_admin'}`;
  },

  launchWordDesktop(secId) {
    const directUrl = this.getWordBridgeUrl(secId);
    window.location.href = `ms-word:ofe|u|${directUrl}`;
  },

  async reimportWordFile(secId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`/api/sections/${secId}/reimport-word`, {
      method: 'POST',
      headers: {
        'x-user-id': activeUserId || 'user_admin'
      },
      body: formData
    });
    return res.json();
  },

  async getWordBridgeStatus(secId) {
    const res = await fetch(`/api/sections/${secId}/word-bridge-status`, { headers: getHeaders() });
    return res.json();
  },

  // Export
  getExportUrl(docId) {
    return `/api/documents/${docId}/export`;
  },

  // Logs
  async getLogs(docId) {
    const res = await fetch(`/api/documents/${docId}/logs`, { headers: getHeaders() });
    return res.json();
  },

  // Google Drive & Backup
  async getGdriveConfig() {
    const res = await fetch('/api/gdrive/config', { headers: getHeaders() });
    return res.json();
  },

  async saveGdriveConfig(config) {
    const res = await fetch('/api/gdrive/config', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config)
    });
    return res.json();
  },

  async syncGdrive() {
    const res = await fetch('/api/gdrive/sync', {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  async getGdriveBackups() {
    const res = await fetch('/api/gdrive/backups', { headers: getHeaders() });
    return res.json();
  },

  getSnapshotDownloadUrl() {
    return '/api/gdrive/download-snapshot';
  },

  async restoreDatabase(backupFile, fileName) {
    const formData = new FormData();
    if (backupFile) formData.append('backupFile', backupFile);
    if (fileName) formData.append('fileName', fileName);

    const res = await fetch('/api/gdrive/restore', {
      method: 'POST',
      headers: {
        'x-user-id': activeUserId
      },
      body: formData
    });
    return res.json();
  },

  // Cross-Chapter Consistency Audit
  async checkConsistency(stageId) {
    const url = stageId ? `/api/consistency/check?stageId=${stageId}` : '/api/consistency/check';
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },

  async getComprehensiveConsistency(stageId, threshold = 0.80) {
    const url = `/api/consistency/comprehensive?stageId=${stageId || ''}&threshold=${threshold}`;
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  }
};
