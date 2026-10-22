import React, { useState } from 'react';
import {
  Lock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  X,
  FileCheck2,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';

export default function StageClosingModal({
  isOpen,
  onClose,
  currentStage,
  nextStage,
  onConfirmClose
}) {
  const [closingNotes, setClosingNotes] = useState('');
  const [confirmedWarning, setConfirmedWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentStage) return null;

  const total = currentStage.totalSections || 0;
  const approved = currentStage.approvedSections || 0;
  const pending = total - approved;
  const isAllApproved = total > 0 && pending === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAllApproved && !confirmedWarning) {
      alert('Harap centang konfirmasi persetujuan sebelum melakukan closing tahapan.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirmClose(currentStage.id, { closingNotes });
      onClose();
    } catch (err) {
      alert('Gagal melakukan closing tahapan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold mb-2 border border-indigo-400/30">
            <Lock className="w-3.5 h-3.5" />
            <span>Penguncian & Roll-Forward Tahapan RKPD</span>
          </div>

          <h3 className="text-xl font-bold tracking-tight">
            Closing Tahapan: {currentStage.shortTitle || currentStage.title}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Mengunci tahapan saat ini dan menggulirkan seluruh naskah ke tahapan berikutnya.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Stepper Roll-Forward Preview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Alur Pergantian Tahapan
            </div>

            <div className="flex items-center justify-between gap-3">
              {/* Current Stage */}
              <div className="flex-1 p-2.5 rounded-lg bg-white border border-amber-300 shadow-2xs">
                <div className="text-[10px] font-bold text-amber-700 uppercase">
                  Tahapan Ditutup (Arsip)
                </div>
                <div className="text-xs font-extrabold text-slate-800 mt-0.5 line-clamp-2">
                  {currentStage.number}. {currentStage.title}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>Akan dikunci permanen</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="shrink-0 text-indigo-600 font-bold flex flex-col items-center">
                <ArrowRight className="w-5 h-5 animate-pulse" />
                <span className="text-[9px] uppercase tracking-wider">Bergulir</span>
              </div>

              {/* Next Stage */}
              <div className="flex-1 p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-300 shadow-2xs">
                <div className="text-[10px] font-bold text-indigo-700 uppercase">
                  Tahapan Baru (Aktif)
                </div>
                <div className="text-xs font-extrabold text-indigo-950 mt-0.5 line-clamp-2">
                  {nextStage ? `${nextStage.number}. ${nextStage.title}` : 'Semua Tahapan Selesai (Final)'}
                </div>
                <div className="text-[10px] text-indigo-600 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>Naskah siap dikerjakan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Checklist */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-800 mb-2">
              Ringkasan Status Dokumen & Sub-Bab:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="text-xs font-bold text-emerald-800">{currentStage.approvedSections || 0}</div>
                <div className="text-[10px] text-emerald-600 font-medium">🟢 Disetujui</div>
              </div>
              <div className="p-2 rounded-lg bg-purple-50 border border-purple-200">
                <div className="text-xs font-bold text-purple-800">{currentStage.reviewSections || 0}</div>
                <div className="text-[10px] text-purple-600 font-medium">🟣 Review</div>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                <div className="text-xs font-bold text-blue-800">{currentStage.inProgressSections || 0}</div>
                <div className="text-[10px] text-blue-600 font-medium">🔵 Kerja</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                <div className="text-xs font-bold text-amber-800">{currentStage.draftSections || 0}</div>
                <div className="text-[10px] text-amber-600 font-medium">🟡 Draft</div>
              </div>
            </div>

            {/* Warning if not 100% approved */}
            {!isAllApproved && (
              <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-300 flex items-start space-x-2 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Perhatian: {pending} Bagian Belum Disetujui (Final)</div>
                  <div className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Masih ada naskah yang berstatus Draf, Dalam Pengerjaan, atau Menunggu Review. Jika Anda melanjutkan closing, naskah ini akan tetap digulirkan ke tahapan selanjutnya sebagai basis draf baru.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes / Berita Acara Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor & Catatan Berita Acara Closing Tahapan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Berita Acara Kesepakatan Konsultasi Publik No. 050/123/2026"
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Catatan ini akan tersimpan permanen dalam riwayat pengarsipan tahapan.
            </p>
          </div>

          {/* Confirmation Checkbox if not all approved */}
          {!isAllApproved && (
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="confirmWarning"
                checked={confirmedWarning}
                onChange={(e) => setConfirmedWarning(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="confirmWarning" className="text-xs text-slate-700 font-medium cursor-pointer">
                Saya menyetujui penguncian Tahapan <strong>{currentStage.number}</strong> dan melanjutkan penggagasan naskah ke Tahapan selanjutnya.
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!isAllApproved && !confirmedWarning)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition cursor-pointer ${
                isSubmitting || (!isAllApproved && !confirmedWarning)
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Memproses Closing...' : 'Konfirmasi Closing & Bergulir ➜'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
