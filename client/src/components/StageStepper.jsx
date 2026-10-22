import React from 'react';
import {
  CheckCircle2,
  Lock,
  Zap,
  ArrowRight,
  ChevronRight,
  Clock,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

export default function StageStepper({
  stages = [],
  activeStageId,
  selectedStageId,
  onSelectStage,
  currentUser,
  onOpenClosingModal,
  onReopenStage,
  onSeedTemplates
}) {
  const selectedStage = stages.find(s => s.id === selectedStageId) || stages[0] || {};
  const isSelectedActive = selectedStage?.status === 'ACTIVE';
  const isSelectedClosed = selectedStage?.status === 'CLOSED';
  const isSelectedLocked = selectedStage?.status === 'LOCKED';
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        
        {/* Horizontal Pipeline Stepper (8 Stages) */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 pt-1 no-scrollbar">
          {stages.map((stage, idx) => {
            const isCurrent = stage.id === selectedStageId;
            const isLive = stage.status === 'ACTIVE';
            const isDone = stage.status === 'CLOSED';
            const isUpcoming = stage.status === 'LOCKED';

            return (
              <React.Fragment key={stage.id}>
                <button
                  onClick={() => onSelectStage(stage.id)}
                  className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all shrink-0 cursor-pointer min-w-[140px] max-w-[160px] ${
                    isCurrent
                      ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
                      : isLive
                      ? 'bg-blue-50/70 border-blue-300 hover:border-blue-400'
                      : isDone
                      ? 'bg-emerald-50/60 border-emerald-300 hover:border-emerald-400'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-75'
                  }`}
                  title={`${stage.title} (${stage.legalBasis || ''})`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isLive
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-3 h-3" /> : stage.number}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800'
                          : isLive
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isDone ? 'Closed' : isLive ? 'Aktif' : 'Terkunci'}
                    </span>
                  </div>

                  {/* Stage Title */}
                  <div className="font-semibold text-[11px] text-slate-800 line-clamp-2 leading-tight">
                    {stage.shortTitle || stage.title}
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-full mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mr-2">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isDone ? 'bg-emerald-600' : isLive ? 'bg-indigo-600' : 'bg-slate-400'
                        }`}
                        style={{ width: `${stage.progress || 0}%` }}
                      />
                    </div>
                    <span className="font-semibold text-[9px] shrink-0">
                      {stage.progress || 0}%
                    </span>
                  </div>
                </button>

                {/* Arrow connector between stages */}
                {idx < stages.length - 1 && (
                  <div className="text-slate-300 shrink-0 px-0.5 hidden sm:block">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Selected Stage Info Banner & Action Strip */}
        <div className={`mt-2 p-3 sm:p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          isSelectedClosed
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : isSelectedActive
            ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
            : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          {/* Left: Stage Details */}
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
              isSelectedClosed
                ? 'bg-emerald-600 text-white'
                : isSelectedActive
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-400 text-white'
            }`}>
              {isSelectedClosed ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isSelectedActive ? (
                <Zap className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-tight">
                  Tahap {selectedStage.number}: {selectedStage.title}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  isSelectedClosed
                    ? 'bg-emerald-200 text-emerald-800'
                    : isSelectedActive
                    ? 'bg-blue-200 text-blue-900'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {isSelectedClosed ? 'Tahapan Ditutup (Arsip Resmi)' : isSelectedActive ? 'Tahapan Sedang Aktif' : 'Tahapan Belum Terbuka'}
                </span>
                {selectedStage.legalBasis && (
                  <span className="text-[10px] bg-white/80 border border-slate-300 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                    {selectedStage.legalBasis}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                {selectedStage.description}
              </p>

              {/* Closed stage metadata info */}
              {isSelectedClosed && selectedStage.closedAt && (
                <div className="mt-1 text-[11px] text-emerald-800 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Ditutup pada {new Date(selectedStage.closedAt).toLocaleString('id-ID')} oleh <strong>{selectedStage.closedByName || 'Admin'}</strong>
                  </span>
                  {selectedStage.closingNotes && (
                    <span className="italic"> — "{selectedStage.closingNotes}"</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            {/* If viewing Active Stage & User is Admin: Closing & Roll forward button */}
            {isSelectedActive && isAdmin && (
              <button
                onClick={onOpenClosingModal}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs shadow-md transition cursor-pointer"
                title="Tutup tahapan ini dan gulirkan seluruh naskah ke tahapan berikutnya"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Closing Tahapan ➜ Bergulir</span>
              </button>
            )}

            {/* If viewing Closed Stage & User is Admin: Reopen Stage */}
            {isSelectedClosed && isAdmin && selectedStage.id === activeStageId && (
              <button
                onClick={() => onReopenStage(selectedStage.id)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white border border-emerald-400 hover:bg-emerald-100 text-emerald-800 font-medium text-xs transition cursor-pointer"
                title="Buka kembali tahapan ini jika ada koreksi mendesak"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Buka Kembali</span>
              </button>
            )}

            {/* Seed Templates button if documents in stage are 0 */}
            {selectedStage.totalDocs === 0 && isSelectedActive && isAdmin && (
              <button
                onClick={() => onSeedTemplates(selectedStage.id)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Inisialisasi 7 Bab RKPD</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
