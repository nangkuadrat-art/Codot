import React, { useState } from 'react';
import {
  FileText,
  Upload,
  BookOpen,
  Plus,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  Trash2,
  Sparkles,
  ShieldCheck,
  FileCheck2,
  Lock,
  BarChart3,
  Layers,
  Info,
  Check,
  Eye,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import ProgressTrackingDashboard from './ProgressTrackingDashboard';
import { api } from '../api';

function WordIcon({ className = "w-4 h-4" }) {
  return (
    <span className={`inline-flex items-center justify-center font-black rounded-xs bg-[#103f91] text-white shrink-0 text-[10px] w-4 h-4 shadow-2xs ${className}`}>
      W
    </span>
  );
}

export default function DocumentList({
  documents,
  loading,
  currentUser,
  selectedStage,
  stages,
  onOpenDoc,
  onOpenDocSection,
  onOpenImportModal,
  onCreateTemplate,
  onCreateBlankDoc,
  onDeleteDoc,
  onExportDoc,
  onSeedTemplates,
  onOpenClosingModal,
  onOpenConsistencyModal,
  onRefreshDocs
}) {
  const [activeTab, setActiveTab] = useState('DOCUMENTS'); // DOCUMENTS or TRACKING
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [docFilterType, setDocFilterType] = useState('ALL'); // ALL, MY_RESPONSIBILITY, READ_ONLY
  const [openingWordDocId, setOpeningWordDocId] = useState(null);
  const [syncingWordDocId, setSyncingWordDocId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (toastData, type = 'info') => {
    if (typeof toastData === 'string') {
      setToast({ message: toastData, type, title: type === 'error' ? 'Gagal' : 'Informasi' });
    } else {
      setToast({ type: 'info', ...toastData });
    }
    setTimeout(() => {
      setToast(null);
    }, 12000);
  };

  const handleOpenWordDesktop = async (docId, docTitle) => {
    try {
      setOpeningWordDocId(docId);
      
      const cleanName = (docTitle || 'BAB').replace(/[^a-zA-Z0-9_-]/g, '_');
      const wordBridgePath = `/api/word-bridge/${currentUser?.id || 'user_admin'}/${docId}/Naskah_${cleanName}.docx`;
      const fullWordBridgeUrl = `${window.location.origin}${wordBridgePath}`;
      const officeUri = `ms-word:ofe|u|${fullWordBridgeUrl}`;

      // 1. Tell backend to prepare document & launch cmd if on localhost
      try {
        await api.openWordDesktop(docId);
      } catch (e) {
        console.warn('Backend open-word-desktop notice:', e.message);
      }

      // 2. Launch Microsoft Word directly on the client PC via Office URI protocol
      // ms-word:ofe|u|URL tells Windows/macOS to launch desktop Word directly with this document
      try {
        const link = document.createElement('a');
        link.href = officeUri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (errNav) {
        console.warn('Office URI trigger notice:', errNav);
      }

      showToast({
        title: 'Membuka Microsoft Word...',
        message: 'Aplikasi Microsoft Word sedang diluncurkan di komputer Anda. Klik "Open Word" / "Izinkan" jika peramban meminta konfirmasi.',
        wordUrl: officeUri,
        directDownloadUrl: wordBridgePath,
        type: 'success'
      });

      setTimeout(() => {
        onRefreshDocs?.();
      }, 3000);
    } catch (err) {
      showToast({ message: 'Gagal membuka file di Word: ' + err.message, type: 'error' });
    } finally {
      setOpeningWordDocId(null);
    }
  };

  const handleSyncWord = async (docId, docTitle) => {
    try {
      setSyncingWordDocId(docId);
      const res = await api.syncWordDoc(docId);
      if (res.success) {
        showToast(res.message || 'Naskah berhasil disinkronkan langsung dari file Word!', 'success');
        onRefreshDocs?.();
      } else {
        showToast(res.message || 'Gagal sinkronisasi naskah dari Word', 'error');
      }
    } catch (err) {
      showToast('Gagal sinkronisasi: ' + err.message, 'error');
    } finally {
      setSyncingWordDocId(null);
    }
  };

  const isClosed = selectedStage?.status === 'CLOSED';
  const isLocked = selectedStage?.status === 'LOCKED';
  const isActive = selectedStage?.status === 'ACTIVE';
  const isAdmin = currentUser?.role === 'ADMIN';

  // Count responsibilities for Contributor & Reviewer
  const myRespDocs = (documents || []).filter(d => {
    if (isAdmin) return true;
    if (currentUser?.role === 'REVIEWER') return d.isReviewerForThisDoc;
    if (currentUser?.role === 'CONTRIBUTOR') return (d.assignedSectionsCount || 0) > 0 || d.isMyResponsibility;
    return true;
  });

  const readOnlyDocs = (documents || []).filter(d => {
    if (isAdmin) return false;
    if (currentUser?.role === 'REVIEWER') return !d.isReviewerForThisDoc;
    if (currentUser?.role === 'CONTRIBUTOR') return !((d.assignedSectionsCount || 0) > 0 || d.isMyResponsibility);
    return false;
  });

  // Filter documents by role responsibility and search query
  const filteredDocs = (documents || []).filter(doc => {
    // 1. Filter by role responsibility
    if (docFilterType === 'MY_RESPONSIBILITY') {
      if (currentUser?.role === 'REVIEWER' && !doc.isReviewerForThisDoc) return false;
      if (currentUser?.role === 'CONTRIBUTOR' && !((doc.assignedSectionsCount || 0) > 0 || doc.isMyResponsibility)) return false;
    } else if (docFilterType === 'READ_ONLY') {
      if (currentUser?.role === 'REVIEWER' && doc.isReviewerForThisDoc) return false;
      if (currentUser?.role === 'CONTRIBUTOR' && ((doc.assignedSectionsCount || 0) > 0 || doc.isMyResponsibility)) return false;
    }

    // 2. Filter by search query
    if (!searchDocQuery.trim()) return true;
    const q = searchDocQuery.toLowerCase();
    return (
      doc.title?.toLowerCase().includes(q) ||
      doc.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Stage Status Alerts (Closed / Locked notices) */}
      {isClosed && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
            <span><strong>Tahap Ditutup:</strong> {selectedStage.title} berstatus arsip permanen (Read-Only).</span>
          </div>
          <span className="text-[11px] text-emerald-700 shrink-0 font-medium">Ditutup {selectedStage.closedAt ? new Date(selectedStage.closedAt).toLocaleDateString('id-ID') : ''}</span>
        </div>
      )}

      {isLocked && (
        <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-slate-700 shadow-2xs">
          <Clock className="w-4 h-4 text-slate-500 shrink-0" />
          <span><strong>Tahap Terkunci:</strong> {selectedStage.title} akan aktif setelah penutupan tahap sebelumnya.</span>
        </div>
      )}

      {/* Main Tab Switcher: Documents vs Tracking Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('DOCUMENTS')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
              activeTab === 'DOCUMENTS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Naskah Dokumen</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === 'DOCUMENTS' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {documents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('TRACKING')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
              activeTab === 'TRACKING'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dasbor Progres</span>
            {selectedStage?.progress !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'TRACKING' ? 'bg-indigo-700 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {selectedStage.progress}%
              </span>
            )}
          </button>
        </div>

        {/* Action buttons (Import, Add Doc, Seed) */}
        {!isClosed && !isLocked && (
          <div className="flex flex-wrap items-center gap-2">
            {documents.length === 0 && isAdmin && (
              <button
                onClick={() => onSeedTemplates(selectedStage.id)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Inisialisasi 7 Bab</span>
              </button>
            )}

            {/* Consistency Audit CTA Button */}
            <button
              onClick={onOpenConsistencyModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-300 text-amber-900 font-semibold text-xs shadow-2xs transition cursor-pointer"
              title="Audit & Cek Konsistensi Antar Bab"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Cek Konsistensi</span>
            </button>

            <button
              onClick={onOpenImportModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs shadow-2xs transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Impor Word</span>
            </button>

            <button
              onClick={onCreateBlankDoc}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>Dokumen Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: Documents Grid */}
      {activeTab === 'DOCUMENTS' && (
        <div className="space-y-4">
          
          {/* Empty State with Seed CTA */}
          {documents.length === 0 && !loading && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Belum ada dokumen naskah pada tahapan ini
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Anda dapat langsung menginisialisasi paket lengkap 7 Bab RKPD dari template resmi.
              </p>

              {isAdmin && !isLocked && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => onSeedTemplates(selectedStage.id)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Inisialisasi 7 Bab RKPD Sekarang</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Toast Notification for Word Launch / Sync */}
          {toast && (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-medium shadow-md transition-all ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-blue-50 border-blue-200 text-blue-950'
            }`}>
              <div className="flex items-start gap-3">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold text-sm text-slate-900">{toast.title || 'Pemberitahuan'}</div>
                  <div className="leading-relaxed text-slate-700">{toast.message}</div>
                  
                  {/* Fallback Action Links if Word didn't open automatically */}
                  {(toast.wordUrl || toast.directDownloadUrl) && (
                    <div className="mt-2.5 pt-1.5 border-t border-slate-200/60 flex flex-wrap items-center gap-2">
                      {toast.wordUrl && (
                        <a
                          href={toast.wordUrl}
                          className="px-2.5 py-1 bg-[#185abd] text-white rounded-lg font-bold text-[11px] shadow-2xs hover:bg-[#134794] transition flex items-center gap-1.5"
                        >
                          <WordIcon className="w-3.5 h-3.5" />
                          <span>Klik di Sini untuk Buka Word (ms-word:)</span>
                        </a>
                      )}
                      {toast.directDownloadUrl && (
                        <a
                          href={toast.directDownloadUrl}
                          download
                          className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold text-[11px] shadow-2xs hover:bg-slate-50 transition flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>Unduh File .docx Manual</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1 self-start sm:self-center cursor-pointer">✕</button>
            </div>
          )}

          {/* Microsoft Word Live Synchronization Banner */}
          <div className="bg-gradient-to-r from-[#0d2a58] via-[#103f91] to-[#185abd] text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-blue-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-xl shadow-inner shrink-0 text-[#185abd]">
                W
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Kolaborasi Langsung dengan Microsoft Word Desktop
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-400/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Auto-Sync Server Aktif
                  </span>
                </div>
                <p className="text-xs text-blue-100/90 leading-relaxed max-w-3xl">
                  Klik tombol <strong>Edit di Microsoft Word</strong> pada bab yang ingin diedit. File naskah asli (<code className="bg-white/20 px-1 py-0.5 rounded text-[11px] font-mono">.docx</code>) langsung dibuka di aplikasi Microsoft Word desktop Anda. Setiap kali Anda menekan <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-[11px] font-mono font-bold text-white">Ctrl + S</kbd> di Word, server Codot otomatis mendeteksi dan menyimpan seluruh perubahannya!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                onClick={() => onRefreshDocs?.()}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer border border-white/20"
                title="Periksa dan perbarui status dokumen dari server"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Segarkan Status</span>
              </button>
            </div>
          </div>

          {/* Role Access Guide Strip */}
          {!isAdmin && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="font-bold text-[#185abd]">Peran: {currentUser?.role === 'REVIEWER' ? 'Reviewer' : 'Kontributor'} ({currentUser?.name})</span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="text-slate-500 hidden sm:inline">
                  {currentUser?.role === 'REVIEWER'
                    ? `Pantauan: ${(currentUser.reviewedChapters || []).join(', ') || 'Belum ada bab'}`
                    : `Tugas: ${myRespDocs.length} Bab • Bab lain mode baca`}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 shrink-0">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Tanggung Jawab ({myRespDocs.length})</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Lihat Saja ({readOnlyDocs.length})</span>
                </span>
              </div>
            </div>
          )}

          {/* Filter Bar: Semua | Tanggung Jawab Saya | Menu Lihat Saja */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                onClick={() => setDocFilterType('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  docFilterType === 'ALL'
                    ? 'bg-[#185abd] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>Semua</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  docFilterType === 'ALL' ? 'bg-[#134794] text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {documents.length}
                </span>
              </button>

              {!isAdmin && (
                <>
                  <button
                    onClick={() => setDocFilterType('MY_RESPONSIBILITY')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      docFilterType === 'MY_RESPONSIBILITY'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    <span>{currentUser?.role === 'REVIEWER' ? 'Bab Pantauan' : 'Tanggung Jawab'}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      docFilterType === 'MY_RESPONSIBILITY' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'
                    }`}>
                      {myRespDocs.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setDocFilterType('READ_ONLY')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      docFilterType === 'READ_ONLY'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Saja</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      docFilterType === 'READ_ONLY' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {readOnlyDocs.length}
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* Quick search inside docs */}
            <div className="relative sm:w-64">
              <input
                type="text"
                placeholder="Cari bab atau topik..."
                value={searchDocQuery}
                onChange={(e) => setSearchDocQuery(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#185abd] transition"
              />
              {searchDocQuery && (
                <button
                  onClick={() => setSearchDocQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDocs.map((doc) => {
              const totalSec = doc.totalSections || 0;
              const approvedSec = doc.approvedSections || 0;
              const inProgressSec = doc.inProgressSections || 0;
              const reviewSec = doc.reviewSections || 0;
              const draftSec = doc.draftSections || 0;
              const pct = doc.progress || 0;

              // Compute responsibility flags
              const isReviewerForThis = currentUser?.role === 'ADMIN' || doc.isReviewerForThisDoc;
              const hasMyContributorSections = (doc.assignedSectionsCount || 0) > 0 || doc.isMyResponsibility;
              const isMyResp = isAdmin || (currentUser?.role === 'REVIEWER' ? isReviewerForThis : hasMyContributorSections);
              const isReadOnlyDoc = !isMyResp;

              return (
                <div
                  key={doc.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden group shadow-xs ${
                    isReadOnlyDoc
                      ? 'border-slate-200 bg-slate-50/40 hover:border-slate-400'
                      : 'border-slate-200 hover:border-[#185abd] hover:shadow-lg'
                  }`}
                >
                  <div className="p-5">
                    {/* Top Row: Stage Tag & Responsibility Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {selectedStage?.shortTitle || 'Tahapan RKPD'}
                      </span>

                      {isClosed ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Arsip Terkunci
                        </span>
                      ) : isReadOnlyDoc ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                          <Eye className="w-3 h-3 text-slate-500" /> Mode Lihat Saja
                        </span>
                      ) : currentUser?.role === 'REVIEWER' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-900 border border-cyan-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-cyan-700" /> Reviewer Resmi
                        </span>
                      ) : currentUser?.role === 'CONTRIBUTOR' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-700" /> Tugas Anda: {doc.assignedSectionsCount || 0} Sub-Bab
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                          {totalSec} Bagian Naskah
                        </span>
                      )}
                    </div>

                    {/* Document Title */}
                    <h3
                      onClick={() => onOpenDoc(doc.id)}
                      className={`font-bold text-sm sm:text-base transition line-clamp-2 cursor-pointer leading-snug ${
                        isReadOnlyDoc ? 'text-slate-800 group-hover:text-slate-900' : 'text-slate-900 group-hover:text-[#185abd]'
                      }`}
                    >
                      {doc.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {doc.description || 'Tidak ada deskripsi naskah'}
                    </p>

                    {/* Reviewer Level Bab Pill */}
                    {doc.assignedReviewers?.length > 0 && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-cyan-950 bg-cyan-50/80 border border-cyan-200 px-2.5 py-1 rounded-lg">
                        <Eye className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
                        <span className="font-semibold text-slate-600">Reviewer Bab:</span>
                        <span className="font-bold truncate text-cyan-900">
                          {doc.assignedReviewers.map(r => r.name).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Dedicated Microsoft Word Direct Integration Box */}
                    <div className="mt-3.5 bg-gradient-to-r from-blue-50/90 to-indigo-50/60 border border-blue-200/90 rounded-xl p-3 flex flex-col gap-2 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="text-[11px] font-bold text-blue-950 truncate" title={doc.originalFilename || 'File Naskah Asli .docx'}>
                            {doc.originalFilename || `${doc.chapter || 'BAB'}.docx`}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Auto-Sync Aktif
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenWordDesktop(doc.id, doc.title);
                          }}
                          disabled={openingWordDocId === doc.id}
                          className="flex-1 bg-[#185abd] hover:bg-[#134794] active:bg-[#0f3875] text-white font-bold text-xs py-2 px-3 rounded-lg shadow-2xs hover:shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                          title="Buka langsung file asli di aplikasi Microsoft Word desktop Anda. Tekan Ctrl+S di Word untuk menyimpan otomatis ke server Codot."
                        >
                          {openingWordDocId === doc.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Membuka Word...</span>
                            </>
                          ) : (
                            <>
                              <WordIcon />
                              <span>Edit di Microsoft Word</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSyncWord(doc.id, doc.title);
                          }}
                          disabled={syncingWordDocId === doc.id}
                          className="p-2 text-blue-800 bg-white hover:bg-blue-100/70 border border-blue-300 rounded-lg shadow-2xs transition cursor-pointer shrink-0 disabled:opacity-50"
                          title="Sinkronkan Naskah dari File Word Sekarang (Reload pembaruan Ctrl+S)"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncingWordDocId === doc.id ? 'animate-spin text-blue-600' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Breakdown */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-600 text-[11px]">
                          Progres Naskah Disetujui
                        </span>
                        <span className="font-bold text-slate-800 text-xs">
                          {pct}%
                        </span>
                      </div>

                      {/* Multi-segmented Progress Bar */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: totalSec > 0 ? `${(approvedSec / totalSec) * 100}%` : '0%' }}
                          title={`Disetujui: ${approvedSec}`}
                        />
                        <div
                          className="bg-purple-500 h-full transition-all"
                          style={{ width: totalSec > 0 ? `${(reviewSec / totalSec) * 100}%` : '0%' }}
                          title={`Review: ${reviewSec}`}
                        />
                        <div
                          className="bg-blue-500 h-full transition-all"
                          style={{ width: totalSec > 0 ? `${(inProgressSec / totalSec) * 100}%` : '0%' }}
                          title={`Dikerjakan: ${inProgressSec}`}
                        />
                        <div
                          className="bg-amber-400 h-full transition-all"
                          style={{ width: totalSec > 0 ? `${(draftSec / totalSec) * 100}%` : '0%' }}
                          title={`Draft: ${draftSec}`}
                        />
                      </div>

                      {/* Micro Legend */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                        <span title="Disetujui / Selesai (Final)">🟢 {approvedSec} Final</span>
                        <span title="Menunggu Review Admin">🟣 {reviewSec} Review</span>
                        <span title="Sedang Dikerjakan">🔵 {inProgressSec} Kerja</span>
                        <span title="Belum Dimulai / Draft">🟡 {draftSec} Draft</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[10px] text-slate-400">
                      Diperbarui {doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString('id-ID') : '-'}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onExportDoc(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
                        title="Ekspor Bab ke Word (.docx)"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {isAdmin && !isClosed && (
                        <button
                          onClick={() => onDeleteDoc(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Dokumen Bab"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onOpenDoc(doc.id)}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-semibold text-xs shadow-2xs transition cursor-pointer ${
                          isClosed
                            ? 'bg-slate-700 hover:bg-slate-800 text-white'
                            : isReadOnlyDoc
                            ? 'bg-slate-600 hover:bg-slate-700 text-white'
                            : currentUser?.role === 'REVIEWER'
                            ? 'bg-cyan-700 hover:bg-cyan-800 text-white'
                            : 'bg-[#185abd] hover:bg-[#144b9e] active:bg-[#0f3b7d] text-white'
                        }`}
                      >
                        <span>
                          {isClosed
                            ? 'Pratinjau'
                            : isReadOnlyDoc
                            ? 'Lihat Saja'
                            : currentUser?.role === 'REVIEWER'
                            ? 'Review'
                            : 'Buka'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* TAB 2: Tracking & Workflow Dashboard */}
      {activeTab === 'TRACKING' && (
        <ProgressTrackingDashboard
          stageId={selectedStage?.id}
          stageTitle={selectedStage?.title}
          currentUser={currentUser}
          onOpenDocSection={onOpenDocSection}
          onOpenClosingModal={onOpenClosingModal}
        />
      )}

    </div>
  );
}
