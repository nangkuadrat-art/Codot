import React from 'react';
import {
  FileText,
  UserCheck,
  ChevronDown,
  Download,
  Plus,
  Shield,
  ArrowLeft,
  Users,
  Cloud,
  Save,
  CheckCircle2,
  Clock,
  FileCheck2,
  LogOut
} from 'lucide-react';

export default function Navbar({
  users,
  currentUser,
  onSelectUser,
  currentDoc,
  selectedStage,
  onBackToDocs,
  onOpenUserModal,
  onOpenMatrixModal,
  onOpenConsistencyModal,
  onOpenGdriveModal,
  isExporting,
  onExport,
  onLogout
}) {
  return (
    <header className="bg-[#185abd] text-white border-b border-[#144b9e] sticky top-0 z-40 shadow-xs select-none">
      <div className="w-full px-3 sm:px-4 h-12 flex items-center justify-between gap-2">
        
        {/* Left: Word Brand & Back Button */}
        <div className="flex items-center space-x-2 shrink-0">
          {currentDoc && (
            <button
              onClick={onBackToDocs}
              className="px-2.5 py-1 rounded bg-[#103f85] hover:bg-[#0c3168] text-white transition flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
              title="Kembali ke Daftar Dokumen"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Daftar Dokumen</span>
            </button>
          )}

          {/* Co. (Codot) Brand & Logo */}
          <div className="flex items-center space-x-2">
            <img
              src="/logo-codot.png"
              alt="Logo Co. (Codot)"
              className="w-7 h-7 rounded-full object-contain p-0.5 bg-white shadow-xs shrink-0"
            />
            {!currentDoc && (
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-base text-white">Co.</span>
                <span className="text-[11px] text-blue-100 font-medium hidden md:inline">
                  <strong className="text-white font-bold">Codot</strong> • Kolaborasi RKPD
                </span>
                {selectedStage?.number && (
                  <span className="hidden lg:inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-900/80 text-blue-100 border border-blue-700/60">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedStage.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                    <span>Tahap {selectedStage.number}: {selectedStage.shortTitle || selectedStage.title}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center: Active Document Title ala Microsoft 365 Title Bar */}
        {currentDoc ? (
          <div className="flex-1 max-w-xl mx-2 flex items-center justify-center">
            <div className="bg-[#134794] hover:bg-[#0f3b7d] px-3 py-1 rounded-md border border-[#2b64b8] flex items-center gap-2 max-w-full text-center transition cursor-default">
              <span className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                {currentDoc.title}.docx
              </span>
              <span className="text-[10px] text-blue-200 flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                <span className="hidden md:inline">Tersimpan</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Right: Actions, Export & User Switcher */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Consistency Checker Button */}
          <button
            onClick={onOpenConsistencyModal}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 rounded transition cursor-pointer"
            title="Audit & Cek Konsistensi Antar Bab (Indikator Makro, Keuangan, Nomenklatur, Tabel/Gambar)"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Cek Konsistensi</span>
          </button>

          {currentUser.role === 'ADMIN' && (
            <button
              onClick={onOpenMatrixModal}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-[#134794] hover:bg-[#0f3b7d] text-blue-100 border border-blue-400/30 rounded transition cursor-pointer"
              title="Matriks Hak Akses Naskah (Reviewer Level Bab & Kontributor Sub-Bab)"
            >
              <Shield className="w-3.5 h-3.5 text-blue-200" />
              <span className="hidden sm:inline">Matriks Akses</span>
            </button>
          )}

          {currentDoc && (
            <button
              onClick={onExport}
              disabled={isExporting}
              className="flex items-center space-x-1 px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded shadow-xs transition disabled:opacity-50 cursor-pointer"
              title="Ekspor seluruh naskah ke format Microsoft Word .docx"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isExporting ? 'Mengekspor...' : 'Ekspor Word'}</span>
            </button>
          )}

          {/* Google Drive Sync Button */}
          <button
            onClick={onOpenGdriveModal}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#134794] hover:bg-[#0f3b7d] text-white border border-blue-400/30 rounded transition"
            title="Google Drive & Cadangan Naskah"
          >
            <Cloud className="w-3.5 h-3.5 text-blue-200" />
            <span className="hidden md:inline">Google Drive</span>
          </button>

          {/* User Profile Switcher */}
          <div className="relative flex items-center bg-[#134794] px-2 py-0.5 rounded border border-[#2b64b8]">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0 ring-1 ring-white/40"
              style={{ backgroundColor: currentUser.color || '#4f46e5' }}
            >
              {currentUser.name.charAt(0)}
            </div>

            <div className="ml-1.5 text-left hidden sm:block max-w-[120px] truncate">
              <div className="text-[11px] font-bold text-white truncate leading-tight">
                {currentUser.name.split(' ')[0]}
              </div>
              <div className="text-[9px] text-blue-200 uppercase font-bold leading-tight">
                {currentUser.role}
              </div>
            </div>

            {/* Select Role Dropdown */}
            <select
              value={currentUser.id}
              onChange={(e) => onSelectUser(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Ganti Pengguna untuk Simulasi Hak Akses"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="text-slate-900 bg-white">
                  [{u.role}] {u.name} - {u.opd}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 ml-1 text-blue-200" />
          </div>

          {/* Manage Users */}
          <button
            onClick={onOpenUserModal}
            className="p-1 text-blue-200 hover:text-white hover:bg-[#134794] rounded transition"
            title="Kelola Daftar Akun OPD"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition shadow-2xs cursor-pointer ml-1"
              title="Keluar dari akun (Logout)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Keluar</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
