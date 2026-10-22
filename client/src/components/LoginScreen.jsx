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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        setErrorMessage(`Server Vercel mengembalikan respon non-JSON (${res.status}): ${rawText.substring(0, 120)}`);
        return;
      }

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

  const handleQuickLogin = async (user) => {
    setUsername(user.username || user.id);
    setPassword('12345@');
    setErrorMessage('');
    
    // Langsung submit otomatis
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username || user.id, password: '12345@' })
      });
      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        setErrorMessage(`Server Vercel mengembalikan respon non-JSON (${res.status}): ${rawText.substring(0, 120)}`);
        return;
      }
      if (data.success && data.data?.user) {
        onLoginSuccess(data.data.user, rememberMe);
      } else {
        setErrorMessage(data.message || 'Gagal login cepat.');
      }
    } catch (err) {
      setErrorMessage('Gagal menghubungkan: ' + err.message);
    } finally {
      setLoading(false);
    }
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
                  </div>
                  <p className="text-xs font-semibold text-slate-500 tracking-wide">
                    Collaborative Document Tools
                  </p>
                </div>
              </div>

              {/* Title & Description */}
              <div className="mb-6 text-center">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-wider leading-loose select-none block pb-3">
                  ꦱꦸꦒꦼꦁ ꦫꦮꦸꦃ
                </h2>
                <p className="text-xs font-semibold text-slate-500 tracking-wide mt-2">
                  Mohon Doa Restu
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
                      placeholder="Masukkan username akun Anda (contoh: admin, Pandu, Hadi)"
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
                      <span>Log in</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Brand Panel */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 p-6 sm:p-8 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-center">
            <div className="flex flex-col items-center text-center">
              <img
                src="/logo-codot.png"
                alt="Logo Co. (Codot)"
                className="w-28 h-28 object-contain rounded-3xl shadow-lg p-2 bg-white border border-blue-100 mb-4"
              />
              <h3 className="text-lg font-black text-slate-900">Co. RKPD</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-xs">
                Penyusunan naskah RKPD Kabupaten Cilacap secara kolaboratif, terstruktur, dan terkendali.
              </p>
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
          &copy; {new Date().getFullYear()} <span className="font-bold text-slate-300">Co.</span> (Collaborative Document Tools) &bull; Badan Perencanaan Pembangunan Daerah Kabupaten Cilacap
        </p>
      </footer>
    </div>
  );
}
