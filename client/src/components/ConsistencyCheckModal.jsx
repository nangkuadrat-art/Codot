import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  FileText,
  Layers,
  Coins,
  BookOpen,
  BookMarked,
  Hash,
  ArrowRight,
  Printer,
  ChevronRight,
  Info,
  X,
  Sparkles,
  Sliders,
  Search,
  Table,
  AlignLeft,
  FileSpreadsheet,
  SplitSquareVertical,
  ArrowLeftRight,
  Focus
} from 'lucide-react';
import { api } from '../api';
import SideBySideCompareModal from './SideBySideCompareModal';

export default function ConsistencyCheckModal({
  isOpen,
  onClose,
  activeStageId,
  stages = [],
  onNavigateToSection
}) {
  const [loading, setLoading] = useState(false);
  const [basicReport, setBasicReport] = useState(null);
  const [comprehensiveReport, setComprehensiveReport] = useState(null);
  const [sideBySideItem, setSideBySideItem] = useState(null);
  
  // Tabs: 't2n' (Tabel vs Narasi), 't2t' (Antar Tabel), 'n2n' (Antar Narasi), 'acronyms' (Kalimat Panjang vs Akronim), 'indicators' (Target Makro), 'finance', 'terminology', 'numbering'
  const [activeTab, setActiveTab] = useState('acronyms');
  const [similarityThreshold, setSimilarityThreshold] = useState(0.80); // 0.70, 0.80, 0.90, 1.00
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'DISCREPANCY' | 'CONSISTENT'
  const [acronymCategoryFilter, setAcronymCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('ALL');

  useEffect(() => {
    if (isOpen) {
      loadAllReports();
    }
  }, [isOpen, activeStageId, similarityThreshold]);

  const loadAllReports = async () => {
    setLoading(true);
    try {
      const [resBasic, resComp] = await Promise.all([
        api.checkConsistency(activeStageId),
        api.getComprehensiveConsistency(activeStageId, similarityThreshold)
      ]);
      if (resBasic.success) setBasicReport(resBasic.data);
      if (resComp.success) setComprehensiveReport(resComp.data);
    } catch (err) {
      console.error('Failed to load consistency reports:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentStage = stages.find(s => s.id === activeStageId) || { shortTitle: 'Tahapan Aktif' };

  // Filter comparisons helper
  const filterComparisons = (items = []) => {
    return items.filter(item => {
      if (statusFilter === 'DISCREPANCY' && item.isEquivalent) return false;
      if (statusFilter === 'CONSISTENT' && !item.isEquivalent) return false;

      if (selectedChapterFilter !== 'ALL') {
        const hasChapter = item.sourceA.chapter === selectedChapterFilter || item.sourceB.chapter === selectedChapterFilter;
        if (!hasChapter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLabel = (item.clusterLabel || '').toLowerCase().includes(q);
        const matchA = (item.sourceA.label || '').toLowerCase().includes(q) || (item.sourceA.secTitle || '').toLowerCase().includes(q);
        const matchB = (item.sourceB.label || '').toLowerCase().includes(q) || (item.sourceB.secTitle || '').toLowerCase().includes(q);
        if (!matchLabel && !matchA && !matchB) return false;
      }

      return true;
    });
  };

  const t2tItems = filterComparisons(comprehensiveReport?.comparisons?.tableToTable || []);
  const t2nItems = filterComparisons(comprehensiveReport?.comparisons?.tableToNarrative || []);
  const n2nItems = filterComparisons(comprehensiveReport?.comparisons?.narrativeToNarrative || []);

  // Filter acronym items
  const filteredAcronyms = (comprehensiveReport?.acronymComparisons || []).filter(item => {
    if (acronymCategoryFilter !== 'ALL' && item.category !== acronymCategoryFilter) return false;
    if (statusFilter === 'DISCREPANCY' && item.status !== 'DISCREPANCY') return false;
    if (statusFilter === 'CONSISTENT' && item.status === 'DISCREPANCY') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAcr = item.acronym.toLowerCase().includes(q);
      const matchLong = item.longForm.toLowerCase().includes(q);
      if (!matchAcr && !matchLong) return false;
    }
    return true;
  });

  const totalDiscrepancies = comprehensiveReport?.metrics?.totalDiscrepancies || 0;
  const consistencyRate = comprehensiveReport?.metrics?.consistencyRate || 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        
        {/* Top Header */}
        <div className="px-5 py-3 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-blue-900/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-tight">
                  Audit Konsistensi Naskah RKPD
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {currentStage.shortTitle}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/25 text-purple-200 border border-purple-400/30">
                  Akronim
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  Fuzzy &ge; {Math.round(similarityThreshold * 100)}%
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Komparasi lintas bab: Kalimat vs Akronim, Antar Tabel, Tabel vs Narasi, Target & Realisasi.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadAllReports}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-md border border-white/20 transition cursor-pointer disabled:opacity-50"
              title="Pindai Ulang Dokumen Sekarang"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Pindai Ulang</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-md border border-white/20 transition cursor-pointer"
              title="Cetak Laporan Audit"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global KPI Summary Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0">
          {/* Consistency Rate */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex items-center space-x-3">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm text-white shrink-0 ${
                consistencyRate >= 75 ? 'bg-emerald-600' : consistencyRate >= 50 ? 'bg-amber-500' : 'bg-rose-600'
              }`}
            >
              {consistencyRate}%
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Keselarasan Data</div>
              <div className="text-xs font-bold text-slate-800">
                {consistencyRate >= 75 ? 'Tinggi' : consistencyRate >= 50 ? 'Perlu Sinkronisasi' : 'Banyak Selisih'}
              </div>
            </div>
          </div>

          {/* Acronyms & Long Form Metric */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Kalimat vs Akronim</span>
              <BookMarked className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-base font-black text-purple-900">
                {comprehensiveReport?.acronymComparisons?.length || 0}
              </span>
              <span className="text-xs text-slate-500">Pasangan Singkatan</span>
            </div>
            <div className="text-[10px] text-purple-700 font-medium mt-0.5 truncate">
              {filteredAcronyms.filter(x => x.status === 'DISCREPANCY').length > 0 ? (
                <span className="text-rose-600 font-bold">{filteredAcronyms.filter(x => x.status === 'DISCREPANCY').length} ada beda angka</span>
              ) : (
                'Tercocokkan ke nama panjang'
              )}
            </div>
          </div>

          {/* Table vs Narrative Discrepancies */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Tabel vs Narasi</span>
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-base font-black text-rose-600">
                {comprehensiveReport?.metrics?.breakdown?.tableToNarrativeDiscrepancies || 0}
              </span>
              <span className="text-xs text-slate-500">
                / {comprehensiveReport?.metrics?.breakdown?.tableToNarrativeChecks || 0} Beda
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">Angka teks vs tabel rujukan</div>
          </div>

          {/* Table vs Table Discrepancies */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Antar Tabel</span>
              <Table className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-base font-black text-amber-600">
                {comprehensiveReport?.metrics?.breakdown?.tableToTableDiscrepancies || 0}
              </span>
              <span className="text-xs text-slate-500">
                / {comprehensiveReport?.metrics?.breakdown?.tableToTableChecks || 0} Selisih
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">Perbandingan tabel lintas Bab</div>
          </div>

          {/* Total Points Scanned */}
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Total Titik Data</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-base font-black text-slate-900">
                {comprehensiveReport?.metrics?.totalDataPointsExtracted || 0}
              </span>
              <span className="text-xs text-slate-500">Angka dipindai</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5 truncate">
              {comprehensiveReport?.metrics?.totalSectionsScanned || 0} Sub-Bab dipindai
            </div>
          </div>
        </div>

        {/* Global Controls & Fuzzy Slider Bar */}
        <div className="px-6 py-2.5 bg-blue-50/70 border-b border-blue-200/70 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-blue-700 shrink-0" />
            <span className="font-bold text-blue-950">Ambang Batas Kemiripan Nama Indikator (Fuzzy Threshold):</span>
            <div className="inline-flex rounded-lg border border-blue-300 bg-white p-0.5">
              {[
                { label: '70% (Toleran)', val: 0.70 },
                { label: '80% (Standar Rekomendasi)', val: 0.80 },
                { label: '90% (Ketat)', val: 0.90 },
                { label: '100% (Identik)', val: 1.00 }
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setSimilarityThreshold(opt.val)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition ${
                    similarityThreshold === opt.val
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari akronim / kalimat panjang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-2.5 py-1 text-xs rounded-md border border-slate-300 bg-white w-44 sm:w-56 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-300 bg-white"
            >
              <option value="ALL">Semua Status</option>
              <option value="DISCREPANCY">Hanya Inkonsistensi / Beda</option>
              <option value="CONSISTENT">Hanya Yang Selaras</option>
            </select>

            {/* Chapter Filter */}
            <select
              value={selectedChapterFilter}
              onChange={(e) => setSelectedChapterFilter(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-300 bg-white"
            >
              <option value="ALL">Semua Bab</option>
              <option value="BAB I">BAB I</option>
              <option value="BAB II">BAB II</option>
              <option value="BAB III">BAB III</option>
              <option value="BAB IV">BAB IV</option>
              <option value="BAB V">BAB V</option>
              <option value="BAB VI">BAB VI</option>
              <option value="BAB VII">BAB VII</option>
            </select>
          </div>
        </div>

        {/* 8 Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-white flex space-x-1 overflow-x-auto shrink-0">
          {/* TAB 1: Kalimat Panjang vs Akronim */}
          <button
            onClick={() => setActiveTab('acronyms')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap cursor-pointer transition ${
              activeTab === 'acronyms'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5 text-purple-600" />
            <span>1. Kalimat Panjang vs Akronim ({filteredAcronyms.length})</span>
            {filteredAcronyms.some(x => x.status === 'DISCREPANCY') && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>

          {/* TAB 2: Tabel vs Narasi */}
          <button
            onClick={() => setActiveTab('t2n')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap cursor-pointer transition ${
              activeTab === 't2n'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>2. Tabel vs Narasi ({t2nItems.length})</span>
            {t2nItems.some(x => !x.isEquivalent) && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>

          {/* TAB 3: Antar Tabel */}
          <button
            onClick={() => setActiveTab('t2t')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap cursor-pointer transition ${
              activeTab === 't2t'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-indigo-600" />
            <span>3. Antar Tabel ({t2tItems.length})</span>
          </button>

          {/* TAB 4: Antar Narasi */}
          <button
            onClick={() => setActiveTab('n2n')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap cursor-pointer transition ${
              activeTab === 'n2n'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5 text-emerald-600" />
            <span>4. Antar Narasi ({n2nItems.length})</span>
          </button>

          {/* TAB 5: Target Makro */}
          <button
            onClick={() => setActiveTab('indicators')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap cursor-pointer transition ${
              activeTab === 'indicators'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>5. Target Makro 2027 ({basicReport?.macroIndicators?.length || 0})</span>
          </button>

          {/* TAB 6: Keuangan */}
          <button
            onClick={() => setActiveTab('finance')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap cursor-pointer transition ${
              activeTab === 'finance'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <span>6. Keuangan (Bab III vs V)</span>
          </button>

          {/* TAB 7: Glosarium / SKPD */}
          <button
            onClick={() => setActiveTab('terminology')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap cursor-pointer transition ${
              activeTab === 'terminology'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>7. Glosarium / SKPD</span>
          </button>

          {/* TAB 8: Penomoran Tabel & Gambar */}
          <button
            onClick={() => setActiveTab('numbering')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 whitespace-nowrap cursor-pointer transition ${
              activeTab === 'numbering'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Hash className="w-3.5 h-3.5 text-slate-600" />
            <span>8. Urutan Tabel & Gambar ({basicReport?.numbering?.issues?.length || 0})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/60">
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-9 h-9 animate-spin text-blue-600 mx-auto mb-3" />
              <div className="text-sm font-bold text-slate-800">Sedang Memindai Kalimat Panjang vs Akronim & Semua Unsur...</div>
              <div className="text-xs text-slate-500 mt-1">Mencocokkan 350+ pasangan akronim dan data yang melekat di seluruh Bab RKPD</div>
            </div>
          ) : (
            <>
              {/* TAB: KALIMAT PANJANG VS AKRONIM */}
              {activeTab === 'acronyms' && (
                <div className="space-y-4">
                  {/* Category Pills & Info Header */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                        <BookMarked className="w-4 h-4 text-purple-600" />
                        <span>Komparasi Kalimat Panjang (Nama Lengkap) dengan Akronim / Singkatannya</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Memverifikasi konsistensi penyampaian data/angka antara penulisan kalimat panjang (misal: "Indeks Pembangunan Manusia") dengan akronimnya ("IPM"), serta kepatuhan tata naskah dinas
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-1">
                      <span className="text-[11px] font-bold text-slate-500">Kategori:</span>
                      <select
                        value={acronymCategoryFilter}
                        onChange={(e) => setAcronymCategoryFilter(e.target.value)}
                        className="text-xs font-semibold px-2 py-1 rounded border border-slate-300 bg-white"
                      >
                        <option value="ALL">Semua Kategori ({comprehensiveReport?.acronymComparisons?.length || 0})</option>
                        <option value="Indikator Makro">Indikator Makro</option>
                        <option value="Keuangan Daerah">Keuangan Daerah</option>
                        <option value="Kinerja Daerah">Kinerja Daerah</option>
                        <option value="Pelayanan Dasar">Pelayanan Dasar</option>
                        <option value="Perencanaan">Perencanaan</option>
                        <option value="Perangkat Daerah">Perangkat Daerah</option>
                        <option value="Ekstraksi Naskah">Ekstraksi Naskah</option>
                      </select>
                    </div>
                  </div>

                  {/* List of Acronym vs Long-Form Cards */}
                  <div className="space-y-3.5">
                    {filteredAcronyms.length === 0 ? (
                      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
                        Tidak ada pasangan akronim yang sesuai dengan kriteria filter.
                      </div>
                    ) : (
                      filteredAcronyms.map((pair, idx) => {
                        const hasDiscrepancy = pair.status === 'DISCREPANCY';
                        const hasDataChecks = pair.dataComparisons && pair.dataComparisons.length > 0;

                        return (
                          <div
                            key={idx}
                            className={`rounded-xl border p-4 shadow-2xs transition hover:shadow-md ${
                              hasDiscrepancy
                                ? 'bg-rose-50/25 border-rose-300'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            {/* Card Header: Acronym <=> Long Form */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className="px-2.5 py-1 rounded-md font-mono font-black text-xs bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
                                  {pair.acronym}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <h4 className="text-sm font-bold text-slate-900">{pair.longForm}</h4>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  {pair.category}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2 shrink-0">
                                <span
                                  className={`inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                                    hasDiscrepancy
                                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                                      : hasDataChecks
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : 'bg-blue-100 text-blue-800 border-blue-200'
                                  }`}
                                >
                                  {hasDiscrepancy ? (
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  )}
                                  <span>{pair.statusLabel}</span>
                                </span>
                              </div>
                            </div>

                            {/* Usage Frequency & Chapters Matrix */}
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              {/* Box Penulisan Akronim */}
                              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">
                                    Penulisan Singkatan ({pair.acronym})
                                  </span>
                                  <span className="font-black text-purple-800 text-xs bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                    {pair.acrCount}x Kemunculan
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1">
                                  Sebaran Bab: <span className="font-semibold text-slate-800">{pair.acrChapters.join(', ') || 'Belum digunakan'}</span>
                                </div>
                              </div>

                              {/* Box Penulisan Kalimat Panjang */}
                              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">
                                    Penulisan Kalimat Panjang
                                  </span>
                                  <span className="font-black text-blue-800 text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                    {pair.longCount}x Kemunculan
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1">
                                  Sebaran Bab: <span className="font-semibold text-slate-800">{pair.longChapters.join(', ') || 'Belum digunakan'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Tata Naskah: First Occurrence Check */}
                            {pair.firstMention && (
                              <div className="mt-2.5 p-2 rounded-lg bg-slate-50/80 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center space-x-2">
                                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span className="text-[11px] text-slate-700">
                                    Kemunculan Pertama: <strong className="text-slate-900">[{pair.firstMention.chapter}] {pair.firstMention.secTitle}</strong>
                                  </span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  pair.firstMention.hasFormalDefinition
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}>
                                  {pair.firstMention.hasFormalDefinition
                                    ? 'Format Baku Terpenuhi: Nama Lengkap (AKRONIM)'
                                    : 'Perlu Dicantumkan Format Baku Nama Lengkap (AKRONIM)'}
                                </span>
                              </div>
                            )}

                            {/* Data & Numeric Cross-Check between Long-form vs Acronym */}
                            {pair.dataComparisons && pair.dataComparisons.length > 0 && (
                              <div className="mt-3 space-y-2">
                                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                                  <span>Komparasi Nilai Angka (Singkatan vs Nama Lengkap):</span>
                                  <span className="text-[10px] font-normal text-slate-500">({pair.dataComparisons.length} Titik Perbandingan)</span>
                                </div>

                                <div className="space-y-1.5">
                                  {pair.dataComparisons.map((dc, dIdx) => (
                                    <div
                                      key={dIdx}
                                      className={`p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                        dc.isEquivalent
                                          ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                                          : 'bg-rose-50/60 border-rose-300 text-rose-950'
                                      }`}
                                    >
                                      <div className="space-y-0.5">
                                        <div className="flex items-center space-x-2 font-bold">
                                          <span>{dc.periodType} {dc.year}:</span>
                                          <span className="font-mono bg-white px-1.5 py-0.2 rounded border">
                                            {pair.acronym} = {dc.acronymSource.val} {dc.acronymSource.unit}
                                          </span>
                                          <span>vs</span>
                                          <span className="font-mono bg-white px-1.5 py-0.2 rounded border">
                                            {pair.longForm} = {dc.longFormSource.val} {dc.longFormSource.unit}
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-slate-600">
                                          {dc.note}
                                        </div>
                                      </div>

                                      <div className="flex items-center space-x-2 shrink-0">
                                        <button
                                          onClick={() => {
                                            setSideBySideItem({
                                              clusterLabel: `${pair.acronym} vs ${pair.longForm}`,
                                              periodType: dc.periodType,
                                              year: dc.year,
                                              similarityPercent: 100,
                                              isEquivalent: dc.isEquivalent,
                                              isAcronymMatched: true,
                                              statusLabel: dc.isEquivalent ? 'Selaras' : 'Inkonsistensi Nilai',
                                              discrepancyNote: dc.note,
                                              sourceA: {
                                                type: 'NARASI',
                                                chapter: dc.acronymSource.chapter,
                                                docId: dc.acronymSource.docId,
                                                secId: dc.acronymSource.secId,
                                                secTitle: dc.acronymSource.secTitle,
                                                tableCaption: `Akronim (${pair.acronym})`,
                                                label: pair.acronym,
                                                value: dc.acronymSource.val,
                                                unit: dc.acronymSource.unit,
                                                snippet: `Penulisan akronim ${pair.acronym}: ${dc.acronymSource.val}`
                                              },
                                              sourceB: {
                                                type: 'NARASI',
                                                chapter: dc.longFormSource.chapter,
                                                docId: dc.longFormSource.docId,
                                                secId: dc.longFormSource.secId,
                                                secTitle: dc.longFormSource.secTitle,
                                                tableCaption: `Kalimat Panjang (${pair.longForm})`,
                                                label: pair.longForm,
                                                value: dc.longFormSource.val,
                                                unit: dc.longFormSource.unit,
                                                snippet: `Penulisan kalimat panjang ${pair.longForm}: ${dc.longFormSource.val}`
                                              }
                                            });
                                          }}
                                          className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                                        >
                                          <SplitSquareVertical className="w-2.5 h-2.5" />
                                          <span>Sandingkan</span>
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button
                                          onClick={() => onNavigateToSection && onNavigateToSection(dc.acronymSource.docId, dc.acronymSource.secId)}
                                          className="text-purple-700 hover:text-purple-900 font-bold text-[10px] flex items-center space-x-0.5 cursor-pointer"
                                        >
                                          <span>Buka {pair.acronym}</span>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button
                                          onClick={() => onNavigateToSection && onNavigateToSection(dc.longFormSource.docId, dc.longFormSource.secId)}
                                          className="text-blue-700 hover:text-blue-900 font-bold text-[10px] flex items-center space-x-0.5 cursor-pointer"
                                        >
                                          <span>Buka Nama Panjang</span>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Sample Snippets */}
                            {pair.snippets && pair.snippets.length > 0 && (
                              <div className="mt-2.5 space-y-1">
                                {pair.snippets.map((snip, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="p-2 rounded bg-white border border-slate-200 text-xs flex items-center justify-between gap-2"
                                  >
                                    <div className="truncate">
                                      <span className="font-bold text-slate-800 mr-2">[{snip.chapter}] {snip.secTitle}:</span>
                                      <span className="text-slate-600 font-mono text-[11px]">"...{snip.text}..."</span>
                                    </div>
                                    <button
                                      onClick={() => onNavigateToSection && onNavigateToSection(snip.docId, snip.secId)}
                                      className="text-blue-600 hover:text-blue-800 font-bold text-[10px] shrink-0 flex items-center space-x-0.5 cursor-pointer"
                                    >
                                      <span>Buka</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: TABEL VS NARASI */}
              {activeTab === 't2n' && (
                <div className="space-y-4">
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                        <span>Pemeriksaan Keselarasan: Teks Narasi vs Tabel Rujukan</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Memverifikasi apakah angka yang disebutkan dalam kalimat narasi sesuai dengan angka yang tertulis pada tabel resmi
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {t2nItems.length} Pasangan Ditemukan
                    </span>
                  </div>

                  <div className="space-y-3">
                    {t2nItems.length === 0 ? (
                      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
                        Tidak ditemukan catatan selisih tabel vs narasi untuk filter ini.
                      </div>
                    ) : (
                      t2nItems.map((item, idx) => (
                        <ComparisonCard
                          key={idx}
                          item={item}
                          onNavigateToSection={onNavigateToSection}
                          onOpenSideBySide={setSideBySideItem}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: ANTAR TABEL */}
              {activeTab === 't2t' && (
                <div className="space-y-4">
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                        <Table className="w-4 h-4 text-indigo-600" />
                        <span>Pemeriksaan Antar Tabel (Table-to-Table Cross-Check)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Membandingkan indikator yang tercantum pada tabel-tabel di Bab II, Bab III, Bab IV, Bab V, dan Bab VI
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {t2tItems.length} Pasangan Tabel
                    </span>
                  </div>

                  <div className="space-y-3">
                    {t2tItems.length === 0 ? (
                      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
                        Tidak ada perbandingan antar tabel yang cocok dengan filter.
                      </div>
                    ) : (
                      t2tItems.map((item, idx) => (
                        <ComparisonCard
                          key={idx}
                          item={item}
                          onNavigateToSection={onNavigateToSection}
                          onOpenSideBySide={setSideBySideItem}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: ANTAR NARASI */}
              {activeTab === 'n2n' && (
                <div className="space-y-4">
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                        <AlignLeft className="w-4 h-4 text-emerald-600" />
                        <span>Pemeriksaan Antar Pernyataan Narasi (Narrative-to-Narrative)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Memeriksa apakah ada dua paragraf di sub-bab berbeda yang menyebutkan angka berbeda untuk indikator dan tahun yang sama
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {n2nItems.length} Perbandingan Narasi
                    </span>
                  </div>

                  <div className="space-y-3">
                    {n2nItems.length === 0 ? (
                      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
                        Tidak ditemukan pertentangan antar narasi teks.
                      </div>
                    ) : (
                      n2nItems.map((item, idx) => (
                        <ComparisonCard
                          key={idx}
                          item={item}
                          onNavigateToSection={onNavigateToSection}
                          onOpenSideBySide={setSideBySideItem}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: TARGET MAKRO */}
              {activeTab === 'indicators' && basicReport && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {(basicReport.macroIndicators || []).map((ind) => {
                      const isConsistent = ind.status === 'CONSISTENT';
                      const isConflict = ind.status === 'CONFLICT';

                      return (
                        <div
                          key={ind.indicatorId}
                          className={`bg-white rounded-xl border p-4 shadow-xs transition hover:shadow-md ${
                            isConflict
                              ? 'border-rose-300 bg-rose-50/20'
                              : isConsistent
                              ? 'border-emerald-200'
                              : 'border-amber-200'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-sm font-bold text-slate-900">{ind.indicatorName}</h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  Satuan: {ind.satuan}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                Target Ideal RKPD 2027: <span className="font-bold text-slate-800">{ind.expectedTarget2027}</span> | Realisasi Awal 2025: <span className="font-medium text-slate-600">{ind.realisasi2025}</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              <span
                                className={`inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                                  isConflict
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : isConsistent
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-amber-100 text-amber-800 border-amber-300'
                                }`}
                              >
                                {isConflict ? (
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                ) : isConsistent ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                )}
                                <span>{ind.statusLabel}</span>
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            {/* BAB II */}
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                BAB II (Realisasi)
                              </div>
                              <div className="font-bold text-slate-800 mt-1 text-sm truncate">
                                {ind.chapterSummary['BAB II']?.value || '-'}
                              </div>
                              {ind.chapterSummary['BAB II']?.primarySection && (
                                <button
                                  onClick={() =>
                                    onNavigateToSection &&
                                    onNavigateToSection(
                                      ind.chapterSummary['BAB II'].primarySection.documentId,
                                      ind.chapterSummary['BAB II'].primarySection.sectionId
                                    )
                                  }
                                  className="mt-1.5 flex items-center space-x-1 text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                                >
                                  <span>Buka Bagian</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>

                            {/* BAB III */}
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                BAB III (Ekonomi & Fiskal)
                              </div>
                              <div className="font-bold text-slate-800 mt-1 text-sm truncate">
                                {ind.chapterSummary['BAB III']?.value || '-'}
                              </div>
                              {ind.chapterSummary['BAB III']?.primarySection && (
                                <button
                                  onClick={() =>
                                    onNavigateToSection &&
                                    onNavigateToSection(
                                      ind.chapterSummary['BAB III'].primarySection.documentId,
                                      ind.chapterSummary['BAB III'].primarySection.sectionId
                                    )
                                  }
                                  className="mt-1.5 flex items-center space-x-1 text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                                >
                                  <span>Buka Bagian</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>

                            {/* BAB IV */}
                            <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200">
                              <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                                BAB IV (Target Sasaran)
                              </div>
                              <div className="font-bold text-blue-900 mt-1 text-sm truncate">
                                {ind.chapterSummary['BAB IV']?.value || '-'}
                              </div>
                              {ind.chapterSummary['BAB IV']?.primarySection && (
                                <button
                                  onClick={() =>
                                    onNavigateToSection &&
                                    onNavigateToSection(
                                      ind.chapterSummary['BAB IV'].primarySection.documentId,
                                      ind.chapterSummary['BAB IV'].primarySection.sectionId
                                    )
                                  }
                                  className="mt-1.5 flex items-center space-x-1 text-[10px] text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
                                >
                                  <span>Buka Bagian</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>

                            {/* BAB VI */}
                            <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
                              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                BAB VI (Target IKU/IKD)
                              </div>
                              <div className="font-bold text-emerald-900 mt-1 text-sm truncate">
                                {ind.chapterSummary['BAB VI']?.value || '-'}
                              </div>
                              {ind.chapterSummary['BAB VI']?.primarySection && (
                                <button
                                  onClick={() =>
                                    onNavigateToSection &&
                                    onNavigateToSection(
                                      ind.chapterSummary['BAB VI'].primarySection.documentId,
                                      ind.chapterSummary['BAB VI'].primarySection.sectionId
                                    )
                                  }
                                  className="mt-1.5 flex items-center space-x-1 text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                                >
                                  <span>Buka Bagian</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {ind.notes && ind.notes.length > 0 && (
                            <div className="mt-3 text-xs bg-slate-50/80 rounded-md p-2.5 border border-slate-200/80 text-slate-700 space-y-1">
                              {ind.notes.map((note, nIdx) => (
                                <div key={nIdx} className="flex items-start space-x-1.5">
                                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                  <span>{note}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 6: KEUANGAN */}
              {activeTab === 'finance' && basicReport && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
                      <Coins className="w-5 h-5 text-amber-600" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Uji Keselarasan Kapasitas Fiskal & Pagu Program</h3>
                        <p className="text-xs text-slate-500">
                          Memastikan total pagu belanja program pada BAB V tidak melampaui kerangka kapasitas riil belanja daerah pada BAB III
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-200">
                        <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                          BAB III: Proyeksi Pendapatan Daerah
                        </div>
                        <div className="text-2xl font-black text-blue-800 mt-2">
                          {basicReport.budgetFinancials?.proyeksiPendapatan}
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200">
                        <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                          BAB III: Kapasitas Riil Belanja Daerah
                        </div>
                        <div className="text-2xl font-black text-emerald-800 mt-2">
                          {basicReport.budgetFinancials?.proyeksiBelanja}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 font-bold text-slate-700">
                          <tr>
                            <th className="px-3.5 py-2.5 text-left">Komponen Kebijakan</th>
                            <th className="px-3.5 py-2.5 text-left">BAB III (Kerangka Keuangan)</th>
                            <th className="px-3.5 py-2.5 text-left">BAB V (Rencana Kerja & Pendanaan)</th>
                            <th className="px-3.5 py-2.5 text-center">Status Keselarasan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {(basicReport.budgetFinancials?.items || []).map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80">
                              <td className="px-3.5 py-3 font-semibold text-slate-900">{item.category}</td>
                              <td className="px-3.5 py-3 font-medium text-blue-900">{item.bab3Value}</td>
                              <td className="px-3.5 py-3 font-medium text-emerald-900">{item.bab5Value}</td>
                              <td className="px-3.5 py-3 text-center">
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Selaras</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: GLOSARIUM & NOMENKLATUR */}
              {activeTab === 'terminology' && basicReport && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Audit Glosarium & Standarisasi Istilah (Permendagri 86/2017)</h3>
                        <p className="text-xs text-slate-500">
                          Mendeteksi penggunaan istilah usang "SKPD" serta variasi nama OPD / Bappeda
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">
                      {(basicReport.terminology || []).map((rule) => (
                        <div
                          key={rule.ruleId}
                          className={`p-4 rounded-xl border transition ${
                            rule.status === 'DISCREPANCY'
                              ? 'bg-amber-50/50 border-amber-300'
                              : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{rule.label}</h4>
                              <p className="text-[11px] text-slate-600 mt-0.5">{rule.description}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              rule.status === 'DISCREPANCY' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {rule.totalCount} Ditemukan
                            </span>
                          </div>

                          {rule.sampleSnippets && rule.sampleSnippets.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              {rule.sampleSnippets.map((snip, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="p-2 rounded bg-white border border-slate-200 text-xs flex items-center justify-between gap-2"
                                >
                                  <div className="truncate">
                                    <span className="font-bold text-slate-800 mr-2">[{snip.chapter}] {snip.sectionTitle}:</span>
                                    <span className="text-slate-600 font-mono text-[11px]">"...{snip.snippet}..."</span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      onNavigateToSection &&
                                      onNavigateToSection(snip.docId, snip.sectionId)
                                    }
                                    className="text-blue-600 hover:text-blue-800 font-bold text-[10px] shrink-0 flex items-center space-x-0.5 cursor-pointer"
                                  >
                                    <span>Buka Naskah</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: URUTAN TABEL & GAMBAR */}
              {activeTab === 'numbering' && basicReport && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="pb-3 border-b border-slate-200">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                        <Hash className="w-4 h-4 text-purple-600" />
                        <span>Integritas Urutan Penomoran Tabel & Gambar</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Mendeteksi nomor tabel/gambar yang terlewat (melompat) atau nomor ganda di setiap Bab
                      </p>
                    </div>

                    <div className="mt-4 space-y-2.5">
                      {(basicReport.numbering?.issues || []).map((issue, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                                {issue.chapter}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                  issue.type === 'DUPLICATE'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {issue.type === 'DUPLICATE' ? 'Nomor Ganda' : 'Urutan Melompat'}
                              </span>
                              <span className="font-bold text-slate-800">{issue.itemType}</span>
                            </div>
                            <p className="text-slate-700 font-medium">{issue.description}</p>
                            <div className="text-[11px] text-slate-500">
                              Lokasi: <span className="font-semibold text-slate-700">{issue.sectionTitle}</span>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              onNavigateToSection &&
                              onNavigateToSection(issue.docId, issue.sectionId)
                            }
                            className="self-start sm:self-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 font-semibold text-xs flex items-center space-x-1 shrink-0 cursor-pointer"
                          >
                            <span>Buka Bagian Ini</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>Komparasi menyeluruh mencakup Kalimat Panjang vs Akronim, Antar Tabel, Tabel vs Narasi & Fuzzy Matching &ge; {Math.round(similarityThreshold * 100)}%</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Dual Inspector Modal */}
      {sideBySideItem && (
        <SideBySideCompareModal
          isOpen={!!sideBySideItem}
          onClose={() => setSideBySideItem(null)}
          item={sideBySideItem}
          onNavigateToSection={(docId, secId) => {
            setSideBySideItem(null);
            if (onNavigateToSection) onNavigateToSection(docId, secId);
          }}
        />
      )}
    </div>
  );
}

/**
 * Komponen Kartu Perbandingan (Comparison Card)
 */
function ComparisonCard({ item, onNavigateToSection, onOpenSideBySide }) {
  const isConflict = !item.isEquivalent;

  return (
    <div
      className={`rounded-xl border p-4 shadow-2xs transition hover:shadow-md ${
        isConflict
          ? 'bg-rose-50/20 border-rose-300'
          : 'bg-white border-slate-200'
      }`}
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <h4 className="text-xs font-bold text-slate-900">{item.clusterLabel}</h4>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {item.periodType} {item.year}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Kemiripan: {item.similarityPercent}%
          </span>
          {item.isAcronymMatched && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              Pencocokan Akronim &harr; Nama Panjang
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Side-by-side header button */}
          <button
            onClick={() => onOpenSideBySide && onOpenSideBySide(item)}
            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition shadow-2xs"
            title="Sandingkan 2 temuan berdampingan dengan sorotan"
          >
            <SplitSquareVertical className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sandingkan & Sorot</span>
          </button>

          <span
            className={`inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
              isConflict
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
          >
            {isConflict ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>{item.statusLabel}</span>
          </span>
        </div>
      </div>

      {/* Side-by-side Sources */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Sumber A */}
        <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                {item.sourceA.type === 'TABLE' ? 'TABEL' : 'NARASI TEKS'} - {item.sourceA.chapter}
              </span>
              <span className="text-xs font-black text-blue-900">
                {item.sourceA.value} {item.sourceA.unit}
              </span>
            </div>
            <div className="font-semibold text-slate-800 mt-1.5 text-[11px]">
              {item.sourceA.tableCaption}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Sub-Bab: <span className="text-slate-700 font-medium">{item.sourceA.secTitle}</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100 line-clamp-2">
              "{item.sourceA.snippet}"
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => onNavigateToSection && onNavigateToSection(item.sourceA.docId, item.sourceA.secId)}
              className="text-blue-600 hover:text-blue-800 font-bold text-[10px] flex items-center space-x-1 cursor-pointer"
            >
              <span>Buka Sumber A di Naskah</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={() => onOpenSideBySide && onOpenSideBySide(item)}
              className="text-indigo-600 hover:text-indigo-800 font-bold text-[10px] flex items-center space-x-1 cursor-pointer"
              title="Sandingkan langsung dengan Sumber B"
            >
              <SplitSquareVertical className="w-3 h-3" />
              <span>Sandingkan</span>
            </button>
          </div>
        </div>

        {/* Sumber B */}
        <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                {item.sourceB.type === 'TABLE' ? 'TABEL' : 'NARASI TEKS'} - {item.sourceB.chapter}
              </span>
              <span className="text-xs font-black text-blue-900">
                {item.sourceB.value} {item.sourceB.unit}
              </span>
            </div>
            <div className="font-semibold text-slate-800 mt-1.5 text-[11px]">
              {item.sourceB.tableCaption}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Sub-Bab: <span className="text-slate-700 font-medium">{item.sourceB.secTitle}</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100 line-clamp-2">
              "{item.sourceB.snippet}"
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => onNavigateToSection && onNavigateToSection(item.sourceB.docId, item.sourceB.secId)}
              className="text-blue-600 hover:text-blue-800 font-bold text-[10px] flex items-center space-x-1 cursor-pointer"
            >
              <span>Buka Sumber B di Naskah</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={() => onOpenSideBySide && onOpenSideBySide(item)}
              className="text-purple-600 hover:text-purple-800 font-bold text-[10px] flex items-center space-x-1 cursor-pointer"
              title="Sandingkan langsung dengan Sumber A"
            >
              <SplitSquareVertical className="w-3 h-3" />
              <span>Sandingkan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Discrepancy Note */}
      {isConflict && (
        <div className="mt-2.5 p-2 rounded-md bg-rose-100/70 text-rose-900 text-xs font-medium flex items-center space-x-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{item.discrepancyNote}</span>
        </div>
      )}

      {/* Tombol Utama: Sandingkan 2 Temuan Berdampingan dengan Sorotan */}
      <div className="mt-3 pt-2.5 border-t border-slate-200/80">
        <button
          onClick={() => onOpenSideBySide && onOpenSideBySide(item)}
          className="w-full py-2 px-4 rounded-lg font-bold text-xs bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-xs flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <SplitSquareVertical className="w-4 h-4 text-white" />
          <span>Sandingkan 2 Temuan Ini Berdampingan (Side-by-Side) dengan Sorotan</span>
        </button>
      </div>
    </div>
  );
}
