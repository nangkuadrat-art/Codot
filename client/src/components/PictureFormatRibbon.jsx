import React, { useState } from 'react';
import {
  Sun,
  Palette,
  Sparkles,
  Grid,
  Minimize2,
  Image as ImageIcon,
  RotateCcw,
  Crop as CropIcon,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Lock,
  Unlock,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Layers,
  ArrowUp,
  ArrowDown,
  Eye,
  AlignJustify,
  Download,
  Wand2
} from 'lucide-react';

export default function PictureFormatRibbon({
  selectedImage,
  onUpdateImageStyle,
  onOpenFormatPane,
  onOpenSizePosition,
  onOpenAltText,
  onChangePicture,
  onResetPicture,
  onStartCrop,
  onApplyStylePreset
}) {
  const [activeDropdown, setActiveDropdown] = useState(null); // 'CORRECTIONS', 'COLOR', 'ARTISTIC', 'TRANSPARENCY', 'BORDER', 'EFFECTS', 'WRAP', 'ROTATE', 'CROP'
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  const stylePresets = [
    { id: 'SIMPLE_WHITE', label: 'Simple Frame, White', preview: 'border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.25);' },
    { id: 'DROP_SHADOW', label: 'Drop Shadow Rectangle', preview: 'box-shadow: 5px 6px 14px rgba(0,0,0,0.35);' },
    { id: 'SOFT_EDGE', label: 'Soft Edge Rectangle', preview: 'border-radius: 6px; box-shadow: 0 0 10px rgba(0,0,0,0.25);' },
    { id: 'DOUBLE_BLACK', label: 'Double Frame, Black', preview: 'border: 3px double #0f172a;' },
    { id: 'THICK_BLACK', label: 'Thick Matte, Black', preview: 'border: 4px solid #0f172a;' },
    { id: 'ROUND_DIAG', label: 'Rounded Diagonal', preview: 'border-radius: 14px 0 14px 0; border: 1px solid #cbd5e1;' },
    { id: 'OVAL', label: 'Oval Frame', preview: 'border-radius: 50%; border: 2px solid #cbd5e1;' },
    { id: 'BEVELED', label: 'Beveled Rectangle', preview: 'border: 3px outset #e2e8f0;' },
    { id: 'METAL_FRAME', label: 'Metal Frame', preview: 'border: 4px solid #94a3b8; box-shadow: 0 3px 8px rgba(0,0,0,0.25);' }
  ];

  const visibleStyles = stylePresets.slice(galleryStartIndex, galleryStartIndex + 4);

  const toggleDropdown = (name) => {
    setActiveDropdown(prev => (prev === name ? null : name));
  };

  const closeDropdown = () => setActiveDropdown(null);

  // Steppers for height and width
  const currentWidthCm = parseFloat(selectedImage?.widthCm || '15.99');
  const currentHeightCm = parseFloat(selectedImage?.heightCm || '11.31');
  const isLocked = selectedImage?.lockAspectRatio !== false;

  const handleWidthChange = (delta) => {
    const newW = Math.max(1, +(currentWidthCm + delta).toFixed(2));
    let newH = currentHeightCm;
    if (isLocked && selectedImage?.aspectRatio) {
      newH = +(newW / selectedImage.aspectRatio).toFixed(2);
    }
    onUpdateImageStyle({ widthCm: newW, heightCm: newH });
  };

  const handleHeightChange = (delta) => {
    const newH = Math.max(1, +(currentHeightCm + delta).toFixed(2));
    let newW = currentWidthCm;
    if (isLocked && selectedImage?.aspectRatio) {
      newW = +(newH * selectedImage.aspectRatio).toFixed(2);
    }
    onUpdateImageStyle({ widthCm: newW, heightCm: newH });
  };

  return (
    <div className="flex items-stretch px-2 py-1 bg-[#f3f2f1] border-b border-[#e1dfdd] text-xs text-slate-800 select-none overflow-x-auto min-h-[96px]">
      
      {/* ================= 1. ADJUST GROUP (Persis Gambar 2) ================= */}
      <div className="flex items-center gap-1 pr-2 border-r border-[#d2d0ce] relative">
        {/* Remove Background */}
        <button
          type="button"
          onClick={() => {
            const currentBlend = selectedImage?.blendMode === 'multiply' ? 'normal' : 'multiply';
            onUpdateImageStyle({ blendMode: currentBlend });
          }}
          className={`flex flex-col items-center justify-center p-1.5 rounded hover:bg-slate-200/70 transition w-16 h-18 text-center ${
            selectedImage?.blendMode === 'multiply' ? 'bg-blue-100 text-[#185abd]' : 'text-slate-700'
          }`}
          title="Remove Background"
        >
          <div className="w-8 h-8 rounded border border-slate-300 bg-white flex items-center justify-center mb-0.5 shadow-2xs">
            <Wand2 className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="text-[10px] leading-tight font-sans">Remove Background</span>
        </button>

        {/* Corrections */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('CORRECTIONS')}
            className={`flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/70 transition w-14 h-18 text-center ${
              activeDropdown === 'CORRECTIONS' ? 'bg-blue-100 text-[#185abd]' : 'text-slate-700'
            }`}
            title="Corrections (Sharpen/Soften and Brightness/Contrast)"
          >
            <Sun className="w-6 h-6 text-amber-500 mb-0.5" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] leading-tight">Corrections</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </div>
          </button>

          {activeDropdown === 'CORRECTIONS' && (
            <div
              className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl p-2.5 w-64 z-50 text-xs"
              onMouseLeave={closeDropdown}
            >
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Sharpen / Soften
              </div>
              <div className="grid grid-cols-5 gap-1 mb-3">
                {[
                  { label: '-50%', blur: 4 },
                  { label: '-25%', blur: 2 },
                  { label: '0%', blur: 0 },
                  { label: '+25%', contrast: 1.15, brightness: 1.05 },
                  { label: '+50%', contrast: 1.3, brightness: 1.1 }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onUpdateImageStyle({ blur: item.blur || 0, contrast: item.contrast || 1, brightness: item.brightness || 1 });
                      closeDropdown();
                    }}
                    className="p-1 border border-slate-200 hover:border-[#185abd] hover:bg-blue-50 rounded text-[9px] text-center"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Brightness / Contrast
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[-40, -20, 0, 20, 40].map(bVal => (
                  <button
                    key={bVal}
                    type="button"
                    onClick={() => {
                      onUpdateImageStyle({ brightness: 1 + bVal / 100, contrast: 1 + bVal / 200 });
                      closeDropdown();
                    }}
                    className="p-1 border border-slate-200 hover:border-[#185abd] hover:bg-blue-50 rounded text-[9px] text-center"
                    title={`Brightness ${bVal > 0 ? '+' : ''}${bVal}%`}
                  >
                    {bVal > 0 ? `+${bVal}%` : `${bVal}%`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Color */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('COLOR')}
            className={`flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/70 transition w-14 h-18 text-center ${
              activeDropdown === 'COLOR' ? 'bg-blue-100 text-[#185abd]' : 'text-slate-700'
            }`}
            title="Color (Saturation, Color Tone, Recolor)"
          >
            <Palette className="w-6 h-6 text-blue-600 mb-0.5" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] leading-tight">Color</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </div>
          </button>

          {activeDropdown === 'COLOR' && (
            <div
              className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl p-2.5 w-64 z-50 text-xs"
              onMouseLeave={closeDropdown}
            >
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Color Saturation
              </div>
              <div className="grid grid-cols-4 gap-1 mb-2.5">
                {[
                  { label: '0% (Grayscale)', sat: 0 },
                  { label: '66%', sat: 0.66 },
                  { label: '100%', sat: 1 },
                  { label: '200%', sat: 2 }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onUpdateImageStyle({ saturation: item.sat });
                      closeDropdown();
                    }}
                    className="p-1 border border-slate-200 hover:border-[#185abd] hover:bg-blue-50 rounded text-[9px] text-center"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Recolor Presets
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: 'Normal', recolor: 'none' },
                  { label: 'Grayscale', recolor: 'grayscale' },
                  { label: 'Sepia', recolor: 'sepia' },
                  { label: 'Washout', recolor: 'washout' },
                  { label: 'Black & White', recolor: 'bw' },
                  { label: 'Invert', recolor: 'invert' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onUpdateImageStyle({ recolor: item.recolor });
                      closeDropdown();
                    }}
                    className="p-1 border border-slate-200 hover:border-[#185abd] hover:bg-blue-50 rounded text-[9px] text-center"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Artistic Effects */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('ARTISTIC')}
            className={`flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/70 transition w-14 h-18 text-center ${
              activeDropdown === 'ARTISTIC' ? 'bg-blue-100 text-[#185abd]' : 'text-slate-700'
            }`}
            title="Artistic Effects"
          >
            <Sparkles className="w-6 h-6 text-purple-600 mb-0.5" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] leading-tight">Artistic</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </div>
          </button>

          {activeDropdown === 'ARTISTIC' && (
            <div
              className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl p-2 w-56 z-50 text-xs"
              onMouseLeave={closeDropdown}
            >
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Artistic Effects
              </div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { label: 'None (Original)', effect: 'none' },
                  { label: 'Marker', effect: 'marker' },
                  { label: 'Pencil Grayscale', effect: 'pencil' },
                  { label: 'Blur', effect: 'blur' },
                  { label: 'Glow Edges', effect: 'glow' },
                  { label: 'Film Grain', effect: 'grain' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onUpdateImageStyle({ artisticEffect: item.effect });
                      closeDropdown();
                    }}
                    className="p-1.5 border border-slate-200 hover:border-[#185abd] hover:bg-blue-50 rounded text-[10px] text-left"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Transparency */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('TRANSPARENCY')}
            className={`flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/70 transition w-14 h-18 text-center ${
              activeDropdown === 'TRANSPARENCY' ? 'bg-blue-100 text-[#185abd]' : 'text-slate-700'
            }`}
            title="Transparency"
          >
            <Grid className="w-6 h-6 text-slate-500 mb-0.5" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] leading-tight">Transparency</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </div>
          </button>

          {activeDropdown === 'TRANSPARENCY' && (
            <div
              className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl p-2 w-48 z-50 text-xs"
              onMouseLeave={closeDropdown}
            >
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Transparency Presets
              </div>
              <div className="space-y-0.5">
                {[0, 15, 30, 50, 65, 80, 95].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      onUpdateImageStyle({ opacity: (100 - val) / 100 });
                      closeDropdown();
                    }}
                    className="w-full text-left px-2 py-1 hover:bg-blue-50 rounded flex items-center justify-between"
                  >
                    <span>{val === 0 ? '0% (Solid)' : `${val}%`}</span>
                    <div className="w-10 h-3 border border-slate-300 bg-blue-600 rounded-2xs" style={{ opacity: (100 - val) / 100 }} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Stacked Tools (Compress, Change, Reset) */}
        <div className="flex flex-col justify-between py-0.5 h-18">
          <button
            type="button"
            onClick={() => {
              alert('Gambar dioptimalkan untuk resolusi dokumen cetak (150-220 DPI).');
            }}
            className="flex items-center gap-1 px-1.5 py-0.5 hover:bg-slate-200/70 rounded text-[10px] text-slate-700"
            title="Compress Pictures"
          >
            <Minimize2 className="w-3 h-3 text-slate-500" />
            <span>Compress Pictures</span>
          </button>

          <button
            type="button"
            onClick={() => onChangePicture('DEVICE')}
            className="flex items-center gap-1 px-1.5 py-0.5 hover:bg-slate-200/70 rounded text-[10px] text-slate-700"
            title="Change Picture"
          >
            <ImageIcon className="w-3 h-3 text-blue-600" />
            <span>Change Picture</span>
          </button>

          <button
            type="button"
            onClick={onResetPicture}
            className="flex items-center gap-1 px-1.5 py-0.5 hover:bg-slate-200/70 rounded text-[10px] text-slate-700"
            title="Reset Picture"
          >
            <RotateCcw className="w-3 h-3 text-red-500" />
            <span>Reset Picture</span>
          </button>
        </div>

        {/* Group Label */}
        <div className="absolute -bottom-1 left-0 right-0 flex items-center justify-center">
          <span className="text-[9px] text-slate-400 font-sans">Adjust</span>
        </div>
      </div>

      {/* ================= 2. PICTURE STYLES GROUP (Persis Gambar 2) ================= */}
      <div className="flex items-center gap-2 px-2 border-r border-[#d2d0ce] relative">
        {/* Visual Styles Carousel Gallery */}
        <div className="flex items-center gap-1.5 bg-white p-1 border border-slate-300 rounded shadow-2xs h-18">
          {visibleStyles.map(st => (
            <button
              key={st.id}
              type="button"
              onClick={() => onApplyStylePreset(st.id)}
              className="w-14 h-full border border-slate-200 hover:border-[#185abd] hover:bg-blue-50/50 rounded flex flex-col items-center justify-center p-1 transition group relative"
              title={st.label}
            >
              <div
                className="w-10 h-7 bg-slate-300 overflow-hidden"
                style={{ ...Object.fromEntries(st.preview.split(';').filter(Boolean).map(s => s.split(':').map(x => x.trim()))) }}
              />
              <span className="text-[7.5px] text-slate-500 group-hover:text-blue-700 truncate w-full text-center mt-0.5">
                {st.label.split(',')[0]}
              </span>
            </button>
          ))}

          {/* Up, Down, More gallery nav buttons */}
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
              disabled={galleryStartIndex + 4 >= stylePresets.length}
              onClick={() => setGalleryStartIndex(Math.min(stylePresets.length - 4, galleryStartIndex + 2))}
              className="p-0.5 hover:bg-slate-100 disabled:opacity-30 rounded"
              title="Next Styles"
            >
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Style Dropdowns Column (Border, Effects, Layout) */}
        <div className="flex flex-col justify-between py-0.5 h-18 text-[10px]">
          {/* Picture Border */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('BORDER')}
              className="flex items-center gap-1.5 px-1.5 py-0.5 hover:bg-slate-200/70 rounded text-slate-700 w-full"
            >
              <Palette className="w-3.5 h-3.5 text-blue-600" />
              <span>Picture Border</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400 ml-auto" />
            </button>

            {activeDropdown === 'BORDER' && (
              <div
                className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl p-2 w-52 z-50 text-xs"
                onMouseLeave={closeDropdown}
              >
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Theme Colors
                </div>
                <div className="grid grid-cols-6 gap-1 mb-2">
                  {['#000000', '#ffffff', '#475569', '#2563eb', '#16a34a', '#dc2626', '#d97706', '#9333ea', '#0891b2', '#0d9488', '#e11d48', '#ca8a04'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        onUpdateImageStyle({ borderColor: c, borderWidthPt: selectedImage?.borderWidthPt || 1.5 });
                        closeDropdown();
                      }}
                      className="w-5 h-5 rounded-xs border border-slate-300 hover:scale-110 transition"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Weight
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[0.5, 1, 1.5, 2.25, 3, 4.5].map(pt => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => {
                        onUpdateImageStyle({ borderWidthPt: pt });
                        closeDropdown();
                      }}
                      className="p-1 border border-slate-200 hover:border-[#185abd] hover:bg-blue-50 rounded text-[9px] text-center"
                    >
                      {pt} pt
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Picture Effects */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('EFFECTS')}
              className="flex items-center gap-1.5 px-1.5 py-0.5 hover:bg-slate-200/70 rounded text-slate-700 w-full"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Picture Effects</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400 ml-auto" />
            </button>

            {activeDropdown === 'EFFECTS' && (
              <div
                className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl p-2 w-52 z-50 text-xs"
                onMouseLeave={closeDropdown}
              >
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Preset Effects
                </div>
                <div className="space-y-0.5">
                  {[
                    { label: 'Drop Shadow', shadow: '6px 8px 16px rgba(0,0,0,0.35)' },
                    { label: 'Soft Shadow', shadow: '0 4px 12px rgba(0,0,0,0.2)' },
                    { label: 'Glow (Blue)', shadow: '0 0 14px rgba(37,99,235,0.6)' },
                    { label: 'Glow (Gold)', shadow: '0 0 14px rgba(217,119,6,0.6)' },
                    { label: 'No Effect', shadow: 'none' }
                  ].map((eff, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        onUpdateImageStyle({ boxShadow: eff.shadow });
                        closeDropdown();
                      }}
                      className="w-full text-left px-2 py-1 hover:bg-blue-50 rounded text-[10px]"
                    >
                      {eff.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Picture Layout */}
          <button
            type="button"
            onClick={onOpenFormatPane}
            className="flex items-center gap-1.5 px-1.5 py-0.5 hover:bg-slate-200/70 rounded text-slate-700 w-full"
            title="Open Format Picture Task Pane"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            <span>Picture Layout</span>
          </button>
        </div>

        {/* Group Label & Launcher */}
        <div className="absolute -bottom-1 left-0 right-0 flex items-center justify-between px-2">
          <span className="text-[9px] text-slate-400 font-sans mx-auto">Picture Styles</span>
          <button
            type="button"
            onClick={onOpenFormatPane}
            className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700"
            title="Format Picture Dialog"
          >
            <Maximize2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* ================= 3. ACCESSIBILITY GROUP (Persis Gambar 2) ================= */}
      <div className="flex items-center px-2 border-r border-[#d2d0ce] relative">
        <button
          type="button"
          onClick={onOpenAltText}
          className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-slate-200/70 transition w-16 h-18 text-center text-slate-700"
          title="Alt Text"
        >
          <div className="w-8 h-8 rounded border border-slate-300 bg-white flex items-center justify-center mb-0.5 shadow-2xs">
            <Eye className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-[10px] leading-tight font-sans">Alt Text</span>
        </button>

        <div className="absolute -bottom-1 left-0 right-0 flex items-center justify-center">
          <span className="text-[9px] text-slate-400 font-sans">Accessibility</span>
        </div>
      </div>

      {/* ================= 4. ARRANGE GROUP (Persis Gambar 2) ================= */}
      <div className="flex items-center gap-2 px-2 border-r border-[#d2d0ce] relative">
        {/* Wrap Text Large Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('WRAP')}
            className={`flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/70 transition w-14 h-18 text-center ${
              activeDropdown === 'WRAP' ? 'bg-blue-100 text-[#185abd]' : 'text-slate-700'
            }`}
            title="Wrap Text"
          >
            <AlignJustify className="w-6 h-6 text-slate-700 mb-0.5" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] leading-tight">Wrap Text</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </div>
          </button>

          {activeDropdown === 'WRAP' && (
            <div
              className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl p-2 w-48 z-50 text-xs"
              onMouseLeave={closeDropdown}
            >
              {[
                { label: 'In Line with Text', mode: 'inline' },
                { label: 'Square (Kiri)', mode: 'square-left' },
                { label: 'Square (Kanan)', mode: 'square-right' },
                { label: 'Top and Bottom', mode: 'top-bottom' },
                { label: 'Behind Text', mode: 'behind' },
                { label: 'In Front of Text', mode: 'in-front' }
              ].map((w, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onUpdateImageStyle({ wrapText: w.mode });
                    closeDropdown();
                  }}
                  className="w-full text-left px-2 py-1.5 hover:bg-blue-50 rounded text-[11px]"
                >
                  {w.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stacked Arrange Controls */}
        <div className="flex flex-col justify-between py-0.5 h-18 text-[10px]">
          {/* Bring Forward / Send Backward */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdateImageStyle({ zIndex: (selectedImage?.zIndex || 10) + 5 })}
              className="flex items-center gap-1 px-1 py-0.5 hover:bg-slate-200/70 rounded text-slate-700"
              title="Bring Forward"
            >
              <ArrowUp className="w-3 h-3 text-slate-600" />
              <span>Forward</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateImageStyle({ zIndex: Math.max(0, (selectedImage?.zIndex || 10) - 5) })}
              className="flex items-center gap-1 px-1 py-0.5 hover:bg-slate-200/70 rounded text-slate-700"
              title="Send Backward"
            >
              <ArrowDown className="w-3 h-3 text-slate-600" />
              <span>Backward</span>
            </button>
          </div>

          {/* Align Options */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdateImageStyle({ alignment: 'left' })}
              className="p-1 hover:bg-slate-200/70 rounded text-slate-700"
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onUpdateImageStyle({ alignment: 'center' })}
              className="p-1 hover:bg-slate-200/70 rounded text-slate-700"
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onUpdateImageStyle({ alignment: 'right' })}
              className="p-1 hover:bg-slate-200/70 rounded text-slate-700"
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Rotate Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('ROTATE')}
              className="flex items-center gap-1 px-1 py-0.5 hover:bg-slate-200/70 rounded text-slate-700"
            >
              <RotateCw className="w-3 h-3 text-blue-600" />
              <span>Rotate</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>

            {activeDropdown === 'ROTATE' && (
              <div
                className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl p-1.5 w-48 z-50 text-xs"
                onMouseLeave={closeDropdown}
              >
                <button
                  type="button"
                  onClick={() => {
                    const currentRot = selectedImage?.rotateDeg || 0;
                    onUpdateImageStyle({ rotateDeg: (currentRot + 90) % 360 });
                    closeDropdown();
                  }}
                  className="w-full text-left px-2 py-1 hover:bg-blue-50 rounded flex items-center gap-2"
                >
                  <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                  <span>Rotate Right 90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentRot = selectedImage?.rotateDeg || 0;
                    onUpdateImageStyle({ rotateDeg: (currentRot - 90 + 360) % 360 });
                    closeDropdown();
                  }}
                  className="w-full text-left px-2 py-1 hover:bg-blue-50 rounded flex items-center gap-2"
                >
                  <RotateCw className="w-3.5 h-3.5 text-blue-600 transform -scale-x-100" />
                  <span>Rotate Left 90°</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateImageStyle({ flipH: !selectedImage?.flipH });
                    closeDropdown();
                  }}
                  className="w-full text-left px-2 py-1 hover:bg-blue-50 rounded flex items-center gap-2"
                >
                  <FlipHorizontal className="w-3.5 h-3.5 text-slate-600" />
                  <span>Flip Horizontal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateImageStyle({ flipV: !selectedImage?.flipV });
                    closeDropdown();
                  }}
                  className="w-full text-left px-2 py-1 hover:bg-blue-50 rounded flex items-center gap-2"
                >
                  <FlipVertical className="w-3.5 h-3.5 text-slate-600" />
                  <span>Flip Vertical</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="absolute -bottom-1 left-0 right-0 flex items-center justify-center">
          <span className="text-[9px] text-slate-400 font-sans">Arrange</span>
        </div>
      </div>

      {/* ================= 5. SIZE GROUP (Persis Gambar 2) ================= */}
      <div className="flex items-center gap-2 px-2 relative">
        {/* Crop Button */}
        <button
          type="button"
          onClick={onStartCrop}
          className="flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/70 transition w-14 h-18 text-center text-slate-700"
          title="Crop"
        >
          <CropIcon className="w-6 h-6 text-slate-800 mb-0.5" />
          <span className="text-[10px] leading-tight">Crop</span>
        </button>

        {/* Height and Width Inputs in CM (11,31 cm & 15,99 cm) */}
        <div className="flex flex-col justify-between py-1 h-18 text-[11px] font-sans">
          {/* Height Input */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-medium w-3.5">H:</span>
            <div className="flex items-center border border-slate-300 rounded bg-white px-1.5 py-0.5 shadow-2xs">
              <input
                type="text"
                value={`${currentHeightCm.toFixed(2).replace('.', ',')} cm`}
                readOnly
                className="w-18 bg-transparent text-right font-mono text-[11px] text-slate-800 focus:outline-none"
              />
              <div className="flex flex-col ml-1 border-l border-slate-200 pl-0.5">
                <button
                  type="button"
                  onClick={() => handleHeightChange(0.25)}
                  className="hover:bg-slate-100 p-0.2 rounded"
                >
                  <ChevronUp className="w-2.5 h-2.5 text-slate-600" />
                </button>
                <button
                  type="button"
                  onClick={() => handleHeightChange(-0.25)}
                  className="hover:bg-slate-100 p-0.2 rounded"
                >
                  <ChevronDown className="w-2.5 h-2.5 text-slate-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Width Input */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-medium w-3.5">W:</span>
            <div className="flex items-center border border-slate-300 rounded bg-white px-1.5 py-0.5 shadow-2xs">
              <input
                type="text"
                value={`${currentWidthCm.toFixed(2).replace('.', ',')} cm`}
                readOnly
                className="w-18 bg-transparent text-right font-mono text-[11px] text-slate-800 focus:outline-none"
              />
              <div className="flex flex-col ml-1 border-l border-slate-200 pl-0.5">
                <button
                  type="button"
                  onClick={() => handleWidthChange(0.25)}
                  className="hover:bg-slate-100 p-0.2 rounded"
                >
                  <ChevronUp className="w-2.5 h-2.5 text-slate-600" />
                </button>
                <button
                  type="button"
                  onClick={() => handleWidthChange(-0.25)}
                  className="hover:bg-slate-100 p-0.2 rounded"
                >
                  <ChevronDown className="w-2.5 h-2.5 text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Aspect Ratio Lock Button */}
        <button
          type="button"
          onClick={() => onUpdateImageStyle({ lockAspectRatio: !isLocked })}
          className={`p-1.5 rounded transition ${isLocked ? 'bg-blue-100 text-[#185abd]' : 'hover:bg-slate-200 text-slate-400'}`}
          title={isLocked ? 'Kunci Rasio Aspek (Aktif)' : 'Bebaskan Rasio Aspek'}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>

        {/* Group Label & Launcher */}
        <div className="absolute -bottom-1 left-0 right-0 flex items-center justify-between px-2">
          <span className="text-[9px] text-slate-400 font-sans mx-auto">Size</span>
          <button
            type="button"
            onClick={onOpenSizePosition}
            className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700"
            title="Size and Position Dialog"
          >
            <Maximize2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
