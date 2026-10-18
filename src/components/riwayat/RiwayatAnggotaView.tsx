import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { formatRupiah, formatTanggalIndo, exportToCSV } from '../../utils/formatters';
import { SchoolHeader } from '../common/SchoolHeader';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import {
  PrintDocumentData,
  executePrint,
  downloadPrintableDocument
} from '../../utils/printHelper';
import {
  History,
  Printer,
  Download,
  Search,
  User,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  Award
} from 'lucide-react';

export const RiwayatAnggotaView: React.FC = () => {
  const { anggota, kelas, transaksi, pengaturan, getKelasById, getBukuById, addToast } = useLibrary();

  const [selectedAnggotaId, setSelectedAnggotaId] = useState<string>(
    anggota[0]?.id || ''
  );
  const [filterKelasId, setFilterKelasId] = useState<string>('all');
  const [searchMember, setSearchMember] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filter members (sorted alphabetically A-Z)
  const filteredAnggota = anggota
    .filter((a) => {
      const matchKelas = filterKelasId === 'all' || a.kelasId === filterKelasId;
      const matchSearch =
        a.nama.toLowerCase().includes(searchMember.toLowerCase()) ||
        a.nomorAnggota.toLowerCase().includes(searchMember.toLowerCase());
      return matchKelas && matchSearch;
    })
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));

  const selectedMember = anggota.find((a) => a.id === selectedAnggotaId) || filteredAnggota[0] || anggota[0];
  const memberClass = selectedMember ? getKelasById(selectedMember.kelasId) : null;

  // Member's loan history
  const memberLoans = selectedMember
    ? transaksi.filter((t) => t.anggotaId === selectedMember.id)
    : [];

  // Member Stats
  const totalPinjam = memberLoans.length;
  const sedangPinjam = memberLoans.filter((t) => t.status === 'Dipinjam').length;
  const pernahTerlambat = memberLoans.filter(
    (t) => t.status === 'Terlambat' || t.denda > 0
  ).length;
  const totalDenda = memberLoans.reduce((acc, curr) => acc + (curr.denda || 0), 0);
  const kepatuhanPct = totalPinjam > 0
    ? Math.round(((totalPinjam - pernahTerlambat) / totalPinjam) * 100)
    : 100;

  // Generate printable HTML transcript for member
  const generateHistoryHtml = () => {
    if (!selectedMember) return '';
    return `
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; font-size: 10pt;">
        <table style="width: 100%; border: none;">
          <tr>
            <td style="width: 20%; font-weight: bold; border: none; padding: 3px 0;">Nama Siswa/Anggota</td>
            <td style="width: 30%; border: none; padding: 3px 0;">: <strong>${selectedMember.nama}</strong></td>
            <td style="width: 20%; font-weight: bold; border: none; padding: 3px 0;">Kelas / Rombel</td>
            <td style="width: 30%; border: none; padding: 3px 0;">: ${memberClass?.namaKelas || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: none; padding: 3px 0;">Nomor Anggota / NISN</td>
            <td style="border: none; padding: 3px 0;">: ${selectedMember.nomorAnggota}</td>
            <td style="font-weight: bold; border: none; padding: 3px 0;">Wali Kelas</td>
            <td style="border: none; padding: 3px 0;">: ${memberClass?.waliKelas || '-'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border: none; padding: 3px 0;">Status Anggota</td>
            <td style="border: none; padding: 3px 0;">: ${selectedMember.status}</td>
            <td style="font-weight: bold; border: none; padding: 3px 0;">Tingkat Kepatuhan</td>
            <td style="border: none; padding: 3px 0;">: <strong>${kepatuhanPct}%</strong> (${totalPinjam} kali pinjam, ${sedangPinjam} aktif)</td>
          </tr>
        </table>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 35px;">No</th>
            <th>Kode Transaksi</th>
            <th>Judul Buku</th>
            <th>Nomor Buku</th>
            <th>Tgl Pinjam</th>
            <th>Jatuh Tempo</th>
            <th>Tgl Kembali</th>
            <th>Status</th>
            <th>Denda</th>
          </tr>
        </thead>
        <tbody>
          ${
            memberLoans.length > 0
              ? memberLoans
                  .map((item, idx) => {
                    const book = getBukuById(item.bukuId);
                    return `
                    <tr>
                      <td style="text-align: center;">${idx + 1}</td>
                      <td style="font-family: monospace; font-weight: bold;">${item.kodeTransaksi}</td>
                      <td><strong>${book?.judul || '-'}</strong></td>
                      <td style="font-family: monospace; text-align: center;">${book?.nomorBuku || '-'}</td>
                      <td style="text-align: center;">${formatTanggalIndo(item.tanggalPinjam)}</td>
                      <td style="text-align: center;">${formatTanggalIndo(item.tanggalJatuhTempo)}</td>
                      <td style="text-align: center;">${item.tanggalKembali ? formatTanggalIndo(item.tanggalKembali) : '-'}</td>
                      <td style="text-align: center; font-weight: bold;">${item.status}</td>
                      <td style="text-align: right; font-family: monospace;">${item.denda > 0 ? formatRupiah(item.denda) : 'Rp 0'}</td>
                    </tr>
                  `;
                  })
                  .join('')
              : `<tr><td colspan="9" style="text-align: center; padding: 15px;">Belum ada riwayat peminjaman.</td></tr>`
          }
        </tbody>
      </table>
    `;
  };

  const getDocumentData = (): PrintDocumentData => {
    return {
      title: 'TRANSKRIP RIWAYAT PEMINJAMAN BUKU PERPUSTAKAAN',
      subtitle: `Siswa/Anggota: ${selectedMember?.nama || ''} (${selectedMember?.nomorAnggota || ''}) - Kelas ${memberClass?.namaKelas || '-'}`,
      filename: `riwayat_peminjaman_${selectedMember?.nomorAnggota || 'siswa'}_${selectedMember?.nama.replace(/\s+/g, '_') || 'dokumen'}`,
      pengaturan,
      bodyHtml: generateHistoryHtml(),
    };
  };

  const handleOpenPrintModal = () => {
    setIsPrintModalOpen(true);
  };

  const handleDownloadCSV = () => {
    if (!selectedMember) return;
    const headers = [
      'No. Transaksi',
      'Kode Buku',
      'Judul Buku',
      'Tanggal Pinjam',
      'Tanggal Jatuh Tempo',
      'Tanggal Kembali',
      'Status',
      'Kondisi Buku',
      'Denda',
      'Catatan',
    ];

    const rows = memberLoans.map((t) => {
      const book = getBukuById(t.bukuId);
      return [
        t.kodeTransaksi,
        book?.nomorBuku || '-',
        book?.judul || '-',
        t.tanggalPinjam,
        t.tanggalJatuhTempo,
        t.tanggalKembali || '-',
        t.status,
        t.kondisiBukuSaatKembali || '-',
        t.denda || 0,
        t.catatan || '',
      ];
    });

    exportToCSV(
      `riwayat_pinjam_${selectedMember.nomorAnggota}_${selectedMember.nama.replace(/\s+/g, '_')}`,
      [headers, ...rows]
    );
    addToast('File CSV riwayat peminjaman berhasil diunduh!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Cetak Riwayat Peminjaman per Siswa / Anggota
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rekam jejak sirkulasi buku, kepatuhan pengembalian, dan denda siswa SMP Negeri 3 Reteh siap cetak resmi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Download riwayat format Excel/CSV"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={handleOpenPrintModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Riwayat</span>
          </button>
        </div>
      </div>

      {/* Member Filter & Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Filter Kelas
            </label>
            <select
              value={filterKelasId}
              onChange={(e) => setFilterKelasId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Kelas</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.namaKelas}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Anggota / Siswa
            </label>
            <select
              value={selectedAnggotaId}
              onChange={(e) => setSelectedAnggotaId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filteredAnggota.map((a) => {
                const cls = getKelasById(a.kelasId);
                return (
                  <option key={a.id} value={a.id}>
                    {a.nama} ({a.nomorAnggota}) - {cls?.namaKelas} [{a.jenisAnggota}]
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Main Printable Transcript Area */}
      {selectedMember && (
        <div className="printable-area bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          {/* Formal School Letterhead */}
          <SchoolHeader
            title="TRANSKRIP RIWAYAT PEMINJAMAN BUKU PERPUSTAKAAN"
            subtitle={`Nomor Induk Anggota: ${selectedMember.nomorAnggota}`}
          />

          {/* Student Profile Card Header */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Nama Anggota</div>
              <div className="text-sm font-black text-slate-900 mt-0.5">{selectedMember.nama}</div>
              <div className="text-xs text-slate-600 font-mono mt-0.5">NISN/ID: {selectedMember.nomorAnggota}</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Kelas / Rombel</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{memberClass?.namaKelas || '-'}</div>
              <div className="text-xs text-slate-600">Wali: {memberClass?.waliKelas || '-'}</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Alamat & Kontak</div>
              <div className="text-xs text-slate-800 font-medium mt-0.5 truncate">{selectedMember.alamat}</div>
              <div className="text-xs text-slate-600">{selectedMember.telepon}</div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <div className="text-xs text-blue-700 font-medium">Total Dipinjam</div>
              <div className="text-xl font-black text-blue-900 mt-0.5">{totalPinjam} kali</div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <div className="text-xs text-amber-700 font-medium">Buku Sedang Dipinjam</div>
              <div className="text-xl font-black text-amber-900 mt-0.5">{sedangPinjam} buku</div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="text-xs text-emerald-700 font-medium">Tingkat Kepatuhan</div>
              <div className="text-xl font-black text-emerald-900 mt-0.5">{kepatuhanPct}%</div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
              <div className="text-xs text-rose-700 font-medium">Akumulasi Denda</div>
              <div className="text-xl font-black text-rose-900 mt-0.5">{formatRupiah(totalDenda)}</div>
            </div>
          </div>

          {/* History Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Daftar Transaksi Peminjaman Siswa</span>
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Kode Transaksi</th>
                    <th className="py-2.5 px-3">Judul Buku</th>
                    <th className="py-2.5 px-3">Tgl Pinjam</th>
                    <th className="py-2.5 px-3">Jatuh Tempo</th>
                    <th className="py-2.5 px-3">Tgl Kembali</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Kondisi</th>
                    <th className="py-2.5 px-3 text-right">Denda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {memberLoans.map((item, idx) => {
                    const book = getBukuById(item.bukuId);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-800">
                          {item.kodeTransaksi}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          <div>{book?.judul || 'Buku Tidak Ditemukan'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {book?.nomorBuku}
                          </div>
                        </td>
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
                        <td className="py-2.5 px-3">
                          {item.kondisiBukuSaatKembali || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {item.denda > 0 ? (
                            <span className="text-rose-700 font-bold">
                              {formatRupiah(item.denda)}
                            </span>
                          ) : (
                            <span className="text-slate-400">Rp 0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {memberLoans.length === 0 && (
                <div className="p-6 text-center text-slate-500 text-xs">
                  Siswa/Anggota ini belum pernah melakukan transaksi peminjaman buku.
                </div>
              )}
            </div>
          </div>

          {/* Signature Block for Formal Printout */}
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
      )}

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
