import React from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  Menu,
  BookOpen,
  LogOut,
  Bell,
  Cloud,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const {
    user,
    logout,
    transaksi,
    pengaturan,
    setActiveTab,
    cloudSyncStatus,
    lastCloudSync,
    triggerManualCloudSync,
    refreshDataFromCloud
  } = useLibrary();

  const overdueCount = transaksi.filter((t) => t.status === 'Terlambat').length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 no-print">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & School Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            {pengaturan.logoKopUrl ? (
              <img
                src={pengaturan.logoKopUrl}
                alt="Logo Sekolah"
                className="w-9 h-9 object-contain flex-shrink-0 drop-shadow-xs"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
                <BookOpen className="w-5 h-5 text-amber-300" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold tracking-tight text-slate-900 uppercase">
                  {pengaturan.namaSekolah}
                </h1>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  Perpustakaan Digital
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Kec. {pengaturan.kecamatan}, {pengaturan.kabupaten}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Cloud Sync, PWA Install, Overdue Bell, User & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloud Auto-Sync Status Badge */}
          <button
            onClick={() => refreshDataFromCloud(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              cloudSyncStatus === 'syncing'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : cloudSyncStatus === 'synced'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
            }`}
            title={`Sinkronisasi Otomatis Cloud: ${cloudSyncStatus === 'synced' ? `Aktif (${lastCloudSync || 'Baru saja'})` : cloudSyncStatus}. Klik untuk sinkronkan manual.`}
          >
            {cloudSyncStatus === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Cloud className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">
              {cloudSyncStatus === 'syncing' ? 'Menyinkronkan...' : cloudSyncStatus === 'synced' ? 'Cloud Terhubung' : 'Offline'}
            </span>
          </button>

          {/* In-App PWA Install Button */}
          <PWAInstallButton />

          {/* Overdue alert indicator */}
          {overdueCount > 0 && (
            <button
              onClick={() => setActiveTab('transaksi')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-all"
              title={`${overdueCount} peminjaman buku telah melewati tenggat jatuh tempo!`}
            >
              <Bell className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span>{overdueCount} Terlambat</span>
            </button>
          )}

          {/* User profile capsule */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {user?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online (Admin)
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-bold text-xs">
              AD
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
