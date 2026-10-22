import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ExternalLink,
  SplitSquareVertical,
  ArrowLeftRight,
  Focus,
  Maximize2,
  Minimize2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Table,
  AlignLeft,
  FileText,
  Info,
  ChevronRight,
  Layers
} from 'lucide-react';
import { api } from '../api';

/**
 * Injeksi highlight pada teks HTML tanpa merusak tag HTML
 */
function injectHighlightHtml(html, targetVal, targetLabel, highlightId) {
  if (!html) return '';
  let res = html;
  let injected = false;

  // 1. Coba cocokkan targetVal terlebih dahulu jika ada
  if (targetVal) {
    // Normalisasi nilai untuk regex (contoh: '64.433' -> '64\\.433', atau '513,65' -> '513[,.]65')
    const cleanVal = String(targetVal)
      .trim()
      .replace(/\./g, '\\.')
      .replace(/,/g, '[,.]');

    if (cleanVal.length > 0) {
      // Regex mencocokkan nilai di luar tag <...>
      const regex = new RegExp('(?<!<[^>]*)(' + cleanVal + ')(?![^<]*>)', 'i');
      if (regex.test(res)) {
        res = res.replace(regex, (match) => {
          injected = true;
          return `<mark id="${highlightId}" class="sbs-highlight-mark bg-amber-300 text-amber-950 font-black px-2 py-0.5 rounded shadow-md ring-3 ring-amber-500 animate-pulse inline-block">${match}</mark>`;
        });
      }
    }
  }

  // 2. Jika nilai angka belum ditemukan, coba cocokkan kata kunci inti dari label
  if (!injected && targetLabel && targetLabel.length >= 3) {
    const escaped = targetLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('(?<!<[^>]*)(' + escaped + ')(?![^<]*>)', 'i');
    if (regex.test(res)) {
      res = res.replace(regex, (match) => {
        injected = true;
        return `<mark id="${highlightId}" class="sbs-highlight-mark bg-amber-300 text-amber-950 font-black px-2 py-0.5 rounded shadow-md ring-3 ring-amber-500 animate-pulse inline-block">${match}</mark>`;
      });
    }
  }

  // 3. Fallback: jika masih belum cocok, coba kata pertama dari label
  if (!injected && targetLabel) {
    const firstWord = targetLabel.split(/[\s\-_:,]+/)[0];
    if (firstWord && firstWord.length >= 4) {
      const escaped = firstWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp('(?<!<[^>]*)(' + escaped + ')(?![^<]*>)', 'i');
      if (regex.test(res)) {
        res = res.replace(regex, (match) => {
          return `<mark id="${highlightId}" class="sbs-highlight-mark bg-amber-300 text-amber-950 font-black px-2 py-0.5 rounded shadow-md ring-3 ring-amber-500 animate-pulse inline-block">${match}</mark>`;
        });
      }
    }
  }

  return res;
}

