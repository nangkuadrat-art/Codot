const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'gdrive_config.json');

// Default sync directory (preferred on D: drive where there is plenty of space, or fallback to data folder)
const DEFAULT_SYNC_DIR = fs.existsSync('D:\\')
  ? 'D:\\RKPD_GOOGLE_DRIVE_BACKUP'
  : path.join(__dirname, '..', 'gdrive_backup');

const DEFAULT_CONFIG = {
  enabled: true,
  syncMode: 'FOLDER_SYNC', // 'FOLDER_SYNC' or 'SERVICE_ACCOUNT'
  syncFolderPath: DEFAULT_SYNC_DIR,
  autoSync: true,
  serviceAccountKey: '', // JSON credentials string if using direct Google Cloud API
  driveFolderId: '', // Google Drive cloud folder ID
  lastSync: null,
  lastSyncMessage: 'Belum pernah disinkronkan'
};

class GoogleDriveService {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      } else {
        this.saveConfig();
      }
    } catch (err) {
      console.error('Error loading Google Drive config:', err.message);
    }
  }

  saveConfig(newConfig = {}) {
    try {
      this.config = { ...this.config, ...newConfig };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
      return this.config;
    } catch (err) {
      console.error('Error saving Google Drive config:', err.message);
      throw err;
    }
  }

  getConfig() {
    // Return sanitized config (mask sensitive service account key in preview)
    return {
      ...this.config,
      hasServiceAccountKey: Boolean(this.config.serviceAccountKey && this.config.serviceAccountKey.length > 20),
      isFolderAccessible: fs.existsSync(this.config.syncFolderPath)
    };
  }

  /**
   * Perform synchronization:
   * 1. Creates JSON database snapshot
   * 2. Exports all active documents as .docx
   * 3. Writes to local Google Drive sync folder or uploads to Google Cloud Drive API
   */
  async sync(db, docxService) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultFiles = [];

    // Ensure sync directory exists if in FOLDER_SYNC mode
    if (this.config.syncMode === 'FOLDER_SYNC') {
      const targetDir = this.config.syncFolderPath;
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // 1. Write JSON Database Snapshot
      const dbData = db.data;
      const jsonBackupPath = path.join(targetDir, `database_backup_${timestamp}.json`);
      const latestJsonPath = path.join(targetDir, 'database_latest.json');

      fs.writeFileSync(jsonBackupPath, JSON.stringify(dbData, null, 2), 'utf-8');
      fs.writeFileSync(latestJsonPath, JSON.stringify(dbData, null, 2), 'utf-8');
      resultFiles.push(path.basename(jsonBackupPath));

      // 2. Export each document to DOCX inside the Google Drive folder
      const docs = db.getDocuments();
      for (const d of docs) {
        const sections = db.getSectionsByDocumentId(d.id);
        const docxBuffer = await docxService.exportSectionsToDocx(d, sections);

        const safeTitle = d.title.replace(/[/\\?%*:|"<>]/g, '_');
        const docxFilename = `${safeTitle}.docx`;
        const docxPath = path.join(targetDir, docxFilename);

        fs.writeFileSync(docxPath, docxBuffer);
        resultFiles.push(docxFilename);
      }

      this.saveConfig({
        lastSync: new Date().toISOString(),
        lastSyncMessage: `Berhasil mencadangkan ${resultFiles.length} file ke folder Google Drive: ${targetDir}`
      });

      return {
        success: true,
        mode: 'FOLDER_SYNC',
        targetDir,
        syncedFiles: resultFiles,
        timestamp: this.config.lastSync
      };
    }

    // Direct Google Cloud API Sync (if service account provided)
    if (this.config.syncMode === 'SERVICE_ACCOUNT') {
      try {
        const creds = JSON.parse(this.config.serviceAccountKey);
        const token = await this.getServiceAccountAccessToken(creds);

        // Upload database JSON
        const dbContent = JSON.stringify(db.data, null, 2);
        await this.uploadFileToGoogleDriveCloud(
          token,
          `rkpd_database_backup_${timestamp}.json`,
          'application/json',
          Buffer.from(dbContent),
          this.config.driveFolderId
        );
        resultFiles.push(`rkpd_database_backup_${timestamp}.json`);

        // Upload DOCX for each document
        const docs = db.getDocuments();
        for (const d of docs) {
          const sections = db.getSectionsByDocumentId(d.id);
          const docxBuffer = await docxService.exportSectionsToDocx(d, sections);
          const safeTitle = d.title.replace(/[/\\?%*:|"<>]/g, '_') + '.docx';

          await this.uploadFileToGoogleDriveCloud(
            token,
            safeTitle,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            docxBuffer,
            this.config.driveFolderId
          );
          resultFiles.push(safeTitle);
        }

        this.saveConfig({
          lastSync: new Date().toISOString(),
          lastSyncMessage: `Berhasil mengunggah ${resultFiles.length} file langsung ke Google Drive Cloud via API`
        });

        return {
          success: true,
          mode: 'SERVICE_ACCOUNT',
          syncedFiles: resultFiles,
          timestamp: this.config.lastSync
        };
      } catch (cloudErr) {
        throw new Error('Gagal sync ke Google Drive Cloud API: ' + cloudErr.message);
      }
    }

    throw new Error('Mode sinkronisasi tidak valid');
  }

  /**
   * Helper: Get Google OAuth Access Token via Service Account JWT (Zero External Dependencies)
   */
  async getServiceAccountAccessToken(creds) {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claimSet = {
      iss: creds.client_email,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const encodeBase64Url = (obj) =>
      Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    const unsignedToken = `${encodeBase64Url(header)}.${encodeBase64Url(claimSet)}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsignedToken);
    sign.end();
    const signature = sign.sign(creds.private_key, 'base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const jwt = `${unsignedToken}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error_description || 'Gagal autentikasi Service Account Google');
    }
    return data.access_token;
  }

  /**
   * Helper: Upload file buffer to Google Drive v3 REST API
   */
  async uploadFileToGoogleDriveCloud(accessToken, fileName, mimeType, fileBuffer, parentFolderId) {
    const metadata = {
      name: fileName,
      mimeType: mimeType
    };
    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    const boundary = 'foo_bar_baz_boundary_' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const bodyParts = [
      delimiter,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      delimiter,
      `Content-Type: ${mimeType}\r\n`,
      'Content-Transfer-Encoding: base64\r\n\r\n',
      fileBuffer.toString('base64'),
      closeDelimiter
    ];

    const body = bodyParts.join('');

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body
    });

    const resJson = await res.json();
    if (!res.ok) {
      throw new Error(resJson.error?.message || 'Gagal mengunggah file ke Google Drive Cloud');
    }
    return resJson;
  }

  /**
   * Get list of backups stored in the local sync directory
   */
  getBackupsList() {
    try {
      const targetDir = this.config.syncFolderPath;
      if (!fs.existsSync(targetDir)) return [];

      const files = fs.readdirSync(targetDir);
      return files
        .filter(f => f.endsWith('.json') || f.endsWith('.docx'))
        .map(f => {
          const stats = fs.statSync(path.join(targetDir, f));
          return {
            fileName: f,
            size: stats.size,
            sizeFormatted: (stats.size / 1024).toFixed(1) + ' KB',
            lastModified: stats.mtime.toISOString(),
            isJsonBackup: f.endsWith('.json'),
            isDocx: f.endsWith('.docx')
          };
        })
        .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    } catch (err) {
      console.error('Error reading backups list:', err.message);
      return [];
    }
  }
}

module.exports = new GoogleDriveService();
