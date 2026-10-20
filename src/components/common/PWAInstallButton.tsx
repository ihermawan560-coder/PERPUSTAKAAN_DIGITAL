import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import {
  Download,
  Smartphone,
  Laptop,
  Apple,
  X,
  CheckCircle2,
  Sparkles,
  Info,
  ExternalLink,
  ShieldCheck,
  Zap,
  RefreshCw
} from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'sidebar' | 'banner' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, platform, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'laptop' | 'android' | 'ios'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'laptop';
  });

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  // If already installed and in standalone mode
  if (isInstalled) {
    if (variant === 'sidebar') {
      return (
        <div className={`px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between ${className}`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium text-[11px]">Aplikasi Terpasang (PWA)</span>
          </div>
          <span className="text-[10px] bg-emerald-900/80 px-1.5 py-0.5 rounded font-mono text-emerald-200">Aktif</span>
        </div>
      );
    }
    if (variant === 'banner') {
      return null;
    }
    return (
      <div className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs font-semibold ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span className="text-[11px]">Mode PWA Aktif</span>
      </div>
    );
  }

  // Render for Sidebar
  if (variant === 'sidebar') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-semibold shadow-md shadow-blue-900/40 transition-all cursor-pointer group ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <Download className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="font-bold">Download / Pasang</div>
              <div className="text-[10px] text-blue-200 font-normal">Di Laptop & HP</div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-900 text-[10px] font-black uppercase tracking-wider">
            PWA
          </span>
        </button>
        {renderModal()}
      </>
    );
  }

  // Render for Banner in Dashboard
  if (variant === 'banner') {
    return (
      <>
        <div className={`p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg shadow-blue-600/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-blue-500/40 ${className}`}>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              <Download className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold">Pasang / Download Aplikasi Perpustakaan</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold uppercase">
                  Laptop & HP
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Aplikasi dapat dipasang di desktop Laptop dan layar utama Smartphone. Buka cepat, offline-ready, dan sinkron otomatis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleInstallClick}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>{isInstallable ? 'Pasang Sekarang (1-Klik)' : 'Cara Download & Pasang'}</span>
            </button>
          </div>
        </div>
        {renderModal()}
      </>
    );
  }

  // Default Navbar variant
  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 shrink-0 ${className}`}
        title="Download / Pasang aplikasi di Laptop atau Smartphone (PWA)"
      >
        <Download className="w-3.5 h-3.5 text-amber-300" />
        <span className="hidden sm:inline">Download Aplikasi</span>
        <span className="sm:hidden">Download</span>
      </button>
      {renderModal()}
    </>
  );

  function renderModal() {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/20">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight">Download & Pasang Aplikasi</h3>
                <p className="text-xs text-blue-200">Perpustakaan Digital SMP Negeri 3 Reteh</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Install Action Banner */}
          {isInstallable && (
            <div className="bg-emerald-50 border-b border-emerald-200 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-emerald-900 text-xs font-medium">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Browser Anda mendukung pemasangan langsung 1-klik!</span>
              </div>
              <button
                onClick={async () => {
                  await install();
                  setShowModal(false);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
              >
                Pasang Sekarang
              </button>
            </div>
          )}

          {/* Tabs for Platforms */}
          <div className="p-5 space-y-4">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('laptop')}
                className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'laptop'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>Laptop & Komputer</span>
              </button>

              <button
                onClick={() => setActiveTab('android')}
                className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'android'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Smartphone Android</span>
              </button>

              <button
                onClick={() => setActiveTab('ios')}
                className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'ios'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Apple className="w-4 h-4" />
                <span>iPhone & iPad (iOS)</span>
              </button>
            </div>

            {/* Tab 1: Laptop & PC */}
            {activeTab === 'laptop' && (
              <div className="space-y-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">
                  Cara pasang di Laptop / Komputer (Google Chrome atau Microsoft Edge):
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 text-[11px]">1</span>
                    <div>
                      Buka aplikasi di <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong> di laptop Anda.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 text-[11px]">2</span>
                    <div>
                      Lihat bilah alamat (Address Bar) di kanan atas browser, klik ikon <strong>Pasang / Install Aplikasi (tanda komputer dengan tanda panah ke bawah)</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 text-[11px]">3</span>
                    <div>
                      Atau klik menu titik tiga (<strong>⋮</strong>) di pojok kanan atas browser &gt; Pilih <strong>"Pasang Perpustakaan SMPN 3 Reteh"</strong> &gt; Klik <strong>"Pasang"</strong>.
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-blue-800 text-[11px] leading-relaxed">
                  💡 <strong>Keuntungan di Laptop:</strong> Aplikasi akan memiliki shortcut di Desktop & Taskbar laptop, terbuka dalam jendela mandiri layaknya software native, dan otomatis memperbarui data buku setiap dibuka.
                </div>
              </div>
            )}

            {/* Tab 2: Android */}
            {activeTab === 'android' && (
              <div className="space-y-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">
                  Cara pasang di Smartphone Android (Chrome atau browser bawaan):
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 text-[11px]">1</span>
                    <div>
                      Buka web perpustakaan ini di <strong>Google Chrome</strong> pada HP Android Anda.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 text-[11px]">2</span>
                    <div>
                      Ketuk menu titik tiga (<strong>⋮</strong>) di pojok kanan atas layar browser.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 text-[11px]">3</span>
                    <div>
                      Pilih <strong>"Pasang Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama" (Add to Home screen)</strong>.
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] leading-relaxed">
                  📱 <strong>Ikon Otomatis Muncul di HP:</strong> Aplikasi dapat dibuka langsung seperti aplikasi Google Play Store, hemat kuota, dan sangat responsif di layar sentuh.
                </div>
              </div>
            )}

            {/* Tab 3: iOS */}
            {activeTab === 'ios' && (
              <div className="space-y-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">
                  Cara pasang di iPhone & iPad (Safari):
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 text-[11px]">1</span>
                    <div>
                      Buka tautan perpustakaan di browser <strong>Safari</strong> pada iPhone/iPad Anda.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 text-[11px]">2</span>
                    <div>
                      Ketuk tombol <strong>Bagikan (Share)</strong> — ikon kotak dengan panah ke atas di bilah bawah layar.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 text-[11px]">3</span>
                    <div>
                      Gulir ke bawah dan ketuk <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong> &gt; Ketuk <strong>"Tambah"</strong> di pojok kanan atas.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Highlights Feature Cards */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
              <div className="p-2.5 bg-slate-50 rounded-xl text-center">
                <RefreshCw className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <div className="font-bold text-[11px] text-slate-800">Sinkron Otomatis</div>
                <div className="text-[10px] text-slate-500">Tiap buka aplikasi</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl text-center">
                <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <div className="font-bold text-[11px] text-slate-800">Sangat Cepat</div>
                <div className="text-[10px] text-slate-500">Hemat memori &lt;2MB</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <div className="font-bold text-[11px] text-slate-800">Aman & PWA</div>
                <div className="text-[10px] text-slate-500">Tersedia offline</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      </div>
    );
  }
};
