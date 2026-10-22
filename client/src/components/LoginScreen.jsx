import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  Shield,
  FileCheck2,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  KeyRound,
  ArrowRight
} from 'lucide-react';

export default function LoginScreen({ onLoginSuccess, availableUsers = [] }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('12345@');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL' | 'ADMIN' | 'REVIEWER' | 'CONTRIBUTOR'

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Username atau identitas akun wajib diisi');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await res.json();
      if (data.success && data.data?.user) {
        onLoginSuccess(data.data.user, rememberMe);
      } else {
        setErrorMessage(data.message || 'Login gagal. Periksa kembali username dan password.');
      }
    } catch (err) {
      setErrorMessage('Tidak dapat terhubung ke server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (user) => {
    setUsername(user.username || user.id);
    setPassword('12345@');
    setErrorMessage('');
    
    // Langsung submit otomatis
    setLoading(true);
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username || user.id, password: '12345@' })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.user) {
          onLoginSuccess(data.data.user, rememberMe);
        } else {
          setErrorMessage(data.message || 'Gagal login cepat.');
        }
      })
      .catch(err => {
        setErrorMessage('Gagal menghubungkan: ' + err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const filteredUsers = availableUsers.filter(u => {
    if (activeCategory === 'ALL') return true;
    return u.role === activeCategory;
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-blue-950 text-slate-800 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Background Subtle Gradient Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-cyan-400 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Logo & Brand Header */}
              <div className="flex items-center space-x-3.5 mb-6">
                <img
                  src="/logo-codot.png"
                  alt="Logo Co. (Codot)"
                  className="w-14 h-14 object-contain rounded-2xl shadow-md p-1 bg-gradient-to-br from-cyan-50 to-blue-100 border border-blue-200"
                />
                <div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">Co.</span>
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      dibaca <span className="uppercase text-blue-700 tracking-wide font-extrabold">Codot</span>
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 tracking-wide">
                    Collaborative Dokument Tools
                  </p>
                </div>
              </div>

              {/* Title & Description */}
              <div className="mb-6">
                <h2 className="text-xl font-extrabold text-slate-900">
                  Selamat Datang Kembali
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Masuk ke sistem penyusunan naskah perencanaan daerah kolaboratif 8 Tahapan RKPD Kabupaten Cilacap.
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="font-medium">{errorMessage}</div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username / Identitas Akun
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username (contoh: admin, reviewer, pic_ikp)"
                      required
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition font-medium text-slate-900"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setPassword('12345@')}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1 cursor-pointer"
                      title="Klik untuk mengisi password default"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Pakai Default (12345@)</span>
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password akun"
                      required
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl transition font-medium text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Hint Badge */}
                <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-900 text-[11px] flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-medium">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Password default seluruh akun:</span>
                  </div>
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-700 select-all shadow-2xs">
                    12345@
                  </span>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Ingat sesi login saya</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Masuk ke Co. (Codot)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Micro footer */}
            <div className="mt-8 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Bappeda Kabupaten Cilacap &bull; 2026/2027</span>
              <span>Versi 2.5 RKPD</span>
            </div>
          </div>

          {/* Right Column: Quick Role Switcher / Demo Accounts */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 p-6 sm:p-8 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Pilih Akun & Masuk Cepat
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                Pilih profil di bawah untuk langsung mencoba hak akses tiap peran (password otomatis terisi):
              </p>

              {/* Role Filter Tabs */}
              <div className="flex items-center space-x-1 p-1 bg-slate-200/70 rounded-xl mb-3 text-[10px] font-bold">
                <button
                  onClick={() => setActiveCategory('ALL')}
                  className={`flex-1 py-1 rounded-lg transition ${
                    activeCategory === 'ALL' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({availableUsers.length})
                </button>
                <button
                  onClick={() => setActiveCategory('ADMIN')}
                  className={`flex-1 py-1 rounded-lg transition ${
                    activeCategory === 'ADMIN' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => setActiveCategory('REVIEWER')}
                  className={`flex-1 py-1 rounded-lg transition ${
                    activeCategory === 'REVIEWER' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Reviewer
                </button>
                <button
                  onClick={() => setActiveCategory('CONTRIBUTOR')}
                  className={`flex-1 py-1 rounded-lg transition ${
                    activeCategory === 'CONTRIBUTOR' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PIC Bidang
                </button>
              </div>

              {/* Quick Select User List */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {filteredUsers.map((u) => {
                  const isSelected = username === (u.username || u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleQuickLogin(u)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex items-center justify-between group ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white hover:bg-blue-50/60 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: u.color || '#3b82f6' }}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {u.name}
                          </div>
                          <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                            {u.opd}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            isSelected
                              ? 'bg-blue-800 text-white'
                              : u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'REVIEWER'
                              ? 'bg-cyan-100 text-cyan-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {u.role === 'CONTRIBUTOR' ? 'PIC' : u.role}
                        </span>
                        <ArrowRight
                          className={`w-3.5 h-3.5 transition group-hover:translate-x-0.5 ${
                            isSelected ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Feature highlights */}
            <div className="mt-6 pt-4 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1.5">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>8 Tahapan Workflow RKPD dengan Closing Terkendali</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Pemindaian Konsistensi Menyeluruh & Sanding Naskah</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer System Info */}
      <footer className="relative z-10 text-center py-4 text-xs text-slate-400">
        <p>
          &copy; 2026/2027 <span className="font-bold text-slate-300">Co.</span> (Collaborative Dokument Tools) &bull; Badan Perencanaan Pembangunan Daerah Kabupaten Cilacap
        </p>
      </footer>
    </div>
  );
}
