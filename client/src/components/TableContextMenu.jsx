import React, { useState } from 'react';
import {
  Scissors,
  Copy,
  Clipboard,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Layers,
  Split,
  Tag,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Grid,
  PaintBucket,
  Bold,
  Italic,
  Underline,
  Highlighter,
  List,
  ListOrdered,
  MessageSquare,
  Search,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

export default function TableContextMenu({
  visible,
  x,
  y,
  selectedTable,
  selectedCell,
  onClose,
  onInsertRowAbove,
  onInsertRowBelow,
  onInsertColLeft,
  onInsertColRight,
  onDeleteRow,
  onDeleteCol,
  onDeleteTable,
  onMergeCells,
  onSplitCell,
  onSetCellAlignment,
  onApplyShading,
  onApplyBorder,
  onAutoFit,
  onOpenCaption,
  onOpenTableProperties,
  onOpenBordersModal,
  onCycleTextDirection
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubmenu, setActiveSubmenu] = useState(null); // 'INSERT', 'DELETE', 'ALIGN', 'AUTOFIT', 'SHADING', 'BORDERS', 'MINI_INSERT', 'MINI_DELETE'

  if (!visible || !selectedTable) return null;

  const filterItem = (name) => {
    if (!searchTerm.trim()) return true;
    return name.toLowerCase().includes(searchTerm.toLowerCase().trim());
  };

  return (
    <div
      className="fixed z-9999 select-none font-sans text-xs"
      style={{ left: `${x}px`, top: `${y}px` }}
      onClick={(e) => e.stopPropagation()}
      onMouseLeave={() => setActiveSubmenu(null)}
    >
      {/* 1. TABLE FLOATING MINI-TOOLBAR (Persis Gambar 1) */}
      <div className="mb-1 bg-white border border-slate-300 rounded-lg shadow-xl p-1.5 w-[310px] space-y-1">
        {/* Row 1: Font, Size, Inc/Dec, Bullets, Numbering, Table Insert, Table Delete, New Comment */}
        <div className="flex items-center gap-1">
          {/* Font Dropdown */}
          <select
            defaultValue="Bookman Old Style"
            onChange={(e) => document.execCommand('fontName', false, e.target.value)}
            className="text-[11px] h-6 px-1 border border-slate-300 rounded bg-white font-sans w-24 text-slate-700 focus:outline-none"
          >
            <option value="Bookman Old Style">Bookman</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times</option>
            <option value="Calibri">Calibri</option>
          </select>

          {/* Size */}
          <select
            defaultValue="9pt"
            onChange={(e) => document.execCommand('fontSize', false, e.target.value)}
            className="text-[11px] h-6 px-1 border border-slate-300 rounded bg-white font-sans w-12 text-slate-700 focus:outline-none"
          >
            <option value="8pt">8</option>
            <option value="9pt">9</option>
            <option value="10pt">10</option>
            <option value="11pt">11</option>
            <option value="12pt">12</option>
          </select>

          {/* Bullets & Numbering */}
          <button
            type="button"
            onClick={() => document.execCommand('insertUnorderedList')}
            className="p-1 hover:bg-slate-100 rounded text-slate-700"
            title="Bullets"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => document.execCommand('insertOrderedList')}
            className="p-1 hover:bg-slate-100 rounded text-slate-700"
            title="Numbering"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          {/* Table Insert Button (Mini-Toolbar - Persis Gambar 1) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveSubmenu(activeSubmenu === 'MINI_INSERT' ? null : 'MINI_INSERT')}
              className="flex items-center gap-0.5 p-1 hover:bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold text-[10px]"
              title="Insert Table Row/Column"
            >
              <Plus className="w-3 h-3 text-blue-600" />
              <span>Insert</span>
            </button>

            {activeSubmenu === 'MINI_INSERT' && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl py-1 w-36 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => { onInsertRowAbove(); onClose(); }}
                  className="w-full text-left px-2.5 py-1 hover:bg-blue-50 text-slate-700"
                >
                  Insert Above
                </button>
                <button
                  type="button"
                  onClick={() => { onInsertRowBelow(); onClose(); }}
                  className="w-full text-left px-2.5 py-1 hover:bg-blue-50 text-slate-700"
                >
                  Insert Below
                </button>
                <button
                  type="button"
                  onClick={() => { onInsertColLeft(); onClose(); }}
                  className="w-full text-left px-2.5 py-1 hover:bg-blue-50 text-slate-700"
                >
                  Insert Left
                </button>
                <button
                  type="button"
                  onClick={() => { onInsertColRight(); onClose(); }}
                  className="w-full text-left px-2.5 py-1 hover:bg-blue-50 text-slate-700"
                >
                  Insert Right
                </button>
              </div>
            )}
          </div>

          {/* Table Delete Button (Mini-Toolbar - Persis Gambar 1) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveSubmenu(activeSubmenu === 'MINI_DELETE' ? null : 'MINI_DELETE')}
              className="flex items-center gap-0.5 p-1 hover:bg-red-50 text-red-700 border border-red-200 rounded font-semibold text-[10px]"
              title="Delete Rows/Cols/Table"
            >
              <Trash2 className="w-3 h-3 text-red-600" />
              <span>Delete</span>
            </button>

            {activeSubmenu === 'MINI_DELETE' && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl py-1 w-36 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => { onDeleteRow(); onClose(); }}
                  className="w-full text-left px-2.5 py-1 hover:bg-red-50 text-red-700"
                >
                  Delete Rows
                </button>
                <button
                  type="button"
                  onClick={() => { onDeleteCol(); onClose(); }}
                  className="w-full text-left px-2.5 py-1 hover:bg-red-50 text-red-700"
                >
                  Delete Columns
                </button>
                <button
                  type="button"
                  onClick={() => { onDeleteTable(); onClose(); }}
                  className="w-full text-left px-2.5 py-1 hover:bg-red-50 text-red-700 font-bold border-t border-slate-100"
                >
                  Delete Table
                </button>
              </div>
            )}
          </div>

          {/* New Comment */}
          <button
            type="button"
            onClick={() => {
              const c = prompt('Masukkan catatan komentar untuk tabel ini:');
              if (c) alert(`Komentar tersimpan: "${c}"`);
              onClose();
            }}
            className="p-1 hover:bg-emerald-50 text-emerald-700 rounded border border-emerald-200"
            title="New Comment"
          >
            <MessageSquare className="w-3 h-3 text-emerald-600" />
          </button>
        </div>

        {/* Row 2: B, I, U, Highlight, Font Color, Borders, Shading, Align */}
        <div className="flex items-center gap-1 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => document.execCommand('bold')}
            className="p-1 hover:bg-slate-100 rounded text-slate-700 font-bold"
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => document.execCommand('italic')}
            className="p-1 hover:bg-slate-100 rounded text-slate-700 italic"
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => document.execCommand('underline')}
            className="p-1 hover:bg-slate-100 rounded text-slate-700 underline"
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          {/* Highlight Color */}
          <button
            type="button"
            onClick={() => document.execCommand('hiliteColor', false, '#fef08a')}
            className="p-1 hover:bg-slate-100 rounded text-amber-600"
            title="Highlight Color"
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>

          {/* Shading / Fill Cell Background */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveSubmenu(activeSubmenu === 'SHADING' ? null : 'SHADING')}
              className="p-1 hover:bg-slate-100 rounded text-blue-600"
              title="Shading (Warna Sel)"
            >
              <PaintBucket className="w-3.5 h-3.5" />
            </button>

            {activeSubmenu === 'SHADING' && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl p-2 w-48 z-50 text-xs">
                <div className="grid grid-cols-6 gap-1 mb-1.5">
                  {['#ffffff', '#f1f5f9', '#cbd5e1', '#dbeafe', '#dcfce7', '#fee2e2', '#fef3c7', '#2563eb', '#16a34a', '#dc2626', '#eab308', '#0f172a'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        onApplyShading(c);
                        setActiveSubmenu(null);
                      }}
                      className="w-5 h-5 rounded-xs border border-slate-300 hover:scale-110"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => { onApplyShading('none'); setActiveSubmenu(null); }}
                  className="w-full text-left px-2 py-1 hover:bg-slate-100 text-[10px] text-slate-600"
                >
                  No Color
                </button>
              </div>
            )}
          </div>

          {/* Borders */}
          <button
            type="button"
            onClick={() => onApplyBorder('all')}
            className="p-1 hover:bg-slate-100 rounded text-slate-700"
            title="All Borders"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Alignment */}
          <div className="flex items-center gap-0.5 ml-auto">
            <button
              type="button"
              onClick={() => onSetCellAlignment('left', 'middle')}
              className="p-1 hover:bg-slate-100 rounded text-slate-700"
              title="Align Left"
            >
              <AlignLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => onSetCellAlignment('center', 'middle')}
              className="p-1 hover:bg-slate-100 rounded text-slate-700"
              title="Align Center"
            >
              <AlignCenter className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => onSetCellAlignment('right', 'middle')}
              className="p-1 hover:bg-slate-100 rounded text-slate-700"
              title="Align Right"
            >
              <AlignRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN TABLE CONTEXT MENU */}
      <div className="bg-white border border-slate-300 rounded-lg shadow-2xl w-60 py-1 text-xs text-slate-800">
        {/* Search the menus */}
        <div className="px-2 pb-1 mb-1 border-b border-slate-200">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-500">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search the menus"
              className="w-full bg-transparent text-xs text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-0.5">
          {/* Cut & Copy */}
          {filterItem('cut') && (
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => {
                document.execCommand('cut');
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2.5 transition"
            >
              <Scissors className="w-3.5 h-3.5 text-slate-500" />
              <span>Cut</span>
            </button>
          )}

          {filterItem('copy') && (
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => {
                document.execCommand('copy');
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2.5 transition"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy</span>
            </button>
          )}

          <div className="my-1 border-t border-slate-200" />

          {/* Insert > Submenu */}
          {filterItem('insert') && (
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setActiveSubmenu('INSERT')}
                onClick={() => setActiveSubmenu(activeSubmenu === 'INSERT' ? null : 'INSERT')}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition ${
                  activeSubmenu === 'INSERT' ? 'bg-blue-50 text-[#185abd]' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Insert</span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </button>

              {activeSubmenu === 'INSERT' && (
                <div className="absolute left-full top-0 ml-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 w-52 z-50 text-xs">
                  <button
                    type="button"
                    onClick={() => { onInsertColLeft(); onClose(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700 flex items-center gap-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-blue-600" />
                    <span>Insert Columns to the Left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { onInsertColRight(); onClose(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700 flex items-center gap-2"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                    <span>Insert Columns to the Right</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { onInsertRowAbove(); onClose(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700 flex items-center gap-2"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                    <span>Insert Rows Above</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { onInsertRowBelow(); onClose(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700 flex items-center gap-2"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    <span>Insert Rows Below</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Delete > Submenu */}
          {filterItem('delete') && (
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setActiveSubmenu('DELETE')}
                onClick={() => setActiveSubmenu(activeSubmenu === 'DELETE' ? null : 'DELETE')}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition ${
                  activeSubmenu === 'DELETE' ? 'bg-red-50 text-red-700' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Delete</span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </button>

              {activeSubmenu === 'DELETE' && (
                <div className="absolute left-full top-0 ml-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 w-44 z-50 text-xs">
                  <button
                    type="button"
                    onClick={() => { onDeleteCol(); onClose(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-700"
                  >
                    Delete Columns
                  </button>
                  <button
                    type="button"
                    onClick={() => { onDeleteRow(); onClose(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-700"
                  >
                    Delete Rows
                  </button>
                  <button
                    type="button"
                    onClick={() => { onDeleteTable(); onClose(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-700 font-bold border-t border-slate-100"
                  >
                    Delete Table
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="my-1 border-t border-slate-200" />

          {/* Merge Cells */}
          {filterItem('merge cells') && (
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => { onMergeCells(); onClose(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2.5 transition"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Merge Cells</span>
            </button>
          )}

          {/* Split Cells... */}
          {filterItem('split cells') && (
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => { onSplitCell(); onClose(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2.5 transition"
            >
              <Split className="w-3.5 h-3.5 text-blue-600" />
              <span>Split Cells...</span>
            </button>
          )}

          {/* Borders and Shading... */}
          {filterItem('borders and shading') && (
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => { onOpenBordersModal(); onClose(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2.5 transition"
            >
              <Grid className="w-3.5 h-3.5 text-slate-500" />
              <span>Borders and Shading...</span>
            </button>
          )}

          {/* Text Direction... */}
          {filterItem('text direction') && (
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => { onCycleTextDirection(); onClose(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2.5 transition"
            >
              <span className="font-bold text-slate-600 text-[11px] w-3.5 text-center">A→</span>
              <span>Text Direction...</span>
            </button>
          )}

          {/* Cell Alignment > (9 Grid) */}
          {filterItem('cell alignment') && (
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setActiveSubmenu('ALIGN')}
                onClick={() => setActiveSubmenu(activeSubmenu === 'ALIGN' ? null : 'ALIGN')}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition ${
                  activeSubmenu === 'ALIGN' ? 'bg-blue-50 text-[#185abd]' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AlignCenter className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cell Alignment</span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </button>

              {activeSubmenu === 'ALIGN' && (
                <div className="absolute left-full top-0 ml-1 bg-white border border-slate-300 rounded-lg shadow-xl p-2 w-32 z-50">
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { align: 'left', vAlign: 'top', label: 'Top Left' },
                      { align: 'center', vAlign: 'top', label: 'Top Center' },
                      { align: 'right', vAlign: 'top', label: 'Top Right' },
                      { align: 'left', vAlign: 'middle', label: 'Middle Left' },
                      { align: 'center', vAlign: 'middle', label: 'Middle Center' },
                      { align: 'right', vAlign: 'middle', label: 'Middle Right' },
                      { align: 'left', vAlign: 'bottom', label: 'Bottom Left' },
                      { align: 'center', vAlign: 'bottom', label: 'Bottom Center' },
                      { align: 'right', vAlign: 'bottom', label: 'Bottom Right' }
                    ].map((m, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          onSetCellAlignment(m.align, m.vAlign);
                          onClose();
                        }}
                        className="w-7 h-7 border border-slate-200 hover:border-[#185abd] hover:bg-blue-50 rounded flex items-center justify-center"
                        title={m.label}
                      >
                        <div
                          className="w-2 h-1 bg-slate-700"
                          style={{
                            marginLeft: m.align === 'left' ? '0' : (m.align === 'center' ? 'auto' : 'auto'),
                            marginRight: m.align === 'right' ? '0' : (m.align === 'center' ? 'auto' : 'auto'),
                            marginTop: m.vAlign === 'top' ? '0' : (m.vAlign === 'middle' ? 'auto' : 'auto'),
                            marginBottom: m.vAlign === 'bottom' ? '0' : (m.vAlign === 'middle' ? 'auto' : 'auto')
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AutoFit > Submenu */}
          {filterItem('autofit') && (
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setActiveSubmenu('AUTOFIT')}
                onClick={() => setActiveSubmenu(activeSubmenu === 'AUTOFIT' ? null : 'AUTOFIT')}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition ${
                  activeSubmenu === 'AUTOFIT' ? 'bg-blue-50 text-[#185abd]' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Grid className="w-3.5 h-3.5 text-slate-500" />
                  <span>AutoFit</span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </button>

              {activeSubmenu === 'AUTOFIT' && (
                <div className="absolute left-full top-0 ml-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 w-44 z-50 text-xs">
                  <button
                    type="button"
                    onClick={() => { onAutoFit('contents'); onClose(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                  >
                    AutoFit to Contents
                  </button>
                  <button
                    type="button"
                    onClick={() => { onAutoFit('window'); onClose(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                  >
                    AutoFit to Window
                  </button>
                  <button
                    type="button"
                    onClick={() => { onAutoFit('fixed'); onClose(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                  >
                    Fixed Column Width
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="my-1 border-t border-slate-200" />

          {/* Insert Caption... (Label: Tabel) */}
          {filterItem('insert caption') && (
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => { onOpenCaption(); onClose(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2.5 transition text-amber-900 font-medium"
            >
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span>Insert Caption...</span>
            </button>
          )}

          {/* Table Properties... */}
          {filterItem('table properties') && (
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => { onOpenTableProperties(); onClose(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-[#185abd] font-bold flex items-center gap-2.5 transition border-t border-slate-100"
            >
              <Sliders className="w-3.5 h-3.5 text-[#185abd]" />
              <span>Table Properties...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
