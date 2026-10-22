import React, { useState, useEffect } from 'react';
import {
  X,
  HardDrive,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FolderSync,
  Cloud,
  FileText,
  Clock,
  ShieldAlert,
  Database
} from 'lucide-react';
import { api } from '../api';

export default function GoogleDriveModal({
  isOpen,
  onClose,
  currentUser,
  onDatabaseRestored
}) {
  const [config, setConfig] = useState(null);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('FOLDER'); // 'FOLDER' or 'API'
  const [message, setMessage] = useState(null);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoring, setRestoring] = useState(false);

  // Form states
  const [syncFolderPath, setSyncFolderPath] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [serviceAccountKey, setServiceAccountKey] = useState('');
  const [driveFolderId, setDriveFolderId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [confRes, backRes] = await Promise.all([
        api.getGdriveConfig(),
        api.getGdriveBackups()
      ]);

      if (confRes.success) {
        setConfig(confRes.data);
        setSyncFolderPath(confRes.data.syncFolderPath || '');
        setAutoSync(confRes.data.autoSync ?? true);
        setActiveTab(confRes.data.syncMode === 'SERVICE_ACCOUNT' ? 'API' : 'FOLDER');
        setDriveFolderId(confRes.data.driveFolderId || '');
      }

      if (backRes.success) {
        setBackups(backRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load GDrive data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.saveGdriveConfig({
        syncMode: activeTab === 'API' ? 'SERVICE_ACCOUNT' : 'FOLDER_SYNC',
        syncFolderPath: syncFolderPath.trim(),
        autoSync: autoSync,
        serviceAccountKey: serviceAccountKey.trim() || config?.serviceAccountKey,
        driveFolderId: driveFolderId.trim()
      });

      if (res.success) {
        setConfig(res.data);
        setMessage({ type: 'success', text: 'Pengaturan Google Drive berhasil disimpan!' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  // Trigger Immediate Sync
  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      setMessage(null);
      const res = await api.syncGdrive();
      if (res.success) {
        setMessage({
          type: 'success',
          text: `Sinkronisasi berhasil! ${res.data.syncedFiles.length} file dicadangkan ke Google Drive.`
        });
        loadData();
      } else {
        setMessage({ type: 'error', text: res.message || 'Gagal sinkronisasi' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error sinkronisasi: ' + err.message });
    } finally {
      setSyncing(false);
    }
  };

  // Restore database from selected backup in folder
  const handleRestoreFromFolder = async (fileName) => {
    if (!window.confirm(`PERINGATAN: Apakah Anda yakin ingin memulihkan database dari file cadangan "${fileName}"? Data saat ini akan digantikan oleh data dari file tersebut.`)) {
      return;
    }

    try {
      setRestoring(true);
      const res = await api.restoreDatabase(null, fileName);
      if (res.success) {
        alert(res.message);
        if (onDatabaseRestored) onDatabaseRestored();
        onClose();
      } else {
        alert('Gagal memulihkan: ' + res.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setRestoring(false);
    }
  };

  // Restore from uploaded JSON file
  const handleRestoreFromUpload = async (e) => {
    e.preventDefault();
    if (!restoreFile) return;

    if (!window.confirm(`PERINGATAN: Apakah Anda yakin ingin memulihkan database dari file "${restoreFile.name}"? Data saat ini akan digantikan.`)) {
      return;
    }

    try {
      setRestoring(true);
      const res = await api.restoreDatabase(restoreFile, null);
      if (res.success) {
        alert(res.message);
        if (onDatabaseRestored) onDatabaseRestored();
        onClose();
      } else {
        alert('Gagal memulihkan: ' + res.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Sinkronisasi & Database Google Drive
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                  Gratis 100%
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Cadangkan database dan file Word naskah RKPD secara otomatis ke Google Drive
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Status Notification */}
          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Quick Action & Status Card */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  Status Sinkronisasi
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white">
                {config?.lastSyncMessage || 'Siap untuk sinkronisasi'}
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Terakhir sinkron: {config?.lastSync ? new Date(config.lastSync).toLocaleString('id-ID') : 'Belum pernah'}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={syncing}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>

              <a
                href={api.getSnapshotDownloadUrl()}
                download
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700"
                title="Unduh backup database mentah (.json)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File JSON</span>
              </a>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="border-b border-slate-200">
            <nav className="flex space-x-6">
              <button
                onClick={() => setActiveTab('FOLDER')}
                className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                  activeTab === 'FOLDER'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FolderSync className="w-4 h-4" />
                <span>1. Folder Google Drive Desktop (Rekomendasi ⭐)</span>
              </button>

              <button
                onClick={() => setActiveTab('API')}
                className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                  activeTab === 'API'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Cloud className="w-4 h-4" />
                <span>2. Google Cloud Service Account API</span>
              </button>
            </nav>
          </div>

          {/* TAB 1: FOLDER SYNC CONFIGURATION */}
          {activeTab === 'FOLDER' && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
                💡 <strong>Cara Kerja:</strong> Masukkan lokasi folder di komputer Anda. Jika Anda memasang aplikasi 
                <strong> Google Drive for Desktop</strong>, Anda bisa memilih folder di <code>G:\My Drive\RKPD 2027</code>. 
                Setiap kali naskah disimpan, file Word dan backup database akan langsung otomatis masuk ke cloud Google Drive Anda.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lokasi Folder Sinkronisasi di Komputer:
                </label>
                <input
                  type="text"
                  required
                  value={syncFolderPath}
                  onChange={(e) => setSyncFolderPath(e.target.value)}
                  placeholder="Contoh: D:\RKPD_GOOGLE_DRIVE_BACKUP atau G:\My Drive\RKPD"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Folder ini akan menampung file <code>database_latest.json</code> dan salinan dokumen Word <code>.docx</code> siap baca.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="auto-sync"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="auto-sync" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Sinkronisasi otomatis setiap kali ada OPD yang menyimpan perubahan narasi
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  Simpan Pengaturan Folder
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SERVICE ACCOUNT API CONFIGURATION */}
          {activeTab === 'API' && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                💡 <strong>Google Cloud Service Account:</strong> Digunakan jika aplikasi berjalan di server cloud terpisah dan ingin mengunggah file langsung ke Google Drive melalui REST API tanpa sinkronisasi folder desktop.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Drive Folder ID (Opsional):
                </label>
                <input
                  type="text"
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2up0"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kunci Kredensial Service Account (Format JSON):
                </label>
                <textarea
                  rows={4}
                  value={serviceAccountKey}
                  onChange={(e) => setServiceAccountKey(e.target.value)}
                  placeholder='Paste isi file service-account-key.json dari Google Cloud Console di sini...'
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  Simpan Kredensial API
                </button>
              </div>
            </form>
          )}

          {/* SECTION: BACKUP ARCHIVE & RESTORE */}
          <div className="pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daftar Arsip Cadangan di Folder ({backups.length})
                </h4>
                <p className="text-xs text-slate-500">
                  File-file ini tersimpan di folder Google Drive Anda dan dapat dipulihkan kapan saja
                </p>
              </div>
            </div>

            {/* Backups List Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-52 overflow-y-auto">
              {backups.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Belum ada file cadangan di folder. Klik tombol <strong>"Sinkronkan Sekarang"</strong> di atas.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">Nama File</th>
                      <th className="p-2.5">Ukuran</th>
                      <th className="p-2.5">Waktu Cadangan</th>
                      <th className="p-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {backups.map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-2.5 font-medium text-slate-800 flex items-center gap-1.5">
                          {b.isDocx ? (
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          ) : (
                            <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          <span className="truncate max-w-xs">{b.fileName}</span>
                        </td>
                        <td className="p-2.5 text-slate-500">{b.sizeFormatted}</td>
                        <td className="p-2.5 text-slate-500">
                          {new Date(b.lastModified).toLocaleString('id-ID')}
                        </td>
                        <td className="p-2.5 text-right">
                          {b.isJsonBackup && currentUser.role === 'ADMIN' && (
                            <button
                              onClick={() => handleRestoreFromFolder(b.fileName)}
                              disabled={restoring}
                              className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200 transition"
                            >
                              Pulihkan
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Upload File Backup to Restore */}
            {currentUser.role === 'ADMIN' && (
              <form onSubmit={handleRestoreFromUpload} className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">
                    Pulihkan dari file JSON komputer:
                  </span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => setRestoreFile(e.target.files ? e.target.files[0] : null)}
                    className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!restoreFile || restoring}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 shrink-0"
                >
                  {restoring ? 'Memulihkan...' : 'Pulihkan Database'}
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            🔒 Integrasi Google Drive menjaga seluruh draf naskah RKPD selalu tercadangkan dengan aman.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
