import React, { useState } from 'react';
import { X, Lock, Unlock, Eye, Maximize2 } from 'lucide-react';

export function SizePositionModal({
  visible,
  onClose,
  selectedImage,
  onUpdateImageStyle
}) {
  if (!visible || !selectedImage) return null;

  const currentWidthCm = parseFloat(selectedImage?.widthCm || '15.99');
  const currentHeightCm = parseFloat(selectedImage?.heightCm || '11.31');
  const isLocked = selectedImage?.lockAspectRatio !== false;
  const currentRot = selectedImage?.rotateDeg || 0;

  const [activeTab, setActiveTab] = useState('SIZE'); // 'SIZE', 'POSITION'
  const [scaleH, setScaleH] = useState(100);
  const [scaleW, setScaleW] = useState(100);

  return (
    <div className="fixed inset-0 z-9999 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-slate-300 font-sans text-xs text-slate-800 overflow-hidden">
        {/* Title Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 border-b border-slate-200">
          <span className="font-semibold text-slate-800 text-sm">Size and Position</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-4 pt-2 gap-4 bg-slate-50 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('SIZE')}
            className={`pb-1.5 font-medium border-b-2 transition ${
              activeTab === 'SIZE' ? 'border-[#185abd] text-[#185abd] font-bold' : 'border-transparent text-slate-600'
            }`}
          >
            Size
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('POSITION')}
            className={`pb-1.5 font-medium border-b-2 transition ${
              activeTab === 'POSITION' ? 'border-[#185abd] text-[#185abd] font-bold' : 'border-transparent text-slate-600'
            }`}
          >
            Position
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 space-y-4">
          {activeTab === 'SIZE' ? (
            <div className="space-y-4">
              {/* Size and rotate box */}
              <div className="border border-slate-200 rounded p-3 space-y-3 bg-slate-50/50">
                <span className="font-bold text-[11px] text-slate-700 block">Size and rotate</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 text-[11px] block mb-1">Height (Tinggi):</label>
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
                        className="w-full border border-slate-300 rounded px-2 py-1 bg-white"
                      />
                      <span className="text-slate-500">cm</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-600 text-[11px] block mb-1">Width (Lebar):</label>
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
                        className="w-full border border-slate-300 rounded px-2 py-1 bg-white"
                      />
                      <span className="text-slate-500">cm</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 text-[11px] block mb-1">Rotation:</label>
                  <div className="flex items-center gap-1 font-mono w-32">
                    <input
                      type="number"
                      step="15"
                      value={currentRot}
                      onChange={(e) => onUpdateImageStyle({ rotateDeg: parseInt(e.target.value, 10) || 0 })}
                      className="w-full border border-slate-300 rounded px-2 py-1 bg-white"
                    />
                    <span className="text-slate-500">°</span>
                  </div>
                </div>
              </div>

              {/* Scale box */}
              <div className="border border-slate-200 rounded p-3 space-y-2 bg-slate-50/50">
                <span className="font-bold text-[11px] text-slate-700 block">Scale</span>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={isLocked}
                    onChange={(e) => onUpdateImageStyle({ lockAspectRatio: e.target.checked })}
                    className="rounded text-[#185abd]"
                  />
                  <span>Lock aspect ratio (Kunci perbandingan)</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="font-bold text-[11px] text-slate-700 block">Horizontal Alignment</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Left (Kiri)', align: 'left' },
                  { label: 'Centered (Tengah)', align: 'center' },
                  { label: 'Right (Kanan)', align: 'right' }
                ].map(item => (
                  <button
                    key={item.align}
                    type="button"
                    onClick={() => onUpdateImageStyle({ alignment: item.align })}
                    className="p-2 border border-slate-200 hover:border-[#185abd] hover:bg-blue-50/50 rounded text-center text-xs"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-2.5 bg-slate-100 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#185abd] hover:bg-[#144b9e] text-white font-medium rounded shadow-2xs"
          >
            OK
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 hover:bg-slate-200 rounded text-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function AltTextModal({
  visible,
  onClose,
  selectedImage,
  onUpdateImageStyle
}) {
  if (!visible || !selectedImage) return null;

  const [altText, setAltText] = useState(selectedImage.altText || '');

  const handleSave = () => {
    onUpdateImageStyle({ altText });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-9999 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm border border-slate-300 font-sans text-xs text-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 border-b border-slate-200">
          <span className="font-semibold text-slate-800 text-sm">Alt Text</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Berikan deskripsi teks naratif untuk gambar ini agar dapat dibaca oleh pembaca layar (screen reader) dan sistem aksesibilitas dokumen resmi.
          </p>
          <textarea
            rows={4}
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Contoh: Peta Topografi Kabupaten Cilacap menunjukkan elevasi wilayah..."
            className="w-full border border-slate-300 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-[#185abd]"
          />
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-2.5 bg-slate-100 border-t border-slate-200">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 bg-[#185abd] hover:bg-[#144b9e] text-white font-medium rounded shadow-2xs"
          >
            Simpan
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 hover:bg-slate-200 rounded text-slate-700"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
