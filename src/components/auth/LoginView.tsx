import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  BookOpen,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Library,
  Layers,
  ArrowRight
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useLibrary();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Brute-force rate limiting protection
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      const count = sessionStorage.getItem('smpn3_login_fails');
      return count ? parseInt(count, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);

  React.useEffect(() => {
    if (lockoutTimer <= 0) return;
    const timer = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTimer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    if (failedAttempts >= 5) {
      setLockoutTimer(30);
      setError('Akses dikunci sementara selama 30 detik untuk mencegah percobaan tidak sah (brute-force).');
      return;
    }

    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const ok = login(username, password);
      if (!ok) {
        const next = failedAttempts + 1;
        setFailedAttempts(next);
        try {
          sessionStorage.setItem('smpn3_login_fails', next.toString());
        } catch {
          // ignore
        }

        if (next >= 5) {
          setLockoutTimer(30);
          setError('Terlalu banyak percobaan gagal! Login dikunci selama 30 detik demi keamanan sistem.');
        } else {
          setError(`Username atau password salah! Percobaan tersisa sebelum terkunci: ${5 - next}`);
        }
      } else {
        try {
          sessionStorage.removeItem('smpn3_login_fails');
        } catch {
          // ignore
        }
      }
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-between relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* Top school header banner */}
      <header className="relative z-10 w-full px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <BookOpen className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white uppercase">
                SMP NEGERI 3 RETEH
              </h1>
              <p className="text-[11px] text-slate-400">
                Kabupaten Indragiri Hilir, Provinsi Riau
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Sistem Perpustakaan Digital v2.4
          </span>
        </div>
      </header>

      {/* Main Login Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 text-white space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-amber-400" /> Gerakan Literasi Sekolah
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Aplikasi Perpustakaan Digital <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300">
                SMP Negeri 3 Reteh
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Portal cerdas pengelolaan data buku, keanggotaan siswa & guru, sirkulasi peminjaman, cetak kartu anggota otomatis, serta laporan berkala perpustakaan sekolah.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl backdrop-blur-sm">
                <Library className="w-5 h-5 text-blue-400 mb-1.5" />
                <div className="text-xs font-semibold text-white">Master Data Buku</div>
                <div className="text-[11px] text-slate-400">Katalog & Stok Real-time</div>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl backdrop-blur-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mb-1.5" />
                <div className="text-xs font-semibold text-white">Kartu Anggota</div>
                <div className="text-[11px] text-slate-400">Cetak & Unduh Otomatis</div>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl backdrop-blur-sm col-span-2 sm:col-span-1">
                <Layers className="w-5 h-5 text-amber-400 mb-1.5" />
                <div className="text-xs font-semibold text-white">Laporan & Denda</div>
                <div className="text-[11px] text-slate-400">Format Resmi Sekolah</div>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white tracking-tight">Masuk Sistem</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Masukkan kredensial administrator perpustakaan
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium animate-in fade-in">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={isLoading || lockoutTimer > 0}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={lockoutTimer > 0 ? `Terkunci sementara (${lockoutTimer}s)` : 'Masukkan password'}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      disabled={isLoading || lockoutTimer > 0}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || lockoutTimer > 0}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : lockoutTimer > 0 ? (
                    <span>Terkunci Sementara ({lockoutTimer} detik)</span>
                  ) : (
                    <>
                      <span>Masuk ke Perpustakaan</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-700/60 text-center">
                <p className="text-[11px] text-slate-400">
                  SMP NEGERI 3 RETEH &bull; Sistem Terpadu Administrasi Sekolah
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-4 border-t border-slate-800 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Perpustakaan SMP Negeri 3 Reteh. Hak Cipta Dilindungi.
      </footer>
    </div>
  );
};
