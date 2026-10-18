import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { BukuItem, DAFTAR_MAPEL, MataPelajaran } from '../../types';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Barcode,
  Layers,
  Sparkles,
  MapPin,
  Calendar,
  User,
  Printer,
  X
} from 'lucide-react';
import { Modal, ConfirmModal } from '../common/Modal';

export const BukuView: React.FC = () => {
  const { buku, addBuku, updateBuku, deleteBuku } = useLibrary();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBuku, setEditingBuku] = useState<BukuItem | null>(null);
  const [formData, setFormData] = useState<Omit<BukuItem, 'id'>>({
    nomorBuku: '',
    isbn: '',
    judul: '',
    pengarang: '',
    penerbit: '',
    tahunTerbit: 2024,
    kategori: 'Pelajaran',
    mataPelajaran: 'Matematika',
    tingkatKelas: '7',
    kurikulum: 'Kurikulum Merdeka',
    jumlahTotal: 10,
    jumlahTersedia: 10,
    lokasiRak: 'Rak A-01',
    sinopsis: '',
  });

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Label barcode preview state
  const [labelPreviewBuku, setLabelPreviewBuku] = useState<BukuItem | null>(null);

  const categories = [
    'Pelajaran',
    'Fiksi',
    'Non-Fiksi',
    'Sains',
    'Sejarah',
    'Agama',
    'Referensi',
    'Kamus',
    'Bahasa',
    'Muatan Lokal',
  ];

  // Filtering
  const filteredBuku = buku.filter((b) => {
    const matchSearch =
      b.judul.toLowerCase().includes(search.toLowerCase()) ||
      b.pengarang.toLowerCase().includes(search.toLowerCase()) ||
      b.nomorBuku.toLowerCase().includes(search.toLowerCase()) ||
      b.isbn.toLowerCase().includes(search.toLowerCase()) ||
      b.lokasiRak.toLowerCase().includes(search.toLowerCase());

    const matchCat =
      selectedCategory === 'all' || b.kategori === selectedCategory;

    let matchStock = true;
    if (stockFilter === 'available') matchStock = b.jumlahTersedia > 0;
    if (stockFilter === 'empty') matchStock = b.jumlahTersedia === 0;

    return matchSearch && matchCat && matchStock;
  });

  const handleOpenAdd = () => {
    setEditingBuku(null);
    const count = buku.length + 1;
    setFormData({
      nomorBuku: `BUK-SMP3-${String(count).padStart(3, '0')}`,
      isbn: '978-',
      judul: '',
      pengarang: '',
      penerbit: 'Kemendikbudristek',
      tahunTerbit: new Date().getFullYear(),
      kategori: 'Pelajaran',
      mataPelajaran: 'Matematika',
      tingkatKelas: '7',
      kurikulum: 'Kurikulum Merdeka',
      jumlahTotal: 5,
      jumlahTersedia: 5,
      lokasiRak: 'Rak A-01',
      sinopsis: '',
    });
    setIsModalOpen(true);
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
      jumlahTotal: item.jumlahTotal,
      jumlahTersedia: item.jumlahTersedia,
      lokasiRak: item.lokasiRak,
      sinopsis: item.sinopsis || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul.trim() || !formData.nomorBuku.trim()) return;

    if (editingBuku) {
      updateBuku(editingBuku.id, formData);
    } else {
      addBuku(formData);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteBuku(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Katalog & Data Nomor Buku
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen koleksi buku, nomor klasifikasi/inventaris, nomor ISBN, stok eksemplar, dan lokasi rak.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Judul Buku Baru</span>
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
            placeholder="Cari judul buku, nomor buku, pengarang, ISBN, atau rak..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status Stok</option>
            <option value="available">Tersedia untuk Dipinjam</option>
            <option value="empty">Stok Habis / Semua Dipinjam</option>
          </select>
        </div>
      </div>

      {/* Book Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBuku.map((item) => {
          const isAvailable = item.jumlahTersedia > 0;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5">
                {/* Top Badge & Nomor Buku */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {item.kategori}
                    </span>
                    <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      {item.nomorBuku}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setLabelPreviewBuku(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Cetak Label & Barcode Buku"
                    >
                      <Barcode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit Buku"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hapus Buku"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-slate-900 line-clamp-2 mt-1 leading-snug">
                  {item.judul}
                </h3>

                {/* Details */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">Penulis: {item.pengarang}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>
                      {item.penerbit} ({item.tahunTerbit})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-medium text-slate-700">{item.lokasiRak}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    ISBN: {item.isbn}
                  </div>
                </div>

                {item.sinopsis && (
                  <p className="mt-3 text-[11px] text-slate-500 line-clamp-2 italic bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                    "{item.sinopsis}"
                  </p>
                )}
              </div>

              {/* Bottom Stock Bar */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 text-[11px]">Tersedia: </span>
                  <span
                    className={`font-black ${
                      isAvailable ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {item.jumlahTersedia}
                  </span>
                  <span className="text-slate-500 text-[11px]"> / {item.jumlahTotal} eks</span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isAvailable
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isAvailable ? 'Dapat Dipinjam' : 'Stok Habis'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBuku.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">Tidak ada buku ditemukan</h4>
          <p className="text-xs text-slate-500 mt-1">
            Silakan periksa kata kunci pencarian atau tambahkan buku baru.
          </p>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBuku ? 'Edit Master Data Buku' : 'Tambah Judul Buku Baru'}
        subtitle="SMP Negeri 3 Reteh"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Contoh: 510/MAT/VII atau BUK-001"
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
              Judul Buku <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.judul}
              onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
              placeholder="Masukkan judul buku lengkap"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pengarang / Penulis <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.pengarang}
                onChange={(e) => setFormData({ ...formData, pengarang: e.target.value })}
                placeholder="Nama pengarang buku"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Penerbit
              </label>
              <input
                type="text"
                value={formData.penerbit}
                onChange={(e) => setFormData({ ...formData, penerbit: e.target.value })}
                placeholder="Nama penerbit buku"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun Terbit
              </label>
              <input
                type="number"
                value={formData.tahunTerbit}
                onChange={(e) =>
                  setFormData({ ...formData, tahunTerbit: parseInt(e.target.value) || 2024 })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Buku
              </label>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mata Pelajaran (Buku Teks)
              </label>
              <select
                value={formData.mataPelajaran || 'Matematika'}
                onChange={(e) =>
                  setFormData({ ...formData, mataPelajaran: e.target.value as any })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Bukan Buku Mapel Pokok --</option>
                {DAFTAR_MAPEL.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tingkat Kelas
              </label>
              <select
                value={formData.tingkatKelas || '7'}
                onChange={(e) =>
                  setFormData({ ...formData, tingkatKelas: e.target.value as any })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Kelas VII</option>
                <option value="8">Kelas VIII</option>
                <option value="9">Kelas IX</option>
                <option value="Semua">Semua Tingkat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lokasi Rak
              </label>
              <input
                type="text"
                value={formData.lokasiRak}
                onChange={(e) => setFormData({ ...formData, lokasiRak: e.target.value })}
                placeholder="Contoh: Rak A-02, Rak R-01"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Jumlah Eksemplar
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
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sinopsis / Ringkasan Buku (Opsional)
            </label>
            <textarea
              rows={2}
              value={formData.sinopsis}
              onChange={(e) => setFormData({ ...formData, sinopsis: e.target.value })}
              placeholder="Deskripsi singkat konten buku..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all"
            >
              {editingBuku ? 'Perbarui Data Buku' : 'Simpan Data Buku'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Barcode & Label Preview Modal */}
      <Modal
        isOpen={!!labelPreviewBuku}
        onClose={() => setLabelPreviewBuku(null)}
        title="Label & Barcode Buku Perpustakaan"
        subtitle="Dapat ditempel pada punggung atau cover buku"
      >
        {labelPreviewBuku && (
          <div className="space-y-4">
            <div className="p-4 border-2 border-dashed border-slate-300 rounded-2xl bg-white max-w-sm mx-auto text-center space-y-2 shadow-sm">
              <div className="text-[10px] font-black text-blue-900 uppercase tracking-wider border-b pb-1">
                PERPUSTAKAAN SMPN 3 RETEH
              </div>
              <div className="font-mono text-base font-extrabold text-slate-900">
                {labelPreviewBuku.nomorBuku}
              </div>
              <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                {labelPreviewBuku.judul}
              </div>
              
              {/* Simulated Barcode */}
              <div className="py-2 flex flex-col items-center">
                <div className="flex items-center gap-[2px] h-10 px-4 bg-white">
                  {[4, 2, 5, 2, 1, 4, 2, 5, 3, 2, 4, 1, 3, 5, 2, 3, 2, 4, 3, 1, 4, 2, 3, 5, 2].map(
                    (w, i) => (
                      <div
                        key={i}
                        className={`h-full bg-slate-900 ${
                          i % 2 === 0 ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{ width: `${w}px` }}
                      />
                    )
                  )}
                </div>
                <div className="font-mono text-[10px] text-slate-600 tracking-widest mt-1">
                  *{labelPreviewBuku.nomorBuku}*
                </div>
              </div>

              <div className="text-[10px] text-slate-500 border-t pt-1 flex justify-between">
                <span>{labelPreviewBuku.lokasiRak}</span>
                <span>{labelPreviewBuku.kategori}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLabelPreviewBuku(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Label</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Konfirmasi Hapus Buku"
        message="Apakah Anda yakin ingin menghapus buku ini? Pastikan seluruh eksemplar buku sudah tidak dalam status peminjaman aktif."
      />
    </div>
  );
};
