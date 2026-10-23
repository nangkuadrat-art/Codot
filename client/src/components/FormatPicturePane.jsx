import React, { useState } from 'react';
import {
  X,
  Palette,
  Sparkles,
  Maximize2,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Sun,
  Sliders,
  Crop as CropIcon,
  RotateCw,
  Lock,
  Unlock,
  Check
} from 'lucide-react';

export default function FormatPicturePane({
  visible,
  onClose,
  selectedImage,
  onUpdateImageStyle
}) {
  const [activeTab, setActiveTab] = useState('PICTURE'); // 'FILL_LINE', 'EFFECTS', 'LAYOUT_PROPS', 'PICTURE'
  const [openSections, setOpenSections] = useState({
    line: true,
    shadow: true,
    reflection: false,
    glow: false,
    softEdges: false,
    size: true,
    altText: false,
    corrections: true,
    color: true,
    transparency: true,
    crop: false
  });

  if (!visible || !selectedImage) return null;

  const toggleSection = (sec) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const currentWidthCm = parseFloat(selectedImage?.widthCm || '15.99');
  const currentHeightCm = parseFloat(selectedImage?.heightCm || '11.31');
  const isLocked = selectedImage?.lockAspectRatio !== false;

  return (
    <div className="w-80 border-l border-[#d2d0ce] bg-[#f8f9fa] flex flex-col h-full shadow-lg z-30 select-none text-xs text-slate-800 font-sans shrink-0">
      {/* Header Ala Microsoft Word Task Pane */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#e1dfdd] bg-[#f3f2f1]">
        <span className="font-semibold text-slate-800 text-[13px]">Format Picture</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition"
          title="Tutup Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 4 Word Task Pane Tabs (Icons) */}
      <div className="flex items-center justify-around border-b border-[#e1dfdd] bg-white px-2 py-1">
        {[
          { id: 'FILL_LINE', label: 'Fill & Line', icon: Palette, title: 'Fill & Line' },
          { id: 'EFFECTS', label: 'Effects', icon: Sparkles, title: 'Effects (Shadow, Glow, Reflection)' },
          { id: 'LAYOUT_PROPS', label: 'Layout & Properties', icon: Maximize2, title: 'Size & Properties' },
          { id: 'PICTURE', label: 'Picture', icon: ImageIcon, title: 'Picture (Color, Corrections, Crop)' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`p-2 rounded-sm transition flex items-center justify-center relative ${
                isActive
                  ? 'text-[#185abd] bg-blue-50/70 border-b-2 border-[#185abd]'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title={tab.title}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Task Pane Body Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        
        {/* ================= TAB 1: FILL & LINE ================= */}
        {activeTab === 'FILL_LINE' && (
          <div className="space-y-3">
            {/* Line Section */}
            <div className="border border-slate-200 rounded bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('line')}
                className="w-full px-2.5 py-1.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 text-left font-semibold text-slate-700"
              >
                <span>Line / Border</span>
                {openSections.line ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {openSections.line && (
                <div className="p-2.5 space-y-2.5">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500">Border Color:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedImage.borderColor || '#000000'}
                        onChange={(e) => onUpdateImageStyle({ borderColor: e.target.value })}
                        className="w-8 h-6 p-0 border border-slate-300 rounded cursor-pointer"
                      />
                      <span className="font-mono text-[11px] text-slate-600">
                        {selectedImage.borderColor || '#000000'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Width (Ketebalan):</span>
                      <span className="font-mono font-bold text-slate-700">{selectedImage.borderWidthPt || 1} pt</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={selectedImage.borderWidthPt || 1}
                      onChange={(e) => onUpdateImageStyle({ borderWidthPt: parseFloat(e.target.value) })}
                      className="w-full accent-[#185abd]"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500">Dash Type:</span>
                    <select
                      value={selectedImage.borderStyle || 'solid'}
                      onChange={(e) => onUpdateImageStyle({ borderStyle: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1 bg-white text-[11px]"
                    >
                      <option value="solid">Solid (Garis Penuh)</option>
                      <option value="dashed">Dashed (Putus-putus)</option>
                      <option value="dotted">Dotted (Titik-titik)</option>
                      <option value="double">Double (Ganda)</option>
                      <option value="none">No Line (Tanpa Garis)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: EFFECTS ================= */}
        {activeTab === 'EFFECTS' && (
          <div className="space-y-3">
            {/* Shadow Section */}
            <div className="border border-slate-200 rounded bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('shadow')}
                className="w-full px-2.5 py-1.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 text-left font-semibold text-slate-700"
              >
                <span>Shadow (Bayangan)</span>
                {openSections.shadow ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {openSections.shadow && (
                <div className="p-2.5 space-y-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: 'None', shadow: 'none' },
                      { label: 'Offset Bottom', shadow: '0 6px 14px rgba(0,0,0,0.3)' },
                      { label: 'Offset Right', shadow: '6px 4px 14px rgba(0,0,0,0.3)' },
                      { label: 'Soft Halo', shadow: '0 0 16px rgba(0,0,0,0.2)' }
                    ].map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onUpdateImageStyle({ boxShadow: s.shadow })}
                        className="px-2 py-1 border border-slate-200 hover:border-[#185abd] hover:bg-blue-50/50 rounded text-[10px] text-center"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Glow Section */}
            <div className="border border-slate-200 rounded bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('glow')}
                className="w-full px-2.5 py-1.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 text-left font-semibold text-slate-700"
              >
                <span>Glow (Pendaran Cahaya)</span>
                {openSections.glow ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {openSections.glow && (
                <div className="p-2.5 space-y-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: 'Blue Glow', shadow: '0 0 16px rgba(37,99,235,0.7)' },
                      { label: 'Gold Glow', shadow: '0 0 16px rgba(217,119,6,0.7)' },
                      { label: 'Green Glow', shadow: '0 0 16px rgba(22,163,74,0.7)' },
                      { label: 'No Glow', shadow: 'none' }
                    ].map((g, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onUpdateImageStyle({ boxShadow: g.shadow })}
                        className="px-2 py-1 border border-slate-200 hover:border-[#185abd] hover:bg-blue-50/50 rounded text-[10px] text-center"
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Soft Edges Section */}
            <div className="border border-slate-200 rounded bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('softEdges')}
                className="w-full px-2.5 py-1.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 text-left font-semibold text-slate-700"
              >
                <span>Soft Edges (Tepi Halus)</span>
                {openSections.softEdges ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {openSections.softEdges && (
                <div className="p-2.5 space-y-2">
                  <div className="grid grid-cols-3 gap-1">
                    {[0, 4, 8, 16, 24, 32].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => onUpdateImageStyle({ borderRadius: `${r}px` })}
                        className="p-1 border border-slate-200 hover:border-[#185abd] hover:bg-blue-50 rounded text-[10px] text-center"
                      >
                        {r === 0 ? '0 pt' : `${r} px`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: LAYOUT & PROPERTIES ================= */}
        {activeTab === 'LAYOUT_PROPS' && (
          <div className="space-y-3">
            {/* Size Section in CM */}
            <div className="border border-slate-200 rounded bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('size')}
                className="w-full px-2.5 py-1.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 text-left font-semibold text-slate-700"
              >
                <span>Size (Ukuran Presisi)</span>
                {openSections.size ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {openSections.size && (
                <div className="p-2.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600">Height (Tinggi):</span>
                    <div className="flex items-center gap-1 font-mono">
                      <input
                        type="number"
                        step="0.1"
                        value={currentHeightCm}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1;
                          let newW = currentWidthCm;
                          if (isLocked && selectedImage?.aspectRatio) {
                            newW = +(val * selectedImage.aspectRatio).toFixed(2);
                          }
                          onUpdateImageStyle({ heightCm: val, widthCm: newW });
                        }}
                        className="w-16 border border-slate-300 rounded px-1.5 py-0.5 text-right text-xs"
                      />
                      <span className="text-slate-500">cm</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600">Width (Lebar):</span>
                    <div className="flex items-center gap-1 font-mono">
                      <input
                        type="number"
                        step="0.1"
                        value={currentWidthCm}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1;
                          let newH = currentHeightCm;
                          if (isLocked && selectedImage?.aspectRatio) {
                            newH = +(val / selectedImage.aspectRatio).toFixed(2);
                          }
                          onUpdateImageStyle({ widthCm: val, heightCm: newH });
                        }}
                        className="w-16 border border-slate-300 rounded px-1.5 py-0.5 text-right text-xs"
                      />
                      <span className="text-slate-500">cm</span>
                    </div>
                  </div>

                  {/* Lock Aspect Ratio */}
                  <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-slate-100 text-[11px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={isLocked}
                      onChange={(e) => onUpdateImageStyle({ lockAspectRatio: e.target.checked })}
                      className="rounded text-[#185abd]"
                    />
                    <span>Lock aspect ratio (Kunci perbandingan)</span>
                  </label>

                  {/* Rotation */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-[11px] text-slate-600">Rotation:</span>
                    <div className="flex items-center gap-1 font-mono">
                      <input
                        type="number"
                        step="15"
                        value={selectedImage.rotateDeg || 0}
                        onChange={(e) => onUpdateImageStyle({ rotateDeg: parseInt(e.target.value, 10) || 0 })}
                        className="w-16 border border-slate-300 rounded px-1.5 py-0.5 text-right text-xs"
                      />
                      <span className="text-slate-500">°</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Alt Text Section */}
            <div className="border border-slate-200 rounded bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('altText')}
                className="w-full px-2.5 py-1.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 text-left font-semibold text-slate-700"
              >
                <span>Alt Text (Aksesibilitas)</span>
                {openSections.altText ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {openSections.altText && (
                <div className="p-2.5 space-y-2">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500">Deskripsi Alternatif:</span>
                    <textarea
                      rows={3}
                      value={selectedImage.altText || ''}
                      onChange={(e) => onUpdateImageStyle({ altText: e.target.value })}
                      placeholder="Jelaskan konten gambar ini untuk pembaca dokumen..."
                      className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: PICTURE ================= */}
        {activeTab === 'PICTURE' && (
          <div className="space-y-3">
            {/* Picture Corrections */}
            <div className="border border-slate-200 rounded bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('corrections')}
                className="w-full px-2.5 py-1.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 text-left font-semibold text-slate-700"
              >
                <span>Picture Corrections</span>
                {openSections.corrections ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {openSections.corrections && (
                <div className="p-2.5 space-y-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Brightness (Kecerahan):</span>
                      <span className="font-mono">{Math.round(((selectedImage.brightness || 1) - 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={selectedImage.brightness || 1}
                      onChange={(e) => onUpdateImageStyle({ brightness: parseFloat(e.target.value) })}
                      className="w-full accent-[#185abd]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Contrast (Kontras):</span>
                      <span className="font-mono">{Math.round(((selectedImage.contrast || 1) - 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={selectedImage.contrast || 1}
                      onChange={(e) => onUpdateImageStyle({ contrast: parseFloat(e.target.value) })}
                      className="w-full accent-[#185abd]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Blur / Soften:</span>
                      <span className="font-mono">{selectedImage.blur || 0} px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      step="0.5"
                      value={selectedImage.blur || 0}
                      onChange={(e) => onUpdateImageStyle({ blur: parseFloat(e.target.value) })}
                      className="w-full accent-[#185abd]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Picture Color */}
            <div className="border border-slate-200 rounded bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('color')}
                className="w-full px-2.5 py-1.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 text-left font-semibold text-slate-700"
              >
                <span>Picture Color (Warna)</span>
                {openSections.color ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {openSections.color && (
                <div className="p-2.5 space-y-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Saturation:</span>
                      <span className="font-mono">{Math.round((selectedImage.saturation ?? 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={selectedImage.saturation ?? 1}
                      onChange={(e) => onUpdateImageStyle({ saturation: parseFloat(e.target.value) })}
                      className="w-full accent-[#185abd]"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500">Recolor Mode:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { label: 'Normal', mode: 'none' },
                        { label: 'Grayscale', mode: 'grayscale' },
                        { label: 'Sepia', mode: 'sepia' },
                        { label: 'Washout', mode: 'washout' },
                        { label: 'B & W', mode: 'bw' },
                        { label: 'Invert', mode: 'invert' }
                      ].map(m => (
                        <button
                          key={m.mode}
                          type="button"
                          onClick={() => onUpdateImageStyle({ recolor: m.mode })}
                          className={`p-1 border rounded text-[10px] text-center ${
                            (selectedImage.recolor || 'none') === m.mode
                              ? 'border-[#185abd] bg-blue-50 text-[#185abd] font-bold'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Picture Transparency */}
            <div className="border border-slate-200 rounded bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('transparency')}
                className="w-full px-2.5 py-1.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 text-left font-semibold text-slate-700"
              >
                <span>Picture Transparency</span>
                {openSections.transparency ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {openSections.transparency && (
                <div className="p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Transparency:</span>
                    <span className="font-mono">{Math.round((1 - (selectedImage.opacity ?? 1)) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={1 - (selectedImage.opacity ?? 1)}
                    onChange={(e) => onUpdateImageStyle({ opacity: 1 - parseFloat(e.target.value) })}
                    className="w-full accent-[#185abd]"
                  />
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
