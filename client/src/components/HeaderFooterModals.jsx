import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

export function HeaderSettingsModal({
  isOpen,
  onClose,
  headerText,
  setHeaderText,
  footerText,
  setFooterText,
  showHeader,
  setShowHeader,
  showFooter,
  setShowFooter,
  differentFirstPage,
  setDifferentFirstPage,
  onSave
}) {
  const [localHeader, setLocalHeader] = useState(headerText || 'RKPD Kabupaten Cilacap Tahun 2027');
  const [localFooter, setLocalFooter] = useState(footerText || 'RKPD Kabupaten Cilacap Tahun 2027');
  const [localShowHeader, setLocalShowHeader] = useState(showHeader);
  const [localShowFooter, setLocalShowFooter] = useState(showFooter);
  const [localDiffFirst, setLocalDiffFirst] = useState(differentFirstPage);

  if (!isOpen) return null;

  const handleApply = () => {
    setHeaderText(localHeader);
    setFooterText(localFooter);
    setShowHeader(localShowHeader);
    setShowFooter(localShowFooter);
    setDifferentFirstPage(localDiffFirst);
    if (onSave) onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-[1px] select-none font-sans text-xs">
      <div className="w-[480px] bg-white border border-slate-400 shadow-2xl rounded-sm flex flex-col text-slate-800">
        
        {/* Title Bar (persis Microsoft Word) */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#f0f0f0] border-b border-slate-300">
          <span className="font-semibold text-slate-700 text-xs">Header and Footer Options</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-red-600 hover:bg-slate-200 rounded transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-4">
          
          {/* Header Options */}
          <fieldset className="border border-slate-300 p-3 rounded">
            <legend className="px-1 font-semibold text-slate-700 text-[11px]">Header (Kepala Halaman)</legend>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localShowHeader}
                  onChange={(e) => setLocalShowHeader(e.target.checked)}
                  className="rounded text-[#185abd]"
                />
                <span className="font-medium">Tampilkan Header Dokumen</span>
              </label>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Teks Header (Sisi Kiri):</label>
                <input
                  type="text"
                  disabled={!localShowHeader}
                  value={localHeader}
                  onChange={(e) => setLocalHeader(e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 rounded disabled:bg-slate-100 disabled:text-slate-400 font-['Bookman_Old_Style',serif] italic text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Sisi kanan header otomatis memuat Nomor Halaman resmi (misal: II-3).</p>
              </div>
            </div>
          </fieldset>

          {/* Footer Options */}
          <fieldset className="border border-slate-300 p-3 rounded">
            <legend className="px-1 font-semibold text-slate-700 text-[11px]">Footer (Kaki Halaman)</legend>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localShowFooter}
                  onChange={(e) => setLocalShowFooter(e.target.checked)}
                  className="rounded text-[#185abd]"
                />
                <span className="font-medium">Tampilkan Footer Dokumen</span>
              </label>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Teks Footer (Sisi Kiri):</label>
                <input
                  type="text"
                  disabled={!localShowFooter}
                  value={localFooter}
                  onChange={(e) => setLocalFooter(e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 rounded disabled:bg-slate-100 disabled:text-slate-400 font-['Bookman_Old_Style',serif] italic text-xs"
                />
              </div>
            </div>
          </fieldset>

          {/* Standard Word Options */}
          <fieldset className="border border-slate-300 p-3 rounded">
            <legend className="px-1 font-semibold text-slate-700 text-[11px]">Pengaturan Khusus</legend>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localDiffFirst}
                onChange={(e) => setLocalDiffFirst(e.target.checked)}
                className="rounded text-[#185abd] mt-0.5"
              />
              <div>
                <span className="font-semibold block text-slate-800">Different First Page (Halaman Pertama Berbeda)</span>
                <span className="text-[10px] text-slate-500">Standar resmi Perbup/Word: Halaman 1 (Sampul/Kop Lampiran) tidak menampilkan header/footer running.</span>
              </div>
            </label>
          </fieldset>

        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2 px-3 py-2 bg-[#f0f0f0] border-t border-slate-300">
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1 bg-[#185abd] hover:bg-[#11499c] text-white rounded font-medium shadow-sm transition"
          >
            OK
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-medium transition"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}

export function PageNumberFormatModal({
  isOpen,
  onClose,
  pageNumberPosition,
  setPageNumberPosition,
  pageNumberFormat,
  setPageNumberFormat,
  startPageNumber,
  setStartPageNumber,
  romanChapter = 'II',
  onSave
}) {
  const [localPos, setLocalPos] = useState(pageNumberPosition || 'TOP_RIGHT');
  const [localFmt, setLocalFmt] = useState(pageNumberFormat || 'CHAPTER_PAGE');
  const [localStart, setLocalStart] = useState(startPageNumber || 1);

  if (!isOpen) return null;

  const handleApply = () => {
    setPageNumberPosition(localPos);
    setPageNumberFormat(localFmt);
    setStartPageNumber(localStart);
    if (onSave) onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-[1px] select-none font-sans text-xs">
      <div className="w-[450px] bg-white border border-slate-400 shadow-2xl rounded-sm flex flex-col text-slate-800">
        
        {/* Title Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#f0f0f0] border-b border-slate-300">
          <span className="font-semibold text-slate-700 text-xs">Page Number Format</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-red-600 hover:bg-slate-200 rounded transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          
          {/* Format selection */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700 text-[11px]">Number format:</label>
            <select
              value={localFmt}
              onChange={(e) => setLocalFmt(e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-medium"
            >
              <option value="CHAPTER_PAGE">Bab - Nomor Urut (contoh: {romanChapter}-1, {romanChapter}-2, {romanChapter}-3) [Standar RKPD]</option>
              <option value="NUMBER">1, 2, 3, ... (Angka Biasa)</option>
              <option value="ROMAN">i, ii, iii, ... (Romawi Kecil)</option>
            </select>
          </div>

          {/* Position Selection */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700 text-[11px]">Position (Posisi):</label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { id: 'TOP_RIGHT', label: 'Top of Page (Header Kanan)', preview: `${romanChapter}-3 (Sesuai Word)` },
                { id: 'BOTTOM_RIGHT', label: 'Bottom of Page (Footer Kanan)', preview: `${romanChapter}-3` },
                { id: 'BOTTOM_CENTER', label: 'Bottom Center (Footer Tengah)', preview: `${romanChapter}-3` },
                { id: 'BOTH', label: 'Atas & Bawah (Header & Footer)', preview: `${romanChapter}-3` }
              ].map(pos => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setLocalPos(pos.id)}
                  className={`p-2.5 text-left border rounded transition flex flex-col gap-1 ${
                    localPos === pos.id
                      ? 'border-[#185abd] bg-blue-50 text-[#185abd] font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold">{pos.label}</span>
                    {localPos === pos.id && <Check className="w-3.5 h-3.5 text-[#185abd]" />}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{pos.preview}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Page Numbering start */}
          <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
            <span className="font-semibold text-slate-700 text-[11px]">Start at (Mulai dari halaman):</span>
            <input
              type="number"
              min="1"
              value={localStart}
              onChange={(e) => setLocalStart(parseInt(e.target.value, 10) || 1)}
              className="w-20 px-2 py-1 border border-slate-300 rounded text-right font-bold text-slate-800"
            />
          </div>

        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2 px-3 py-2 bg-[#f0f0f0] border-t border-slate-300">
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1 bg-[#185abd] hover:bg-[#11499c] text-white rounded font-medium shadow-sm transition"
          >
            OK
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-medium transition"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
