import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  FolderArchive,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';

export default function ImportModal({
  isOpen,
  onClose,
  onSuccess
}) {
  const [activeTab, setActiveTab] = useState('CATALOG'); // 'CATALOG' or 'UPLOAD'
  const [templates, setTemplates] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importingFile, setImportingFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setError(null);
      setFile(null);
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const res = await api.getRkpdTemplates();
      if (res.success) {
        setTemplates(res.data);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  // Upload custom file
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Silakan pilih file Word (.docx) terlebih dahulu');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.importDocx(file);
      if (res.success) {
        onSuccess(res.data.id);
        onClose();
      } else {
        setError(res.message || 'Gagal mengimpor file');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengunggah file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Import specific chapter from Template folder
  const handleImportChapter = async (fileName) => {
    try {
      setImportingFile(fileName);
      setError(null);
      const res = await api.importRkpdChapter(fileName);
      if (res.success) {
        onSuccess(res.data.id);
        onClose();
      } else {
        setError(res.message || 'Gagal mengimpor bab');
      }
    } catch (err) {
      setError('Terjadi kesalahan: ' + err.message);
    } finally {
      setImportingFile(null);
    }
  };

  // Import all 7 chapters
  const handleImportAll = async () => {
    if (!window.confirm('Apakah Anda ingin mengimpor seluruh Bab (Bab I s.d Bab VII) sekaligus? Seluruh dokumen akan dimuat ke ruang kerja Anda.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.importAllRkpdChapters();
      if (res.success && res.data.length > 0) {
        onSuccess(res.data[0].id);
        onClose();
      } else {
        setError(res.message || 'Gagal mengimpor seluruh bab');
      }
    } catch (err) {
      setError('Terjadi kesalahan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Import Dokumen & Template Resmi RKPD 2027
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 uppercase">
                  Perbup Cilacap No. 7/2026
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pilih naskah bab resmi dari folder <code>Template/</code> atau unggah file Word mandiri
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading || !!importingFile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100/80 px-6 pt-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('CATALOG')}
              className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
                activeTab === 'CATALOG'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Naskah Resmi Perbup (Folder Template) ({templates.length} Bab)</span>
            </button>

            <button
              onClick={() => setActiveTab('UPLOAD')}
              className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
                activeTab === 'UPLOAD'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Unggah File Word Lain (.docx)</span>
            </button>
          </div>

          {activeTab === 'CATALOG' && templates.length > 0 && (
            <button
              type="button"
              onClick={handleImportAll}
              disabled={loading || !!importingFile}
              className="mb-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{loading ? 'Mengimpor Semua...' : 'Import Semua Bab (I s.d VII)'}</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: OFFICIAL TEMPLATES CATALOG */}
          {activeTab === 'CATALOG' && (
            <div className="space-y-3">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-normal flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Naskah Resmi Siap Kerja:</strong> Ditemukan 7 file draf bab lengkap dari Perbup RKPD 2027 di folder <code>Template/</code>. 
                  Setiap bab otomatis diurai menjadi unit-unit hierarki yang siap didelegasikan ke OPD pengampu.
                </div>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
                {templates.map((tpl) => {
                  const isImportingThis = importingFile === tpl.fileName;

                  return (
                    <div
                      key={tpl.fileName}
                      className="p-4 hover:bg-indigo-50/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-indigo-700 font-extrabold flex items-center justify-center shrink-0 border border-slate-200 text-xs">
                          {tpl.chapter}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                              {tpl.title}
                            </h4>
                            <span className="text-[10px] text-slate-400">
                              ({tpl.sizeKb} KB)
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {tpl.desc}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-indigo-700 font-medium">
                            <span className="px-1.5 py-0.2 rounded bg-indigo-50 border border-indigo-100">
                              Pengampu Utama: {tpl.recommendedOpd}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleImportChapter(tpl.fileName)}
                        disabled={loading || !!importingFile}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 self-end sm:self-center shrink-0 disabled:opacity-50"
                      >
                        {isImportingThis && (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        <span>{isImportingThis ? 'Mengurai...' : 'Impor Bab Ini'}</span>
                        {!isImportingThis && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD CUSTOM DOCX */}
          {activeTab === 'UPLOAD' && (
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-8 text-center transition bg-slate-50/50">
                <input
                  type="file"
                  id="file-upload"
                  accept=".docx"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                    <FileText className="w-7 h-7" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-indigo-600 hover:underline">
                    Pilih file dokumen Microsoft Word (.docx)
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Mendukung file dokumen hingga 50 MB
                  </span>
                </label>

                {file && (
                  <div className="mt-4 p-3 bg-white rounded-xl border border-indigo-200 text-xs text-indigo-900 font-semibold flex items-center justify-center gap-2 max-w-md mx-auto">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!file || loading}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{loading ? 'Mengimpor & Memecah Naskah...' : 'Mulai Import'}</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            💡 Setiap naskah yang diimpor akan dipecah otomatis berdasarkan BAB, Sub-Bab, dan tabel.
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
