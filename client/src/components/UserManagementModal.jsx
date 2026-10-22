import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  Edit2,
  Trash2,
  Search,
  Mail,
  Palette,
  Check,
  AlertCircle,
  RotateCcw,
  Building,
  Key,
  ShieldCheck,
  UserCheck,
  Eye,
  BookOpen
} from 'lucide-react';
import { api } from '../api';

const PRESET_COLORS = [
  '#4f46e5', // Indigo
  '#0891b2', // Cyan
  '#059669', // Emerald
  '#d97706', // Amber
  '#9333ea', // Purple
  '#dc2626', // Red
  '#ea580c', // Orange
  '#2563eb', // Blue
  '#10b981'  // Green
];

export const CHAPTER_OPTIONS = [
  { code: 'BAB I', title: 'BAB I: PENDAHULUAN', desc: 'Latar Belakang, Dasar Hukum, Sistematika RKPD' },
  { code: 'BAB II', title: 'BAB II: KONDISI DAERAH & EVALUASI RKPD', desc: 'Geografi, Demografi, Pelayanan Dasar, Evaluasi Renja (222 Tabel)' },
  { code: 'BAB III', title: 'BAB III: KERANGKA EKONOMI & KEUANGAN', desc: 'Arah Kebijakan Ekonomi, Proyeksi PAD, Belanja Daerah, TKDD' },
  { code: 'BAB IV', title: 'BAB IV: SASARAN & PRIORITAS DAERAH', desc: 'Penyelarasan Prioritas Nasional (Asta Cita), Jawa Tengah, Isu Strategis' },
  { code: 'BAB V', title: 'BAB V: RENCANA KERJA & PENDANAAN', desc: 'Matriks Program Prioritas Urusan Daerah TA 2027' },
  { code: 'BAB VI', title: 'BAB VI: KINERJA PEMERINTAHAN DAERAH', desc: 'Indikator Kinerja Utama (IKU), IKD, dan IKK LPPD' },
  { code: 'BAB VII', title: 'BAB VII: PENUTUP', desc: 'Kaidah Pelaksanaan & Pedoman KUA-PPAS TA 2027' }
];

