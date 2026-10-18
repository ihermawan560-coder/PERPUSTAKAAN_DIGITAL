import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { KelasItem } from '../../types';
import {
  School,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Building,
  GraduationCap
} from 'lucide-react';
import { Modal, ConfirmModal } from '../common/Modal';

export const KelasView: React.FC = () => {
  const {
    kelas,
    addKelas,
    updateKelas,
    deleteKelas,
    anggota,
    setActiveTab,
    setTargetAnggotaKelasFilter,
  } = useLibrary();

  const [search, setSearch] = useState('');
  const [selectedTingkat, setSelectedTingkat] = useState<string>('all');

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState<KelasItem | null>(null);
  const [formData, setFormData] = useState<Omit<KelasItem, 'id'>>({
    namaKelas: '',
    tingkat: '7',
    waliKelas: '',
    ruangan: '',
    keterangan: '',
  });

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filtered classes
  const filteredKelas = kelas.filter((k) => {
    const matchSearch =
      k.namaKelas.toLowerCase().includes(search.toLowerCase()) ||
      k.waliKelas.toLowerCase().includes(search.toLowerCase()) ||
      (k.ruangan && k.ruangan.toLowerCase().includes(search.toLowerCase()));

    const matchTingkat =
      selectedTingkat === 'all' || k.tingkat === selectedTingkat;

    return matchSearch && matchTingkat;
  });

  const handleOpenAdd = () => {
    setEditingKelas(null);
    setFormData({
      namaKelas: '',
      tingkat: '7',
      waliKelas: '',
      ruangan: '',
      keterangan: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: KelasItem) => {
    setEditingKelas(item);
    setFormData({
      namaKelas: item.namaKelas,
      tingkat: item.tingkat,
      waliKelas: item.waliKelas,
      ruangan: item.ruangan || '',
      keterangan: item.keterangan || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaKelas.trim()) return;

    if (editingKelas) {
      updateKelas(editingKelas.id, formData);
    } else {
      addKelas(formData);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteKelas(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Data Kelas & Rombongan Belajar
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola rombel siswa dan dewan guru SMP Negeri 3 Reteh untuk pengelompokan anggota perpustakaan.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas Baru</span>
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
            placeholder="Cari nama kelas, wali kelas, atau gedung ruangan..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Tingkat:
          </span>
          <select
            value={selectedTingkat}
            onChange={(e) => setSelectedTingkat(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Tingkat</option>
            <option value="7">Kelas VII (Tujuh)</option>
            <option value="8">Kelas VIII (Delapan)</option>
            <option value="9">Kelas IX (Sembilan)</option>
            <option value="Guru/Staf">Dewan Guru / Staf</option>
          </select>
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredKelas.map((item) => {
          const membersCount = anggota.filter((a) => a.kelasId === item.id).length;

          let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
          if (item.tingkat === '8') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          if (item.tingkat === '9') badgeColor = 'bg-violet-50 text-violet-700 border-violet-200';
          if (item.tingkat === 'Guru/Staf') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}
                    >
                      {item.tingkat === 'Guru/Staf' ? 'Pendidik' : `Tingkat ${item.tingkat}`}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">
                      {item.namaKelas}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit Kelas"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hapus Kelas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">
                      Wali: <strong className="text-slate-800">{item.waliKelas || '-'}</strong>
                    </span>
                  </div>

                  {item.ruangan && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>{item.ruangan}</span>
                    </div>
                  )}

                  {item.keterangan && (
                    <p className="text-[11px] text-slate-500 italic mt-1 line-clamp-1">
                      {item.keterangan}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer: Connected Members */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold text-slate-800">{membersCount}</span>
                  <span>Anggota</span>
                </div>

                <button
                  onClick={() => {
                    setTargetAnggotaKelasFilter(item.id);
                    setActiveTab('anggota');
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1"
                  title={`Tampilkan anggota Kelas ${item.namaKelas}`}
                >
                  <span>Lihat Siswa</span>
                  <span className="text-[10px]">&rarr;</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredKelas.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <School className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">Tidak ada kelas ditemukan</h4>
          <p className="text-xs text-slate-500 mt-1">
            Coba ubah kata kunci pencarian atau tambah kelas baru.
          </p>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingKelas ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
        subtitle="SMP Negeri 3 Reteh"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Kelas / Rombel <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.namaKelas}
              onChange={(e) => setFormData({ ...formData, namaKelas: e.target.value })}
              placeholder="Contoh: VII-A, VIII-C, IX-A"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tingkat
              </label>
              <select
                value={formData.tingkat}
                onChange={(e) =>
                  setFormData({ ...formData, tingkat: e.target.value as any })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Kelas VII (Tujuh)</option>
                <option value="8">Kelas VIII (Delapan)</option>
                <option value="9">Kelas IX (Sembilan)</option>
                <option value="Guru/Staf">Dewan Guru / Staf</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ruangan / Gedung
              </label>
              <input
                type="text"
                value={formData.ruangan}
                onChange={(e) => setFormData({ ...formData, ruangan: e.target.value })}
                placeholder="Contoh: Gedung A R.02"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Wali Kelas / Penanggung Jawab
            </label>
            <input
              type="text"
              value={formData.waliKelas}
              onChange={(e) => setFormData({ ...formData, waliKelas: e.target.value })}
              placeholder="Nama Guru Wali Kelas & Gelar"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan
            </label>
            <input
              type="text"
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              placeholder="Contoh: Kelas Unggulan Sains, Reguler, dll."
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
              {editingKelas ? 'Perbarui Kelas' : 'Simpan Kelas'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Konfirmasi Hapus Kelas"
        message="Apakah Anda yakin ingin menghapus kelas ini? Tindakan ini tidak dapat dibatalkan jika belum ada anggota yang terdaftar."
      />
    </div>
  );
};
