import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { BukuItem, DAFTAR_MAPEL, MataPelajaran } from '../../types';
import { exportToCSV, formatTanggalIndo } from '../../utils/formatters';
import { SchoolHeader } from '../common/SchoolHeader';
import { Modal, ConfirmModal } from '../common/Modal';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { PrintDocumentData } from '../../utils/printHelper';
import {
  Layers,
  Search,
  Filter,
  Plus,
  Printer,
  Download,
  BookOpen,
  Calculator,
  Compass,
  Globe2,
  Atom,
  Flame,
  Activity,
  Palette,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Edit2,
  PlusCircle,
  MinusCircle,
  FolderOpen
} from 'lucide-react';

export const StokPelajaranView: React.FC = () => {
  const { buku, addBuku, updateBuku, transaksi, pengaturan } = useLibrary();

  // Active Mapel filter ('all' or one of the 11 subjects)
  const [selectedMapel, setSelectedMapel] = useState<MataPelajaran | 'all'>('all');
  const [selectedTingkat, setSelectedTingkat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'low' | 'empty'>('all');

  // Modal State for adding a new subject book
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBuku, setEditingBuku] = useState<BukuItem | null>(null);
  const [formData, setFormData] = useState<Omit<BukuItem, 'id'>>({
    nomorBuku: '',
    isbn: '',
    judul: '',
    pengarang: '',
    penerbit: 'Kemendikbudristek',
    tahunTerbit: 2022,
    kategori: 'Pelajaran',
    mataPelajaran: 'Matematika',
    tingkatKelas: '7',
    kurikulum: 'Kurikulum Merdeka',
    semester: '1 Tahun Penuh',
    jumlahTotal: 50,
    jumlahTersedia: 50,
    lokasiRak: 'Rak A-01',
    sinopsis: '',
  });

  // Quick adjust stock state
  const [quickAdjustBuku, setQuickAdjustBuku] = useState<BukuItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(5);

  // Subject icon helper
  const getMapelIcon = (mapel?: string) => {
    switch (mapel) {
      case 'Matematika':
        return Calculator;
      case 'Bahasa Indonesia':
        return BookOpen;
      case 'Bahasa Inggris':
        return Globe2;
      case 'Pendidikan Pancasila':
        return Compass;
      case 'Pendidikan Agama Islam':
        return Flame;
      case 'IPA':
        return Atom;
      case 'IPS':
        return Compass;
      case 'PJOK':
        return Activity;
      case 'Prakarya dan Seni':
        return Palette;
      case 'Informatika':
        return Laptop;
      case 'BMR':
        return Sparkles;
      default:
        return BookOpen;
    }
  };

  const getMapelColor = (mapel?: string) => {
    switch (mapel) {
      case 'Matematika':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'Bahasa Indonesia':
        return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      case 'Bahasa Inggris':
        return 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100';
      case 'Pendidikan Pancasila':
        return 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100';
      case 'Pendidikan Agama Islam':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
      case 'IPA':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100';
      case 'IPS':
        return 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100';
      case 'PJOK':
        return 'bg-lime-50 text-lime-800 border-lime-200 hover:bg-lime-100';
      case 'Prakarya dan Seni':
        return 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100';
      case 'Informatika':
        return 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100';
      case 'BMR':
        return 'bg-yellow-50 text-yellow-900 border-yellow-300 hover:bg-yellow-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
    }
  };

  // Filter books specifically belonging to the 11 subjects
  const subjectBooks = buku.filter((b) => !!b.mataPelajaran);

  // Filtered view
  const filteredBooks = subjectBooks.filter((b) => {
    const matchMapel = selectedMapel === 'all' || b.mataPelajaran === selectedMapel;
    const matchTingkat = selectedTingkat === 'all' || b.tingkatKelas === selectedTingkat;
    
    const matchSearch =
      b.judul.toLowerCase().includes(search.toLowerCase()) ||
      b.nomorBuku.toLowerCase().includes(search.toLowerCase()) ||
      (b.isbn && b.isbn.toLowerCase().includes(search.toLowerCase())) ||
      b.pengarang.toLowerCase().includes(search.toLowerCase()) ||
      b.lokasiRak.toLowerCase().includes(search.toLowerCase()) ||
      (b.mataPelajaran && b.mataPelajaran.toLowerCase().includes(search.toLowerCase()));

    let matchStatus = true;
    if (statusFilter === 'available') matchStatus = b.jumlahTersedia > 10;
    if (statusFilter === 'low') matchStatus = b.jumlahTersedia > 0 && b.jumlahTersedia <= 10;
    if (statusFilter === 'empty') matchStatus = b.jumlahTersedia === 0;

    return matchMapel && matchTingkat && matchSearch && matchStatus;
  });

  // Calculate subject level aggregates
  const totalSubjectTitles = subjectBooks.length;
  const totalSubjectStock = subjectBooks.reduce((acc, curr) => acc + curr.jumlahTotal, 0);
  const totalSubjectAvailable = subjectBooks.reduce((acc, curr) => acc + curr.jumlahTersedia, 0);
  const totalSubjectBorrowed = totalSubjectStock - totalSubjectAvailable;

  const handleOpenAdd = (defaultMapel?: MataPelajaran) => {
    setEditingBuku(null);
    const mapelToUse = defaultMapel || (selectedMapel !== 'all' ? selectedMapel : 'Matematika');
    const count = subjectBooks.filter((b) => b.mataPelajaran === mapelToUse).length + 1;
    
    let defaultCodePrefix = '510/MAT';
    if (mapelToUse === 'Bahasa Indonesia') defaultCodePrefix = '410/BIN';
    if (mapelToUse === 'Bahasa Inggris') defaultCodePrefix = '420/ENG';
    if (mapelToUse === 'Pendidikan Pancasila') defaultCodePrefix = '320/PAN';
    if (mapelToUse === 'Pendidikan Agama Islam') defaultCodePrefix = '297/PAI';
    if (mapelToUse === 'IPA') defaultCodePrefix = '500/IPA';
    if (mapelToUse === 'IPS') defaultCodePrefix = '300/IPS';
    if (mapelToUse === 'PJOK') defaultCodePrefix = '613/PJK';
    if (mapelToUse === 'Prakarya dan Seni') defaultCodePrefix = '700/PRK';
    if (mapelToUse === 'Informatika') defaultCodePrefix = '004/INF';
    if (mapelToUse === 'BMR') defaultCodePrefix = '959/BMR';

    setFormData({
      nomorBuku: `${defaultCodePrefix}/VII/${String(count).padStart(2, '0')}`,
      isbn: '978-602-',
      judul: `Buku Siswa ${mapelToUse} SMP Kelas VII`,
      pengarang: 'Tim Penulis Kemendikbudristek',
      penerbit: mapelToUse === 'BMR' ? 'Lembaga Adat Melayu Riau (LAMR)' : 'Kemendikbudristek',
      tahunTerbit: 2023,
      kategori: mapelToUse === 'BMR' ? 'Muatan Lokal' : 'Pelajaran',
      mataPelajaran: mapelToUse,
      tingkatKelas: '7',
      kurikulum: mapelToUse === 'BMR' ? 'Muatan Lokal Riau' : 'Kurikulum Merdeka',
      semester: '1 Tahun Penuh',
      jumlahTotal: 60,
      jumlahTersedia: 60,
      lokasiRak: `Rak ${mapelToUse.substring(0, 3).toUpperCase()}-01`,
      sinopsis: `Buku pegangan siswa mata pelajaran ${mapelToUse} untuk SMP Negeri 3 Reteh.`,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: BukuItem) => {
    setEditingBuku(item);
    setFormData({
      nomorBuku: item.nomorBuku,
      isbn: item.isbn,
      judul: item.judul,
      pengarang: item.pengarang,
      penerbit: item.penerbit,
      tahunTerbit: item.tahunTerbit,
      kategori: item.kategori,
      mataPelajaran: item.mataPelajaran || 'Matematika',
      tingkatKelas: item.tingkatKelas || '7',
      kurikulum: item.kurikulum || 'Kurikulum Merdeka',
      semester: item.semester || '1 Tahun Penuh',
      jumlahTotal: item.jumlahTotal,
      jumlahTersedia: item.jumlahTersedia,
      lokasiRak: item.lokasiRak,
      sinopsis: item.sinopsis || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul.trim() || !formData.nomorBuku.trim()) return;

    if (editingBuku) {
      updateBuku(editingBuku.id, formData);
    } else {
      addBuku(formData);
    }
    setIsAddModalOpen(false);
  };

  const handleQuickAddStock = (book: BukuItem, amount: number) => {
    const newTotal = book.jumlahTotal + amount;
    const newAvailable = Math.max(0, book.jumlahTersedia + amount);
    updateBuku(book.id, {
      jumlahTotal: newTotal,
      jumlahTersedia: newAvailable,
    });
  };

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const generateStockReportHtml = () => {
    return `
      <div style="font-size: 9.5pt; margin-bottom: 12px; color: #334155;">
        Filter Mata Pelajaran: <strong>${selectedMapel === 'all' ? '11 Mata Pelajaran' : selectedMapel}</strong> | 
        Tingkat Kelas: <strong>${selectedTingkat === 'all' ? 'Semua Tingkat (VII, VIII, IX)' : `Kelas ${selectedTingkat}`}</strong> | 
        Jumlah Terdata: <strong>${filteredBooks.length} Judul Buku</strong>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 30px;">No</th>
            <th>Mata Pelajaran</th>
            <th>Tingkat</th>
            <th>Nomor Buku</th>
            <th>Judul Buku Pelajaran</th>
            <th>Pengarang & Penerbit</th>
            <th>Total</th>
            <th>Dipinjam</th>
            <th>Tersedia</th>
            <th>Rak</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${filteredBooks.map((b, idx) => {
            const borrowed = b.jumlahTotal - b.jumlahTersedia;
            let status = 'Tersedia';
            let color = '#047857';
            if (b.jumlahTersedia === 0) {
              status = 'Habis';
              color = '#b91c1c';
            } else if (b.jumlahTersedia <= 10) {
              status = 'Menipis';
              color = '#d97706';
            }
            return `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><strong>${b.mataPelajaran || '-'}</strong></td>
                <td style="text-align: center;">${b.tingkatKelas ? `Kls ${b.tingkatKelas}` : '-'}</td>
                <td style="font-family: monospace; font-weight: bold; text-align: center;">${b.nomorBuku}</td>
                <td><strong>${b.judul}</strong><br><small style="color: #64748b;">${b.kurikulum || 'Kurikulum Merdeka'}</small></td>
                <td>${b.pengarang} (${b.penerbit}, ${b.tahunTerbit})</td>
                <td style="text-align: center; font-weight: bold;">${b.jumlahTotal}</td>
                <td style="text-align: center;">${borrowed}</td>
                <td style="text-align: center; font-weight: bold; color: ${color};">${b.jumlahTersedia}</td>
                <td style="text-align: center; font-family: monospace;">${b.lokasiRak}</td>
                <td style="text-align: center; font-weight: bold; color: ${color};">${status}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  };

  const getDocumentData = (): PrintDocumentData => {
    return {
      title: 'LAPORAN REKAPITULASI STOK BUKU PELAJARAN',
      subtitle: `Inventaris Koleksi Buku Paket SMP Negeri 3 Reteh - ${selectedMapel === 'all' ? '11 Mata Pelajaran' : selectedMapel}`,
      filename: `rekap_stok_mapel_${selectedMapel === 'all' ? 'semua' : selectedMapel.toLowerCase().replace(/\s+/g, '_')}_smpn3reteh`,
      pengaturan,
      bodyHtml: generateStockReportHtml(),
      orientation: 'landscape',
    };
  };

  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  const handleDownloadCSV = () => {
    const filename = `rekap_stok_buku_pelajaran_smpn3reteh_${new Date().toISOString().slice(0, 10)}`;
    const headers = [
      'Mata Pelajaran',
      'Tingkat Kelas',
      'Nomor Buku',
      'ISBN',
      'Judul Buku Pelajaran',
      'Kurikulum',
      'Pengarang & Penerbit',
      'Tahun Terbit',
      'Total Stok (Eks)',
      'Sedang Dipinjam',
      'Sisa Tersedia (Eks)',
      'Lokasi Rak',
      'Status Ketersediaan'
    ];

    const rows = filteredBooks.map((b) => {
      const borrowed = b.jumlahTotal - b.jumlahTersedia;
      let status = 'Tersedia Cukup';
      if (b.jumlahTersedia === 0) status = 'Habis';
      else if (b.jumlahTersedia <= 10) status = 'Kritis / Menipis';

      return [
        b.mataPelajaran || '-',
        b.tingkatKelas ? `Kelas ${b.tingkatKelas}` : '-',
        b.nomorBuku,
        b.isbn,
        b.judul,
        b.kurikulum || '-',
        `${b.pengarang} (${b.penerbit})`,
        b.tahunTerbit,
        b.jumlahTotal,
        borrowed,
        b.jumlahTersedia,
        b.lokasiRak,
        status,
      ];
    });

    exportToCSV(filename, [headers, ...rows]);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Stok Buku Berdasarkan Mata Pelajaran
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring inventaris buku paket kurikulum merdeka dan muatan lokal SMP Negeri 3 Reteh untuk 11 mata pelajaran pokok.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Download Rekap Stok dalam format CSV"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Cetak Laporan Rekapitulasi Stok Buku Pelajaran"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Rekap</span>
          </button>

          <button
            onClick={() => handleOpenAdd()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Buku Mapel</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 no-print">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Total Judul Buku Paket</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalSubjectTitles} Judul</div>
          <div className="text-[10px] text-blue-600 font-medium mt-0.5">11 Mata Pelajaran Resmi</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Total Eksemplar Terdata</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalSubjectStock} Eks</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Koleksi Buku Pelajaran</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Stok Tersedia di Rak</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{totalSubjectAvailable} Eks</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Siap Didistribusikan ke Siswa</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Sedang Dipinjam Siswa</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{totalSubjectBorrowed} Eks</div>
          <div className="text-[10px] text-amber-600 font-medium mt-0.5">Dipinjam per Rombel/Siswa</div>
        </div>
      </div>

      {/* 11 Subjects Selector Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 no-print">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
            Pilih Mata Pelajaran:
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {DAFTAR_MAPEL.length} Mata Pelajaran SMPN 3 Reteh
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedMapel('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              selectedMapel === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Semua Pelajaran ({subjectBooks.length})
          </button>

          {DAFTAR_MAPEL.map((mapel) => {
            const Icon = getMapelIcon(mapel);
            const count = subjectBooks.filter((b) => b.mataPelajaran === mapel).length;
            const isSelected = selectedMapel === mapel;
            const styleColor = getMapelColor(mapel);

            return (
              <button
                key={mapel}
                onClick={() => setSelectedMapel(mapel)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-blue-500'
                    : styleColor
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mapel}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-slate-800 text-white' : 'bg-white/80 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Second row filters: Search & Tingkat Kelas */}
        <div className="flex flex-col md:flex-row gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul buku pelajaran, kode/nomor buku, pengarang, kurikulum, atau rak..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedTingkat}
              onChange={(e) => setSelectedTingkat(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Tingkat (7, 8, 9)</option>
              <option value="7">Kelas VII (Tujuh)</option>
              <option value="8">Kelas VIII (Delapan)</option>
              <option value="9">Kelas IX (Sembilan)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Kondisi Stok</option>
              <option value="available">Stok Aman (&gt; 10 eks)</option>
              <option value="low">Stok Kritis / Menipis (&le; 10 eks)</option>
              <option value="empty">Stok Habis (0 eks)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subject Stock Cards Summary Grid (when "all" or specific view) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 no-print">
        {(selectedMapel === 'all' ? DAFTAR_MAPEL : [selectedMapel]).map((mapel) => {
          const mapelBooks = subjectBooks.filter((b) => b.mataPelajaran === mapel);
          const totalStock = mapelBooks.reduce((acc, curr) => acc + curr.jumlahTotal, 0);
          const availableStock = mapelBooks.reduce((acc, curr) => acc + curr.jumlahTersedia, 0);
          const borrowed = totalStock - availableStock;
          const availabilityRatio = totalStock > 0 ? Math.round((availableStock / totalStock) * 100) : 0;
          const Icon = getMapelIcon(mapel);

          return (
            <div
              key={mapel}
              onClick={() => setSelectedMapel(mapel)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white hover:shadow-md ${
                selectedMapel === mapel
                  ? 'border-blue-600 ring-2 ring-blue-500/20'
                  : 'border-slate-200/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      {mapel}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {mapelBooks.length} judul terdaftar
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    availableStock > 15
                      ? 'bg-emerald-50 text-emerald-700'
                      : availableStock > 0
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {availabilityRatio}% Tersedia
                </span>
              </div>

              {/* Stock Numbers */}
              <div className="grid grid-cols-3 gap-1 py-2 text-center border-t border-b border-slate-100 my-2">
                <div>
                  <div className="text-[9px] text-slate-400 uppercase font-semibold">Total</div>
                  <div className="text-xs font-black text-slate-900">{totalStock}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 uppercase font-semibold">Dipinjam</div>
                  <div className="text-xs font-black text-amber-700">{borrowed}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 uppercase font-semibold">Sisa</div>
                  <div className="text-xs font-black text-emerald-700">{availableStock}</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                  style={{ width: `${availabilityRatio}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Printable Table Area */}
      <div className="printable-area bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        
        {/* Kop Surat for official printout */}
        <SchoolHeader
          title="DAFTAR REKAPITULASI INVENTARIS & STOK BUKU TEKS PELAJARAN"
          subtitle={`Mata Pelajaran: ${selectedMapel === 'all' ? 'Seluruh Mata Pelajaran (11 Mapel)' : selectedMapel} - SMP Negeri 3 Reteh`}
        />

        {/* Table of Subject Books */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Mata Pelajaran & Kelas</th>
                <th className="py-3 px-3">Kode Buku / ISBN</th>
                <th className="py-3 px-3">Judul Buku Pelajaran</th>
                <th className="py-3 px-3">Kurikulum & Penerbit</th>
                <th className="py-3 px-3 text-center">Total</th>
                <th className="py-3 px-3 text-center">Pinjam</th>
                <th className="py-3 px-3 text-center">Sisa</th>
                <th className="py-3 px-3">Lokasi Rak</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right no-print">Aksi Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredBooks.map((item, idx) => {
                const borrowed = item.jumlahTotal - item.jumlahTersedia;
                const isAvailable = item.jumlahTersedia > 10;
                const isLow = item.jumlahTersedia > 0 && item.jumlahTersedia <= 10;
                const isEmpty = item.jumlahTersedia === 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 text-slate-500 font-medium">{idx + 1}</td>
                    
                    {/* Subject & Grade */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{item.mataPelajaran || item.kategori}</span>
                      </div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                        {item.tingkatKelas ? `Kelas ${item.tingkatKelas}` : 'Semua'}
                      </span>
                    </td>

                    {/* Book Code */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                      <div className="font-bold text-blue-900">{item.nomorBuku}</div>
                      <div className="text-[10px] text-slate-500">{item.isbn}</div>
                    </td>

                    {/* Title */}
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-bold text-slate-900 line-clamp-1">{item.judul}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        Pengarang: {item.pengarang}
                      </div>
                    </td>

                    {/* Curriculum */}
                    <td className="py-3 px-3 whitespace-nowrap text-[11px] text-slate-700">
                      <div className="font-medium">{item.kurikulum || 'Kurikulum Merdeka'}</div>
                      <div className="text-slate-500 text-[10px]">{item.penerbit} ({item.tahunTerbit})</div>
                    </td>

                    {/* Total */}
                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {item.jumlahTotal}
                    </td>

                    {/* Borrowed */}
                    <td className="py-3 px-3 text-center font-bold text-amber-700">
                      {borrowed}
                    </td>

                    {/* Available */}
                    <td className="py-3 px-3 text-center font-black text-emerald-700 text-sm">
                      {item.jumlahTersedia}
                    </td>

                    {/* Shelf */}
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                      {item.lokasiRak}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isEmpty ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Habis
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Menipis ({item.jumlahTersedia})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Aman
                        </span>
                      )}
                    </td>

                    {/* Actions (Update Stock / Edit) */}
                    <td className="py-3 px-3 text-right whitespace-nowrap no-print">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleQuickAddStock(item, 5)}
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 text-[11px] transition-colors"
                          title="Tambah +5 Eksemplar Stok Masuk"
                        >
                          +5 Eks
                        </button>

                        <button
                          onClick={() => handleQuickAddStock(item, -5)}
                          disabled={item.jumlahTersedia < 5}
                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 text-[11px] transition-colors disabled:opacity-40"
                          title="Kurangi -5 Eksemplar (Rusak / Afkir)"
                        >
                          -5 Eks
                        </button>

                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Rincian Buku"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredBooks.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              Tidak ada buku pelajaran yang cocok dengan filter. Silakan ubah filter atau tambahkan buku baru.
            </div>
          )}
        </div>

        {/* Legal Signatures for official printout */}
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
            <p className="font-semibold text-slate-900">Pengelola Perpustakaan</p>
            <div className="h-16 flex items-center justify-center">
              <span className="font-serif italic text-slate-400 text-[10px]">[Tanda Tangan & Cap]</span>
            </div>
            <p className="font-bold underline text-slate-900">{pengaturan.namaKepalaPerpustakaan}</p>
            <p className="text-[11px] text-slate-500">NIP. {pengaturan.nipKepalaPerpustakaan}</p>
          </div>
        </div>

      </div>

      {/* Add / Edit Subject Book Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingBuku ? 'Edit Buku Pelajaran' : 'Tambah Buku Teks Pelajaran Baru'}
        subtitle="SMP Negeri 3 Reteh"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Mata Pelajaran <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.mataPelajaran}
                onChange={(e) =>
                  setFormData({ ...formData, mataPelajaran: e.target.value as any })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DAFTAR_MAPEL.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tingkat Kelas <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.tingkatKelas}
                onChange={(e) =>
                  setFormData({ ...formData, tingkatKelas: e.target.value as any })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Kelas VII (Tujuh)</option>
                <option value="8">Kelas VIII (Delapan)</option>
                <option value="9">Kelas IX (Sembilan)</option>
                <option value="Semua">Semua Tingkat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor / Kode Buku <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nomorBuku}
                onChange={(e) => setFormData({ ...formData, nomorBuku: e.target.value })}
                placeholder="Contoh: 510/MAT/VII/01"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor ISBN
              </label>
              <input
                type="text"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                placeholder="Contoh: 978-602-244-384-1"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Buku Pelajaran <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.judul}
              onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
              placeholder="Contoh: Matematika SMP/MTs Kelas VII Kurikulum Merdeka"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pengarang / Penulis
              </label>
              <input
                type="text"
                value={formData.pengarang}
                onChange={(e) => setFormData({ ...formData, pengarang: e.target.value })}
                placeholder="Nama penulis buku teks"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Penerbit & Tahun
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.penerbit}
                  onChange={(e) => setFormData({ ...formData, penerbit: e.target.value })}
                  placeholder="Kemendikbudristek"
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={formData.tahunTerbit}
                  onChange={(e) =>
                    setFormData({ ...formData, tahunTerbit: parseInt(e.target.value) || 2023 })
                  }
                  className="w-20 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kurikulum
              </label>
              <select
                value={formData.kurikulum}
                onChange={(e) =>
                  setFormData({ ...formData, kurikulum: e.target.value as any })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                <option value="Kurikulum 2013">Kurikulum 2013</option>
                <option value="Muatan Lokal Riau">Muatan Lokal Riau</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lokasi Rak Buku
              </label>
              <input
                type="text"
                value={formData.lokasiRak}
                onChange={(e) => setFormData({ ...formData, lokasiRak: e.target.value })}
                placeholder="Contoh: Rak A-01 (Matematika)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Jumlah Stok (Eksemplar)
              </label>
              <input
                type="number"
                min="1"
                value={formData.jumlahTotal}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setFormData({
                    ...formData,
                    jumlahTotal: val,
                    jumlahTersedia: editingBuku ? formData.jumlahTersedia : val,
                  });
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stok Tersedia Saat Ini
              </label>
              <input
                type="number"
                min="0"
                max={formData.jumlahTotal}
                value={formData.jumlahTersedia}
                onChange={(e) =>
                  setFormData({ ...formData, jumlahTersedia: parseInt(e.target.value) || 0 })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
            >
              {editingBuku ? 'Perbarui Buku' : 'Simpan Buku Pelajaran'}
            </button>
          </div>
        </form>
      </Modal>

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
