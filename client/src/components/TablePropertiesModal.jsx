import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function TablePropertiesModal({
  isOpen,
  onClose,
  selectedTable,
  selectedCell,
  onApply
}) {
  const [activeTab, setActiveTab] = useState('table'); // 'table', 'row', 'column', 'cell', 'altText'

  // Table Tab state
  const [tableWidthEnabled, setTableWidthEnabled] = useState(false);
  const [tableWidth, setTableWidth] = useState(16.5);
  const [tableWidthUnit, setTableWidthUnit] = useState('cm'); // 'cm', 'percent'
  const [tableAlignment, setTableAlignment] = useState('center'); // 'left', 'center', 'right'
  const [tableIndent, setTableIndent] = useState(0);
  const [tableWrapping, setTableWrapping] = useState('none'); // 'none', 'around'

  // Row Tab state
  const [rowHeightEnabled, setRowHeightEnabled] = useState(false);
  const [rowHeight, setRowHeight] = useState(0.8);
  const [rowHeightType, setRowHeightType] = useState('atLeast'); // 'atLeast', 'exactly'
  const [allowBreakAcrossPages, setAllowBreakAcrossPages] = useState(true);
  const [repeatHeaderRow, setRepeatHeaderRow] = useState(false);

  // Column Tab state
  const [colWidthEnabled, setColWidthEnabled] = useState(false);
  const [colWidth, setColWidth] = useState(3.5);
  const [colWidthUnit, setColWidthUnit] = useState('cm');

  // Cell Tab state
  const [cellWidthEnabled, setCellWidthEnabled] = useState(false);
  const [cellWidth, setCellWidth] = useState(3.5);
  const [cellWidthUnit, setCellWidthUnit] = useState('cm');
  const [cellVAlign, setCellVAlign] = useState('top'); // 'top', 'center', 'bottom'

  // Alt Text state
  const [altTitle, setAltTitle] = useState('');
  const [altDesc, setAltDesc] = useState('');

  // Borders & Shading sub-tab or values
  const [borderColor, setBorderColor] = useState('#cbd5e1');
  const [borderWidth, setBorderWidth] = useState('1');
  const [shadingColor, setShadingColor] = useState('transparent');

  useEffect(() => {
    if (selectedTable && isOpen) {
      // Read current table values
      const currentWidth = selectedTable.style.width;
      if (currentWidth && currentWidth !== 'auto') {
        setTableWidthEnabled(true);
        if (currentWidth.includes('%')) {
          setTableWidth(parseFloat(currentWidth) || 100);
          setTableWidthUnit('percent');
        } else {
          const pxVal = parseFloat(currentWidth) || 500;
          setTableWidth(+(pxVal / 37.795).toFixed(2));
          setTableWidthUnit('cm');
        }
      }
      
      const align = selectedTable.style.margin === '0px auto' || selectedTable.style.marginLeft === 'auto'
        ? 'center'
        : selectedTable.style.marginLeft ? 'left' : 'left';
      setTableAlignment(align);

      if (selectedCell) {
        const row = selectedCell.closest('tr');
        if (row && row.style.height) {
          setRowHeightEnabled(true);
          setRowHeight(+(parseFloat(row.style.height) / 37.795).toFixed(2) || 0.8);
        }
        if (selectedCell.style.width) {
          setCellWidthEnabled(true);
          setCellWidth(+(parseFloat(selectedCell.style.width) / 37.795).toFixed(2) || 3.5);
        }
        setCellVAlign(selectedCell.style.verticalAlign || 'middle');
      }

      setAltTitle(selectedTable.getAttribute('data-title') || '');
      setAltDesc(selectedTable.getAttribute('data-desc') || '');
    }
  }, [selectedTable, selectedCell, isOpen]);

  if (!isOpen || !selectedTable) return null;

  const handleSave = () => {
    // 1. Table Tab
    if (tableWidthEnabled) {
      selectedTable.style.width = tableWidthUnit === 'percent' ? `${tableWidth}%` : `${tableWidth * 37.795}px`;
    }

    if (tableAlignment === 'center') {
      selectedTable.style.marginLeft = 'auto';
      selectedTable.style.marginRight = 'auto';
    } else if (tableAlignment === 'right') {
      selectedTable.style.marginLeft = 'auto';
      selectedTable.style.marginRight = '0';
    } else {
      selectedTable.style.marginLeft = `${tableIndent}cm`;
      selectedTable.style.marginRight = 'auto';
    }

    if (tableWrapping === 'around') {
      selectedTable.style.float = 'left';
      selectedTable.style.marginRight = '12pt';
      selectedTable.style.marginBottom = '6pt';
    } else {
      selectedTable.style.float = 'none';
    }

    // 2. Row Tab
    if (selectedCell) {
      const row = selectedCell.closest('tr');
      if (row) {
        if (rowHeightEnabled) {
          row.style.height = `${rowHeight * 37.795}px`;
        }
        if (repeatHeaderRow) {
          const tbody = selectedTable.querySelector('tbody') || selectedTable;
          const thead = selectedTable.querySelector('thead');
          if (!thead && selectedTable.rows[0]) {
            const newThead = document.createElement('thead');
            newThead.appendChild(selectedTable.rows[0]);
            selectedTable.insertBefore(newThead, selectedTable.firstChild);
          }
        }
      }
    }

    // 3. Column / Cell Tab
    if (selectedCell) {
      if (cellWidthEnabled) {
        selectedCell.style.width = cellWidthUnit === 'percent' ? `${cellWidth}%` : `${cellWidth * 37.795}px`;
      }
      selectedCell.style.verticalAlign = cellVAlign;
    }

    // Alt text
    if (altTitle) selectedTable.setAttribute('data-title', altTitle);
    if (altDesc) selectedTable.setAttribute('data-desc', altDesc);

    if (onApply) onApply();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-[1px] select-none font-sans text-xs">
      <div className="w-[520px] bg-[#fdfdfd] border border-slate-400 shadow-2xl rounded-sm flex flex-col text-slate-800">
        
        {/* Title Bar (persis Microsoft Word dialog) */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#f0f0f0] border-b border-slate-300">
          <span className="font-semibold text-slate-700 text-xs">Table Properties</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-red-600 hover:bg-slate-200 rounded transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center px-2 pt-2 bg-[#f0f0f0] border-b border-slate-300 gap-1 text-[11px]">
          {[
            { id: 'table', label: 'Table' },
            { id: 'row', label: 'Row' },
            { id: 'column', label: 'Column' },
            { id: 'cell', label: 'Cell' },
            { id: 'altText', label: 'Alt Text' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 font-medium border-t border-l border-r rounded-t transition ${
                activeTab === tab.id
                  ? 'bg-white border-slate-300 border-b-white text-[#185abd] -mb-[1px] font-semibold'
                  : 'bg-[#e5e5e5] border-transparent text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 bg-white flex-1 min-h-[290px] space-y-4">
          
          {/* TAB 1: TABLE */}
          {activeTab === 'table' && (
            <div className="space-y-4">
              {/* Size Group */}
              <fieldset className="border border-slate-300 p-2.5 rounded text-slate-700">
                <legend className="px-1 text-[11px] font-semibold text-slate-600">Size</legend>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tableWidthEnabled}
                      onChange={(e) => setTableWidthEnabled(e.target.checked)}
                      className="rounded text-[#185abd]"
                    />
                    <span>Preferred width:</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    disabled={!tableWidthEnabled}
                    value={tableWidth}
                    onChange={(e) => setTableWidth(parseFloat(e.target.value) || 0)}
                    className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-right disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <select
                    disabled={!tableWidthEnabled}
                    value={tableWidthUnit}
                    onChange={(e) => setTableWidthUnit(e.target.value)}
                    className="border border-slate-300 px-1 py-0.5 rounded disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="cm">Centimeters</option>
                    <option value="percent">Percent</option>
                  </select>
                </div>
              </fieldset>

              {/* Alignment Group */}
              <fieldset className="border border-slate-300 p-2.5 rounded text-slate-700">
                <legend className="px-1 text-[11px] font-semibold text-slate-600">Alignment</legend>
                <div className="flex items-center justify-around py-1">
                  {[
                    { id: 'left', label: 'Left', icon: '⫷' },
                    { id: 'center', label: 'Center', icon: '☰' },
                    { id: 'right', label: 'Right', icon: '⫸' }
                  ].map(align => (
                    <button
                      key={align.id}
                      type="button"
                      onClick={() => setTableAlignment(align.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded w-20 border transition ${
                        tableAlignment === align.id
                          ? 'border-[#185abd] bg-blue-50 text-[#185abd] font-semibold shadow-inner'
                          : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="text-base leading-none mb-1">{align.icon}</span>
                      <span className="text-[11px]">{align.label}</span>
                    </button>
                  ))}
                </div>
                {tableAlignment === 'left' && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                    <span>Indent from left:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={tableIndent}
                      onChange={(e) => setTableIndent(parseFloat(e.target.value) || 0)}
                      className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-right"
                    />
                    <span>cm</span>
                  </div>
                )}
              </fieldset>

              {/* Text Wrapping Group */}
              <fieldset className="border border-slate-300 p-2.5 rounded text-slate-700">
                <legend className="px-1 text-[11px] font-semibold text-slate-600">Text wrapping</legend>
                <div className="flex items-center gap-6 py-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="wrapping"
                      checked={tableWrapping === 'none'}
                      onChange={() => setTableWrapping('none')}
                      className="text-[#185abd]"
                    />
                    <span>None</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="wrapping"
                      checked={tableWrapping === 'around'}
                      onChange={() => setTableWrapping('around')}
                      className="text-[#185abd]"
                    />
                    <span>Around</span>
                  </label>
                </div>
              </fieldset>
            </div>
          )}

          {/* TAB 2: ROW */}
          {activeTab === 'row' && (
            <div className="space-y-4">
              <fieldset className="border border-slate-300 p-2.5 rounded text-slate-700">
                <legend className="px-1 text-[11px] font-semibold text-slate-600">Size</legend>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rowHeightEnabled}
                      onChange={(e) => setRowHeightEnabled(e.target.checked)}
                      className="rounded text-[#185abd]"
                    />
                    <span>Specify height:</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    disabled={!rowHeightEnabled}
                    value={rowHeight}
                    onChange={(e) => setRowHeight(parseFloat(e.target.value) || 0)}
                    className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-right disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <span>cm</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">Row height is:</span>
                    <select
                      disabled={!rowHeightEnabled}
                      value={rowHeightType}
                      onChange={(e) => setRowHeightType(e.target.value)}
                      className="border border-slate-300 px-1 py-0.5 rounded disabled:bg-slate-100 text-[11px]"
                    >
                      <option value="atLeast">At least</option>
                      <option value="exactly">Exactly</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              <fieldset className="border border-slate-300 p-2.5 rounded text-slate-700">
                <legend className="px-1 text-[11px] font-semibold text-slate-600">Options</legend>
                <div className="space-y-2 py-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowBreakAcrossPages}
                      onChange={(e) => setAllowBreakAcrossPages(e.target.checked)}
                      className="rounded text-[#185abd]"
                    />
                    <span>Allow row to break across pages</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={repeatHeaderRow}
                      onChange={(e) => setRepeatHeaderRow(e.target.checked)}
                      className="rounded text-[#185abd]"
                    />
                    <span>Repeat as header row at the top of each page</span>
                  </label>
                </div>
              </fieldset>
            </div>
          )}

          {/* TAB 3: COLUMN */}
          {activeTab === 'column' && (
            <div className="space-y-4">
              <fieldset className="border border-slate-300 p-2.5 rounded text-slate-700">
                <legend className="px-1 text-[11px] font-semibold text-slate-600">Size</legend>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={colWidthEnabled}
                      onChange={(e) => setColWidthEnabled(e.target.checked)}
                      className="rounded text-[#185abd]"
                    />
                    <span>Preferred width:</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    disabled={!colWidthEnabled}
                    value={colWidth}
                    onChange={(e) => setColWidth(parseFloat(e.target.value) || 0)}
                    className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-right disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <select
                    disabled={!colWidthEnabled}
                    value={colWidthUnit}
                    onChange={(e) => setColWidthUnit(e.target.value)}
                    className="border border-slate-300 px-1 py-0.5 rounded disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="cm">Centimeters</option>
                    <option value="percent">Percent</option>
                  </select>
                </div>
              </fieldset>
            </div>
          )}

          {/* TAB 4: CELL */}
          {activeTab === 'cell' && (
            <div className="space-y-4">
              <fieldset className="border border-slate-300 p-2.5 rounded text-slate-700">
                <legend className="px-1 text-[11px] font-semibold text-slate-600">Size</legend>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cellWidthEnabled}
                      onChange={(e) => setCellWidthEnabled(e.target.checked)}
                      className="rounded text-[#185abd]"
                    />
                    <span>Preferred width:</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    disabled={!cellWidthEnabled}
                    value={cellWidth}
                    onChange={(e) => setCellWidth(parseFloat(e.target.value) || 0)}
                    className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-right disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <select
                    disabled={!cellWidthEnabled}
                    value={cellWidthUnit}
                    onChange={(e) => setCellWidthUnit(e.target.value)}
                    className="border border-slate-300 px-1 py-0.5 rounded disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="cm">Centimeters</option>
                    <option value="percent">Percent</option>
                  </select>
                </div>
              </fieldset>

              <fieldset className="border border-slate-300 p-2.5 rounded text-slate-700">
                <legend className="px-1 text-[11px] font-semibold text-slate-600">Vertical alignment</legend>
                <div className="flex items-center justify-around py-1">
                  {[
                    { id: 'top', label: 'Top', icon: '▔' },
                    { id: 'middle', label: 'Center', icon: '☰' },
                    { id: 'bottom', label: 'Bottom', icon: ' ' }
                  ].map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setCellVAlign(v.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded w-20 border transition ${
                        cellVAlign === v.id
                          ? 'border-[#185abd] bg-blue-50 text-[#185abd] font-semibold shadow-inner'
                          : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="text-base leading-none mb-1 font-mono">{v.icon}</span>
                      <span className="text-[11px]">{v.label}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          {/* TAB 5: ALT TEXT */}
          {activeTab === 'altText' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Title:</label>
                <input
                  type="text"
                  value={altTitle}
                  onChange={(e) => setAltTitle(e.target.value)}
                  placeholder="Judul Tabel..."
                  className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:border-[#185abd]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Description:</label>
                <textarea
                  rows={4}
                  value={altDesc}
                  onChange={(e) => setAltDesc(e.target.value)}
                  placeholder="Deskripsi atau rincian tabel..."
                  className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:border-[#185abd] resize-none"
                />
              </div>
            </div>
          )}

        </div>

        {/* Dialog Actions Footer */}
        <div className="flex items-center justify-end gap-2 px-3 py-2 bg-[#f0f0f0] border-t border-slate-300">
          <button
            type="button"
            onClick={handleSave}
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
