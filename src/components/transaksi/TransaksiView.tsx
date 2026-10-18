import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { TransaksiItem } from '../../types';
import {
  formatRupiah,
  formatTanggalIndo,
  hitungHariTerlambat,
} from '../../utils/formatters';
import {
  Repeat,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit2,
  Trash2,
  BookOpen,
  User,
  ArrowRightLeft,
  Calendar,
  AlertCircle,
  Keyboard,
  Layers,
  Sparkles,
  BookMarked,
  Check
} from 'lucide-react';
import { Modal, ConfirmModal } from '../common/Modal';

export const TransaksiView: React.FC = () => {
  const {
    transaksi,
    anggota,
    buku,
    kelas,
    pengaturan,
    addTransaksi,
    addTransaksiManual,
    kembalikanBuku,
    updateTransaksi,
    deleteTransaksi,
    getAnggotaById,
    getBukuById,
    getKelasById,
    refreshOverdueStatus,
  } = useLibrary();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // New Loan Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loanMode, setLoanMode] = useState<'manual' | 'select'>('manual');
  const [manualNamaSiswa, setManualNamaSiswa] = useState('');
  const [manualKelasId, setManualKelasId] = useState('k-71');
  const [manualNomorAnggota, setManualNomorAnggota] = useState('');
  const [manualNoBuku, setManualNoBuku] = useState('');
  const [manualJudulBuku, setManualJudulBuku] = useState('');
  const [bookCategoryFilter, setBookCategoryFilter] = useState<'all' | 'Pelajaran' | 'Fiksi' | 'Non-Fiksi'>('all');

  const [selectedAnggotaId, setSelectedAnggotaId] = useState('');
  const [selectedBukuId, setSelectedBukuId] = useState('');
  const [tanggalPinjam, setTanggalPinjam] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + (pengaturan.maksimalHariPinjam || 7));
    return d.toISOString().slice(0, 10);
  });
  const [catatanPinjam, setCatatanPinjam] = useState('');

  // Return Modal State
  const [returnTrxId, setReturnTrxId] = useState<string | null>(null);
  const [tanggalKembali, setTanggalKembali] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [kondisiBuku, setKondisiBuku] = useState<
    'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Hilang'
  >('Baik');
  const [statusDenda, setStatusDenda] = useState<'Lunas' | 'Belum Lunas' | 'Tanpa Denda'>(
    'Lunas'
  );
  const [catatanKembali, setCatatanKembali] = useState('');

  // Edit Modal State
  const [editingTrx, setEditingTrx] = useState<TransaksiItem | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<TransaksiItem>>({});

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filtered transactions
  const filteredTransaksi = transaksi.filter((t) => {
    const member = getAnggotaById(t.anggotaId);
    const book = getBukuById(t.bukuId);

    const matchSearch =
      t.kodeTransaksi.toLowerCase().includes(search.toLowerCase()) ||
      (member && member.nama.toLowerCase().includes(search.toLowerCase())) ||
      (member && member.nomorAnggota.toLowerCase().includes(search.toLowerCase())) ||
      (book && book.judul.toLowerCase().includes(search.toLowerCase())) ||
      (book && book.nomorBuku.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = filterStatus === 'all' || t.status === filterStatus;

    return matchSearch && matchStatus;
  });

  // Calculate active loans of selected member when adding
  const activeLoansOfSelectedMember = transaksi.filter(
    (t) => t.anggotaId === selectedAnggotaId && t.status !== 'Dikembalikan'
  ).length;

  const handleOpenAddLoan = () => {
    refreshOverdueStatus();
    const activeAnggota = anggota.filter((a) => a.status === 'Aktif');
    const availableBuku = buku.filter((b) => b.jumlahTersedia > 0);

    setSelectedAnggotaId(activeAnggota[0]?.id || '');
    setSelectedBukuId(availableBuku[0]?.id || '');

    // Reset manual loan state
    setLoanMode('manual');
    setManualNamaSiswa('');
    setManualKelasId(kelas[0]?.id || 'k-71');
    setManualNomorAnggota('');
    setManualNoBuku('');
    setManualJudulBuku('');
    setBookCategoryFilter('all');

    const today = new Date();
    setTanggalPinjam(today.toISOString().slice(0, 10));

    const dueDate = new Date();
    dueDate.setDate(today.getDate() + (pengaturan.maksimalHariPinjam || 7));
    setTanggalJatuhTempo(dueDate.toISOString().slice(0, 10));

    setCatatanPinjam('');
    setIsAddModalOpen(true);
  };

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();

    if (loanMode === 'manual') {
      if (!manualNamaSiswa.trim()) return;
      if (!manualNoBuku.trim() && !manualJudulBuku.trim()) return;

      const ok = addTransaksiManual({
        namaSiswa: manualNamaSiswa,
        kelasId: manualKelasId,
        nomorAnggota: manualNomorAnggota,
        noBuku: manualNoBuku,
        judulBuku: manualJudulBuku,
        tanggalPinjam,
        tanggalJatuhTempo,
        catatan: catatanPinjam,
      });

      if (ok) {
        setIsAddModalOpen(false);
      }
      return;
    }

    if (!selectedAnggotaId || !selectedBukuId) return;

    const ok = addTransaksi({
      anggotaId: selectedAnggotaId,
      bukuId: selectedBukuId,
      tanggalPinjam,
      tanggalJatuhTempo,
      catatan: catatanPinjam,
    });

    if (ok) {
      setIsAddModalOpen(false);
    }
  };

  const handleOpenReturnModal = (trx: TransaksiItem) => {
    setReturnTrxId(trx.id);
    const todayStr = new Date().toISOString().slice(0, 10);
    setTanggalKembali(todayStr);
    setKondisiBuku('Baik');

    const lateDays = hitungHariTerlambat(trx.tanggalJatuhTempo, todayStr);
    if (lateDays > 0) {
      setStatusDenda('Lunas');
    } else {
      setStatusDenda('Tanpa Denda');
    }
    setCatatanKembali('');
  };

  const handleProcessReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnTrxId) return;

    kembalikanBuku({
      transaksiId: returnTrxId,
      tanggalKembali,
      kondisiBuku,
      statusDenda,
      catatan: catatanKembali,
    });

    setReturnTrxId(null);
  };

  const handleOpenEditModal = (trx: TransaksiItem) => {
    setEditingTrx(trx);
    setEditFormData({
      tanggalPinjam: trx.tanggalPinjam,
      tanggalJatuhTempo: trx.tanggalJatuhTempo,
      tanggalKembali: trx.tanggalKembali || '',
      status: trx.status,
      denda: trx.denda,
      statusDenda: trx.statusDenda,
      catatan: trx.catatan || '',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrx) return;
    updateTransaksi(editingTrx.id, editFormData);
    setEditingTrx(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteTransaksi(deleteId);
      setDeleteId(null);
    }
  };

  const returnTargetTrx = transaksi.find((t) => t.id === returnTrxId);
  const returnMember = returnTargetTrx ? getAnggotaById(returnTargetTrx.anggotaId) : null;
  const returnBook = returnTargetTrx ? getBukuById(returnTargetTrx.bukuId) : null;
  const returnLateDays = returnTargetTrx
    ? hitungHariTerlambat(returnTargetTrx.tanggalJatuhTempo, tanggalKembali)
    : 0;
  const calculatedDenda = returnLateDays * (pengaturan.dendaPerHari || 1000);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Sirkulasi Transaksi Perpustakaan
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Peminjaman dan pengembalian buku, perhitungan denda keterlambatan otomatis, dan status sirkulasi.
          </p>
        </div>

        <button
          onClick={handleOpenAddLoan}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Peminjaman Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor transaksi, nama anggota, NISN, atau judul buku..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="Dipinjam">Sedang Dipinjam</option>
            <option value="Terlambat">Terlambat (Jatuh Tempo)</option>
            <option value="Dikembalikan">Sudah Dikembalikan</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">No. Transaksi</th>
                <th className="py-3 px-4">Anggota Peminjam</th>
                <th className="py-3 px-4">Buku & Nomor</th>
                <th className="py-3 px-4">Tgl Pinjam & Tempo</th>
                <th className="py-3 px-4">Status & Denda</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransaksi.map((trx) => {
                const member = getAnggotaById(trx.anggotaId);
                const book = getBukuById(trx.bukuId);

                return (
                  <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Kode Transaksi */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono text-xs font-bold text-blue-700">
                        {trx.kodeTransaksi}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Petugas: {trx.petugas}
                      </div>
                    </td>

                    {/* Member */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {member?.nama || 'Anggota Tidak Ditemukan'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        NISN/ID: {member?.nomorAnggota || '-'}
                      </div>
                    </td>

                    {/* Book */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-slate-800 line-clamp-1">
                        {book?.judul || 'Buku Tidak Ditemukan'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {book?.nomorBuku} &bull; {book?.lokasiRak}
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div>Pinjam: {formatTanggalIndo(trx.tanggalPinjam)}</div>
                      <div className="text-[11px] text-slate-500">
                        Tempo: <span className="font-semibold text-slate-700">{formatTanggalIndo(trx.tanggalJatuhTempo)}</span>
                      </div>
                      {trx.tanggalKembali && (
                        <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                          Kembali: {formatTanggalIndo(trx.tanggalKembali)}
                        </div>
                      )}
                    </td>

                    {/* Status & Fine */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        {trx.status === 'Dipinjam' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Dipinjam
                          </span>
                        )}
                        {trx.status === 'Terlambat' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            Terlambat
                          </span>
                        )}
                        {trx.status === 'Dikembalikan' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Dikembalikan
                          </span>
                        )}

                        {trx.denda > 0 && (
                          <span
                            className={`text-[10px] font-semibold ${
                              trx.statusDenda === 'Lunas'
                                ? 'text-emerald-700'
                                : 'text-rose-700'
                            }`}
                          >
                            Denda: {formatRupiah(trx.denda)} ({trx.statusDenda})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {trx.status !== 'Dikembalikan' && (
                          <button
                            onClick={() => handleOpenReturnModal(trx)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 transition-colors inline-flex items-center gap-1 text-[11px]"
                            title="Proses Pengembalian Buku"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Kembalikan</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEditModal(trx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Transaksi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteId(trx.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTransaksi.length === 0 && (
          <div className="p-8 text-center">
            <Repeat className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">Tidak ada transaksi ditemukan</h4>
            <p className="text-xs text-slate-500 mt-1">
              Belum ada transaksi peminjaman yang cocok dengan filter.
            </p>
          </div>
        )}
      </div>

      {/* Add Loan Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Catat Peminjaman Buku Baru"
        subtitle="Sirkulasi Perpustakaan SMP Negeri 3 Reteh"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateLoan} className="space-y-4">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setLoanMode('manual')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                loanMode === 'manual'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Input Manual (Nama Siswa & No Buku)</span>
            </button>
            <button
              type="button"
              onClick={() => setLoanMode('select')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                loanMode === 'select'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Pilih dari Daftar Terdaftar</span>
            </button>
          </div>

          {loanMode === 'manual' ? (
            /* MANUAL INPUT MODE */
            <div className="space-y-3.5 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900 pb-1 border-b border-blue-100">
                <User className="w-4 h-4 text-blue-600" />
                <span>1. Data Siswa / Peminjam</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Siswa / Peminjam <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualNamaSiswa}
                    onChange={(e) => setManualNamaSiswa(e.target.value)}
                    placeholder="Contoh: Ahmad Rizky Pratama"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  />
                  {anggota.length > 0 && manualNamaSiswa.length > 1 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {anggota
                        .filter((a) => a.nama.toLowerCase().includes(manualNamaSiswa.toLowerCase()))
                        .slice(0, 3)
                        .map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              setManualNamaSiswa(a.nama);
                              setManualKelasId(a.kelasId);
                              setManualNomorAnggota(a.nomorAnggota);
                            }}
                            className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-0.5 rounded-md cursor-pointer font-medium"
                          >
                            Pilih: {a.nama} ({getKelasById(a.kelasId)?.namaKelas})
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={manualKelasId}
                    onChange={(e) => setManualKelasId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  >
                    {kelas.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.namaKelas}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NISN / No Anggota
                  </label>
                  <input
                    type="text"
                    value={manualNomorAnggota}
                    onChange={(e) => setManualNomorAnggota(e.target.value)}
                    placeholder="Opsional (NISN)"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  />
                </div>
              </div>

              {/* BOOK DETAILS */}
              <div className="flex items-center justify-between text-xs font-bold text-blue-900 pt-2 pb-1 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>2. Data Buku yang Dipinjam</span>
                </div>
                <span className="text-[11px] text-slate-500 font-normal">Ketik manual atau klik daftar cepat</span>
              </div>

              {/* Category Filter Chips for Quick Book Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-[11px] font-semibold text-slate-600 shrink-0">Daftar Buku:</span>
                  {(['all', 'Pelajaran', 'Fiksi', 'Non-Fiksi'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setBookCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                        bookCategoryFilter === cat
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat === 'all' ? 'Semua Kategori' : `Buku ${cat}`}
                    </button>
                  ))}
                </div>

                {/* Quick Selection Chips from Database */}
                <div className="max-h-24 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200 flex flex-wrap gap-1.5">
                  {buku
                    .filter((b) => {
                      if (bookCategoryFilter === 'all') return true;
                      if (bookCategoryFilter === 'Pelajaran') return b.kategori === 'Pelajaran' || b.kategori === 'Muatan Lokal';
                      if (bookCategoryFilter === 'Fiksi') return b.kategori === 'Fiksi';
                      if (bookCategoryFilter === 'Non-Fiksi') return b.kategori === 'Non-Fiksi' || b.kategori === 'Sains' || b.kategori === 'Sejarah' || b.kategori === 'Referensi';
                      return true;
                    })
                    .slice(0, 15)
                    .map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setManualNoBuku(b.nomorBuku);
                          setManualJudulBuku(b.judul);
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border text-left cursor-pointer transition-colors flex items-center gap-1.5 ${
                          manualNoBuku === b.nomorBuku
                            ? 'bg-blue-100 border-blue-400 text-blue-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                        title={`${b.judul} (${b.nomorBuku}) - Stok: ${b.jumlahTersedia}`}
                      >
                        <span className="font-mono text-[10px] text-slate-500 font-normal">[{b.nomorBuku}]</span>
                        <span className="truncate max-w-[150px]">{b.judul}</span>
                        <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                          b.kategori === 'Fiksi' ? 'bg-amber-100 text-amber-800' :
                          b.kategori === 'Non-Fiksi' ? 'bg-purple-100 text-purple-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {b.kategori}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Buku / Kode <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualNoBuku}
                    onChange={(e) => {
                      const val = e.target.value;
                      setManualNoBuku(val);
                      // Auto-lookup matching book
                      const match = buku.find((b) => b.nomorBuku.toLowerCase() === val.toLowerCase());
                      if (match) {
                        setManualJudulBuku(match.judul);
                      }
                    }}
                    placeholder="Contoh: 510/MAT/VII/01"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  />
                </div>

                <div className="sm:col-span-8">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Judul Buku <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualJudulBuku}
                    onChange={(e) => setManualJudulBuku(e.target.value)}
                    placeholder="Contoh: Matematika Kelas VII Kurikulum Merdeka / Laskar Pelangi"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* SELECTION FROM REGISTERED LIST */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Anggota Peminjam <span className="text-rose-500">*</span>
                </label>
                <select
                  required={loanMode === 'select'}
                  value={selectedAnggotaId}
                  onChange={(e) => setSelectedAnggotaId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>-- Pilih Siswa / Guru --</option>
                  {anggota
                    .filter((a) => a.status === 'Aktif')
                    .map((a) => {
                      const currentLoans = transaksi.filter(
                        (t) => t.anggotaId === a.id && t.status !== 'Dikembalikan'
                      ).length;
                      const cls = getKelasById(a.kelasId);
                      return (
                        <option key={a.id} value={a.id}>
                          {a.nama} ({a.nomorAnggota}) - {cls?.namaKelas} [{currentLoans} buku aktif]
                        </option>
                      );
                    })}
                </select>
                {activeLoansOfSelectedMember >= pengaturan.maksimalBukuPinjam && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    Perhatian: Anggota ini telah meminjam {activeLoansOfSelectedMember} buku (Batas maksimal: {pengaturan.maksimalBukuPinjam}).
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Pilih Judul Buku <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-1 text-[11px]">
                    {(['all', 'Pelajaran', 'Fiksi', 'Non-Fiksi'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setBookCategoryFilter(cat)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                          bookCategoryFilter === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {cat === 'all' ? 'Semua' : cat}
                      </button>
                    ))}
                  </div>
                </div>
                <select
                  required={loanMode === 'select'}
                  value={selectedBukuId}
                  onChange={(e) => setSelectedBukuId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>-- Pilih Buku Tersedia --</option>
                  {buku
                    .filter((b) => {
                      if (bookCategoryFilter === 'all') return true;
                      if (bookCategoryFilter === 'Pelajaran') return b.kategori === 'Pelajaran' || b.kategori === 'Muatan Lokal';
                      if (bookCategoryFilter === 'Fiksi') return b.kategori === 'Fiksi';
                      if (bookCategoryFilter === 'Non-Fiksi') return b.kategori === 'Non-Fiksi' || b.kategori === 'Sains' || b.kategori === 'Sejarah' || b.kategori === 'Referensi';
                      return true;
                    })
                    .map((b) => (
                      <option key={b.id} value={b.id} disabled={b.jumlahTersedia <= 0}>
                        [{b.kategori}] {b.judul} [{b.nomorBuku}] - Stok: {b.jumlahTersedia}/{b.jumlahTotal} ({b.lokasiRak})
                        {b.jumlahTersedia <= 0 ? ' (HABIS)' : ''}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pinjam
              </label>
              <input
                type="date"
                required
                value={tanggalPinjam}
                onChange={(e) => {
                  setTanggalPinjam(e.target.value);
                  const pDate = new Date(e.target.value);
                  pDate.setDate(pDate.getDate() + (pengaturan.maksimalHariPinjam || 7));
                  setTanggalJatuhTempo(pDate.toISOString().slice(0, 10));
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Jatuh Tempo ({pengaturan.maksimalHariPinjam} Hari)
              </label>
              <input
                type="date"
                required
                value={tanggalJatuhTempo}
                onChange={(e) => setTanggalJatuhTempo(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Peminjaman (Opsional)
            </label>
            <input
              type="text"
              value={catatanPinjam}
              onChange={(e) => setCatatanPinjam(e.target.value)}
              placeholder="Contoh: Peminjaman mandiri / tugas literasi kelas"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loanMode === 'select' && activeLoansOfSelectedMember >= pengaturan.maksimalBukuPinjam}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50 transition-all"
            >
              Simpan Peminjaman Buku
            </button>
          </div>
        </form>
      </Modal>

      {/* Return Modal */}
      <Modal
        isOpen={!!returnTrxId}
        onClose={() => setReturnTrxId(null)}
        title="Proses Pengembalian Buku"
        subtitle={returnTargetTrx?.kodeTransaksi}
      >
        <form onSubmit={handleProcessReturn} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div>
              <span className="text-slate-500">Peminjam:</span>{' '}
              <strong className="text-slate-900">{returnMember?.nama}</strong> ({returnMember?.nomorAnggota})
            </div>
            <div>
              <span className="text-slate-500">Buku:</span>{' '}
              <strong className="text-slate-900">{returnBook?.judul}</strong>
            </div>
            <div>
              <span className="text-slate-500">Jatuh Tempo:</span>{' '}
              <span className="font-semibold text-slate-800">
                {formatTanggalIndo(returnTargetTrx?.tanggalJatuhTempo)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggal Dikembalikan
            </label>
            <input
              type="date"
              required
              value={tanggalKembali}
              onChange={(e) => setTanggalKembali(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {returnLateDays > 0 ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Terlambat {returnLateDays} Hari!
              </div>
              <div>
                Tarif denda: Rp {pengaturan.dendaPerHari.toLocaleString('id-ID')}/hari &bull; Total: <strong>{formatRupiah(calculatedDenda)}</strong>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pengembalian tepat waktu (Bebas Denda).</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kondisi Fisik Buku
              </label>
              <select
                value={kondisiBuku}
                onChange={(e) => setKondisiBuku(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Baik">Baik (Lengkap & Utuh)</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
                <option value="Hilang">Hilang (Kurangi Total Stok)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Pembayaran Denda
              </label>
              <select
                value={statusDenda}
                onChange={(e) => setStatusDenda(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Tanpa Denda">Tanpa Denda (Tepat Waktu)</option>
                <option value="Lunas">Lunas (Telah Disetor ke Kas)</option>
                <option value="Belum Lunas">Belum Lunas (Tunggakan)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Pengembalian
            </label>
            <input
              type="text"
              value={catatanKembali}
              onChange={(e) => setCatatanKembali(e.target.value)}
              placeholder="Catatan kondisi buku atau pembayaran denda..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setReturnTrxId(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            >
              Simpan & Kembalikan Buku
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal
        isOpen={!!editingTrx}
        onClose={() => setEditingTrx(null)}
        title="Edit Data Transaksi"
        subtitle={editingTrx?.kodeTransaksi}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pinjam
              </label>
              <input
                type="date"
                value={editFormData.tanggalPinjam}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, tanggalPinjam: e.target.value })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Jatuh Tempo
              </label>
              <input
                type="date"
                value={editFormData.tanggalJatuhTempo}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, tanggalJatuhTempo: e.target.value })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Peminjaman
              </label>
              <select
                value={editFormData.status}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, status: e.target.value as any })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Dipinjam">Dipinjam</option>
                <option value="Terlambat">Terlambat</option>
                <option value="Dikembalikan">Dikembalikan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Denda (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={editFormData.denda || 0}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, denda: parseInt(e.target.value) || 0 })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Transaksi
            </label>
            <input
              type="text"
              value={editFormData.catatan || ''}
              onChange={(e) => setEditFormData({ ...editFormData, catatan: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setEditingTrx(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Konfirmasi Hapus Transaksi"
        message="Apakah Anda yakin ingin menghapus catatan transaksi ini? Jika transaksi masih dalam status dipinjam, stok buku akan otomatis dikembalikan ke perpustakaan."
      />
    </div>
  );
};
