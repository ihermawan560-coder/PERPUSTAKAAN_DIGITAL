import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  formatRupiah,
  formatTanggalIndo,
  exportToCSV,
} from '../../utils/formatters';
import { SchoolHeader } from '../common/SchoolHeader';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import {
  PrintDocumentData,
  executePrint,
  downloadPrintableDocument
} from '../../utils/printHelper';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  BookOpen,
  Users,
  Repeat,
  Coins
} from 'lucide-react';

type JenisLaporan = 'sirkulasi' | 'denda' | 'katalog' | 'anggota';

export const LaporanView: React.FC = () => {
  const {
    transaksi,
    buku,
    anggota,
    kelas,
    pengaturan,
    getAnggotaById,
    getBukuById,
    getKelasById,
    addToast,
  } = useLibrary();

  const [jenisLaporan, setJenisLaporan] = useState<JenisLaporan>('sirkulasi');
  const [filterPeriode, setFilterPeriode] = useState<string>('all'); // all, thisMonth, thisYear, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Date filtering logic
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const isWithinPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    if (filterPeriode === 'all') return true;

    const d = new Date(dateStr);
    if (filterPeriode === 'thisMonth') {
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }
    if (filterPeriode === 'thisYear') {
      return d.getFullYear() === currentYear;
    }
    if (filterPeriode === 'custom') {
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(endDate)) return false;
      return true;
    }
    return true;
  };

  // Filtered transactions for sirkulasi report
  const filteredTransaksi = transaksi.filter((t) => isWithinPeriod(t.tanggalPinjam));

  // Transactions with fine for denda report
  const filteredDenda = filteredTransaksi.filter((t) => (t.denda || 0) > 0);

  // Total denda in period
  const totalDendaPeriode = filteredTransaksi.reduce((acc, curr) => acc + (curr.denda || 0), 0);
  const totalDendaLunas = filteredTransaksi
    .filter((t) => t.statusDenda === 'Lunas')
    .reduce((acc, curr) => acc + (curr.denda || 0), 0);

  const getReportTitle = () => {
    switch (jenisLaporan) {
      case 'sirkulasi':
        return 'LAPORAN SIRKULASI PEMINJAMAN DAN PENGEMBALIAN BUKU';
      case 'denda':
        return 'LAPORAN REKAPITULASI DENDA KETERLAMBATAN PENGEMBALIAN';
      case 'katalog':
        return 'LAPORAN DAFTAR INVENTARIS & KATALOG BUKU PERPUSTAKAAN';
      case 'anggota':
        return 'LAPORAN DATA INDUK ANGGOTA PERPUSTAKAAN SEKOLAH';
    }
  };

  const getPeriodeLabel = () => {
    if (filterPeriode === 'thisMonth') return `Periode: Bulan Ini (${new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date())})`;
    if (filterPeriode === 'thisYear') return `Periode: Tahun Ini (${new Date().getFullYear()})`;
    if (filterPeriode === 'custom' && (startDate || endDate)) {
      return `Periode: ${startDate || 'Awal'} s.d. ${endDate || 'Sekarang'}`;
    }
    return 'Periode: Seluruh Data Tercatat';
  };

  // Generate printable HTML table for modal & download
  const generateReportHtml = () => {
    if (jenisLaporan === 'sirkulasi') {
      return `
        <div style="font-size: 9.5pt; margin-bottom: 12px; color: #334155;">
          ${getPeriodeLabel()} | Total Transaksi: <strong>${filteredTransaksi.length}</strong>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th>No. Transaksi</th>
              <th>Nama Peminjam</th>
              <th>Kelas</th>
              <th>Judul Buku</th>
              <th>Tgl Pinjam</th>
              <th>Jatuh Tempo</th>
              <th>Tgl Kembali</th>
              <th>Status</th>
              <th>Denda</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransaksi.map((t, idx) => {
              const member = getAnggotaById(t.anggotaId);
              const book = getBukuById(t.bukuId);
              const cls = member ? getKelasById(member.kelasId) : null;
              return `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td style="font-family: monospace; font-weight: bold; text-align: center;">${t.kodeTransaksi}</td>
                  <td><strong>${member?.nama || '-'}</strong></td>
                  <td style="text-align: center;">${cls?.namaKelas || '-'}</td>
                  <td>${book?.judul || '-'}</td>
                  <td style="text-align: center;">${formatTanggalIndo(t.tanggalPinjam)}</td>
                  <td style="text-align: center;">${formatTanggalIndo(t.tanggalJatuhTempo)}</td>
                  <td style="text-align: center;">${t.tanggalKembali ? formatTanggalIndo(t.tanggalKembali) : '-'}</td>
                  <td style="text-align: center; font-weight: bold;">${t.status}</td>
                  <td style="text-align: right; font-family: monospace;">${t.denda > 0 ? formatRupiah(t.denda) : '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    if (jenisLaporan === 'denda') {
      return `
        <div style="display: flex; gap: 20px; font-size: 9.5pt; margin-bottom: 12px; background: #f8fafc; padding: 10px; border: 1px solid #cbd5e1;">
          <div>Kasus Keterlambatan: <strong>${filteredDenda.length} kali</strong></div>
          <div>Total Denda: <strong style="color: #b91c1c;">${formatRupiah(totalDendaPeriode)}</strong></div>
          <div>Denda Disetor: <strong style="color: #047857;">${formatRupiah(totalDendaLunas)}</strong></div>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th>No. Transaksi</th>
              <th>Nama Siswa</th>
              <th>Kelas</th>
              <th>Buku Dipinjam</th>
              <th>Jatuh Tempo</th>
              <th>Tgl Kembali</th>
              <th>Besaran Denda</th>
              <th>Status Bayar</th>
            </tr>
          </thead>
          <tbody>
            ${filteredDenda.map((t, idx) => {
              const member = getAnggotaById(t.anggotaId);
              const book = getBukuById(t.bukuId);
              const cls = member ? getKelasById(member.kelasId) : null;
              return `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td style="font-family: monospace; font-weight: bold; text-align: center;">${t.kodeTransaksi}</td>
                  <td><strong>${member?.nama || '-'}</strong></td>
                  <td style="text-align: center;">${cls?.namaKelas || '-'}</td>
                  <td>${book?.judul || '-'}</td>
                  <td style="text-align: center;">${formatTanggalIndo(t.tanggalJatuhTempo)}</td>
                  <td style="text-align: center;">${t.tanggalKembali ? formatTanggalIndo(t.tanggalKembali) : '-'}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold; color: #b91c1c;">${formatRupiah(t.denda)}</td>
                  <td style="text-align: center; font-weight: bold;">${t.statusDenda || 'Lunas'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    if (jenisLaporan === 'katalog') {
      return `
        <div style="font-size: 9.5pt; margin-bottom: 12px;">
          Total Judul Buku: <strong>${buku.length}</strong> | Total Fisik/Eksemplar: <strong>${buku.reduce((acc, curr) => acc + curr.jumlahTotal, 0)} eks</strong>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th>Nomor Buku</th>
              <th>Judul Buku</th>
              <th>Pengarang & Penerbit</th>
              <th>Kategori / Mapel</th>
              <th>Total</th>
              <th>Ada</th>
              <th>Rak</th>
            </tr>
          </thead>
          <tbody>
            ${buku.map((b, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="font-family: monospace; font-weight: bold; text-align: center;">${b.nomorBuku}</td>
                <td><strong>${b.judul}</strong><br><small style="color: #64748b;">ISBN: ${b.isbn}</small></td>
                <td>${b.pengarang} &bull; ${b.penerbit} (${b.tahunTerbit})</td>
                <td>${b.mataPelajaran ? `${b.mataPelajaran} (${b.tingkatKelas ? `Kls ${b.tingkatKelas}` : ''})` : b.kategori}</td>
                <td style="text-align: center; font-weight: bold;">${b.jumlahTotal}</td>
                <td style="text-align: center; font-weight: bold; color: #047857;">${b.jumlahTersedia}</td>
                <td style="text-align: center; font-family: monospace;">${b.lokasiRak}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    if (jenisLaporan === 'anggota') {
      return `
        <div style="font-size: 9.5pt; margin-bottom: 12px;">
          Total Anggota Terdaftar: <strong>${anggota.length}</strong> orang
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th>Nomor Anggota</th>
              <th>Nama Lengkap</th>
              <th>Jenis</th>
              <th>Kelas</th>
              <th>L/P</th>
              <th>Telepon</th>
              <th>Alamat</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${[...anggota].sort((a, b) => a.nama.localeCompare(b.nama, 'id')).map((a, idx) => {
              const cls = getKelasById(a.kelasId);
              return `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td style="font-family: monospace; font-weight: bold; text-align: center;">${a.nomorAnggota}</td>
                  <td><strong>${a.nama}</strong></td>
                  <td style="text-align: center;">${a.jenisAnggota}</td>
                  <td style="text-align: center;">${cls?.namaKelas || '-'}</td>
                  <td style="text-align: center;">${a.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}</td>
                  <td>${a.telepon}</td>
                  <td>${a.alamat}</td>
                  <td style="text-align: center; font-weight: bold;">${a.status}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }

    return '';
  };

  const getDocumentData = (): PrintDocumentData => {
    return {
      title: getReportTitle(),
      subtitle: `${getPeriodeLabel()} - Dokumen Resmi Perpustakaan SMP Negeri 3 Reteh`,
      filename: `laporan_${jenisLaporan}_smpn3reteh_${new Date().toISOString().slice(0, 10)}`,
      pengaturan,
      bodyHtml: generateReportHtml(),
      orientation: jenisLaporan === 'sirkulasi' || jenisLaporan === 'denda' ? 'landscape' : 'portrait',
    };
  };

  const handleDownloadCSV = () => {
    let filename = `laporan_${jenisLaporan}_smpn3reteh_${new Date().toISOString().slice(0, 10)}`;
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (jenisLaporan === 'sirkulasi') {
      headers = [
        'No. Transaksi',
        'Nama Peminjam',
        'NISN/ID',
        'Kelas',
        'Judul Buku',
        'Nomor Buku',
        'Tanggal Pinjam',
        'Jatuh Tempo',
        'Tanggal Kembali',
        'Status',
        'Denda',
      ];
      rows = filteredTransaksi.map((t) => {
        const member = getAnggotaById(t.anggotaId);
        const book = getBukuById(t.bukuId);
        const cls = member ? getKelasById(member.kelasId) : null;
        return [
          t.kodeTransaksi,
          member?.nama || '-',
          member?.nomorAnggota || '-',
          cls?.namaKelas || '-',
          book?.judul || '-',
          book?.nomorBuku || '-',
          t.tanggalPinjam,
          t.tanggalJatuhTempo,
          t.tanggalKembali || '-',
          t.status,
          t.denda || 0,
        ];
      });
    } else if (jenisLaporan === 'denda') {
      headers = [
        'No. Transaksi',
        'Nama Siswa',
        'Kelas',
        'Judul Buku',
        'Jatuh Tempo',
        'Tanggal Kembali',
        'Besaran Denda (Rp)',
        'Status Bayar',
      ];
      rows = filteredDenda.map((t) => {
        const member = getAnggotaById(t.anggotaId);
        const book = getBukuById(t.bukuId);
        const cls = member ? getKelasById(member.kelasId) : null;
        return [
          t.kodeTransaksi,
          member?.nama || '-',
          cls?.namaKelas || '-',
          book?.judul || '-',
          t.tanggalJatuhTempo,
          t.tanggalKembali || '-',
          t.denda || 0,
          t.statusDenda || 'Tanpa Denda',
        ];
      });
    } else if (jenisLaporan === 'katalog') {
      headers = [
        'Nomor Buku',
        'ISBN',
        'Judul Buku',
        'Pengarang',
        'Penerbit',
        'Tahun',
        'Kategori',
        'Mata Pelajaran',
        'Tingkat Kelas',
        'Total Stok',
        'Stok Tersedia',
        'Lokasi Rak',
      ];
      rows = buku.map((b) => [
        b.nomorBuku,
        b.isbn,
        b.judul,
        b.pengarang,
        b.penerbit,
        b.tahunTerbit,
        b.kategori,
        b.mataPelajaran || '-',
        b.tingkatKelas || '-',
        b.jumlahTotal,
        b.jumlahTersedia,
        b.lokasiRak,
      ]);
    } else if (jenisLaporan === 'anggota') {
      headers = [
        'Nomor Anggota / NISN',
        'Nama Lengkap',
        'Jenis Anggota',
        'Kelas',
        'Jenis Kelamin',
        'Telepon',
        'Alamat',
        'Status',
        'Tanggal Bergabung',
      ];
      rows = anggota.map((a) => {
        const cls = getKelasById(a.kelasId);
        return [
          a.nomorAnggota,
          a.nama,
          a.jenisAnggota,
          cls?.namaKelas || '-',
          a.jenisKelamin,
          a.telepon,
          a.alamat,
          a.status,
          a.tanggalBergabung,
        ];
      });
    }

    exportToCSV(filename, [headers, ...rows]);
    addToast('File CSV laporan berhasil diunduh!', 'success');
  };

  const handleOpenPrintModal = () => {
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Cetak Laporan Perpustakaan Sekolah
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ekspor dan cetak laporan sirkulasi peminjaman, denda, katalog buku, dan data anggota SMP Negeri 3 Reteh.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={handleOpenPrintModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Filter and Configuration Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 no-print">
        {/* Report Type Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => setJenisLaporan('sirkulasi')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              jenisLaporan === 'sirkulasi'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Sirkulasi & Peminjaman</span>
          </button>

          <button
            onClick={() => setJenisLaporan('denda')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              jenisLaporan === 'denda'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Denda Keterlambatan</span>
          </button>

          <button
            onClick={() => setJenisLaporan('katalog')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              jenisLaporan === 'katalog'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Katalog & Inventaris Buku</span>
          </button>

          <button
            onClick={() => setJenisLaporan('anggota')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              jenisLaporan === 'anggota'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Data Anggota Siswa/Guru</span>
          </button>
        </div>

        {/* Date Filters (applicable to transactions & fines) */}
        {(jenisLaporan === 'sirkulasi' || jenisLaporan === 'denda') && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Rentang Waktu:</span>
            </span>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'Semua Periode' },
                { id: 'thisMonth', label: 'Bulan Ini' },
                { id: 'thisYear', label: 'Tahun Ini' },
                { id: 'custom', label: 'Kustom Tanggal' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setFilterPeriode(p.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    filterPeriode === p.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {filterPeriode === 'custom' && (
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                />
                <span className="text-slate-400">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="p-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Printable Document Area */}
      <div className="printable-area bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        {/* School Header */}
        <SchoolHeader
          title={getReportTitle()}
          subtitle={`${getPeriodeLabel()} - Unit Perpustakaan Digital SMP Negeri 3 Reteh`}
        />

        {/* Dynamic Report Content Body */}
        {jenisLaporan === 'sirkulasi' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Total Transaksi:</span>{' '}
                <strong className="text-slate-900">{filteredTransaksi.length}</strong>
              </div>
              <div>
                <span className="text-slate-500">Buku Dipinjam:</span>{' '}
                <strong className="text-blue-700">
                  {filteredTransaksi.filter((t) => t.status === 'Dipinjam').length}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Dikembalikan:</span>{' '}
                <strong className="text-emerald-700">
                  {filteredTransaksi.filter((t) => t.status === 'Dikembalikan').length}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Terlambat:</span>{' '}
                <strong className="text-rose-700">
                  {filteredTransaksi.filter((t) => t.status === 'Terlambat').length}
                </strong>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Kode Transaksi</th>
                    <th className="py-2.5 px-3">Peminjam</th>
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3">Judul Buku</th>
                    <th className="py-2.5 px-3">Tgl Pinjam</th>
                    <th className="py-2.5 px-3">Jatuh Tempo</th>
                    <th className="py-2.5 px-3">Tgl Kembali</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Denda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTransaksi.map((item, idx) => {
                    const member = getAnggotaById(item.anggotaId);
                    const book = getBukuById(item.bukuId);
                    const cls = member ? getKelasById(member.kelasId) : null;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-900">
                          {item.kodeTransaksi}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {member?.nama || '-'}
                        </td>
                        <td className="py-2.5 px-3">{cls?.namaKelas || '-'}</td>
                        <td className="py-2.5 px-3 max-w-xs truncate">{book?.judul || '-'}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {formatTanggalIndo(item.tanggalPinjam)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {formatTanggalIndo(item.tanggalJatuhTempo)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {item.tanggalKembali ? formatTanggalIndo(item.tanggalKembali) : '-'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'Dikembalikan'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'Terlambat'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          {item.denda > 0 ? formatRupiah(item.denda) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {jenisLaporan === 'denda' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Kasus Keterlambatan:</span>{' '}
                <strong className="text-slate-900">{filteredDenda.length} kali</strong>
              </div>
              <div>
                <span className="text-slate-500">Total Denda Tercatat:</span>{' '}
                <strong className="text-rose-700">{formatRupiah(totalDendaPeriode)}</strong>
              </div>
              <div>
                <span className="text-slate-500">Denda Telah Disetor:</span>{' '}
                <strong className="text-emerald-700">{formatRupiah(totalDendaLunas)}</strong>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">No. Transaksi</th>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3">Buku Dipinjam</th>
                    <th className="py-2.5 px-3">Jatuh Tempo</th>
                    <th className="py-2.5 px-3">Tgl Kembali</th>
                    <th className="py-2.5 px-3 text-right">Besaran Denda</th>
                    <th className="py-2.5 px-3 text-center">Status Bayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDenda.map((item, idx) => {
                    const member = getAnggotaById(item.anggotaId);
                    const book = getBukuById(item.bukuId);
                    const cls = member ? getKelasById(member.kelasId) : null;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-900">
                          {item.kodeTransaksi}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {member?.nama || '-'}
                        </td>
                        <td className="py-2.5 px-3">{cls?.namaKelas || '-'}</td>
                        <td className="py-2.5 px-3 max-w-xs truncate">{book?.judul || '-'}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {formatTanggalIndo(item.tanggalJatuhTempo)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {item.tanggalKembali ? formatTanggalIndo(item.tanggalKembali) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                          {formatRupiah(item.denda)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.statusDenda === 'Lunas'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.statusDenda || 'Belum Lunas'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {jenisLaporan === 'katalog' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Total Koleksi Judul:</span>{' '}
                <strong className="text-slate-900">{buku.length} judul</strong>
              </div>
              <div>
                <span className="text-slate-500">Total Seluruh Eksemplar:</span>{' '}
                <strong className="text-blue-700">
                  {buku.reduce((acc, curr) => acc + curr.jumlahTotal, 0)} eksemplar
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Stok Tersedia di Rak:</span>{' '}
                <strong className="text-emerald-700">
                  {buku.reduce((acc, curr) => acc + curr.jumlahTersedia, 0)} eksemplar
                </strong>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Nomor Buku</th>
                    <th className="py-2.5 px-3">Judul Buku</th>
                    <th className="py-2.5 px-3">Pengarang & Penerbit</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-center">Total</th>
                    <th className="py-2.5 px-3 text-center">Tersedia</th>
                    <th className="py-2.5 px-3">Lokasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {buku.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-900">
                        {item.nomorBuku}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{item.judul}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ISBN: {item.isbn}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div>{item.pengarang}</div>
                        <div className="text-[10px] text-slate-500">
                          {item.penerbit} ({item.tahunTerbit})
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {item.mataPelajaran || item.kategori}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                        {item.jumlahTotal}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                        {item.jumlahTersedia}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {item.lokasiRak}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {jenisLaporan === 'anggota' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Total Anggota Terdaftar:</span>{' '}
                <strong className="text-slate-900">{anggota.length} orang</strong>
              </div>
              <div>
                <span className="text-slate-500">Anggota Siswa:</span>{' '}
                <strong className="text-blue-700">
                  {anggota.filter((a) => a.jenisAnggota === 'Siswa').length} siswa
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Guru & Staf:</span>{' '}
                <strong className="text-emerald-700">
                  {anggota.filter((a) => a.jenisAnggota === 'Guru' || a.jenisAnggota === 'Staf').length} orang
                </strong>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Nomor Anggota</th>
                    <th className="py-2.5 px-3">Nama Lengkap</th>
                    <th className="py-2.5 px-3">Jenis</th>
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3">L/P</th>
                    <th className="py-2.5 px-3">Telepon</th>
                    <th className="py-2.5 px-3">Alamat</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {[...anggota].sort((a, b) => a.nama.localeCompare(b.nama, 'id')).map((item, idx) => {
                    const cls = getKelasById(item.kelasId);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-900">
                          {item.nomorAnggota}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {item.nama}
                        </td>
                        <td className="py-2.5 px-3">{item.jenisAnggota}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {cls?.namaKelas || '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          {item.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                        </td>
                        <td className="py-2.5 px-3">{item.telepon}</td>
                        <td className="py-2.5 px-3 max-w-xs truncate">{item.alamat}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'Aktif'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Formal Legal Validation Signatures */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-800">
          <div>
            <p className="text-slate-600">Mengetahui,</p>
            <p className="font-semibold text-slate-900">Kepala SMP Negeri 3 Reteh</p>
            <div className="h-16 flex items-center justify-center">
              <span className="font-serif italic text-slate-400 text-[10px]">[Tanda Tangan & Cap]</span>
            </div>
            <p className="font-bold underline text-slate-900">{pengaturan.namaKepalaSekolah}</p>
            <p className="text-[11px] text-slate-500">NIP. {pengaturan.nipKepalaSekolah}</p>
          </div>

          <div>
            <p className="text-slate-600">Sanglar, {formatTanggalIndo(new Date().toISOString().slice(0, 10))}</p>
            <p className="font-semibold text-slate-900">Kepala Perpustakaan</p>
            <div className="h-16 flex items-center justify-center">
              <span className="font-serif italic text-slate-400 text-[10px]">[Tanda Tangan & Cap]</span>
            </div>
            <p className="font-bold underline text-slate-900">{pengaturan.namaKepalaPerpustakaan}</p>
            <p className="text-[11px] text-slate-500">NIP. {pengaturan.nipKepalaPerpustakaan}</p>
          </div>
        </div>

      </div>

      {/* Universal Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        documentData={getDocumentData()}
        onDownloadCsv={handleDownloadCSV}
      />
    </div>
  );
};
