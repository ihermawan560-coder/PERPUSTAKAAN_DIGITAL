import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { formatRupiah, formatTanggalIndo } from '../../utils/formatters';
import {
  BookOpen,
  Users,
  Repeat,
  AlertTriangle,
  Coins,
  BookmarkCheck,
  TrendingUp,
  PlusCircle,
  FileText,
  CreditCard,
  ChevronRight,
  Sparkles,
  School,
  CheckCircle2,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { PWAInstallButton } from '../common/PWAInstallButton';

export const DashboardView: React.FC = () => {
  const {
    buku,
    anggota,
    transaksi,
    kelas,
    pengaturan,
    setActiveTab,
    kembalikanBuku,
    getAnggotaById,
    getBukuById,
  } = useLibrary();

  // Quick return modal state
  const [returnModalTrxId, setReturnModalTrxId] = useState<string | null>(null);
  const [returnCondition, setReturnCondition] = useState<'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Hilang'>('Baik');
  const [returnFineStatus, setReturnFineStatus] = useState<'Lunas' | 'Belum Lunas' | 'Tanpa Denda'>('Lunas');
  const [returnNotes, setReturnNotes] = useState('');

  // Calculations
  const totalJudulBuku = buku.length;
  const totalEksemplar = buku.reduce((acc, curr) => acc + curr.jumlahTotal, 0);
  const totalTersedia = buku.reduce((acc, curr) => acc + curr.jumlahTersedia, 0);
  const totalAnggota = anggota.length;
  const activeLoans = transaksi.filter((t) => t.status === 'Dipinjam');
  const overdueLoans = transaksi.filter((t) => t.status === 'Terlambat');
  const totalDenda = transaksi.reduce((acc, curr) => acc + (curr.denda || 0), 0);

  // Recent 6 transactions
  const recentTransactions = [...transaksi]
    .sort((a, b) => new Date(b.tanggalPinjam).getTime() - new Date(a.tanggalPinjam).getTime())
    .slice(0, 6);

  // Category counts
  const categoryMap: { [key: string]: number } = {};
  buku.forEach((b) => {
    categoryMap[b.kategori] = (categoryMap[b.kategori] || 0) + b.jumlahTotal;
  });

  const handleProcessQuickReturn = () => {
    if (!returnModalTrxId) return;
    kembalikanBuku({
      transaksiId: returnModalTrxId,
      tanggalKembali: new Date().toISOString().slice(0, 10),
      kondisiBuku: returnCondition,
      statusDenda: returnFineStatus,
      catatan: returnNotes,
    });
    setReturnModalTrxId(null);
  };

  const selectedTrxForReturn = transaksi.find((t) => t.id === returnModalTrxId);
  const selectedMember = selectedTrxForReturn ? getAnggotaById(selectedTrxForReturn.anggotaId) : null;
  const selectedBook = selectedTrxForReturn ? getBukuById(selectedTrxForReturn.bukuId) : null;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-blue-800/40">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Sistem Otomasi Perpustakaan Digital
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Selamat Datang di {pengaturan.namaSekolah}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Pusat literasi terpadu SMP Negeri 3 Reteh, Sanglar, Reteh, Kabupaten Indragiri Hilir.
              Kelola sirkulasi buku, data kelas, kartu anggota, dan cetak laporan resmi dengan mudah.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setActiveTab('transaksi')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Transaksi Pinjam
            </button>
            <button
              onClick={() => setActiveTab('kartu-anggota')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4 text-amber-300" />
              Cetak Kartu
            </button>
            <button
              onClick={() => setActiveTab('laporan')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              Cetak Laporan
            </button>
          </div>
        </div>
      </div>

      {/* Download / Install App Banner for Multi-Device Use */}
      <PWAInstallButton variant="banner" />

      {/* Overdue Warning Alert Banner (if any) */}
      {overdueLoans.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white font-bold flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                Perhatian: Terdapat {overdueLoans.length} Peminjaman Melewati Batas Waktu!
              </h4>
              <p className="text-[11px] sm:text-xs text-amber-800">
                Denda keterlambatan berlaku Rp {pengaturan.dendaPerHari.toLocaleString('id-ID')}/hari. Segera proses pengembalian buku.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('transaksi')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-all self-start sm:self-auto flex items-center gap-1.5"
          >
            <span>Lihat Daftar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Judul Buku */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500">Judul Buku</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalJudulBuku}</div>
          <div className="text-[11px] text-slate-500 mt-1">Koleksi Terdaftar</div>
        </div>

        {/* Card 2: Total Eksemplar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500">Total Stok</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <BookmarkCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalEksemplar}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {totalTersedia} eksemplar tersedia
          </div>
        </div>

        {/* Card 3: Anggota */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500">Anggota</span>
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalAnggota}</div>
          <div className="text-[11px] text-slate-500 mt-1">Siswa & Guru Terdaftar</div>
        </div>

        {/* Card 4: Pinjam Aktif */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500">Sedang Dipinjam</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">{activeLoans.length}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Sirkulasi Aktif</div>
        </div>

        {/* Card 5: Terlambat */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500">Jatuh Tempo</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700">{overdueLoans.length}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">Perlu Ditagih</div>
        </div>

        {/* Card 6: Denda */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500">Total Denda</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-teal-700">{formatRupiah(totalDenda)}</div>
          <div className="text-[11px] text-teal-600 font-medium mt-1">Kas Keterlambatan</div>
        </div>
      </div>

      {/* Main Grid: Recent Transactions & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recent Transactions Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Transaksi Sirkulasi Terkini</h3>
            </div>
            <button
              onClick={() => setActiveTab('transaksi')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
            >
              <span>Semua Transaksi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Kode & Anggota</th>
                  <th className="py-3 px-4">Judul Buku</th>
                  <th className="py-3 px-4">Tgl Pinjam / Tempo</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((trx) => {
                  const member = getAnggotaById(trx.anggotaId);
                  const book = getBukuById(trx.bukuId);

                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] font-bold text-blue-700">
                          {trx.kodeTransaksi}
                        </div>
                        <div className="font-semibold text-slate-800 mt-0.5">
                          {member?.nama || 'Anggota'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {member?.nomorAnggota}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-slate-900 line-clamp-1">
                          {book?.judul || 'Judul Buku'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {book?.nomorBuku} &bull; {book?.lokasiRak}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-700">{formatTanggalIndo(trx.tanggalPinjam)}</div>
                        <div className="text-[11px] text-slate-500">
                          s/d <span className="font-medium text-slate-700">{formatTanggalIndo(trx.tanggalJatuhTempo)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {trx.status === 'Dipinjam' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Dipinjam
                          </span>
                        )}
                        {trx.status === 'Terlambat' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            Terlambat ({formatRupiah(trx.denda)})
                          </span>
                        )}
                        {trx.status === 'Dikembalikan' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Dikembalikan
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {trx.status !== 'Dikembalikan' ? (
                          <button
                            onClick={() => {
                              setReturnModalTrxId(trx.id);
                              setReturnCondition('Baik');
                              setReturnFineStatus(trx.denda > 0 ? 'Lunas' : 'Tanpa Denda');
                              setReturnNotes('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200 transition-colors inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Kembalikan</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Selesai</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Categories & Quick Links */}
        <div className="lg:col-span-4 space-y-6">
          {/* Categories Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Distribusi Kategori Buku</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {Object.keys(categoryMap).length} Kategori
              </span>
            </div>

            <div className="space-y-3">
              {Object.entries(categoryMap).map(([kat, count]) => {
                const percentage = Math.round((count / (totalEksemplar || 1)) * 100);
                return (
                  <div key={kat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{kat}</span>
                      <span className="font-semibold text-slate-900">{count} eks ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Layanan Cepat</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTab('stok-pelajaran')}
                className="p-3 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/80 text-left transition-colors col-span-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-700" />
                    <div className="text-xs font-bold text-blue-900">Stok Buku Pelajaran (11 Mapel)</div>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">
                    Buka Stok
                  </span>
                </div>
                <div className="text-[10px] text-blue-700 mt-1">
                  Matematika, B. Indo, B. Inggris, Pancasila, PAI, IPA, IPS, PJOK, Prakarya/Seni, Informatika, BMR
                </div>
              </button>

              <button
                onClick={() => setActiveTab('kelas')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-colors"
              >
                <School className="w-4 h-4 text-blue-600 mb-1" />
                <div className="text-xs font-bold text-slate-900">Data Kelas</div>
                <div className="text-[10px] text-slate-500">{kelas.length} rombel aktif</div>
              </button>

              <button
                onClick={() => setActiveTab('kartu-anggota')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-colors"
              >
                <CreditCard className="w-4 h-4 text-emerald-600 mb-1" />
                <div className="text-xs font-bold text-slate-900">Kartu Anggota</div>
                <div className="text-[10px] text-slate-500">Cetak & Unduh</div>
              </button>

              <button
                onClick={() => setActiveTab('riwayat')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-colors"
              >
                <BookmarkCheck className="w-4 h-4 text-violet-600 mb-1" />
                <div className="text-xs font-bold text-slate-900">Riwayat Siswa</div>
                <div className="text-[10px] text-slate-500">Cek rekam baca</div>
              </button>

              <button
                onClick={() => setActiveTab('laporan')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-colors"
              >
                <FileText className="w-4 h-4 text-amber-600 mb-1" />
                <div className="text-xs font-bold text-slate-900">Laporan Resmi</div>
                <div className="text-[10px] text-slate-500">Kop SMPN 3 Reteh</div>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Quick Return Modal */}
      <Modal
        isOpen={!!returnModalTrxId}
        onClose={() => setReturnModalTrxId(null)}
        title="Proses Pengembalian Buku"
        subtitle={selectedTrxForReturn?.kodeTransaksi}
      >
        {selectedTrxForReturn && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div>
                <span className="text-slate-500">Peminjam:</span>{' '}
                <strong className="text-slate-800">{selectedMember?.nama}</strong> ({selectedMember?.nomorAnggota})
              </div>
              <div>
                <span className="text-slate-500">Buku:</span>{' '}
                <strong className="text-slate-800">{selectedBook?.judul}</strong> ({selectedBook?.nomorBuku})
              </div>
              <div>
                <span className="text-slate-500">Tenggat Waktu:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {formatTanggalIndo(selectedTrxForReturn.tanggalJatuhTempo)}
                </span>
              </div>
              {selectedTrxForReturn.denda > 0 && (
                <div className="text-rose-700 font-bold">
                  Denda Keterlambatan: {formatRupiah(selectedTrxForReturn.denda)}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kondisi Fisik Buku Saat Dikembalikan
              </label>
              <select
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Baik">Baik (Lengkap & Utuh)</option>
                <option value="Rusak Ringan">Rusak Ringan (Halaman sobek/terlipat)</option>
                <option value="Rusak Berat">Rusak Berat</option>
                <option value="Hilang">Hilang (Perlu Ganti)</option>
              </select>
            </div>

            {selectedTrxForReturn.denda > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Pembayaran Denda
                </label>
                <select
                  value={returnFineStatus}
                  onChange={(e) => setReturnFineStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Lunas">Lunas (Telah dibayar ke kas)</option>
                  <option value="Belum Lunas">Belum Lunas (Tunggakan)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Pengembalian (Opsional)
              </label>
              <textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Catatan tambahan bila ada..."
                rows={2}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReturnModalTrxId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProcessQuickReturn}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
              >
                Simpan & Kembalikan Buku
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
