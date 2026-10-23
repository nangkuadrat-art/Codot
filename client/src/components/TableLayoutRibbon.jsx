import React, { useState } from 'react';
import {
  Grid,
  Maximize2,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Split,
  ChevronDown,
  ChevronUp,
  AlignCenter,
  AlignLeft,
  AlignRight,
  RotateCw,
  Sliders,
  SortAsc,
  Binary,
  Layers,
  Pencil,
  Eraser as EraserIcon
} from 'lucide-react';

export default function TableLayoutRibbon({
  selectedTable,
  selectedCell,
  onInsertRowAbove,
  onInsertRowBelow,
  onInsertColLeft,
  onInsertColRight,
  onDeleteRow,
  onDeleteCol,
  onDeleteTable,
  onMergeCells,
  onSplitCell,
  onSplitTable,
  onDistributeRows,
  onDistributeCols,
  onAutoFit,
  onSetCellAlignment,
  onOpenTableProperties,
  onToggleRepeatHeaders,
  onSortTable
}) {
  const [activeDropdown, setActiveDropdown] = useState(null); // 'SELECT', 'DELETE', 'AUTOFIT'
  const [cellHeightCm, setCellHeightCm] = useState(0.6);
  const [cellWidthCm, setCellWidthCm] = useState(3.5);
  const [textDirection, setTextDirection] = useState('horizontal');

  const toggleDropdown = (name) => {
    setActiveDropdown(prev => (prev === name ? null : name));
  };

  const closeDropdown = () => setActiveDropdown(null);

  const handleCellHeightChange = (delta) => {
    const newH = Math.max(0.2, +(cellHeightCm + delta).toFixed(2));
    setCellHeightCm(newH);
    if (selectedCell) {
      const row = selectedCell.closest('tr');
      if (row) row.style.height = `${newH * 37.795}px`;
    }
  };

  const handleCellWidthChange = (delta) => {
    const newW = Math.max(0.5, +(cellWidthCm + delta).toFixed(2));
    setCellWidthCm(newW);
    if (selectedCell) {
      selectedCell.style.width = `${newW * 37.795}px`;
    }
  };

  const handleCycleTextDirection = () => {
    if (!selectedCell) return;
    if (textDirection === 'horizontal') {
      selectedCell.style.writingMode = 'vertical-rl';
      setTextDirection('vertical-rl');
    } else {
      selectedCell.style.writingMode = 'horizontal-tb';
      setTextDirection('horizontal');
    }
  };

  return (
    <div className="flex items-stretch px-2 py-1 bg-[#f3f2f1] border-b border-[#e1dfdd] text-xs text-slate-800 select-none overflow-x-auto min-h-[96px]">
      
      {/* ================= 1. TABLE GROUP (Persis Gambar 3) ================= */}
      <div className="flex items-center gap-1.5 pr-2.5 border-r border-[#d2d0ce] relative">
        {/* Select Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('SELECT')}
            className={`flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/70 transition w-13 h-18 text-center ${
              activeDropdown === 'SELECT' ? 'bg-blue-100 text-[#185abd]' : 'text-slate-700'
            }`}
            title="Select"
          >
            <div className="w-6 h-6 border border-slate-400 rounded-2xs bg-white flex items-center justify-center shadow-2xs mb-0.5">
              <span className="text-[10px] font-bold text-slate-700">↖</span>
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] leading-tight">Select</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </div>
          </button>

          {activeDropdown === 'SELECT' && (
            <div
              className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl py-1 w-40 z-50 text-xs"
              onMouseLeave={closeDropdown}
            >
              <button
                type="button"
                onClick={() => {
                  if (selectedCell) {
                    selectedCell.style.outline = '2px solid #185abd';
                  }
                  closeDropdown();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
              >
                Select Cell
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedCell && selectedTable) {
                    const row = selectedCell.closest('tr');
                    const cellIdx = Array.from(row.children).indexOf(selectedCell);
                    selectedTable.querySelectorAll('tr').forEach(r => {
                      if (r.children[cellIdx]) r.children[cellIdx].style.outline = '2px solid #185abd';
                    });
                  }
                  closeDropdown();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
              >
                Select Column
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedCell) {
                    const row = selectedCell.closest('tr');
                    if (row) row.style.outline = '2px solid #185abd';
                  }
                  closeDropdown();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
              >
                Select Row
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedTable) {
                    selectedTable.style.outline = '2px solid #185abd';
                  }
                  closeDropdown();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
              >
                Select Table
              </button>
            </div>
          )}
        </div>

        {/* View Gridlines */}
        <button
          type="button"
          onClick={() => {
            if (selectedTable) {
              selectedTable.classList.toggle('show-gridlines');
            }
          }}
          className="flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/70 transition w-14 h-18 text-center text-slate-700"
          title="View Gridlines"
        >
          <Grid className="w-6 h-6 text-slate-600 mb-0.5" />
          <span className="text-[10px] leading-tight">View Gridlines</span>
        </button>

        {/* Properties */}
        <button
          type="button"
          onClick={onOpenTableProperties}
          className="flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/70 transition w-14 h-18 text-center text-slate-700"
          title="Table Properties"
        >
          <Sliders className="w-6 h-6 text-blue-700 mb-0.5" />
          <span className="text-[10px] leading-tight">Properties</span>
        </button>

        <div className="absolute -bottom-1 left-0 right-0 flex items-center justify-center">
          <span className="text-[9px] text-slate-400 font-sans">Table</span>
        </div>
      </div>

      {/* ================= 2. DRAW GROUP (Persis Gambar 3) ================= */}
      <div className="flex items-center gap-1.5 px-2.5 border-r border-[#d2d0ce] relative">
        <button
          type="button"
          onClick={() => alert('Draw Table Aktif: Seret kursor untuk menggambar batas sel tabel.')}
          className="flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/70 transition w-14 h-18 text-center text-slate-700"
          title="Draw Table"
        >
          <Pencil className="w-6 h-6 text-amber-600 mb-0.5" />
          <span className="text-[10px] leading-tight">Draw Table</span>
        </button>

        <button
          type="button"
          onClick={() => alert('Eraser Aktif: Klik pada batas sel tabel untuk menghapusnya.')}
          className="flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/70 transition w-13 h-18 text-center text-slate-700"
          title="Eraser"
        >
          <EraserIcon className="w-6 h-6 text-pink-600 mb-0.5" />
          <span className="text-[10px] leading-tight">Eraser</span>
        </button>

        <div className="absolute -bottom-1 left-0 right-0 flex items-center justify-center">
          <span className="text-[9px] text-slate-400 font-sans">Draw</span>
        </div>
      </div>

      {/* ================= 3. ROWS & COLUMNS GROUP (Persis Gambar 3) ================= */}
      <div className="flex items-center gap-1 px-2.5 border-r border-[#d2d0ce] relative">
        {/* Delete Split Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('DELETE')}
            className={`flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/70 transition w-13 h-18 text-center ${
              activeDropdown === 'DELETE' ? 'bg-red-50 text-red-700' : 'text-slate-700'
            }`}
            title="Delete Rows/Columns/Table"
          >
            <div className="w-6 h-6 border border-red-300 rounded-2xs bg-red-50 flex items-center justify-center shadow-2xs mb-0.5">
              <Trash2 className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] leading-tight text-red-700 font-medium">Delete</span>
              <ChevronDown className="w-2.5 h-2.5 text-red-400" />
            </div>
          </button>

          {activeDropdown === 'DELETE' && (
            <div
              className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl py-1 w-44 z-50 text-xs"
              onMouseLeave={closeDropdown}
            >
              <button
                type="button"
                onClick={() => { onDeleteRow(); closeDropdown(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-700 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Rows</span>
              </button>
              <button
                type="button"
                onClick={() => { onDeleteCol(); closeDropdown(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-700 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Columns</span>
              </button>
              <button
                type="button"
                onClick={() => { onDeleteTable(); closeDropdown(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-700 flex items-center gap-2 font-bold border-t border-slate-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Table</span>
              </button>
            </div>
          )}
        </div>

        {/* Insert Row Above (Persis Gambar 3) */}
        <button
          type="button"
          onClick={onInsertRowAbove}
          className="flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/70 transition w-15 h-18 text-center text-slate-700"
          title="Insert Row Above"
        >
          <div className="w-6 h-6 border border-blue-400 rounded-2xs bg-white flex flex-col justify-between p-0.5 shadow-2xs mb-0.5">
            <div className="h-1.5 w-full bg-blue-500 rounded-3xs" />
            <ArrowUp className="w-3 h-3 text-blue-700 mx-auto" />
          </div>
          <span className="text-[9.5px] leading-tight">Insert Above</span>
        </button>

        {/* Insert Row Below (Persis Gambar 3) */}
        <button
          type="button"
          onClick={onInsertRowBelow}
          className="flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/70 transition w-15 h-18 text-center text-slate-700"
          title="Insert Row Below"
        >
          <div className="w-6 h-6 border border-blue-400 rounded-2xs bg-white flex flex-col justify-between p-0.5 shadow-2xs mb-0.5">
            <ArrowDown className="w-3 h-3 text-blue-700 mx-auto" />
            <div className="h-1.5 w-full bg-blue-500 rounded-3xs" />
          </div>
          <span className="text-[9.5px] leading-tight">Insert Below</span>
        </button>

        {/* Insert Column Left (Persis Gambar 3) */}
        <button
          type="button"
          onClick={onInsertColLeft}
          className="flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/70 transition w-15 h-18 text-center text-slate-700"
          title="Insert Column Left"
        >
          <div className="w-6 h-6 border border-blue-400 rounded-2xs bg-white flex items-center justify-between p-0.5 shadow-2xs mb-0.5">
            <div className="w-1.5 h-full bg-blue-500 rounded-3xs" />
            <ArrowLeft className="w-3 h-3 text-blue-700" />
          </div>
          <span className="text-[9.5px] leading-tight">Insert Left</span>
        </button>

        {/* Insert Column Right (Persis Gambar 3) */}
        <button
          type="button"
          onClick={onInsertColRight}
          className="flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/70 transition w-15 h-18 text-center text-slate-700"
          title="Insert Column Right"
        >
          <div className="w-6 h-6 border border-blue-400 rounded-2xs bg-white flex items-center justify-between p-0.5 shadow-2xs mb-0.5">
            <ArrowRight className="w-3 h-3 text-blue-700" />
            <div className="w-1.5 h-full bg-blue-500 rounded-3xs" />
          </div>
          <span className="text-[9.5px] leading-tight">Insert Right</span>
        </button>

        <div className="absolute -bottom-1 left-0 right-0 flex items-center justify-center">
          <span className="text-[9px] text-slate-400 font-sans">Rows & Columns</span>
        </div>
      </div>

      {/* ================= 4. MERGE GROUP (Persis Gambar 3) ================= */}
      <div className="flex flex-col justify-between py-1 px-2.5 border-r border-[#d2d0ce] h-18 relative">
        <button
          type="button"
          onClick={onMergeCells}
          className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-slate-200/70 rounded text-[10.5px] text-slate-700"
          title="Merge Cells"
        >
          <Layers className="w-3.5 h-3.5 text-blue-700" />
          <span>Merge Cells</span>
        </button>

        <button
          type="button"
          onClick={onSplitCell}
          className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-slate-200/70 rounded text-[10.5px] text-slate-700"
          title="Split Cells"
        >
          <Split className="w-3.5 h-3.5 text-blue-700" />
          <span>Split Cells</span>
        </button>

        <button
          type="button"
          onClick={onSplitTable}
          className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-slate-200/70 rounded text-[10.5px] text-slate-700"
          title="Split Table"
        >
          <Grid className="w-3.5 h-3.5 text-slate-600" />
          <span>Split Table</span>
        </button>

        <div className="absolute -bottom-1 left-0 right-0 flex items-center justify-center">
          <span className="text-[9px] text-slate-400 font-sans">Merge</span>
        </div>
      </div>

      {/* ================= 5. CELL SIZE GROUP (Persis Gambar 3) ================= */}
      <div className="flex items-center gap-2 px-2.5 border-r border-[#d2d0ce] relative">
        <div className="flex flex-col justify-between py-1 h-18 text-[11px] font-sans">
          {/* Height Stepper */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 w-3">H:</span>
            <div className="flex items-center border border-slate-300 rounded bg-white px-1 py-0.2 shadow-2xs">
              <input
                type="text"
                value={`${cellHeightCm.toFixed(2).replace('.', ',')} cm`}
                readOnly
                className="w-14 bg-transparent text-right font-mono text-[10.5px] text-slate-800 focus:outline-none"
              />
              <div className="flex flex-col ml-0.5 border-l border-slate-200 pl-0.5">
                <button
                  type="button"
                  onClick={() => handleCellHeightChange(0.1)}
                  className="hover:bg-slate-100 p-0.2 rounded"
                >
                  <ChevronUp className="w-2.5 h-2.5 text-slate-600" />
                </button>
                <button
                  type="button"
                  onClick={() => handleCellHeightChange(-0.1)}
                  className="hover:bg-slate-100 p-0.2 rounded"
                >
                  <ChevronDown className="w-2.5 h-2.5 text-slate-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Width Stepper */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 w-3">W:</span>
            <div className="flex items-center border border-slate-300 rounded bg-white px-1 py-0.2 shadow-2xs">
              <input
                type="text"
                value={`${cellWidthCm.toFixed(2).replace('.', ',')} cm`}
                readOnly
                className="w-14 bg-transparent text-right font-mono text-[10.5px] text-slate-800 focus:outline-none"
              />
              <div className="flex flex-col ml-0.5 border-l border-slate-200 pl-0.5">
                <button
                  type="button"
                  onClick={() => handleCellWidthChange(0.2)}
                  className="hover:bg-slate-100 p-0.2 rounded"
                >
                  <ChevronUp className="w-2.5 h-2.5 text-slate-600" />
                </button>
                <button
                  type="button"
                  onClick={() => handleCellWidthChange(-0.2)}
                  className="hover:bg-slate-100 p-0.2 rounded"
                >
                  <ChevronDown className="w-2.5 h-2.5 text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Distribute & AutoFit Column */}
        <div className="flex flex-col justify-between py-1 h-18 text-[10px]">
          <button
            type="button"
            onClick={onDistributeRows}
            className="flex items-center gap-1 px-1.5 py-0.5 hover:bg-slate-200/70 rounded text-slate-700"
            title="Distribute Rows"
          >
            <div className="w-3.5 h-3 border border-slate-400 flex flex-col justify-between p-0.2">
              <div className="h-0.5 bg-blue-600" />
              <div className="h-0.5 bg-blue-600" />
            </div>
            <span>Distribute Rows</span>
          </button>

          <button
            type="button"
            onClick={onDistributeCols}
            className="flex items-center gap-1 px-1.5 py-0.5 hover:bg-slate-200/70 rounded text-slate-700"
            title="Distribute Columns"
          >
            <div className="w-3.5 h-3 border border-slate-400 flex justify-between p-0.2">
              <div className="w-0.5 bg-blue-600 h-full" />
              <div className="w-0.5 bg-blue-600 h-full" />
            </div>
            <span>Distribute Columns</span>
          </button>

          {/* AutoFit Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('AUTOFIT')}
              className="flex items-center gap-1 px-1.5 py-0.5 hover:bg-slate-200/70 rounded text-slate-700 font-medium"
            >
              <span>AutoFit</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>

            {activeDropdown === 'AUTOFIT' && (
              <div
                className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl py-1 w-44 z-50 text-xs"
                onMouseLeave={closeDropdown}
              >
                <button
                  type="button"
                  onClick={() => { onAutoFit('contents'); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                >
                  AutoFit Contents
                </button>
                <button
                  type="button"
                  onClick={() => { onAutoFit('window'); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                >
                  AutoFit Window
                </button>
                <button
                  type="button"
                  onClick={() => { onAutoFit('fixed'); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                >
                  Fixed Column Width
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="absolute -bottom-1 left-0 right-0 flex items-center justify-center">
          <span className="text-[9px] text-slate-400 font-sans">Cell Size</span>
        </div>
      </div>

      {/* ================= 6. ALIGNMENT GROUP (3x3 Grid - Persis Gambar 3) ================= */}
      <div className="flex items-center gap-2 px-2.5 border-r border-[#d2d0ce] relative">
        {/* Exact 9-Cell 3x3 Alignment Grid from Microsoft Word */}
        <div className="grid grid-cols-3 gap-0.5 bg-white p-1 border border-slate-300 rounded shadow-2xs h-18">
          {[
            { align: 'left', vAlign: 'top', label: 'Top Left' },
            { align: 'center', vAlign: 'top', label: 'Top Center' },
            { align: 'right', vAlign: 'top', label: 'Top Right' },
            { align: 'left', vAlign: 'middle', label: 'Center Left' },
            { align: 'center', vAlign: 'middle', label: 'Center (Middle)' },
            { align: 'right', vAlign: 'middle', label: 'Center Right' },
            { align: 'left', vAlign: 'bottom', label: 'Bottom Left' },
            { align: 'center', vAlign: 'bottom', label: 'Bottom Center' },
            { align: 'right', vAlign: 'bottom', label: 'Bottom Right' }
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSetCellAlignment(item.align, item.vAlign)}
              className="w-5 h-5 flex items-center justify-center hover:bg-blue-100 hover:text-[#185abd] text-slate-600 rounded-xs transition"
              title={item.label}
            >
              <div className="w-3.5 h-3 border border-slate-300 rounded-3xs relative overflow-hidden">
                <div
                  className="w-1.5 h-0.5 bg-slate-700 absolute"
                  style={{
                    top: item.vAlign === 'top' ? '1px' : (item.vAlign === 'middle' ? '4px' : '7px'),
                    left: item.align === 'left' ? '1px' : (item.align === 'center' ? '4px' : '7px')
                  }}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Text Direction & Cell Margins */}
        <div className="flex flex-col justify-between py-1 h-18 text-[10px]">
          <button
            type="button"
            onClick={handleCycleTextDirection}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-200/70 rounded text-slate-700"
            title="Text Direction"
          >
            <span className="font-bold font-sans text-xs">A→</span>
            <span>Text Direction</span>
          </button>

          <button
            type="button"
            onClick={onOpenTableProperties}
            className="flex items-center gap-1.5 px-2 py-1 hover:bg-slate-200/70 rounded text-slate-700"
            title="Cell Margins"
          >
            <Grid className="w-3.5 h-3.5 text-blue-700" />
            <span>Cell Margins</span>
          </button>
        </div>

        <div className="absolute -bottom-1 left-0 right-0 flex items-center justify-center">
          <span className="text-[9px] text-slate-400 font-sans">Alignment</span>
        </div>
      </div>

      {/* ================= 7. DATA GROUP (Persis Gambar 3) ================= */}
      <div className="flex items-center gap-1.5 px-2.5 relative">
        <div className="flex flex-col justify-between py-1 h-18 text-[10px]">
          {/* Sort */}
          <button
            type="button"
            onClick={onSortTable}
            className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-slate-200/70 rounded text-slate-700"
            title="Sort Table"
          >
            <SortAsc className="w-3.5 h-3.5 text-blue-700" />
            <span>Sort</span>
          </button>

          {/* Repeat Header Rows */}
          <button
            type="button"
            onClick={onToggleRepeatHeaders}
            className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-slate-200/70 rounded text-slate-700"
            title="Repeat Header Rows on every page"
          >
            <Binary className="w-3.5 h-3.5 text-indigo-700" />
            <span>Repeat Header Rows</span>
          </button>

          {/* Formula fx */}
          <button
            type="button"
            onClick={() => {
              if (selectedCell) {
                const formula = prompt('Masukkan formula Excel/Word:', '=SUM(ABOVE)');
                if (formula) selectedCell.innerHTML = `<strong>${formula}</strong>`;
              }
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 hover:bg-slate-200/70 rounded text-slate-700"
            title="Formula fx"
          >
            <span className="font-serif italic font-bold text-xs text-blue-700">fx</span>
            <span>Formula</span>
          </button>
        </div>

        <div className="absolute -bottom-1 left-0 right-0 flex items-center justify-center">
          <span className="text-[9px] text-slate-400 font-sans">Data</span>
        </div>
      </div>

    </div>
  );
}
