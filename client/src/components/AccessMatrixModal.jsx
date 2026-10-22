import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Lock,
  Unlock,
  Check,
  Users,
  Search,
  Eye,
  BookOpen,
  Filter,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Layers
} from 'lucide-react';
import { api } from '../api';
import { CHAPTER_OPTIONS } from './UserManagementModal';

export default function AccessMatrixModal({
  isOpen,
  onClose,
  documentId,
  currentDoc,
  documents = [],
  sections = [],
  users = [],
  onSectionsUpdated
}) {
  const [activeTab, setActiveTab] = useState('SUB_BABS'); // 'SUB_BABS' or 'REVIEWER_CHAPTERS'
  const [selectedDocId, setSelectedDocId] = useState(documentId || (documents[0]?.id || null));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPicFilter, setSelectedPicFilter] = useState('ALL');
  const [collapsedIds, setCollapsedIds] = useState(new Set());
  
  // Local state for sections
  const [docSections, setDocSections] = useState(sections);
  const [localUsers, setLocalUsers] = useState(users);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Sync users when prop changes
  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  // Load sections if switching documents inside the modal
  const loadDocSections = async (docIdToLoad) => {
    if (!docIdToLoad) return;
    try {
      setLoadingDoc(true);
      const res = await api.getDocument(docIdToLoad);
      if (res.success) {
        setDocSections(res.data.sections || []);
      }
    } catch (err) {
      console.error('Failed to load doc sections:', err);
    } finally {
      setLoadingDoc(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      setSelectedDocId(documentId);
      setDocSections(sections);
    } else if (documents.length > 0) {
      const firstDoc = documents.find(d => d.title.includes('BAB II')) || documents[0];
      setSelectedDocId(firstDoc.id);
      loadDocSections(firstDoc.id);
    }
  }, [documentId, sections, documents]);

  const handleDocChange = (newDocId) => {
    setSelectedDocId(newDocId);
    loadDocSections(newDocId);
  };

  if (!isOpen) return null;

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Contributors only (exclude admin and reviewers for sub-bab columns)
  const contributors = localUsers.filter(u => u.role === 'CONTRIBUTOR');
  const reviewers = localUsers.filter(u => u.role === 'REVIEWER');

  // Toggle user assignment on a sub-bab
  const handleToggleUserAccess = async (sectionId, userId) => {
    const sec = docSections.find(s => s.id === sectionId);
    if (!sec) return;

    const currentAssigned = sec.assignedUserIds || [];
    const nextAssigned = currentAssigned.includes(userId)
      ? currentAssigned.filter(id => id !== userId)
      : [...currentAssigned, userId];

    setDocSections(prev =>
      prev.map(s => (s.id === sectionId ? { ...s, assignedUserIds: nextAssigned } : s))
    );

    try {
      setSavingId(sectionId);
      await api.updateSectionPermissions(sectionId, {
        assignedUserIds: nextAssigned
      });
      if (onSectionsUpdated) onSectionsUpdated();
    } catch (err) {
      console.error('Failed to update permission:', err);
    } finally {
      setSavingId(null);
    }
  };

  // Quick single-click assign to a specific PIC
  const handleAssignSinglePic = async (sectionId, userId) => {
    setDocSections(prev =>
      prev.map(s => (s.id === sectionId ? { ...s, assignedUserIds: [userId] } : s))
    );

    try {
      setSavingId(sectionId);
      await api.updateSectionPermissions(sectionId, {
        assignedUserIds: [userId]
      });
      if (onSectionsUpdated) onSectionsUpdated();
    } catch (err) {
      console.error('Failed to update permission:', err);
    } finally {
      setSavingId(null);
    }
  };

  // Toggle Lock on a sub-bab
  const handleToggleLock = async (sectionId) => {
    const sec = docSections.find(s => s.id === sectionId);
    if (!sec) return;

    const nextLocked = !sec.isLocked;

    setDocSections(prev =>
      prev.map(s => (s.id === sectionId ? { ...s, isLocked: nextLocked } : s))
    );

    try {
      setSavingId(sectionId);
      await api.updateSectionPermissions(sectionId, {
        isLocked: nextLocked
      });
      if (onSectionsUpdated) onSectionsUpdated();
    } catch (err) {
      console.error('Failed to update lock:', err);
    } finally {
      setSavingId(null);
    }
  };

  // Toggle Reviewer chapter assignment (Level Bab)
  const handleToggleReviewerChapter = async (reviewerId, chapterCode) => {
    const rev = localUsers.find(u => u.id === reviewerId);
    if (!rev) return;

    const currentChapters = rev.reviewedChapters || [];
    const nextChapters = currentChapters.includes(chapterCode)
      ? currentChapters.filter(c => c !== chapterCode)
      : [...currentChapters, chapterCode];

    // Optimistic update
    setLocalUsers(prev =>
      prev.map(u => (u.id === reviewerId ? { ...u, reviewedChapters: nextChapters } : u))
    );

    try {
      await api.updateUser(reviewerId, { reviewedChapters: nextChapters });
      showNotification(`Penugasan ${rev.name} untuk ${chapterCode} berhasil diperbarui`);
      if (onSectionsUpdated) onSectionsUpdated();
    } catch (err) {
      alert('Gagal memperbarui penugasan reviewer: ' + err.message);
    }
  };

  // Hierarchy check & collapse helpers
  const hasChildren = (sec, allSections) => {
    const idx = allSections.findIndex(s => s.id === sec.id);
    if (idx === -1 || idx === allSections.length - 1) return false;
    return allSections[idx + 1].level > sec.level;
  };

  const isSectionHiddenByParent = (sec, allSections) => {
    const secIndex = allSections.findIndex(s => s.id === sec.id);
    if (secIndex <= 0) return false;

    let currentLevel = sec.level;
    for (let i = secIndex - 1; i >= 0; i--) {
      const prev = allSections[i];
      if (prev.level < currentLevel) {
        if (collapsedIds.has(prev.id)) return true;
        currentLevel = prev.level;
        if (currentLevel <= 1) break;
      }
    }
    return false;
  };

  const handleToggleCollapse = (secId) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(secId)) next.delete(secId);
      else next.add(secId);
      return next;
    });
  };

  const handleExpandAll = () => {
    setCollapsedIds(new Set());
  };

  const handleCollapseSubLevels = () => {
    const set = new Set();
    docSections.forEach(s => {
      if (s.level >= 4 && hasChildren(s, docSections)) set.add(s.id);
    });
    setCollapsedIds(set);
  };

  // Filter sections
  const filtered = docSections.filter(s => {
    if (selectedPicFilter !== 'ALL') {
      const hasPic = (s.assignedUserIds || []).includes(selectedPicFilter);
      if (!hasPic) return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const codeMatch = s.code && s.code.toLowerCase().includes(q);
      const titleMatch = s.title && s.title.toLowerCase().includes(q);
      if (!codeMatch && !titleMatch) return false;
    } else {
      // Sembunyikan anak jika parent sedang dilipat
      if (isSectionHiddenByParent(s, docSections)) return false;
    }
    return true;
  });

  const activeDocObj = documents.find(d => d.id === selectedDocId) || currentDoc || {};
  const activeChapter = activeDocObj.chapter || 'BAB II';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Matriks Hak Akses & Penugasan Naskah
              </h3>
              <p className="text-xs text-slate-500">
                Pengaturan penugasan Kontributor per sub-bab dan Reviewer per bab.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            {notification && (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-lg animate-in fade-in">
                {notification}
              </span>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher: Sub-Babs vs Reviewer Level Bab */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('SUB_BABS')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'SUB_BABS'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Kontributor Sub-Bab</span>
            </button>

            <button
              onClick={() => setActiveTab('REVIEWER_CHAPTERS')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'REVIEWER_CHAPTERS'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Reviewer Bab</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'REVIEWER_CHAPTERS' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {reviewers.length}
              </span>
            </button>
          </div>
        </div>

        {/* TAB 1: KONTRIBUTOR SUB-BAB (PIC BIDANG & OPD) */}
        {activeTab === 'SUB_BABS' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Filter & Document Chooser Bar */}
            <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Dokumen:</span>
                <select
                  value={selectedDocId || ''}
                  onChange={(e) => handleDocChange(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg text-indigo-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-xs"
                >
                  {documents.map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>

                {/* Filter PIC Bidang */}
                <select
                  value={selectedPicFilter}
                  onChange={(e) => setSelectedPicFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 cursor-pointer"
                >
                  <option value="ALL">Semua PIC Bidang</option>
                  {contributors.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {/* Tree Collapse/Expand Buttons */}
                <div className="flex items-center space-x-1.5 ml-1">
                  <button
                    type="button"
                    onClick={handleExpandAll}
                    className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer transition shadow-2xs flex items-center space-x-1"
                    title="Buka seluruh sub-level naskah (seperti Gambar 1 Word)"
                  >
                    <span>Buka Semua</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCollapseSubLevels}
                    className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer transition shadow-2xs flex items-center space-x-1"
                    title="Ringkas level rincian (Level 4 & 5)"
                  >
                    <span>Ringkas Level</span>
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari sub-bab..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

            </div>

            {/* Matrix Table */}
            <div className="flex-1 overflow-auto p-4">
              {loadingDoc ? (
                <div className="p-12 text-center text-slate-500 text-xs font-medium">
                  Memuat struktur sub-bab naskah...
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 sticky top-0 z-10 border-b border-slate-200 shadow-2xs">
                      <th className="p-2.5 font-bold text-slate-700 min-w-[280px]">
                        Struktur Sub-Bab / Bagian Naskah
                      </th>
                      <th className="p-2.5 font-bold text-slate-700 text-center w-16">
                        Kunci
                      </th>
                      {contributors.map(u => (
                        <th key={u.id} className="p-2.5 font-bold text-slate-700 text-center min-w-[110px] max-w-[140px]">
                          <div className="truncate text-xs font-bold text-slate-900" title={u.name}>
                            {u.name}
                          </div>
                          <div className="text-[10px] font-normal text-slate-500 truncate" title={u.opd}>
                            {u.opd}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map(sec => {
                      const isBabHeader = sec.level === 1;
                      const assignedIds = sec.assignedUserIds || [];
                      const hasChild = hasChildren(sec, docSections);
                      const isCollapsed = collapsedIds.has(sec.id);

                      return (
                        <tr
                          key={sec.id}
                          className={`hover:bg-indigo-50/40 transition ${
                            isBabHeader ? 'bg-slate-50/80 font-bold' : ''
                          }`}
                        >
                          {/* Section Title with Word Navigation Tree Styling */}
                          <td className="p-2.5">
                            <div
                              className="flex items-center space-x-2"
                              style={{ paddingLeft: `${Math.max(0, (sec.level - 1) * 20)}px` }}
                            >
                              {/* Collapsible toggle arrow like Word Gambar 1 */}
                              {hasChild ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleCollapse(sec.id)}
                                  className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition shrink-0 cursor-pointer"
                                  title={isCollapsed ? 'Buka Sub-Bagian' : 'Tutup Sub-Bagian'}
                                >
                                  {isCollapsed ? (
                                    <span className="text-[10px] font-bold text-slate-400">▶</span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-indigo-700">◢</span>
                                  )}
                                </button>
                              ) : (
                                <span className="w-4 shrink-0 text-center text-slate-300 text-[10px]">&bull;</span>
                              )}

                              {/* Code Badge */}
                              {sec.code && (
                                <span
                                  className={`font-mono font-bold shrink-0 ${
                                    sec.level === 1
                                      ? 'text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200'
                                      : sec.level === 2
                                      ? 'text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200'
                                      : sec.level === 3
                                      ? 'text-[11px] px-1 py-0.2 rounded bg-indigo-50 text-indigo-800 border border-indigo-200'
                                      : sec.level === 4
                                      ? 'text-[10px] px-1 rounded bg-slate-100 text-slate-800 border border-slate-200'
                                      : 'text-[10px] text-slate-600 font-semibold'
                                  }`}
                                >
                                  {sec.code}
                                </span>
                              )}

                              {/* Section Title */}
                              <span
                                className={`line-clamp-1 ${
                                  sec.level === 1
                                    ? 'font-black text-slate-900 text-xs'
                                    : sec.level === 2
                                    ? 'font-bold text-slate-900 text-xs'
                                    : sec.level === 3
                                    ? 'font-semibold text-slate-800 text-xs'
                                    : sec.level === 4
                                    ? 'font-medium text-slate-800 text-xs'
                                    : 'font-normal text-slate-700 text-xs'
                                }`}
                                title={`${sec.code} ${sec.title}`}
                              >
                                {sec.title}
                              </span>
                            </div>
                          </td>

                          {/* Lock Status */}
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => handleToggleLock(sec.id)}
                              className={`p-1 rounded-md border transition cursor-pointer ${
                                sec.isLocked
                                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                                  : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                              }`}
                              title={sec.isLocked ? 'Terkunci' : 'Terbuka'}
                            >
                              {sec.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                          </td>

                          {/* Checkbox columns for each Contributor / PIC */}
                          {contributors.map(u => {
                            const isAssigned = assignedIds.includes(u.id);
                            return (
                              <td key={u.id} className="p-2.5 text-center">
                                <label className="inline-flex items-center justify-center p-1 rounded hover:bg-slate-100 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isAssigned}
                                    onChange={() => handleToggleUserAccess(sec.id, u.id)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                </label>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: PENUGASAN REVIEWER PER BAB (LEVEL BAB) */}
        {activeTab === 'REVIEWER_CHAPTERS' && (
          <div className="flex-1 overflow-auto p-6 space-y-5">
            <div className="bg-cyan-50/80 border border-cyan-200 rounded-xl p-4 flex items-start space-x-3">
              <Eye className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-cyan-950 uppercase tracking-wider">
                  Matriks Penugasan Reviewer (Level Bab)
                </h4>
                <p className="text-xs text-cyan-800 mt-0.5 leading-relaxed">
                  Reviewer bertugas memantau di <strong>level Bab</strong> (bisa 1 Bab atau lebih). Reviewer yang ditugaskan memiliki wewenang untuk memberi catatan telaah mutu dan melakukan <strong>Approval (Disetujui/Final)</strong> pada Bab tersebut.
                </p>
              </div>
            </div>

            {/* Matrix of Chapters vs Reviewers */}
            <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="p-3 font-bold text-slate-800 min-w-[280px]">
                      Dokumen BAB (1 s.d 7)
                    </th>
                    {reviewers.map(r => (
                      <th key={r.id} className="p-3 font-bold text-center min-w-[160px]">
                        <div className="text-slate-900 font-bold">{r.name}</div>
                        <div className="text-[10px] text-cyan-700 font-semibold">{r.opd}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {CHAPTER_OPTIONS.map(ch => {
                    return (
                      <tr key={ch.code} className="hover:bg-cyan-50/30 transition">
                        <td className="p-3">
                          <div className="font-bold text-xs text-slate-900">
                            {ch.title}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {ch.desc}
                          </div>
                        </td>

                        {reviewers.map(r => {
                          const isAssigned = (r.reviewedChapters || []).includes(ch.code);
                          return (
                            <td key={r.id} className="p-3 text-center">
                              <label className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition cursor-pointer hover:bg-slate-50">
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  onChange={() => handleToggleReviewerChapter(r.id, ch.code)}
                                  className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                                />
                                <span className={`text-[11px] font-bold ${
                                  isAssigned ? 'text-cyan-900' : 'text-slate-400'
                                }`}>
                                  {isAssigned ? 'Memantau' : 'Tidak'}
                                </span>
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <span>Kontributor aktif: <strong>{contributors.length} PIC/OPD</strong></span>
            <span>•</span>
            <span>Reviewer aktif: <strong>{reviewers.length} Ahli</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-lg transition cursor-pointer shadow-xs"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
}
