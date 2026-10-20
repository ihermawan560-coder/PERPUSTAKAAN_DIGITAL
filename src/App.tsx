import React, { useState } from 'react';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { LoginView } from './components/auth/LoginView';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { OfflineIndicator } from './components/common/OfflineIndicator';

// Feature Views
import { DashboardView } from './components/dashboard/DashboardView';
import { KelasView } from './components/kelas/KelasView';
import { BukuView } from './components/master/BukuView';
import { StokPelajaranView } from './components/stok/StokPelajaranView';
import { AnggotaView } from './components/master/AnggotaView';
import { TransaksiView } from './components/transaksi/TransaksiView';
import { KartuAnggotaView } from './components/kartu/KartuAnggotaView';
import { RiwayatAnggotaView } from './components/riwayat/RiwayatAnggotaView';
import { LaporanView } from './components/laporan/LaporanView';
import { PengaturanView } from './components/pengaturan/PengaturanView';
import { GoogleSheetsView } from './components/sheets/GoogleSheetsView';

const MainLayout: React.FC = () => {
  const { user, activeTab } = useLibrary();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // If not authenticated, render Login Page
  if (!user) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'kelas':
        return <KelasView />;
      case 'buku':
        return <BukuView />;
      case 'stok-pelajaran':
        return <StokPelajaranView />;
      case 'anggota':
        return <AnggotaView />;
      case 'transaksi':
        return <TransaksiView />;
      case 'kartu-anggota':
        return <KartuAnggotaView />;
      case 'riwayat':
        return <RiwayatAnggotaView />;
      case 'laporan':
        return <LaporanView />;
      case 'pengaturan':
        return <PengaturanView />;
      case 'google-sheets':
        return <GoogleSheetsView />;
      default:
        return <DashboardView />;
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast notifications */}
      <ToastContainer />

      {/* Offline connectivity indicator */}
      <OfflineIndicator />

      {/* Sidebar navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main app container shifted by sidebar on desktop */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderTabContent()}
        </main>

        {/* Global Footer */}
        <footer className="py-4 px-6 border-t border-slate-200/80 bg-white/60 text-center text-xs text-slate-500 no-print">
          <p>
            &copy; {new Date().getFullYear()} Perpustakaan SMP Negeri 3 Reteh &bull;
            Kabupaten Indragiri Hilir, Riau. Sistem Informasi Manajemen Perpustakaan.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <LibraryProvider>
      <MainLayout />
    </LibraryProvider>
  );
}