export default function UserManagementModal({
  isOpen,
  onClose,
  users,
  onUserAdded
}) {
  const [activeTab, setActiveTab] = useState('LIST'); // 'LIST' or 'FORM'
  const [editingUserId, setEditingUserId] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('12345@');
  const [opd, setOpd] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('CONTRIBUTOR');
  const [color, setColor] = useState('#4f46e5');
  const [selectedChapters, setSelectedChapters] = useState(['BAB I', 'BAB II']);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // ALL, ADMIN, REVIEWER, CONTRIBUTOR

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: '' }

  if (!isOpen) return null;

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Reset Form
  const resetForm = () => {
    setName('');
    setUsername('');
    setPassword('12345@');
    setOpd('');
    setEmail('');
    setRole('CONTRIBUTOR');
    setColor('#4f46e5');
    setSelectedChapters(['BAB I', 'BAB II']);
    setEditingUserId(null);
  };

  // Switch to Edit Mode
  const handleStartEdit = (user) => {
    setEditingUserId(user.id);
    setName(user.name || '');
    setUsername(user.username || '');
    setPassword(user.password || '12345@');
    setOpd(user.opd || '');
    setEmail(user.email || '');
    setRole(user.role || 'CONTRIBUTOR');
    setColor(user.color || '#4f46e5');
    setSelectedChapters(user.reviewedChapters && user.reviewedChapters.length > 0
      ? user.reviewedChapters
      : ['BAB I', 'BAB II']);
    setActiveTab('FORM');
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    resetForm();
    setActiveTab('LIST');
  };

  // Toggle Chapter in Reviewer Selection
  const handleToggleChapter = (chapterCode) => {
    setSelectedChapters(prev =>
      prev.includes(chapterCode)
        ? prev.filter(c => c !== chapterCode)
        : [...prev, chapterCode]
    );
  };

  // Select all chapters
  const handleSelectAllChapters = () => {
    setSelectedChapters(CHAPTER_OPTIONS.map(c => c.code));
  };

  // Deselect all
  const handleDeselectAllChapters = () => {
    setSelectedChapters([]);
  };

  // Submit Form (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      showNotification('error', 'Nama lengkap dan username wajib diisi!');
      return;
    }

    if (role === 'REVIEWER' && selectedChapters.length === 0) {
      showNotification('error', 'Harap pilih minimal 1 Bab yang akan dipantau oleh Reviewer ini.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: name.trim(),
        username: username.trim(),
        password: password.trim() || '12345@',
        opd: opd.trim() || 'Perangkat Daerah',
        email: email.trim(),
        role,
        color,
        reviewedChapters: role === 'REVIEWER'
          ? selectedChapters
          : role === 'ADMIN'
          ? CHAPTER_OPTIONS.map(c => c.code)
          : []
      };

      if (editingUserId) {
        const res = await api.updateUser(editingUserId, payload);
        if (res.success) {
          showNotification('success', `Pengguna "${name}" berhasil diperbarui!`);
          resetForm();
          setActiveTab('LIST');
          if (onUserAdded) onUserAdded();
        } else {
          showNotification('error', res.message || 'Gagal memperbarui pengguna');
        }
      } else {
        const res = await api.addUser(payload);
        if (res.success) {
          showNotification('success', `Pengguna "${name}" berhasil didaftarkan!`);
          resetForm();
          setActiveTab('LIST');
          if (onUserAdded) onUserAdded();
        } else {
          showNotification('error', res.message || 'Gagal mendaftarkan pengguna');
        }
      }
    } catch (err) {
      showNotification('error', err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  // Quick Role Change from List
  const handleQuickRoleChange = async (userId, newRole) => {
    try {
      const user = users.find(u => u.id === userId);
      const payload = { role: newRole };
      if (newRole === 'REVIEWER' && (!user.reviewedChapters || user.reviewedChapters.length === 0)) {
        payload.reviewedChapters = ['BAB I', 'BAB II'];
      }
      const res = await api.updateUser(userId, payload);
      if (res.success) {
        showNotification('success', 'Peran pengguna berhasil diubah!');
        if (onUserAdded) onUserAdded();
      }
    } catch (err) {
      alert('Gagal mengubah peran: ' + err.message);
    }
  };

  // Delete User
  const handleDeleteUser = async (user) => {
    if (user.id === 'user_admin') {
      alert('Akun Admin Utama (user_admin) dilindungi dan tidak dapat dihapus.');
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin menghapus akun "${user.name}" (@${user.username})?\n\nPenugasan sub-bab atas nama pengguna ini akan dilepaskan secara otomatis.`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await api.deleteUser(user.id);
      if (res.success) {
        showNotification('success', res.message || `Pengguna "${user.name}" berhasil dihapus.`);
        if (onUserAdded) onUserAdded();
      } else {
        showNotification('error', res.message || 'Gagal menghapus pengguna');
      }
    } catch (err) {
      showNotification('error', err.message || 'Gagal menghapus pengguna');
    } finally {
      setLoading(false);
    }
  };

  // Filtered Users
  const filteredUsers = (users || []).filter(u => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(q);
      const matchUsername = u.username?.toLowerCase().includes(q);
      const matchOpd = u.opd?.toLowerCase().includes(q);
      const matchRole = u.role?.toLowerCase().includes(q);
      const matchCh = u.reviewedChapters?.some(c => c.toLowerCase().includes(q));
      if (!matchName && !matchUsername && !matchOpd && !matchRole && !matchCh) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Manajemen Pengguna & OPD Kontributor (CRUD)
              </h3>
              <p className="text-xs text-slate-500">
                Reviewer di level Bab (1 bab atau lebih), Kontributor ditugaskan Admin per sub-bab
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar Switcher */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (editingUserId) resetForm();
                setActiveTab('LIST');
              }}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'LIST'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Daftar Pengguna Aktif</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'LIST' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {users.length}
              </span>
            </button>

            <button
              onClick={() => {
                if (!editingUserId) resetForm();
                setActiveTab('FORM');
              }}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'FORM'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{editingUserId ? `Edit: ${name || 'Pengguna'}` : '+ Tambah Pengguna Baru'}</span>
            </button>
          </div>

          {editingUserId && activeTab === 'FORM' && (
            <button
              onClick={handleCancelEdit}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Batal Edit
            </button>
          )}
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className={`mx-6 mt-4 p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* VIEW 1: FORM (CREATE / UPDATE) */}
          {activeTab === 'FORM' && (
            <form onSubmit={handleSubmit} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>{editingUserId ? 'Perbarui Data & Hak Akses Pengguna' : 'Formulir Pendaftaran Pengguna / PIC Bidang Baru'}</span>
                </h4>
                {editingUserId && (
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                    Mode Edit: ID {editingUserId}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar / PIC Bidang <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PIC Bidang IKP (Diskominfo) / Dr. Joko Susanto"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Username Akun <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pandu / Hadi / Nabila"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Password Akun */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Password Akun
                    </label>
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      Default: 12345@
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="12345@"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* OPD / Instansi */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Instansi / Bidang / Tim Ahli
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bidang Informasi & Komunikasi Publik (Diskominfo)"
                    value={opd}
                    onChange={(e) => setOpd(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Kontak / Dinas
                  </label>
                  <input
                    type="email"
                    placeholder="Contoh: ikp@diskominfo.go.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Role Selector */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Peran Akses (Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="CONTRIBUTOR">CONTRIBUTOR (Editor PIC Bidang / OPD - Tugas Diberikan Admin per Sub-Bab)</option>
                    <option value="REVIEWER">REVIEWER (Level Bab - Memantau 1 Bab atau Lebih & Menyetujui Naskah)</option>
                    <option value="ADMIN">ADMIN (Super Admin / Koordinator Naskah - Akses Penuh Seluruh Bab)</option>
                  </select>
                </div>

                {/* BAB SELECTION FOR REVIEWER (1 Bab atau Lebih) */}
                {role === 'REVIEWER' && (
                  <div className="col-span-1 sm:col-span-2 p-4 rounded-xl bg-cyan-50/80 border border-cyan-300 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-200 pb-2">
                      <div>
                        <label className="block text-xs font-bold text-cyan-950 flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-cyan-700" />
                          <span>Pilih Bab yang Dipantau oleh Reviewer Ini (Bisa 1 Bab atau Lebih):</span>
                        </label>
                        <p className="text-[10px] text-cyan-800 mt-0.5">
                          Reviewer ini hanya berhak memvalidasi, memberi telaah, dan meng-Approve sub-bab pada Bab terpilih.
                        </p>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleSelectAllChapters}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-cyan-600 text-white hover:bg-cyan-700 cursor-pointer shadow-2xs"
                        >
                          Pilih Semua (7 Bab)
                        </button>
                        <button
                          type="button"
                          onClick={handleDeselectAllChapters}
                          className="text-[10px] font-semibold px-2 py-1 rounded-md bg-white border border-cyan-300 text-cyan-900 hover:bg-cyan-100 cursor-pointer"
                        >
                          Hapus Pilihan
                        </button>
                      </div>
                    </div>

                    {/* 7 Chapters Checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {CHAPTER_OPTIONS.map(ch => {
                        const isChecked = selectedChapters.includes(ch.code);
                        return (
                          <label
                            key={ch.code}
                            className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
                              isChecked
                                ? 'bg-white border-cyan-500 ring-2 ring-cyan-400/30 shadow-2xs'
                                : 'bg-white/60 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleChapter(ch.code)}
                              className="mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer w-4 h-4"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-slate-900">
                                {ch.title}
                              </div>
                              <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                {ch.desc}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <div className="text-[10px] font-bold text-cyan-900 pt-1">
                      Total Dipantau: {selectedChapters.length} dari 7 Bab ({selectedChapters.join(', ') || 'Belum ada bab yang dipilih'})
                    </div>
                  </div>
                )}

                {/* INFO FOR CONTRIBUTOR */}
                {role === 'CONTRIBUTOR' && (
                  <div className="col-span-1 sm:col-span-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed">
                      <strong>Peran Kontributor / PIC Bidang:</strong> Pengguna ini akan menerima tugas pengisian bagian sub-bab naskah dari Admin melalui <strong>Matriks Akses Naskah</strong>. Misal: BAB II bagian geografi & demografi ke PIC PPM, riset & teknologi ke PIC Rinov, kominfo & data ke PIC IKP, dan evaluasi program ke PIC Program.
                    </div>
                  </div>
                )}

                {/* Avatar Color Picker */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Warna Identitas Avatar
                  </label>
                  <div className="flex items-center space-x-2 pt-0.5">
                    {PRESET_COLORS.map(c => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                          color === c ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {color === c && <Check className="w-3 h-3 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                {editingUserId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || !name.trim() || !username.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{loading ? 'Menyimpan...' : editingUserId ? 'Simpan Perubahan Pengguna' : '+ Daftarkan Pengguna Baru'}</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW 2: LIST (READ, QUICK ROLE CHANGE, EDIT, DELETE) */}
          {activeTab === 'LIST' && (
            <div className="space-y-4">
              
              {/* Search & Role Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama, OPD, PIC bidang, bab..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center space-x-1 shrink-0 overflow-x-auto">
                  {['ALL', 'ADMIN', 'REVIEWER', 'CONTRIBUTOR'].map(r => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer ${
                        roleFilter === r
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r === 'ALL' ? 'Semua' : r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users List Cards */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Tidak ada pengguna yang cocok dengan kriteria pencarian.
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isSuperAdmin = u.id === 'user_admin';
                    const roleBadgeStyles = {
                      ADMIN: 'bg-amber-100 text-amber-900 border-amber-300',
                      REVIEWER: 'bg-cyan-100 text-cyan-900 border-cyan-300',
                      CONTRIBUTOR: 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    };

                    return (
                      <div
                        key={u.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition"
                      >
                        {/* User Identity Info */}
                        <div className="flex items-start space-x-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs text-white shrink-0 shadow-xs mt-0.5"
                            style={{ backgroundColor: u.color || '#4f46e5' }}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-slate-900">
                                {u.name}
                              </span>
                              {isSuperAdmin && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                                  Utama
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono text-indigo-600">@{u.username}</span> • {u.opd}
                            </div>

                            {/* Reviewer Level Bab Indicator */}
                            {u.role === 'REVIEWER' && (
                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                <span className="text-[10px] text-cyan-900 font-bold flex items-center gap-1">
                                  <Eye className="w-3 h-3 text-cyan-700" />
                                  <span>Memantau ({(u.reviewedChapters || []).length} Bab):</span>
                                </span>
                                {(u.reviewedChapters || []).map(ch => (
                                  <span
                                    key={ch}
                                    className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-800 border border-cyan-200"
                                  >
                                    {ch}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Contributor Level Sub-Bab Indicator */}
                            {u.role === 'CONTRIBUTOR' && (
                              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                                <span className="font-semibold text-emerald-700">✍️ PIC Sub-Bab / Bagian:</span>
                                <span className="text-slate-600 truncate">{u.opd}</span>
                              </div>
                            )}

                            {u.email && (
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{u.email}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Role Selector & Action Buttons */}
                        <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                          {/* Quick Role Dropdown */}
                          <select
                            value={u.role}
                            disabled={isSuperAdmin}
                            onChange={(e) => handleQuickRoleChange(u.id, e.target.value)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer ${
                              roleBadgeStyles[u.role] || 'bg-slate-100 text-slate-800 border-slate-300'
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                            title="Ubah peran akses pengguna ini"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="REVIEWER">REVIEWER</option>
                            <option value="CONTRIBUTOR">CONTRIBUTOR</option>
                          </select>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleStartEdit(u)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition cursor-pointer shadow-2xs"
                            title="Edit data pengguna & bab pemantauan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          {!isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer shadow-2xs"
                              title="Hapus pengguna ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            Total: <strong>{users.length}</strong> Akun Tim Penyusun & Reviewer
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
