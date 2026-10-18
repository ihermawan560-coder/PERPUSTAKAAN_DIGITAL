import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  KelasItem,
  BukuItem,
  AnggotaItem,
  TransaksiItem,
  PengaturanSekolah,
  UserSession,
  ActiveTab,
} from '../types';
import {
  initialKelas,
  initialBuku,
  initialAnggota,
  initialTransaksi,
  initialPengaturan,
} from '../data/initialData';
import { generateId, generateTrxCode, hitungHariTerlambat } from '../utils/formatters';
import {
  fetchAllDataFromFirestore,
  saveDocToFirestore,
  syncAllDataToFirestore,
  subscribeToFirestoreSync,
  FS_COLLECTIONS,
} from '../services/firestoreSync';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface LibraryContextType {
  // Auth
  user: UserSession | null;
  login: (username: string, pass: string) => boolean;
  logout: () => void;

  // Active navigation tab
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  targetAnggotaKelasFilter: string;
  setTargetAnggotaKelasFilter: (id: string) => void;

  // Data
  kelas: KelasItem[];
  buku: BukuItem[];
  anggota: AnggotaItem[];
  transaksi: TransaksiItem[];
  pengaturan: PengaturanSekolah;

  // Cloud Sync Status (Otomatis Antar Platform)
  cloudSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastCloudSync: string | null;
  triggerManualCloudSync: () => Promise<void>;

  // CRUD Kelas
  addKelas: (data: Omit<KelasItem, 'id'>) => void;
  updateKelas: (id: string, data: Partial<KelasItem>) => void;
  deleteKelas: (id: string) => { success: boolean; message?: string };

  // CRUD Buku
  addBuku: (data: Omit<BukuItem, 'id'>) => void;
  updateBuku: (id: string, data: Partial<BukuItem>) => void;
  deleteBuku: (id: string) => { success: boolean; message?: string };

  // CRUD Anggota
  addAnggota: (data: Omit<AnggotaItem, 'id'>) => void;
  addMultipleAnggota: (list: Omit<AnggotaItem, 'id'>[]) => void;
  setAllAnggota: (list: AnggotaItem[]) => void;
  updateAnggota: (id: string, data: Partial<AnggotaItem>) => void;
  updateMultipleAnggotaKelas: (ids: string[], newKelasId: string) => void;
  deleteAnggota: (id: string) => { success: boolean; message?: string };
  clearAllAnggota: () => void;
  clearAnggotaByKelas: (kelasId: string) => void;

  // Transaksi
  addTransaksi: (data: {
    anggotaId: string;
    bukuId: string;
    tanggalPinjam: string;
    tanggalJatuhTempo: string;
    catatan?: string;
  }) => boolean;
  addTransaksiManual: (data: {
    namaSiswa: string;
    kelasId?: string;
    nomorAnggota?: string;
    noBuku: string;
    judulBuku: string;
    tanggalPinjam: string;
    tanggalJatuhTempo: string;
    catatan?: string;
  }) => boolean;
  kembalikanBuku: (data: {
    transaksiId: string;
    tanggalKembali: string;
    kondisiBuku: 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Hilang';
    statusDenda: 'Lunas' | 'Belum Lunas' | 'Tanpa Denda';
    catatan?: string;
  }) => void;
  updateTransaksi: (id: string, data: Partial<TransaksiItem>) => void;
  deleteTransaksi: (id: string) => void;

  // Pengaturan
  updatePengaturan: (data: Partial<PengaturanSekolah>) => void;
  resetAllData: () => void;
  exportDatabaseJSON: () => void;
  importDatabaseJSON: (jsonStr: string) => boolean;

  // Toasts
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Helpers
  getKelasById: (id: string) => KelasItem | undefined;
  getAnggotaById: (id: string) => AnggotaItem | undefined;
  getBukuById: (id: string) => BukuItem | undefined;
  refreshOverdueStatus: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'smpn3_library_user_v1',
  KELAS: 'smpn3_library_kelas_v1',
  BUKU: 'smpn3_library_buku_v1',
  ANGGOTA: 'smpn3_library_anggota_v1',
  TRANSAKSI: 'smpn3_library_transaksi_v1',
  PENGATURAN: 'smpn3_library_pengaturan_v1',
};

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [targetAnggotaKelasFilter, setTargetAnggotaKelasFilter] = useState<string>('all');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = generateId('toast');
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Datasets
  const [pengaturan, setPengaturan] = useState<PengaturanSekolah>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PENGATURAN);
      return saved ? JSON.parse(saved) : initialPengaturan;
    } catch {
      return initialPengaturan;
    }
  });

  const [kelas, setKelas] = useState<KelasItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.KELAS);
      if (saved) {
        const parsed: KelasItem[] = JSON.parse(saved);
        // Map old format names/IDs to standard VII.1, VII.2, etc.
        const updated = parsed.map((k) => {
          if (k.id === 'k-7a' || k.namaKelas === 'VII-A') return { ...k, id: 'k-71', namaKelas: 'VII.1' };
          if (k.id === 'k-7b' || k.namaKelas === 'VII-B') return { ...k, id: 'k-72', namaKelas: 'VII.2' };
          if (k.id === 'k-8a' || k.namaKelas === 'VIII-A') return { ...k, id: 'k-81', namaKelas: 'VIII.1' };
          if (k.id === 'k-8b' || k.namaKelas === 'VIII-B') return { ...k, id: 'k-82', namaKelas: 'VIII.2' };
          if (k.id === 'k-9a' || k.namaKelas === 'IX-A') return { ...k, id: 'k-91', namaKelas: 'IX.1' };
          if (k.id === 'k-9b' || k.namaKelas === 'IX-B') return { ...k, id: 'k-92', namaKelas: 'IX.2' };
          return k;
        });

        // Filter: STRICTLY only allowed classes (VII.1, VII.2, VIII.1, VIII.2, IX.1, IX.2, and Dewan Guru & Staf)
        const allowedIds = new Set(initialKelas.map((k) => k.id));
        const filtered = updated.filter((k) => allowedIds.has(k.id));

        // Ensure all standard SMPN 3 Reteh classes exist
        for (const defK of initialKelas) {
          if (!filtered.some((k) => k.id === defK.id || k.namaKelas === defK.namaKelas)) {
            filtered.push(defK);
          }
        }
        return filtered;
      }
      return initialKelas;
    } catch {
      return initialKelas;
    }
  });

  const [buku, setBuku] = useState<BukuItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUKU);
      if (saved) {
        const parsed: BukuItem[] = JSON.parse(saved);
        // If stored books do not have the newly added subject books, merge them
        const hasSubjects = parsed.some((b) => !!b.mataPelajaran);
        if (!hasSubjects) {
          return initialBuku;
        }
        return parsed;
      }
      return initialBuku;
    } catch {
      return initialBuku;
    }
  });

  const [anggota, setAnggota] = useState<AnggotaItem[]>(() => {
    try {
      // User explicitly requested to empty student & member data so they can input/sync it themselves
      const hasAppliedUserClear = localStorage.getItem('smpn3_anggota_cleared_user_v2');
      if (!hasAppliedUserClear) {
        localStorage.setItem('smpn3_anggota_cleared_user_v2', 'true');
        localStorage.setItem(STORAGE_KEYS.ANGGOTA, JSON.stringify([]));
        return [];
      }

      const saved = localStorage.getItem(STORAGE_KEYS.ANGGOTA);
      if (saved) {
        let parsed: AnggotaItem[] = JSON.parse(saved);
        // Map any legacy kelasId and remap removed classes (e.g. k-73 -> k-72)
        parsed = parsed.map((a) => {
          if (a.kelasId === 'k-7a' || a.kelasId === 'VII-A') return { ...a, kelasId: 'k-71' };
          if (a.kelasId === 'k-7b' || a.kelasId === 'VII-B') return { ...a, kelasId: 'k-72' };
          if (a.kelasId === 'k-73' || a.kelasId === 'VII-C' || a.kelasId === 'VII.3') return { ...a, kelasId: 'k-72' };
          if (a.kelasId === 'k-8a' || a.kelasId === 'VIII-A') return { ...a, kelasId: 'k-81' };
          if (a.kelasId === 'k-8b' || a.kelasId === 'VIII-B') return { ...a, kelasId: 'k-82' };
          if (a.kelasId === 'k-9a' || a.kelasId === 'IX-A') return { ...a, kelasId: 'k-91' };
          if (a.kelasId === 'k-9b' || a.kelasId === 'IX-B') return { ...a, kelasId: 'k-92' };
          return a;
        });
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  const [transaksi, setTransaksi] = useState<TransaksiItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSAKSI);
      return saved ? JSON.parse(saved) : initialTransaksi;
    } catch {
      return initialTransaksi;
    }
  });

  // Cloud Sync state (Otomatis & Multi-Platform)
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('syncing');
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);

  // Auto-sync from Cloud Firestore whenever the application is opened
  useEffect(() => {
    let isMounted = true;
    const initCloudData = async () => {
      setCloudSyncStatus('syncing');
      try {
        const remote = await fetchAllDataFromFirestore();
        if (!isMounted) return;

        if (remote) {
          const hasRemoteData =
            (remote.buku && remote.buku.length > 0) ||
            (remote.anggota && remote.anggota.length > 0) ||
            (remote.transaksi && remote.transaksi.length > 0) ||
            (remote.kelas && remote.kelas.length > 0);

          if (hasRemoteData) {
            if (remote.kelas && remote.kelas.length > 0) setKelas(remote.kelas);
            if (remote.buku && remote.buku.length > 0) setBuku(remote.buku);
            if (remote.anggota) setAnggota(remote.anggota);
            if (remote.transaksi) setTransaksi(remote.transaksi);
            if (remote.pengaturan) setPengaturan(remote.pengaturan);
          } else {
            // First time cloud initialization: seed current local state up to Firestore
            await syncAllDataToFirestore({
              buku,
              anggota,
              kelas,
              transaksi,
              pengaturan,
            });
          }
          setCloudSyncStatus('synced');
          setLastCloudSync(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        } else {
          setCloudSyncStatus('offline');
        }
      } catch (err) {
        console.warn('Auto cloud sync notice:', err);
        if (isMounted) setCloudSyncStatus('offline');
      }
    };

    initCloudData();

    // Live subscription across devices / platforms
    const unsub = subscribeToFirestoreSync(async (updated) => {
      if (updated.lastSyncedAt && isMounted) {
        setLastCloudSync(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        const fresh = await fetchAllDataFromFirestore();
        if (fresh && isMounted) {
          if (fresh.buku) setBuku(fresh.buku);
          if (fresh.anggota) setAnggota(fresh.anggota);
          if (fresh.transaksi) setTransaksi(fresh.transaksi);
          if (fresh.kelas) setKelas(fresh.kelas);
          if (fresh.pengaturan) setPengaturan(fresh.pengaturan);
        }
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const triggerManualCloudSync = async () => {
    setCloudSyncStatus('syncing');
    try {
      const ok = await syncAllDataToFirestore({
        buku,
        anggota,
        kelas,
        transaksi,
        pengaturan,
      });
      if (ok) {
        setCloudSyncStatus('synced');
        setLastCloudSync(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        addToast('Data perpustakaan berhasil disinkronkan ke Cloud Firestore!', 'success');
      } else {
        setCloudSyncStatus('offline');
        addToast('Sinkronisasi cloud tertunda (mode offline). Data tersimpan di perangkat.', 'info');
      }
    } catch (e: any) {
      setCloudSyncStatus('error');
      addToast('Gagal menyinkronkan ke Cloud. Cek koneksi internet.', 'error');
    }
  };

  // Sync to local storage
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(pengaturan));
  }, [pengaturan]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(kelas));
  }, [kelas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUKU, JSON.stringify(buku));
  }, [buku]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANGGOTA, JSON.stringify(anggota));
  }, [anggota]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSAKSI, JSON.stringify(transaksi));
  }, [transaksi]);

  // Check and update overdue status dynamically
  const refreshOverdueStatus = () => {
    setTransaksi((prev) =>
      prev.map((t) => {
        if (t.status === 'Dikembalikan') return t;
        const daysLate = hitungHariTerlambat(t.tanggalJatuhTempo);
        if (daysLate > 0) {
          const fine = daysLate * (pengaturan.dendaPerHari || 1000);
          return {
            ...t,
            status: 'Terlambat',
            denda: fine,
            statusDenda: t.statusDenda === 'Lunas' ? 'Lunas' : 'Belum Lunas',
          };
        }
        return {
          ...t,
          status: 'Dipinjam',
          denda: 0,
          statusDenda: 'Tanpa Denda',
        };
      })
    );
  };

  useEffect(() => {
    refreshOverdueStatus();
  }, [pengaturan.dendaPerHari]);

  // Auth methods
  const login = (username: string, pass: string): boolean => {
    if (username.trim().toLowerCase() === 'admin' && pass === 'admin') {
      const newSession: UserSession = {
        username: 'admin',
        name: 'Administrator Perpustakaan',
        role: 'admin',
        loginTime: new Date().toISOString(),
      };
      setUser(newSession);
      addToast('Selamat Datang di Sistem Perpustakaan SMP Negeri 3 Reteh', 'success');
      return true;
    }
    addToast('Username atau password salah! Silakan coba lagi.', 'error');
    return false;
  };

  const logout = () => {
    setUser(null);
    setActiveTab('dashboard');
    addToast('Anda telah keluar dari aplikasi', 'info');
  };

  // CRUD Kelas
  const addKelas = (data: Omit<KelasItem, 'id'>) => {
    const newK: KelasItem = {
      ...data,
      id: generateId('k'),
    };
    setKelas((prev) => [...prev, newK]);
    addToast(`Kelas ${newK.namaKelas} berhasil ditambahkan!`, 'success');
  };

  const updateKelas = (id: string, data: Partial<KelasItem>) => {
    setKelas((prev) => prev.map((k) => (k.id === id ? { ...k, ...data } : k)));
    addToast('Data kelas berhasil diperbarui!', 'success');
  };

  const deleteKelas = (id: string) => {
    // Check if any member belongs to this class
    const membersInClass = anggota.filter((a) => a.kelasId === id);
    if (membersInClass.length > 0) {
      addToast(`Tidak dapat menghapus! Ada ${membersInClass.length} anggota di kelas ini.`, 'error');
      return { success: false, message: 'Masih ada anggota terhubung ke kelas ini.' };
    }
    setKelas((prev) => prev.filter((k) => k.id !== id));
    addToast('Kelas berhasil dihapus.', 'info');
    return { success: true };
  };

  // CRUD Buku
  const addBuku = (data: Omit<BukuItem, 'id'>) => {
    const newBuku: BukuItem = {
      ...data,
      id: generateId('buku'),
    };
    setBuku((prev) => [newBuku, ...prev]);
    addToast(`Buku "${newBuku.judul}" berhasil didaftarkan!`, 'success');
  };

  const updateBuku = (id: string, data: Partial<BukuItem>) => {
    setBuku((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const updated = { ...b, ...data };
          // ensure available does not exceed total
          if (updated.jumlahTersedia > updated.jumlahTotal) {
            updated.jumlahTersedia = updated.jumlahTotal;
          }
          return updated;
        }
        return b;
      })
    );
    addToast('Data buku berhasil diperbarui!', 'success');
  };

  const deleteBuku = (id: string) => {
    // Check if active loans exist for this book
    const activeLoans = transaksi.filter((t) => t.bukuId === id && t.status !== 'Dikembalikan');
    if (activeLoans.length > 0) {
      addToast(`Tidak dapat dihapus! Buku sedang dipinjam dalam ${activeLoans.length} transaksi aktif.`, 'error');
      return { success: false, message: 'Buku masih dalam masa peminjaman aktif.' };
    }
    setBuku((prev) => prev.filter((b) => b.id !== id));
    addToast('Data buku berhasil dihapus.', 'info');
    return { success: true };
  };

  // CRUD Anggota
  const addAnggota = (data: Omit<AnggotaItem, 'id'>) => {
    const newAnggota: AnggotaItem = {
      ...data,
      id: generateId('ang'),
    };
    setAnggota((prev) => [newAnggota, ...prev]);
    addToast(`Anggota "${newAnggota.nama}" berhasil didaftarkan!`, 'success');
  };

  const addMultipleAnggota = (list: Omit<AnggotaItem, 'id'>[]) => {
    if (!list || list.length === 0) return;
    const newItems: AnggotaItem[] = list.map((item, index) => ({
      ...item,
      id: generateId(`ang_${Date.now()}_${index}`),
    }));
    setAnggota((prev) => [...newItems, ...prev]);
    addToast(`Berhasil menambahkan ${newItems.length} data siswa ke dalam sistem!`, 'success');
  };

  const updateAnggota = (id: string, data: Partial<AnggotaItem>) => {
    setAnggota((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
    addToast('Data anggota berhasil diperbarui!', 'success');
  };

  const updateMultipleAnggotaKelas = (ids: string[], newKelasId: string) => {
    if (!ids || ids.length === 0 || !newKelasId) return;
    const targetK = getKelasById(newKelasId);
    setAnggota((prev) =>
      prev.map((a) => (ids.includes(a.id) ? { ...a, kelasId: newKelasId } : a))
    );
    const targetName = targetK ? `Kelas ${targetK.namaKelas}` : 'kelas tujuan';
    addToast(`Berhasil memindahkan ${ids.length} anggota ke ${targetName}!`, 'success');
  };

  const deleteAnggota = (id: string) => {
    const activeLoans = transaksi.filter((t) => t.anggotaId === id && t.status !== 'Dikembalikan');
    if (activeLoans.length > 0) {
      addToast(`Tidak dapat dihapus! Anggota ini masih memiliki ${activeLoans.length} buku pinjaman aktif.`, 'error');
      return { success: false, message: 'Anggota memiliki buku yang belum dikembalikan.' };
    }
    setAnggota((prev) => prev.filter((a) => a.id !== id));
    addToast('Data anggota berhasil dihapus.', 'info');
    return { success: true };
  };

  const setAllAnggota = (list: AnggotaItem[]) => {
    setAnggota(list);
    localStorage.setItem(STORAGE_KEYS.ANGGOTA, JSON.stringify(list));
    localStorage.setItem('smpn3_anggota_cleared_user_v2', 'true');
  };

  const clearAllAnggota = () => {
    setAnggota([]);
    localStorage.setItem(STORAGE_KEYS.ANGGOTA, JSON.stringify([]));
    localStorage.setItem('smpn3_anggota_cleared_user_v2', 'true');
    addToast('Seluruh data anggota perpustakaan telah dikosongkan.', 'info');
  };

  const clearAnggotaByKelas = (kelasId: string) => {
    setAnggota((prev) => {
      const remaining = prev.filter((a) => a.kelasId !== kelasId);
      localStorage.setItem(STORAGE_KEYS.ANGGOTA, JSON.stringify(remaining));
      return remaining;
    });
    const k = getKelasById(kelasId);
    addToast(`Data anggota untuk ${k ? k.namaKelas : 'kelas terpilih'} berhasil dikosongkan.`, 'info');
  };

  // Transaksi
  const addTransaksi = (data: {
    anggotaId: string;
    bukuId: string;
    tanggalPinjam: string;
    tanggalJatuhTempo: string;
    catatan?: string;
  }): boolean => {
    const targetBuku = buku.find((b) => b.id === data.bukuId);
    if (!targetBuku) {
      addToast('Buku tidak ditemukan!', 'error');
      return false;
    }
    if (targetBuku.jumlahTersedia <= 0) {
      addToast('Stok buku ini sedang habis atau seluruhnya sedang dipinjam!', 'error');
      return false;
    }

    const activeMemberLoans = transaksi.filter(
      (t) => t.anggotaId === data.anggotaId && t.status !== 'Dikembalikan'
    );
    if (activeMemberLoans.length >= pengaturan.maksimalBukuPinjam) {
      addToast(
        `Anggota telah mencapai batas maksimal peminjaman (${pengaturan.maksimalBukuPinjam} buku)!`,
        'error'
      );
      return false;
    }

    const newTrx: TransaksiItem = {
      id: generateId('trx'),
      kodeTransaksi: generateTrxCode(transaksi.length),
      anggotaId: data.anggotaId,
      bukuId: data.bukuId,
      tanggalPinjam: data.tanggalPinjam,
      tanggalJatuhTempo: data.tanggalJatuhTempo,
      status: 'Dipinjam',
      denda: 0,
      statusDenda: 'Tanpa Denda',
      catatan: data.catatan || '',
      petugas: user?.username || 'admin',
    };

    // Decrease book available stock
    setBuku((prev) =>
      prev.map((b) => (b.id === data.bukuId ? { ...b, jumlahTersedia: b.jumlahTersedia - 1 } : b))
    );

    setTransaksi((prev) => [newTrx, ...prev]);
    saveDocToFirestore(FS_COLLECTIONS.TRANSAKSI, newTrx.id, newTrx);
    addToast(`Peminjaman berhasil dicatat dengan kode ${newTrx.kodeTransaksi}`, 'success');
    return true;
  };

  const addTransaksiManual = (data: {
    namaSiswa: string;
    kelasId?: string;
    nomorAnggota?: string;
    noBuku: string;
    judulBuku: string;
    tanggalPinjam: string;
    tanggalJatuhTempo: string;
    catatan?: string;
  }): boolean => {
    if (!data.namaSiswa.trim()) {
      addToast('Nama peminjam wajib diisi!', 'error');
      return false;
    }
    if (!data.noBuku.trim() && !data.judulBuku.trim()) {
      addToast('Nomor buku atau judul buku wajib diisi!', 'error');
      return false;
    }

    // 1. Resolve or Create Anggota
    let targetAnggota = anggota.find(
      (a) =>
        a.nama.trim().toLowerCase() === data.namaSiswa.trim().toLowerCase() ||
        (data.nomorAnggota && a.nomorAnggota.trim().toLowerCase() === data.nomorAnggota.trim().toLowerCase())
    );

    if (!targetAnggota) {
      const newAnggota: AnggotaItem = {
        id: generateId('ang'),
        nomorAnggota: data.nomorAnggota?.trim() || `NIS-${Math.floor(100000 + Math.random() * 900000)}`,
        nama: data.namaSiswa.trim(),
        jenisAnggota: data.kelasId === 'k-guru' ? 'Guru' : 'Siswa',
        kelasId: data.kelasId || 'k-71',
        jenisKelamin: 'Laki-laki',
        telepon: '-',
        alamat: 'SMPN 3 Reteh',
        tanggalBergabung: data.tanggalPinjam || new Date().toISOString().slice(0, 10),
        status: 'Aktif',
      };
      targetAnggota = newAnggota;
      setAnggota((prev) => [newAnggota, ...prev]);
      saveDocToFirestore(FS_COLLECTIONS.ANGGOTA, newAnggota.id, newAnggota);
    }

    // 2. Resolve or Create Buku
    let targetBuku = buku.find(
      (b) =>
        (data.noBuku && b.nomorBuku.trim().toLowerCase() === data.noBuku.trim().toLowerCase()) ||
        (data.judulBuku && b.judul.trim().toLowerCase() === data.judulBuku.trim().toLowerCase())
    );

    if (!targetBuku) {
      const newBuku: BukuItem = {
        id: generateId('buku'),
        nomorBuku: data.noBuku.trim() || `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        isbn: '-',
        judul: data.judulBuku.trim() || `Buku ${data.noBuku.trim()}`,
        pengarang: 'Penulis Perpustakaan',
        penerbit: 'Penerbit Mandiri',
        tahunTerbit: new Date().getFullYear(),
        kategori: 'Pelajaran',
        jumlahTotal: 5,
        jumlahTersedia: 4, // 1 borrowed now
        lokasiRak: 'Rak Peminjaman',
      };
      targetBuku = newBuku;
      setBuku((prev) => [newBuku, ...prev]);
      saveDocToFirestore(FS_COLLECTIONS.BUKU, newBuku.id, newBuku);
    } else {
      // Decrease stock
      setBuku((prev) =>
        prev.map((b) =>
          b.id === targetBuku!.id
            ? { ...b, jumlahTersedia: Math.max(0, b.jumlahTersedia - 1) }
            : b
        )
      );
      saveDocToFirestore(FS_COLLECTIONS.BUKU, targetBuku.id, {
        ...targetBuku,
        jumlahTersedia: Math.max(0, targetBuku.jumlahTersedia - 1)
      });
    }

    // 3. Create Transaksi
    const newTrx: TransaksiItem = {
      id: generateId('trx'),
      kodeTransaksi: generateTrxCode(transaksi.length),
      anggotaId: targetAnggota.id,
      bukuId: targetBuku.id,
      tanggalPinjam: data.tanggalPinjam,
      tanggalJatuhTempo: data.tanggalJatuhTempo,
      status: 'Dipinjam',
      denda: 0,
      statusDenda: 'Tanpa Denda',
      catatan: data.catatan || '',
      petugas: user?.username || 'admin',
    };

    setTransaksi((prev) => [newTrx, ...prev]);
    saveDocToFirestore(FS_COLLECTIONS.TRANSAKSI, newTrx.id, newTrx);
    addToast(`Peminjaman berhasil dicatat untuk "${targetAnggota.nama}" (${targetBuku.judul})!`, 'success');
    return true;
  };

  const kembalikanBuku = (data: {
    transaksiId: string;
    tanggalKembali: string;
    kondisiBuku: 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Hilang';
    statusDenda: 'Lunas' | 'Belum Lunas' | 'Tanpa Denda';
    catatan?: string;
  }) => {
    const targetTrx = transaksi.find((t) => t.id === data.transaksiId);
    if (!targetTrx) return;

    const daysLate = hitungHariTerlambat(targetTrx.tanggalJatuhTempo, data.tanggalKembali);
    const denda = daysLate > 0 ? daysLate * (pengaturan.dendaPerHari || 1000) : 0;
    const finalStatusDenda = denda === 0 ? 'Tanpa Denda' : data.statusDenda;

    // Increment book stock if not lost
    if (data.kondisiBuku !== 'Hilang') {
      setBuku((prev) =>
        prev.map((b) =>
          b.id === targetTrx.bukuId
            ? { ...b, jumlahTersedia: Math.min(b.jumlahTotal, b.jumlahTersedia + 1) }
            : b
        )
      );
    } else {
      // If book is lost, reduce total stock too
      setBuku((prev) =>
        prev.map((b) =>
          b.id === targetTrx.bukuId
            ? { ...b, jumlahTotal: Math.max(0, b.jumlahTotal - 1) }
            : b
        )
      );
    }

    setTransaksi((prev) =>
      prev.map((t) =>
        t.id === data.transaksiId
          ? {
              ...t,
              status: 'Dikembalikan',
              tanggalKembali: data.tanggalKembali,
              kondisiBukuSaatKembali: data.kondisiBuku,
              denda,
              statusDenda: finalStatusDenda,
              catatan: data.catatan ? `${t.catatan ? t.catatan + ' | ' : ''}${data.catatan}` : t.catatan,
            }
          : t
      )
    );

    addToast(`Pengembalian buku berhasil diproses!`, 'success');
  };

  const updateTransaksi = (id: string, data: Partial<TransaksiItem>) => {
    setTransaksi((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    addToast('Data transaksi berhasil diperbarui!', 'success');
  };

  const deleteTransaksi = (id: string) => {
    const targetTrx = transaksi.find((t) => t.id === id);
    if (targetTrx && targetTrx.status !== 'Dikembalikan') {
      // Return stock
      setBuku((prev) =>
        prev.map((b) =>
          b.id === targetTrx.bukuId
            ? { ...b, jumlahTersedia: Math.min(b.jumlahTotal, b.jumlahTersedia + 1) }
            : b
        )
      );
    }
    setTransaksi((prev) => prev.filter((t) => t.id !== id));
    addToast('Transaksi berhasil dihapus!', 'info');
  };

  // Pengaturan
  const updatePengaturan = (data: Partial<PengaturanSekolah>) => {
    setPengaturan((prev) => ({ ...prev, ...data }));
    addToast('Pengaturan perpustakaan berhasil disimpan!', 'success');
  };

  const resetAllData = () => {
    setKelas(initialKelas);
    setBuku(initialBuku);
    setAnggota(initialAnggota);
    setTransaksi(initialTransaksi);
    setPengaturan(initialPengaturan);
    localStorage.removeItem(STORAGE_KEYS.KELAS);
    localStorage.removeItem(STORAGE_KEYS.BUKU);
    localStorage.removeItem(STORAGE_KEYS.ANGGOTA);
    localStorage.removeItem(STORAGE_KEYS.TRANSAKSI);
    localStorage.removeItem(STORAGE_KEYS.PENGATURAN);
    addToast('Data berhasil di-reset ke data bawaan SMP Negeri 3 Reteh!', 'info');
  };

  const exportDatabaseJSON = () => {
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      pengaturan,
      kelas,
      buku,
      anggota,
      transaksi,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_perpustakaan_smpn3reteh_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Backup data perpustakaan berhasil diunduh!', 'success');
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.kelas && parsed.buku && parsed.anggota && parsed.transaksi) {
        setKelas(parsed.kelas);
        setBuku(parsed.buku);
        setAnggota(parsed.anggota);
        setTransaksi(parsed.transaksi);
        if (parsed.pengaturan) setPengaturan(parsed.pengaturan);
        addToast('Data perpustakaan berhasil dipulihkan dari file backup!', 'success');
        return true;
      }
      throw new Error('Format file tidak sesuai skema');
    } catch {
      addToast('Gagal memulihkan data: Format file JSON tidak valid', 'error');
      return false;
    }
  };

  // Helpers
  const getKelasById = (id: string) => {
    if (!id) return undefined;
    const direct = kelas.find((k) => k.id === id);
    if (direct) return direct;
    const byName = kelas.find((k) => k.namaKelas.toLowerCase() === id.toLowerCase());
    if (byName) return byName;
    const legacyMap: Record<string, string> = {
      'k-7a': 'k-71', 'k-7b': 'k-72', 'k-8a': 'k-81', 'k-8b': 'k-82', 'k-9a': 'k-91', 'k-9b': 'k-92',
      'VII-A': 'k-71', 'VII-B': 'k-72', 'VIII-A': 'k-81', 'VIII-B': 'k-82', 'IX-A': 'k-91', 'IX-B': 'k-92'
    };
    if (legacyMap[id]) {
      return kelas.find((k) => k.id === legacyMap[id]);
    }
    return undefined;
  };
  const getAnggotaById = (id: string) => anggota.find((a) => a.id === id);
  const getBukuById = (id: string) => buku.find((b) => b.id === id);

  return (
    <LibraryContext.Provider
      value={{
        user,
        login,
        logout,
        activeTab,
        setActiveTab,
        targetAnggotaKelasFilter,
        setTargetAnggotaKelasFilter,
        kelas,
        buku,
        anggota,
        transaksi,
        pengaturan,
        addKelas,
        updateKelas,
        deleteKelas,
        addBuku,
        updateBuku,
        deleteBuku,
        addAnggota,
        addMultipleAnggota,
        setAllAnggota,
        updateAnggota,
        updateMultipleAnggotaKelas,
        deleteAnggota,
        clearAllAnggota,
        clearAnggotaByKelas,
        addTransaksi,
        addTransaksiManual,
        cloudSyncStatus,
        lastCloudSync,
        triggerManualCloudSync,
        kembalikanBuku,
        updateTransaksi,
        deleteTransaksi,
        updatePengaturan,
        resetAllData,
        exportDatabaseJSON,
        importDatabaseJSON,
        toasts,
        addToast,
        removeToast,
        getKelasById,
        getAnggotaById,
        getBukuById,
        refreshOverdueStatus,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