export default function SideBySideCompareModal({
  isOpen,
  onClose,
  item,
  onNavigateToSection
}) {
  const [loading, setLoading] = useState(true);
  const [sourceAData, setSourceAData] = useState(null);
  const [sourceBData, setSourceBData] = useState(null);
  const [syncScroll, setSyncScroll] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const containerARef = useRef(null);
  const containerBRef = useRef(null);
  const isSyncingScroll = useRef(false);

  useEffect(() => {
    if (!isOpen || !item) return;

    let isMounted = true;
    setLoading(true);

    const loadPair = async () => {
      try {
        const secIdA = item.sourceA?.secId;
        const secIdB = item.sourceB?.secId;

        if (!secIdA && !secIdB) {
          setLoading(false);
          return;
        }

        const res = await api.getComparisonPair(secIdA, secIdB);
        if (isMounted && res.success) {
          setSourceAData(res.data.sourceA);
          setSourceBData(res.data.sourceB);
        }
      } catch (err) {
        console.error('Failed to load comparison pair sections:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPair();

    return () => {
      isMounted = false;
    };
  }, [isOpen, item]);

  // Otomatis scroll ke elemen yang di-highlight saat data selesai dimuat
  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      scrollToHighlight('A');
      scrollToHighlight('B');
    }, 350);

    return () => clearTimeout(timer);
  }, [loading, sourceAData, sourceBData]);

  const scrollToHighlight = (target) => {
    const elementId = target === 'A' ? 'hl-side-a' : 'hl-side-b';
    const container = target === 'A' ? containerARef.current : containerBRef.current;
    if (!container) return;

    const el = container.querySelector(`#${elementId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Sync scroll logic
  const handleScrollA = () => {
    if (!syncScroll || isSyncingScroll.current) return;
    const conA = containerARef.current;
    const conB = containerBRef.current;
    if (!conA || !conB) return;

    isSyncingScroll.current = true;
    const scrollPercent = conA.scrollTop / (conA.scrollHeight - conA.clientHeight || 1);
    conB.scrollTop = scrollPercent * (conB.scrollHeight - conB.clientHeight || 1);
    setTimeout(() => {
      isSyncingScroll.current = false;
    }, 50);
  };

  const handleScrollB = () => {
    if (!syncScroll || isSyncingScroll.current) return;
    const conA = containerARef.current;
    const conB = containerBRef.current;
    if (!conA || !conB) return;

    isSyncingScroll.current = true;
    const scrollPercent = conB.scrollTop / (conB.scrollHeight - conB.clientHeight || 1);
    conA.scrollTop = scrollPercent * (conA.scrollHeight - conA.clientHeight || 1);
    setTimeout(() => {
      isSyncingScroll.current = false;
    }, 50);
  };

  if (!isOpen || !item) return null;

  const isConflict = !item.isEquivalent;

  // Dapatkan HTML dengan sorotan
  const rawHtmlA = sourceAData?.content || `<p class="italic text-slate-400 p-4">${item.sourceA?.snippet || 'Konten bagian tidak tersedia'}</p>`;
  const highlightedHtmlA = injectHighlightHtml(
    rawHtmlA,
    item.sourceA?.value,
    item.sourceA?.label,
    'hl-side-a'
  );

  const rawHtmlB = sourceBData?.content || `<p class="italic text-slate-400 p-4">${item.sourceB?.snippet || 'Konten bagian tidak tersedia'}</p>`;
  const highlightedHtmlB = injectHighlightHtml(
    rawHtmlB,
    item.sourceB?.value,
    item.sourceB?.label,
    'hl-side-b'
  );

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden transition-all duration-200 ${
          isFullScreen ? 'w-full h-full rounded-none' : 'w-full max-w-7xl h-[94vh]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="bg-white border-b border-slate-200 px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 shadow-2xs">
              <SplitSquareVertical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Sandingkan Temuan (Side-by-Side)
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {item.periodType} {item.year}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Kemiripan Frasa: {item.similarityPercent}%
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center space-x-1 ${
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
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                {item.clusterLabel}
              </h3>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Sync scroll toggle */}
            <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer hover:bg-slate-100 select-none">
              <input
                type="checkbox"
                checked={syncScroll}
                onChange={(e) => setSyncScroll(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
              />
              <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
              <span>Sinkronisasi Scroll</span>
            </label>

            {/* Quick jump to highlight buttons */}
            <button
              onClick={() => scrollToHighlight('A')}
              className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center space-x-1 cursor-pointer transition"
              title="Fokuskan ke bagian yang disorot pada Sumber A"
            >
              <Focus className="w-3.5 h-3.5" />
              <span>Sorotan A</span>
            </button>

            <button
              onClick={() => scrollToHighlight('B')}
              className="px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold flex items-center space-x-1 cursor-pointer transition"
              title="Fokuskan ke bagian yang disorot pada Sumber B"
            >
              <Focus className="w-3.5 h-3.5" />
              <span>Sorotan B</span>
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
              title={isFullScreen ? 'Perkecil' : 'Layar Penuh'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Discrepancy Note Banner */}
        <div
          className={`px-5 py-2.5 text-xs font-medium border-b shrink-0 flex items-center justify-between ${
            isConflict
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {isConflict ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{item.discrepancyNote}</span>
          </div>

          <div className="hidden md:flex items-center space-x-3 text-[11px] font-bold">
            <span className="text-blue-900 bg-blue-100/80 px-2 py-0.5 rounded">
              Sumber A: {item.sourceA?.value} {item.sourceA?.unit}
            </span>
            <span className="text-slate-400 font-normal">&harr;</span>
            <span className="text-purple-900 bg-purple-100/80 px-2 py-0.5 rounded">
              Sumber B: {item.sourceB?.value} {item.sourceB?.unit}
            </span>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <span className="text-xs font-medium">Memuat dan menyandingkan isi naskah kedua sumber...</span>
          </div>
        ) : (
          /* Main Side-by-Side Dual View */
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-300 overflow-hidden bg-slate-200/60 p-2 sm:p-3 gap-2 sm:gap-3">
            {/* Panel Kiri: Sumber A */}
            <div className="flex flex-col bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              {/* Header Sumber A */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-600 text-white shadow-2xs shrink-0">
                    SUMBER A &bull; {item.sourceA?.type === 'TABLE' ? 'TABEL' : 'NARASI'}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {item.sourceA?.chapter} - {item.sourceA?.secTitle}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {item.sourceA?.tableCaption}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      Nilai: {item.sourceA?.value} {item.sourceA?.unit}
                    </span>
                  </div>
                  {onNavigateToSection && item.sourceA?.docId && (
                    <button
                      onClick={() => onNavigateToSection(item.sourceA.docId, item.sourceA.secId)}
                      className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition shadow-2xs"
                      title="Buka dokumen ini langsung di editor utama"
                    >
                      <span>Buka di Editor</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Highlight Target Info Bar */}
              <div className="bg-blue-50/70 border-b border-blue-100 px-4 py-1.5 flex items-center justify-between text-[11px] text-blue-900 shrink-0">
                <span className="font-medium truncate">
                  📍 Bagian Disorot: <span className="font-bold">{item.sourceA?.label}</span> ({item.sourceA?.value} {item.sourceA?.unit})
                </span>
                <button
                  onClick={() => scrollToHighlight('A')}
                  className="text-blue-700 hover:text-blue-900 font-bold text-[10px] underline ml-2 shrink-0 cursor-pointer"
                >
                  Loncat ke Sorotan
                </button>
              </div>

              {/* Scrollable Document Content */}
              <div
                ref={containerARef}
                onScroll={handleScrollA}
                className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white selection:bg-amber-200 text-slate-800"
              >
                <div
                  className="paper-content prose prose-slate max-w-none text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: highlightedHtmlA }}
                />
              </div>
            </div>

            {/* Panel Kanan: Sumber B */}
            <div className="flex flex-col bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              {/* Header Sumber B */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-600 text-white shadow-2xs shrink-0">
                    SUMBER B &bull; {item.sourceB?.type === 'TABLE' ? 'TABEL' : 'NARASI'}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {item.sourceB?.chapter} - {item.sourceB?.secTitle}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {item.sourceB?.tableCaption}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-black text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                      Nilai: {item.sourceB?.value} {item.sourceB?.unit}
                    </span>
                  </div>
                  {onNavigateToSection && item.sourceB?.docId && (
                    <button
                      onClick={() => onNavigateToSection(item.sourceB.docId, item.sourceB.secId)}
                      className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-purple-600 border border-slate-200 text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition shadow-2xs"
                      title="Buka dokumen ini langsung di editor utama"
                    >
                      <span>Buka di Editor</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Highlight Target Info Bar */}
              <div className="bg-purple-50/70 border-b border-purple-100 px-4 py-1.5 flex items-center justify-between text-[11px] text-purple-900 shrink-0">
                <span className="font-medium truncate">
                  📍 Bagian Disorot: <span className="font-bold">{item.sourceB?.label}</span> ({item.sourceB?.value} {item.sourceB?.unit})
                </span>
                <button
                  onClick={() => scrollToHighlight('B')}
                  className="text-purple-700 hover:text-purple-900 font-bold text-[10px] underline ml-2 shrink-0 cursor-pointer"
                >
                  Loncat ke Sorotan
                </button>
              </div>

              {/* Scrollable Document Content */}
              <div
                ref={containerBRef}
                onScroll={handleScrollB}
                className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white selection:bg-amber-200 text-slate-800"
              >
                <div
                  className="paper-content prose prose-slate max-w-none text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: highlightedHtmlB }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Bar */}
        <div className="bg-white border-t border-slate-200 px-5 py-2.5 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="font-medium">
              Bagian yang dikomparasi ditandai dengan sorotan kuning menyala (<mark className="bg-amber-300 text-amber-950 font-bold px-1 rounded">...</mark>)
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg cursor-pointer transition shadow-xs"
          >
            Tutup Sandingan
          </button>
        </div>
      </div>
    </div>
  );
}
