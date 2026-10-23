import React, { useState } from 'react';
import {
  Scissors,
  Copy,
  Clipboard,
  Image as ImageIcon,
  Layers,
  ArrowUp,
  ArrowDown,
  Link as LinkIcon,
  Download,
  Tag,
  AlignJustify,
  Eye,
  Maximize2,
  Palette,
  Crop as CropIcon,
  Search,
  ChevronRight
} from 'lucide-react';

export default function PictureContextMenu({
  visible,
  x,
  y,
  selectedImage,
  onClose,
  onOpenFormatPane,
  onOpenSizePosition,
  onOpenAltText,
  onOpenCaption,
  onChangePicture,
  onSaveAsPicture,
  onSetWrapText,
  onApplyStylePreset,
  onStartCrop
}) {
  const [searchTerm, setSearchTerm] = useState('');
  // Single active submenu state so only ONE submenu can ever be open at a time
  const [activeSubmenu, setActiveSubmenu] = useState(null); // null | 'CHANGE_PICTURE' | 'BRING_FRONT' | 'SEND_BACK' | 'WRAP' | 'STYLE'

  if (!visible || !selectedImage) return null;

  const stylePresets = [
    { id: 'SIMPLE_WHITE', label: 'Simple Frame, White', preview: 'border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.2);' },
    { id: 'DROP_SHADOW', label: 'Drop Shadow Rectangle', preview: 'box-shadow: 4px 6px 14px rgba(0,0,0,0.35);' },
    { id: 'SOFT_EDGE', label: 'Soft Edge Rectangle', preview: 'border-radius: 6px; box-shadow: 0 0 10px rgba(0,0,0,0.25);' },
    { id: 'DOUBLE_BLACK', label: 'Double Frame, Black', preview: 'border: 3px double #0f172a;' },
    { id: 'THICK_BLACK', label: 'Thick Matte, Black', preview: 'border: 4px solid #0f172a;' },
    { id: 'ROUND_DIAG', label: 'Rounded Diagonal', preview: 'border-radius: 14px 0 14px 0; border: 1px solid #cbd5e1;' },
    { id: 'OVAL', label: 'Oval Frame', preview: 'border-radius: 50%; border: 2px solid #cbd5e1;' },
    { id: 'BEVELED', label: 'Beveled Rectangle', preview: 'border: 3px outset #e2e8f0;' }
  ];

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
      {/* 1. FLOATING MINI-TOOLBAR (Style & Crop) - Persis Gambar 1 */}
      <div className="mb-1 flex items-center gap-1 bg-white border border-slate-300 rounded-lg shadow-xl px-2 py-1 w-max">
        {/* Style Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveSubmenu(activeSubmenu === 'STYLE' ? null : 'STYLE')}
            className={`flex flex-col items-center justify-center p-1.5 rounded transition ${
              activeSubmenu === 'STYLE' ? 'bg-blue-100 text-[#185abd]' : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Picture Styles"
          >
            <div className="flex items-center gap-1">
              <div className="w-5 h-4 border border-blue-500 rounded-xs bg-linear-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                <Palette className="w-2.5 h-2.5 text-blue-700" />
              </div>
            </div>
            <span className="text-[10px] text-slate-600 mt-0.5 font-medium leading-none">Style</span>
          </button>

          {/* Quick Style Palette Popup */}
          {activeSubmenu === 'STYLE' && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-2xl p-2 w-64 grid grid-cols-4 gap-2 z-50">
              {stylePresets.map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    onApplyStylePreset(st.id);
                    setActiveSubmenu(null);
                  }}
                  className="p-1 border border-slate-200 hover:border-[#185abd] hover:bg-blue-50/50 rounded flex flex-col items-center gap-1 transition group"
                  title={st.label}
                >
                  <div
                    className="w-10 h-7 bg-slate-200 overflow-hidden"
                    style={{ ...Object.fromEntries(st.preview.split(';').filter(Boolean).map(s => s.split(':').map(x => x.trim()))) }}
                  />
                  <span className="text-[8px] text-slate-600 group-hover:text-blue-700 text-center truncate w-full">
                    {st.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* Crop Button */}
        <button
          type="button"
          onClick={() => {
            onStartCrop();
            onClose();
          }}
          className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded text-slate-700 transition"
          title="Crop"
        >
          <CropIcon className="w-4 h-4 text-slate-700" />
          <span className="text-[10px] text-slate-600 mt-0.5 font-medium leading-none">Crop</span>
        </button>
      </div>

      {/* 2. MAIN PICTURE CONTEXT MENU - Persis Gambar 1 */}
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
          {/* Cut */}
          {filterItem('cut') && (
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => {
                if (selectedImage.el) {
                  navigator.clipboard.writeText(selectedImage.el.outerHTML);
                  selectedImage.el.remove();
                }
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2.5 transition"
            >
              <Scissors className="w-3.5 h-3.5 text-slate-500" />
              <span>Cut</span>
            </button>
          )}

          {/* Copy */}
          {filterItem('copy') && (
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => {
                if (selectedImage.el) {
                  navigator.clipboard.writeText(selectedImage.el.outerHTML);
                }
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2.5 transition"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy</span>
            </button>
          )}

          {/* Paste Options */}
          {filterItem('paste') && (
            <div
              onMouseEnter={() => setActiveSubmenu(null)}
              className="px-3 py-1 flex items-center justify-between hover:bg-slate-50 text-slate-700"
            >
              <span className="text-[11px] text-slate-600 font-medium">Paste Options:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="p-1 hover:bg-slate-200 border border-slate-300 rounded shadow-2xs text-slate-700"
                  title="Paste (Picture)"
                >
                  <Clipboard className="w-3 h-3 text-amber-700" />
                </button>
              </div>
            </div>
          )}

          <div className="my-1 border-t border-slate-200" />

          {/* Convert to Office Math (disabled) */}
          {filterItem('office math') && (
            <div
              onMouseEnter={() => setActiveSubmenu(null)}
              className="px-3 py-1 text-slate-400 select-none cursor-not-allowed"
            >
              Convert to Office Math
            </div>
          )}
          {filterItem('convert all to office math') && (
            <div
              onMouseEnter={() => setActiveSubmenu(null)}
              className="px-3 py-1 text-slate-400 select-none cursor-not-allowed"
            >
              Convert All to Office Math
            </div>
          )}
          {filterItem('edit picture') && (
            <div
              onMouseEnter={() => setActiveSubmenu(null)}
              className="px-3 py-1 text-slate-400 select-none cursor-not-allowed"
            >
              Edit Picture
            </div>
          )}

          <div className="my-1 border-t border-slate-200" />

          {/* Change Picture > */}
          {filterItem('change picture') && (
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setActiveSubmenu('CHANGE_PICTURE')}
                onClick={() => setActiveSubmenu(activeSubmenu === 'CHANGE_PICTURE' ? null : 'CHANGE_PICTURE')}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition ${
                  activeSubmenu === 'CHANGE_PICTURE' ? 'bg-blue-50 text-[#185abd]' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Change Picture</span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </button>

              {activeSubmenu === 'CHANGE_PICTURE' && (
                <div
                  className="absolute left-full top-0 ml-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 w-44 z-50 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onChangePicture('DEVICE');
                      onClose();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                  >
                    This Device...
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChangePicture('URL');
                      onClose();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                  >
                    Online Pictures / URL...
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Group > */}
          {filterItem('group') && (
            <div
              onMouseEnter={() => setActiveSubmenu(null)}
              className="px-3 py-1.5 text-slate-400 flex items-center justify-between select-none cursor-not-allowed"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Group</span>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-300" />
            </div>
          )}

          {/* Bring to Front > */}
          {filterItem('bring to front') && (
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setActiveSubmenu('BRING_FRONT')}
                onClick={() => setActiveSubmenu(activeSubmenu === 'BRING_FRONT' ? null : 'BRING_FRONT')}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition ${
                  activeSubmenu === 'BRING_FRONT' ? 'bg-blue-50 text-[#185abd]' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                  <span>Bring to Front</span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </button>

              {activeSubmenu === 'BRING_FRONT' && (
                <div
                  className="absolute left-full top-0 ml-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 w-48 z-50 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedImage.el) selectedImage.el.style.zIndex = '30';
                      onClose();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                  >
                    Bring to Front
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedImage.el) selectedImage.el.style.zIndex = '20';
                      onClose();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                  >
                    Bring Forward
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSetWrapText('in-front');
                      onClose();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                  >
                    Bring in Front of Text
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Send to Back > */}
          {filterItem('send to back') && (
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setActiveSubmenu('SEND_BACK')}
                onClick={() => setActiveSubmenu(activeSubmenu === 'SEND_BACK' ? null : 'SEND_BACK')}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition ${
                  activeSubmenu === 'SEND_BACK' ? 'bg-blue-50 text-[#185abd]' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>Send to Back</span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </button>

              {activeSubmenu === 'SEND_BACK' && (
                <div
                  className="absolute left-full top-0 ml-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 w-48 z-50 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedImage.el) selectedImage.el.style.zIndex = '0';
                      onClose();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                  >
                    Send to Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedImage.el) selectedImage.el.style.zIndex = '5';
                      onClose();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                  >
                    Send Backward
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSetWrapText('behind');
                      onClose();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                  >
                    Send Behind Text
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Link */}
          {filterItem('link') && (
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => {
                const url = prompt('Masukkan tautan URL untuk gambar ini:', 'https://');
                if (url && selectedImage.el) {
                  const parentA = selectedImage.el.closest('a');
                  if (parentA) parentA.href = url;
                  else {
                    const a = document.createElement('a');
                    a.href = url;
                    a.target = '_blank';
                    selectedImage.el.parentNode.insertBefore(a, selectedImage.el);
                    a.appendChild(selectedImage.el);
                  }
                }
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2.5 transition"
            >
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Link</span>
            </button>
          )}

          {/* Save as Picture... - Persis Gambar 1 */}
          {filterItem('save as picture') && (
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => {
                onSaveAsPicture();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2.5 transition text-blue-900 font-medium"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Save as Picture...</span>
            </button>
          )}

          <div className="my-1 border-t border-slate-200" />

          {/* Insert Caption... - Persis Gambar 1 */}
          {filterItem('insert caption') && (
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => {
                onOpenCaption();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2.5 transition font-medium text-amber-900"
            >
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span>Insert Caption...</span>
            </button>
          )}

          {/* Wrap Text > - Persis Gambar 1 */}
          {filterItem('wrap text') && (
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setActiveSubmenu('WRAP')}
                onClick={() => setActiveSubmenu(activeSubmenu === 'WRAP' ? null : 'WRAP')}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition ${
                  activeSubmenu === 'WRAP' ? 'bg-blue-50 text-[#185abd]' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AlignJustify className="w-3.5 h-3.5 text-slate-500" />
                  <span>Wrap Text</span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </button>

              {activeSubmenu === 'WRAP' && (
                <div
                  className="absolute left-full top-0 ml-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 w-48 z-50 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => { onSetWrapText('inline'); onClose(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                  >
                    In Line with Text
                  </button>
                  <button
                    type="button"
                    onClick={() => { onSetWrapText('square-left'); onClose(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                  >
                    Square (Kiri)
                  </button>
                  <button
                    type="button"
                    onClick={() => { onSetWrapText('square-right'); onClose(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                  >
                    Square (Kanan)
                  </button>
                  <button
                    type="button"
                    onClick={() => { onSetWrapText('top-bottom'); onClose(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                  >
                    Top and Bottom
                  </button>
                  <button
                    type="button"
                    onClick={() => { onSetWrapText('behind'); onClose(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                  >
                    Behind Text
                  </button>
                  <button
                    type="button"
                    onClick={() => { onSetWrapText('in-front'); onClose(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-slate-700"
                  >
                    In Front of Text
                  </button>
                </div>
              )}
            </div>
          )}

          {/* View Alt Text... - Persis Gambar 1 */}
          {filterItem('view alt text') && (
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => {
                onOpenAltText();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2.5 transition"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>View Alt Text...</span>
            </button>
          )}

          {/* Size and Position... - Persis Gambar 1 */}
          {filterItem('size and position') && (
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => {
                onOpenSizePosition();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2.5 transition"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Size and Position...</span>
            </button>
          )}

          {/* Format Picture... - Persis Gambar 1 */}
          {filterItem('format picture') && (
            <button
              type="button"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => {
                onOpenFormatPane();
                onClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-[#185abd] font-bold flex items-center gap-2.5 transition border-t border-slate-100"
            >
              <Palette className="w-3.5 h-3.5 text-[#185abd]" />
              <span>Format Picture...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
