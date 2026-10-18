import React from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { ActiveTab } from '../../types';
import {
  LayoutDashboard,
  School,
  BookOpen,
  Users,
  Repeat,
  CreditCard,
  History,
  FileSpreadsheet,
  Settings,
  X,
  ChevronRight,
  Sparkles,
  Layers,
  Cloud
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: number | null;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, buku, anggota, transaksi, kelas } = useLibrary();

  const navGroups: NavGroup[] = [
    {
      title: 'Menu Utama',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          id: 'kelas',
          label: 'Data Kelas',
          icon: School,
          badge: kelas.length,
        },
      ],
    },
    {
      title: 'Master Data & Koleksi',
      items: [
        {
          id: 'buku',
          label: 'Data Buku & Nomor',
          icon: BookOpen,
          badge: buku.length,
        },
        {
          id: 'stok-pelajaran',
          label: 'Stok Buku Pelajaran',
          icon: Layers,
          badge: buku.filter((b) => !!b.mataPelajaran).length,
          badgeColor: 'bg-emerald-100 text-emerald-800',
        },
        {
          id: 'anggota',
          label: 'Data Anggota',
          icon: Users,
          badge: anggota.length,
        },
      ],
    },
    {
      title: 'Sirkulasi Buku',
      items: [
        {
          id: 'transaksi',
          label: 'Transaksi Buku',
          icon: Repeat,
          badge: transaksi.filter((t) => t.status !== 'Dikembalikan').length,
          badgeColor: 'bg-amber-100 text-amber-800',
        },
      ],
    },
    {
      title: 'Menu Cetak & Unduh',
      items: [
        {
          id: 'kartu-anggota',
          label: 'Cetak Kartu Anggota',
          icon: CreditCard,
          badge: null,
        },
        {
          id: 'riwayat',
          label: 'Cetak Riwayat Pinjam',
          icon: History,
          badge: null,
        },
        {
          id: 'laporan',
          label: 'Cetak Laporan Sekolah',
          icon: FileSpreadsheet,
          badge: null,
        },
      ],
    },
    {
      title: 'Integrasi Cloud & Sheets',
      items: [
        {
          id: 'google-sheets',
          label: 'Google Sheets & Drive',
          icon: Cloud,
          badge: null,
          badgeColor: 'bg-emerald-100 text-emerald-800',
        },
      ],
    },
    {
      title: 'Pengaturan Sistem',
      items: [
        {
          id: 'pengaturan',
          label: 'Pengaturan Sekolah',
          icon: Settings,
          badge: null,
        },
      ],
    },
  ];


  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden no-print"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 no-print ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <BookOpen className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                SIPERPUSTAKAAN
              </div>
              <div className="text-[10px] text-blue-400 font-medium">
                SMPN 3 RETEH
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-amber-300' : 'text-slate-400 group-hover:text-white'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.badge !== null && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              item.badgeColor ||
                              (isActive
                                ? 'bg-blue-700 text-white'
                                : 'bg-slate-800 text-slate-400')
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* School Footer Card */}
        <div className="p-3 m-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-bold text-white">Status Perpustakaan</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Akreditasi A &bull; Buka Senin - Sabtu 07.30 - 14.30 WIB
          </p>
        </div>
      </aside>
    </>
  );
};
