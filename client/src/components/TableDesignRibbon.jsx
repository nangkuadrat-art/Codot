import React, { useState } from 'react';
import {
  PaintBucket,
  Palette,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Grid,
  Check,
  Paintbrush
} from 'lucide-react';

export default function TableDesignRibbon({
  selectedTable,
  selectedCell,
  onApplyTableStyle,
  onApplyShading,
  onApplyBorder,
  onToggleTableOption,
  onOpenBordersModal
}) {
  const [activeDropdown, setActiveDropdown] = useState(null); // 'SHADING', 'BORDER_STYLE', 'BORDER_WEIGHT', 'PEN_COLOR', 'BORDERS'
  const [tableOptions, setTableOptions] = useState({
    headerRow: true,
    totalRow: false,
    bandedRows: true,
    firstCol: false,
    lastCol: false,
    bandedCols: false
  });
  const [lineStyle, setLineStyle] = useState('solid');
  const [lineWeight, setLineWeight] = useState('1/2 pt');
  const [penColor, setPenColor] = useState('#cbd5e1');
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  const toggleDropdown = (name) => {
    setActiveDropdown(prev => (prev === name ? null : name));
  };

  const closeDropdown = () => setActiveDropdown(null);

  const handleOptionChange = (key) => {
    const newVal = !tableOptions[key];
    setTableOptions(prev => ({ ...prev, [key]: newVal }));
    onToggleTableOption(key, newVal);
  };

  const tableStylesGallery = [
    { id: 'PLAIN_TABLE', name: 'Table Grid', preview: 'border: 1px solid #cbd5e1; bg-head: #ffffff;' },
    { id: 'GRID_LIGHT', name: 'Grid Table 1 Light', preview: 'border: 1px solid #94a3b8; bg-head: #f1f5f9;' },
    { id: 'GRID_BLUE', name: 'Grid Table 2 Blue', preview: 'border: 1px solid #93c5fd; bg-head: #dbeafe;' },
    { id: 'GRID_GREEN', name: 'Grid Table 3 Emerald', preview: 'border: 1px solid #86efac; bg-head: #dcfce7;' },
    { id: 'LIST_LIGHT', name: 'List Table 1 Light', preview: 'border-b: 1px solid #cbd5e1; bg-head: #f8fafc;' },
    { id: 'OFFICIAL_PERBUP', name: 'Perbup Resmi', preview: 'border: 1px solid #334155; bg-head: #e2e8f0;' },
    { id: 'BANDED_GRAY', name: 'Banded Gray', preview: 'border: 1px solid #cbd5e1; bg-head: #cbd5e1;' }
  ];

  const visibleGallery = tableStylesGallery.slice(galleryStartIndex, galleryStartIndex + 6);

  return (
    <div className="flex items-stretch px-2 py-1 bg-[#f3f2f1] border-b border-[#e1dfdd] text-xs text-slate-800 select-none overflow-x-auto min-h-[96px]">
      
      {/* ================= 1. TABLE STYLE OPTIONS GROUP (Persis Gambar 2) ================= */}
      <div className="flex items-center gap-3 pr-3 border-r border-[#d2d0ce] relative">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 my-auto text-[11px] font-sans">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-black">
            <input
              type="checkbox"
              checked={tableOptions.headerRow}
              onChange={() => handleOptionChange('headerRow')}
              className="rounded text-[#185abd] w-3.5 h-3.5"
            />
            <span>Header Row</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-black">
            <input
              type="checkbox"
              checked={tableOptions.firstCol}
              onChange={() => handleOptionChange('firstCol')}
              className="rounded text-[#185abd] w-3.5 h-3.5"
            />
            <span>First Column</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-black">
            <input
              type="checkbox"
              checked={tableOptions.totalRow}
              onChange={() => handleOptionChange('totalRow')}
              className="rounded text-[#185abd] w-3.5 h-3.5"
            />
            <span>Total Row</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-black">
            <input
              type="checkbox"
              checked={tableOptions.lastCol}
              onChange={() => handleOptionChange('lastCol')}
              className="rounded text-[#185abd] w-3.5 h-3.5"
            />
            <span>Last Column</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-black">
            <input
              type="checkbox"
              checked={tableOptions.bandedRows}
              onChange={() => handleOptionChange('bandedRows')}
              className="rounded text-[#185abd] w-3.5 h-3.5"
            />
            <span>Banded Rows</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-black">
            <input
              type="checkbox"
              checked={tableOptions.bandedCols}
              onChange={() => handleOptionChange('bandedCols')}
              className="rounded text-[#185abd] w-3.5 h-3.5"
            />
            <span>Banded Columns</span>
          </label>
        </div>

        <div className="absolute -bottom-1 left-0 right-0 flex items-center justify-center">
          <span className="text-[9px] text-slate-400 font-sans">Table Style Options</span>
        </div>
      </div>

      {/* ================= 2. TABLE STYLES GROUP (Persis Gambar 2) ================= */}
      <div className="flex items-center gap-2 px-3 border-r border-[#d2d0ce] relative">
        {/* Table Styles Gallery Carousel */}
        <div className="flex items-center gap-1.5 bg-white p-1 border border-slate-300 rounded shadow-2xs h-18">
          {visibleGallery.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => onApplyTableStyle(st.id)}
              className="w-13 h-full border border-slate-200 hover:border-[#185abd] hover:bg-blue-50/50 rounded flex flex-col items-center justify-center p-1 transition group"
              title={st.name}
            >
              {/* Table Thumbnail Grid Drawing */}
              <div className="w-10 h-7 border border-slate-300 rounded-2xs overflow-hidden flex flex-col bg-white">
                <div className="h-2 w-full bg-slate-300 border-b border-slate-300" />
                <div className="h-1.5 w-full bg-slate-50 border-b border-slate-200" />
                <div className="h-1.5 w-full bg-white border-b border-slate-200" />
                <div className="h-1.5 w-full bg-slate-50" />
              </div>
              <span className="text-[7.5px] text-slate-500 group-hover:text-blue-700 truncate w-full text-center mt-0.5 font-sans">
                {st.name.split(' ')[0]}
              </span>
            </button>
          ))}

          {/* Up, Down, More Navigation */}
          <div className="flex flex-col justify-between h-full py-0.5 border-l border-slate-200 pl-1">
            <button
              type="button"
              disabled={galleryStartIndex === 0}
              onClick={() => setGalleryStartIndex(Math.max(0, galleryStartIndex - 2))}
              className="p-0.5 hover:bg-slate-100 disabled:opacity-30 rounded"
              title="Previous Styles"
            >
              <ChevronUp className="w-3 h-3 text-slate-500" />
            </button>
            <button
              type="button"
              disabled={galleryStartIndex + 6 >= tableStylesGallery.length}
              onClick={() => setGalleryStartIndex(Math.min(tableStylesGallery.length - 6, galleryStartIndex + 2))}
              className="p-0.5 hover:bg-slate-100 disabled:opacity-30 rounded"
              title="Next Styles"
            >
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Shading Button with Dropdown (Persis Gambar 2) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('SHADING')}
            className={`flex flex-col items-center justify-center p-1.5 rounded hover:bg-slate-200/70 transition w-14 h-18 text-center ${
              activeDropdown === 'SHADING' ? 'bg-blue-100 text-[#185abd]' : 'text-slate-700'
            }`}
            title="Shading (Warna Latar Sel/Tabel)"
          >
            <PaintBucket className="w-6 h-6 text-blue-600 mb-0.5" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] leading-tight">Shading</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </div>
          </button>

          {activeDropdown === 'SHADING' && (
            <div
              className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl p-2 w-52 z-50 text-xs"
              onMouseLeave={closeDropdown}
            >
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Theme Colors
              </div>
              <div className="grid grid-cols-6 gap-1 mb-2">
                {['#ffffff', '#000000', '#f1f5f9', '#cbd5e1', '#64748b', '#1e293b',
                  '#dbeafe', '#bfdbfe', '#60a5fa', '#2563eb', '#1d4ed8', '#1e40af',
                  '#dcfce7', '#bbf7d0', '#4ade80', '#16a34a', '#15803d', '#166534',
                  '#fef3c7', '#fde68a', '#facc15', '#eab308', '#ca8a04', '#a16207',
                  '#fee2e2', '#fecaca', '#f87171', '#dc2626', '#b91c1c', '#991b1b'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      onApplyShading(c);
                      closeDropdown();
                    }}
                    className="w-5 h-5 rounded-xs border border-slate-300 hover:scale-110 transition"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  onApplyShading('none');
                  closeDropdown();
                }}
                className="w-full text-left px-2 py-1 hover:bg-slate-100 rounded text-[11px] text-slate-700 border-t border-slate-100 pt-1.5"
              >
                No Color (Tanpa Warna)
              </button>
            </div>
          )}
        </div>

        <div className="absolute -bottom-1 left-0 right-0 flex items-center justify-center">
          <span className="text-[9px] text-slate-400 font-sans">Table Styles</span>
        </div>
      </div>

      {/* ================= 3. BORDERS GROUP (Persis Gambar 2) ================= */}
      <div className="flex items-center gap-2 px-3 relative">
        {/* Border Styles column */}
        <div className="flex flex-col justify-between py-0.5 h-18 text-[11px] font-sans">
          {/* Line Style Dropdown */}
          <div className="relative">
            <select
              value={lineStyle}
              onChange={(e) => setLineStyle(e.target.value)}
              className="h-5 px-1 border border-slate-300 rounded bg-white text-[10px] w-28 text-slate-700 focus:outline-none"
            >
              <option value="solid">────── Solid</option>
              <option value="dashed">------ Dashed</option>
              <option value="dotted">······ Dotted</option>
              <option value="double">══════ Double</option>
            </select>
          </div>

          {/* Line Weight Dropdown */}
          <div className="relative">
            <select
              value={lineWeight}
              onChange={(e) => setLineWeight(e.target.value)}
              className="h-5 px-1 border border-slate-300 rounded bg-white text-[10px] w-28 text-slate-700 focus:outline-none"
            >
              <option value="1/4 pt">¼ pt</option>
              <option value="1/2 pt">½ pt</option>
              <option value="3/4 pt">¾ pt</option>
              <option value="1 pt">1 pt</option>
              <option value="1 1/2 pt">1 ½ pt</option>
              <option value="2 1/4 pt">2 ¼ pt</option>
              <option value="3 pt">3 pt</option>
              <option value="4 1/2 pt">4 ½ pt</option>
              <option value="6 pt">6 pt</option>
            </select>
          </div>

          {/* Pen Color */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500">Pen:</span>
            <input
              type="color"
              value={penColor}
              onChange={(e) => setPenColor(e.target.value)}
              className="w-6 h-4.5 p-0 border border-slate-300 rounded cursor-pointer"
              title="Pen Color"
            />
          </div>
        </div>

        {/* Borders Split Button (Persis Gambar 2) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('BORDERS')}
            className={`flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/70 transition w-14 h-18 text-center ${
              activeDropdown === 'BORDERS' ? 'bg-blue-100 text-[#185abd]' : 'text-slate-700'
            }`}
            title="Borders"
          >
            <div className="w-7 h-7 border border-slate-400 rounded-2xs bg-white flex items-center justify-center shadow-2xs mb-0.5">
              <Grid className="w-5 h-5 text-slate-700" />
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] leading-tight">Borders</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </div>
          </button>

          {activeDropdown === 'BORDERS' && (
            <div
              className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl py-1 w-52 z-50 text-xs"
              onMouseLeave={closeDropdown}
            >
              {[
                { label: 'Bottom Border', type: 'bottom' },
                { label: 'Top Border', type: 'top' },
                { label: 'Left Border', type: 'left' },
                { label: 'Right Border', type: 'right' },
                { label: 'No Border', type: 'none' },
                { label: 'All Borders', type: 'all' },
                { label: 'Outside Borders', type: 'outside' },
                { label: 'Inside Borders', type: 'inside' }
              ].map(b => (
                <button
                  key={b.type}
                  type="button"
                  onClick={() => {
                    const weightVal = parseFloat(lineWeight) || 0.5;
                    onApplyBorder(b.type, penColor, weightVal, lineStyle);
                    closeDropdown();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700 text-[11px]"
                >
                  {b.label}
                </button>
              ))}

              <div className="border-t border-slate-100 my-1" />

              <button
                type="button"
                onClick={() => {
                  onOpenBordersModal();
                  closeDropdown();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-[#185abd] font-semibold text-[11px]"
              >
                Borders and Shading...
              </button>
            </div>
          )}
        </div>

        {/* Border Painter */}
        <button
          type="button"
          onClick={() => alert('Border Painter Aktif: Klik sel atau batas tabel untuk menyapukan format garis.')}
          className="flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/70 transition w-14 h-18 text-center text-slate-700"
          title="Border Painter"
        >
          <Paintbrush className="w-6 h-6 text-blue-600 mb-0.5" />
          <span className="text-[10px] leading-tight">Border Painter</span>
        </button>

        {/* Group Label & Launcher */}
        <div className="absolute -bottom-1 left-0 right-0 flex items-center justify-between px-2">
          <span className="text-[9px] text-slate-400 font-sans mx-auto">Borders</span>
          <button
            type="button"
            onClick={onOpenBordersModal}
            className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700"
            title="Borders Dialog"
          >
            <Maximize2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
