import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  Users,
  FileText,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  Lock,
  Zap,
  Building,
  Check,
  Award
} from 'lucide-react';
import { api } from '../api';

export default function ProgressTrackingDashboard({
  stageId,
  stageTitle,
  currentUser,
  onOpenDocSection,
  onOpenClosingModal
}) {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, DRAFT, IN_PROGRESS, REVIEW, APPROVED
  const [selectedUserFilter, setSelectedUserFilter] = useState('ALL');
  const [selectedDocFilter, setSelectedDocFilter] = useState('ALL');
  const [updatingSectionId, setUpdatingSectionId] = useState(null);

  const loadTracking = async () => {
    if (!stageId) return;
    try {
      setLoading(true);
      const res = await api.getStageTracking(stageId);
      if (res.success) {
        setTrackingData(res.data);
      }
    } catch (err) {
      console.error('Failed to load tracking data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracking();
  }, [stageId]);

  // Handle quick status change by Admin/Reviewer
  const handleQuickStatusChange = async (sectionId, newStatus) => {
    try {
      setUpdatingSectionId(sectionId);
      const res = await api.updateSectionStatus(sectionId, newStatus);
      if (res.success) {
        await loadTracking();
      }
    } catch (err) {
      alert('Gagal mengubah status: ' + err.message);
    } finally {
      setUpdatingSectionId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-xs">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Memuat dasbor pelacakan progres tahapan...</p>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-xs">
        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Data pelacakan belum tersedia untuk tahapan ini.</p>
      </div>
    );
  }

  const {
    stage,
    totalDocs,
    totalSections,
    approvedSections,
    reviewSections,
    inProgressSections,
    draftSections,
    overallProgress,
    userTracking = [],
    detailedSections = []
  } = trackingData;

  // Filter sections
  const filteredSections = detailedSections.filter(sec => {
    if (statusFilter !== 'ALL' && sec.status !== statusFilter) return false;
    if (selectedDocFilter !== 'ALL' && sec.documentId !== selectedDocFilter) return false;
    if (selectedUserFilter !== 'ALL') {
      const hasUser = sec.assignees?.some(u => u.id === selectedUserFilter);
      if (!hasUser) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const codeMatch = sec.code?.toLowerCase().includes(q);
      const titleMatch = sec.title?.toLowerCase().includes(q);
      const docMatch = sec.docTitle?.toLowerCase().includes(q);
      const opdMatch = sec.assignees?.some(u => u.opd?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q));
      if (!codeMatch && !titleMatch && !docMatch && !opdMatch) return false;
    }
    return true;
  });

  // Extract unique documents for filter dropdown
  const uniqueDocs = Array.from(new Set(detailedSections.map(s => s.documentId)))
    .map(docId => {
      const s = detailedSections.find(item => item.documentId === docId);
      return { id: docId, title: s?.docTitle || 'Dokumen' };
    });

  const isAdmin = currentUser?.role === 'ADMIN';
  const isReviewer = currentUser?.role === 'REVIEWER';
  const isStageClosed = stage?.status === 'CLOSED';

  return (
    <div className="space-y-6">

      {/* 1. Header Overview & Progress Stats */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pemantauan Progres Tahapan</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {stage.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Pelacakan status naskah RKPD dan progres kontribusi OPD secara real-time.
            </p>
          </div>

          {/* Overall Progress Gauge */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-5 shrink-0">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500 transition-all duration-700 ease-out"
                  strokeWidth="3.5"
                  strokeDasharray={`${overallProgress}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-800">
                {overallProgress}%
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Kemajuan Naskah
              </div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                {approvedSections} <span className="text-xs text-slate-500 font-normal">dari {totalSections} Sub-Bab Disetujui</span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                {totalDocs} Dokumen Bab Terbuka
              </div>
            </div>
          </div>
        </div>

        {/* 4 Status Cards (Exact terminology from user's image) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          
          {/* 1. Belum Dimulai / Draft */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'DRAFT' ? 'ALL' : 'DRAFT')}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              statusFilter === 'DRAFT'
                ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300'
                : 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">🟡</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                {totalSections > 0 ? Math.round((draftSections / totalSections) * 100) : 0}%
              </span>
            </div>
            <div className="text-2xl font-black text-amber-950 mt-2">
              {draftSections}
            </div>
            <div className="text-xs font-bold text-amber-900 mt-0.5">
              Belum Dimulai / Draft
            </div>
            <div className="text-[10px] text-amber-700/80 mt-1">
              Menunggu pengerjaan oleh penanggung jawab
            </div>
          </div>

          {/* 2. Sedang Dikerjakan */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300'
                : 'bg-blue-50/60 border-blue-200 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">🔵</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-900">
                {totalSections > 0 ? Math.round((inProgressSections / totalSections) * 100) : 0}%
              </span>
            </div>
            <div className="text-2xl font-black text-blue-950 mt-2">
              {inProgressSections}
            </div>
            <div className="text-xs font-bold text-blue-900 mt-0.5">
              Sedang Dikerjakan
            </div>
            <div className="text-[10px] text-blue-700/80 mt-1">
              Aktif disunting narasi & tabelnya
            </div>
          </div>

          {/* 3. Menunggu Review Admin */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'REVIEW' ? 'ALL' : 'REVIEW')}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              statusFilter === 'REVIEW'
                ? 'bg-purple-100 border-purple-400 ring-2 ring-purple-300'
                : 'bg-purple-50/60 border-purple-200 hover:bg-purple-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">🟣</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">
                {totalSections > 0 ? Math.round((reviewSections / totalSections) * 100) : 0}%
              </span>
            </div>
            <div className="text-2xl font-black text-purple-950 mt-2">
              {reviewSections}
            </div>
            <div className="text-xs font-bold text-purple-900 mt-0.5">
              Menunggu Review Admin
            </div>
            <div className="text-[10px] text-purple-700/80 mt-1">
              Siap diverifikasi tim perumus / penjamin mutu
            </div>
          </div>

          {/* 4. Disetujui / Selesai (Final) */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'APPROVED' ? 'ALL' : 'APPROVED')}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-300'
                : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">🟢</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                {totalSections > 0 ? Math.round((approvedSections / totalSections) * 100) : 0}%
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-950 mt-2">
              {approvedSections}
            </div>
            <div className="text-xs font-bold text-emerald-900 mt-0.5">
              Disetujui / Selesai (Final)
            </div>
            <div className="text-[10px] text-emerald-700/80 mt-1">
              Telah disahkan & siap digulirkan
            </div>
          </div>

        </div>
      </div>

      {/* 2. Admin Progress Tracking by OPD ("Siapa yang belum menyelesaikan bagian tugasnya") */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Pelacakan Keterisian Perangkat Daerah & Kontributor</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau siapa saja OPD yang telah menyelesaikan seluruh bagian naskahnya atau masih memiliki tugas pending.
            </p>
          </div>

          {selectedUserFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedUserFilter('ALL')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold self-start sm:self-auto cursor-pointer"
            >
              Reset Filter OPD
            </button>
          )}
        </div>

        {/* User / OPD Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {userTracking.map(user => {
            const isSelected = selectedUserFilter === user.userId;
            return (
              <div
                key={user.userId}
                onClick={() => setSelectedUserFilter(isSelected ? 'ALL' : user.userId)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                      style={{ backgroundColor: user.color || '#4f46e5' }}
                    >
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800 line-clamp-1">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">
                        {user.opd}
                      </div>
                    </div>
                  </div>

                  {/* Completion Status Tag */}
                  {user.totalAssigned === 0 ? (
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                      Tidak Ditugaskan
                    </span>
                  ) : user.isCompleted ? (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" /> Selesai 100%
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                      {user.pending} Tersisa
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                {user.totalAssigned > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-slate-600 font-medium">
                        {user.approved} dari {user.totalAssigned} Selesai
                      </span>
                      <span className="font-extrabold text-slate-800">
                        {user.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${(user.approved / user.totalAssigned) * 100}%` }}
                        title={`Disetujui: ${user.approved}`}
                      />
                      <div
                        className="bg-purple-500 h-full"
                        style={{ width: `${(user.review / user.totalAssigned) * 100}%` }}
                        title={`Menunggu Review: ${user.review}`}
                      />
                      <div
                        className="bg-blue-500 h-full"
                        style={{ width: `${(user.inProgress / user.totalAssigned) * 100}%` }}
                        title={`Sedang Dikerjakan: ${user.inProgress}`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1.5 pt-1 border-t border-slate-200/60">
                      <span>🟡 {user.draft} Draft</span>
                      <span>🔵 {user.inProgress} Kerja</span>
                      <span>🟣 {user.review} Review</span>
                      <span>🟢 {user.approved} Final</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Detailed Sub-Bab Workflow Checklist & Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        
        {/* Filter bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Matriks Progres Tiap Sub-Bab Naskah
            </h3>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredSections.length} dari total {detailedSections.length} sub-bab dalam tahapan ini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari sub-bab / OPD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44 sm:w-56"
              />
            </div>

            {/* Document BAB Filter */}
            <select
              value={selectedDocFilter}
              onChange={(e) => setSelectedDocFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-700 cursor-pointer"
            >
              <option value="ALL">Semua Dokumen BAB</option>
              {uniqueDocs.map(d => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-700 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="DRAFT">🟡 Belum Dimulai / Draft</option>
              <option value="IN_PROGRESS">🔵 Sedang Dikerjakan</option>
              <option value="REVIEW">🟣 Menunggu Review Admin</option>
              <option value="APPROVED">🟢 Disetujui / Selesai (Final)</option>
            </select>
          </div>
        </div>

        {/* Sub-Bab Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3 w-16">Kode</th>
                <th className="py-2.5 px-3">Judul Sub-Bab</th>
                <th className="py-2.5 px-3">Dokumen (BAB)</th>
                <th className="py-2.5 px-3">Penanggung Jawab / OPD</th>
                <th className="py-2.5 px-3 w-48">Status Workflow</th>
                <th className="py-2.5 px-3 text-right w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSections.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    Tidak ada sub-bab yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredSections.map(sec => {
                  const statusColors = {
                    DRAFT: 'bg-amber-100 text-amber-900 border-amber-300',
                    IN_PROGRESS: 'bg-blue-100 text-blue-900 border-blue-300',
                    REVIEW: 'bg-purple-100 text-purple-900 border-purple-300',
                    APPROVED: 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  };

                  const statusLabels = {
                    DRAFT: '🟡 Belum Dimulai / Draft',
                    IN_PROGRESS: '🔵 Sedang Dikerjakan',
                    REVIEW: '🟣 Menunggu Review Admin',
                    APPROVED: '🟢 Disetujui / Selesai (Final)'
                  };

                  return (
                    <tr key={sec.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                        {sec.code || '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {sec.title}
                        </div>
                        {sec.isLocked && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] text-slate-400 font-medium mt-0.5">
                            <Lock className="w-2.5 h-2.5 text-slate-400" /> Terkunci
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-medium">
                        <div className="line-clamp-1">{sec.docTitle}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        {sec.assignees?.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1">
                            {sec.assignees.map(u => (
                              <span
                                key={u.id}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200 bg-white"
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: u.color || '#4f46e5' }}
                                />
                                <span className="line-clamp-1 max-w-[120px]">{u.opd || u.name}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Belum ditentukan</span>
                        )}
                      </td>

                      {/* Status Workflow Selector */}
                      <td className="py-2.5 px-3">
                        {!isStageClosed && (isAdmin || isReviewer) ? (
                          <select
                            value={sec.status || 'DRAFT'}
                            disabled={updatingSectionId === sec.id}
                            onChange={(e) => handleQuickStatusChange(sec.id, e.target.value)}
                            className={`text-[11px] font-bold px-2 py-1 rounded-md border cursor-pointer ${
                              statusColors[sec.status || 'DRAFT']
                            }`}
                          >
                            <option value="DRAFT">🟡 Belum Dimulai / Draft</option>
                            <option value="IN_PROGRESS">🔵 Sedang Dikerjakan</option>
                            <option value="REVIEW">🟣 Menunggu Review Admin</option>
                            <option value="APPROVED">🟢 Disetujui / Selesai (Final)</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            statusColors[sec.status || 'DRAFT']
                          }`}>
                            {statusLabels[sec.status || 'DRAFT']}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onOpenDocSection(sec.documentId, sec.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition cursor-pointer"
                          title="Buka naskah sub-bab ini di Word Editor"
                        >
                          <span>Buka</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
