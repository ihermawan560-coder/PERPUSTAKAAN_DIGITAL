import React, { useState, useRef } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { PengaturanSekolah } from '../../types';
import {
  Settings,
  School,
  FileText,
  RotateCcw,
  Download,
  Upload,
  Save,
  CheckCircle,
  Key,
  ShieldAlert,
  Clock,
  Coins,
  Image as ImageIcon,
  Sparkles,
  Link2,
  Trash2,
  Check,
  Eye,
  Layers
} from 'lucide-react';
import { ConfirmModal } from '../common/Modal';
import { PRESET_LOGOS, LOGO_SMPN3_RETEH } from '../../utils/logoPresets';

export const PengaturanView: React.FC = () => {
  const {
    pengaturan,
    updatePengaturan,
    resetAllData,
    exportDatabaseJSON,
    importDatabaseJSON,
    addToast,
  } = useLibrary();

  const [formData, setFormData] = useState<PengaturanSekolah>({ ...pengaturan });
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoImageInputRef = useRef<HTMLInputElement>(null);

  // Logo tab selection: 'preset' | 'upload' | 'url'
  const [logoTab, setLogoTab] = useState<'preset' | 'upload' | 'url'>('preset');
  const [urlInput, setUrlInput] = useState('');

  // Admin Password Management
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSave = { ...formData };
    if (newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        addToast('Kata sandi administrator baru harus minimal 6 karakter demi keamanan!', 'error');
        return;
      }
      if (newPassword.trim() !== confirmPassword.trim()) {
        addToast('Konfirmasi kata sandi tidak sesuai dengan sandi baru!', 'error');
        return;
      }
      dataToSave.adminPassword = newPassword.trim();
    }

    updatePengaturan(dataToSave);
    if (newPassword.trim()) {
      setNewPassword('');
      setConfirmPassword('');
      addToast('Pengaturan dan kata sandi baru administrator berhasil disimpan!', 'success');
    } else {
      addToast('Pengaturan sekolah dan logo kop surat berhasil disimpan!', 'success');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDatabaseJSON(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload Custom Logo Handler (PNG/JPG/SVG/WebP to Base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast('Ukuran gambar maksimal 2MB agar penyimpanan lokal tetap optimal.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64Data = ev.target?.result as string;
      if (base64Data) {
        setFormData((prev) => ({
          ...prev,
          logoKopUrl: base64Data,
        }));
        addToast('Logo baru berhasil dimuat! Jangan lupa klik "Simpan Pengaturan".', 'success');
      }
    };
    reader.readAsDataURL(file);
    if (logoImageInputRef.current) logoImageInputRef.current.value = '';
  };

  // Apply URL logo
  const handleApplyLogoUrl = () => {
    if (!urlInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      logoKopUrl: urlInput.trim(),
    }));
    addToast('Tautan logo berhasil diterapkan! Klik "Simpan Pengaturan" untuk menyimpan.', 'info');
  };

  // Select Preset Logo
  const handleSelectPreset = (dataUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      logoKopUrl: dataUrl,
    }));
    addToast('Logo preset dipilih! Jangan lupa klik "Simpan Pengaturan".', 'info');
  };

  // Reset Logo to Default
  const handleResetLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logoKopUrl: LOGO_SMPN3_RETEH,
      posisiLogoKop: 'kiri',
    }));
    addToast('Logo kop dikembalikan ke logo bawaan SMPN 3 Reteh.', 'info');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Bar */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Pengaturan Aplikasi Perpustakaan
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Konfigurasi identitas sekolah, logo kop surat resmi, pejabat penandatangan kartu/laporan, dan pencadangan data.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Profil Sekolah */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <School className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Identitas Satuan Pendidikan & Perpustakaan
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Sekolah <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.namaSekolah}
                onChange={(e) => setFormData({ ...formData, namaSekolah: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Pokok Sekolah Nasional (NPSN)
              </label>
              <input
                type="text"
                value={formData.npsn}
                onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Lengkap Sekolah
            </label>
            <input
              type="text"
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Desa / Kelurahan
              </label>
              <input
                type="text"
                value={formData.desaKelurahan}
                onChange={(e) => setFormData({ ...formData, desaKelurahan: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kecamatan
              </label>
              <input
                type="text"
                value={formData.kecamatan}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kabupaten
              </label>
              <input
                type="text"
                value={formData.kabupaten}
                onChange={(e) => setFormData({ ...formData, kabupaten: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Pos
              </label>
              <input
                type="text"
                value={formData.kodePos}
                onChange={(e) => setFormData({ ...formData, kodePos: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={formData.telepon}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email Perpustakaan
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section: Logo Kop Surat & Lambang Sekolah (FITUR GANTI LOGO KOP) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Logo Kop Surat & Lambang Resmi Sekolah
                </h3>
                <p className="text-[11px] text-slate-500">
                  Ubah logo resmi untuk Kop Surat laporan, berkas cetak, transkrip siswa, dan Kartu Anggota.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetLogo}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              title="Kembalikan ke logo awal SMPN 3 Reteh"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Default</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Interactive Logo Selector Tabs */}
            <div className="lg:col-span-7 space-y-4">
              {/* Method Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-xl gap-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setLogoTab('preset')}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    logoTab === 'preset'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preset Resmi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLogoTab('upload')}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    logoTab === 'upload'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah File</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLogoTab('url')}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    logoTab === 'url'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Tautan URL</span>
                </button>
              </div>

              {/* Tab 1: Preset Logos */}
              {logoTab === 'preset' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-600">
                    Pilih salah satu lambang resmi pendidikan atau lambang SMP Negeri 3 Reteh:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PRESET_LOGOS.map((preset) => {
                      const isSelected = formData.logoKopUrl === preset.dataUrl;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset.dataUrl)}
                          className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-2 relative ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                          <img
                            src={preset.dataUrl}
                            alt={preset.name}
                            className="w-14 h-14 object-contain drop-shadow-sm my-1"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 leading-tight">
                              {preset.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                              {preset.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 2: Upload File Custom Logo */}
              {logoTab === 'upload' && (
                <div className="space-y-3">
                  <div
                    onClick={() => logoImageInputRef.current?.click()}
                    className="p-6 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/80 transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Klik untuk Memilih File Logo dari Komputer / HP
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Mendukung format <strong>PNG transparan, JPG, WebP, atau SVG</strong> (Maks. 2MB)
                    </p>
                    <span className="mt-3 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs">
                      Pilih Berkas Gambar
                    </span>
                    <input
                      ref={logoImageInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    💡 Disarankan menggunakan logo dengan latar belakang transparan (format PNG) agar menyatu sempurna dengan kop surat dan kartu anggota.
                  </p>
                </div>
              )}

              {/* Tab 3: URL Image Input */}
              {logoTab === 'url' && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700">
                    Masukkan URL Gambar Logo Online:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/logo-sekolah.png"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyLogoUrl}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              )}

              {/* Position Choice for Letterhead */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Tata Letak / Posisi Logo pada Kop Surat:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs transition-all ${
                      (formData.posisiLogoKop || 'kiri') === 'kiri'
                        ? 'border-blue-600 bg-blue-50/60 font-bold text-blue-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="posisiLogo"
                      value="kiri"
                      checked={(formData.posisiLogoKop || 'kiri') === 'kiri'}
                      onChange={() => setFormData({ ...formData, posisiLogoKop: 'kiri' })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Logo Sisi Kiri (Standar Resmi)</span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs transition-all ${
                      formData.posisiLogoKop === 'kiri-kanan'
                        ? 'border-blue-600 bg-blue-50/60 font-bold text-blue-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="posisiLogo"
                      value="kiri-kanan"
                      checked={formData.posisiLogoKop === 'kiri-kanan'}
                      onChange={() => setFormData({ ...formData, posisiLogoKop: 'kiri-kanan' })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Dua Sisi Simetris (Kiri & Kanan)</span>
                  </label>
                </div>
              </div>

            </div>

            {/* Right: Live Preview Box of the Letterhead */}
            <div className="lg:col-span-5 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pratinjau Langsung Kop Surat</span>
                </h4>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Live Preview
                </span>
              </div>

              {/* White Letterhead Preview Box */}
              <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 text-center">
                <div className="flex items-center justify-center gap-3 pb-2.5 border-b-2 border-slate-900">
                  {formData.logoKopUrl ? (
                    <img
                      src={formData.logoKopUrl}
                      alt="Logo Kop Preview"
                      className="w-12 h-12 object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      LOGO
                    </div>
                  )}

                  <div className="flex-1 text-center leading-tight">
                    <div className="text-[8px] font-bold uppercase text-slate-700 tracking-wider">
                      PEMERINTAH {formData.kabupaten || 'INDRAGIRI HILIR'}
                    </div>
                    <div className="text-[8px] font-bold uppercase text-slate-800">
                      DINAS PENDIDIKAN DAN KEBUDAYAAN
                    </div>
                    <div className="text-[10px] font-black uppercase text-blue-900 tracking-tight mt-0.5">
                      {formData.namaSekolah || 'SMP NEGERI 3 RETEH'}
                    </div>
                    <div className="text-[7px] text-slate-500 mt-0.5">
                      {formData.alamat}, Kec. {formData.kecamatan} | NPSN: {formData.npsn}
                    </div>
                  </div>

                  {formData.posisiLogoKop === 'kiri-kanan' && formData.logoKopUrl ? (
                    <img
                      src={formData.logoKopUrl}
                      alt="Logo Kanan"
                      className="w-12 h-12 object-contain flex-shrink-0"
                    />
                  ) : formData.logoKopUrl ? (
                    <div className="w-12 opacity-0 flex-shrink-0" />
                  ) : null}
                </div>
                {/* Thin subline */}
                <div className="border-b border-slate-900 mt-0.5 mb-2"></div>
                <div className="text-[9px] font-bold text-slate-800 uppercase underline">
                  CONTOH LAPORAN & DOKUMEN RESMI
                </div>
              </div>

              {/* Active Logo Details */}
              <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1">
                <span>Status Logo Kop:</span>
                <span className="font-semibold text-blue-900">
                  {formData.logoKopUrl ? 'Terpasang & Siap Cetak' : 'Belum Dipasang'}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Section 2: Pejabat Penandatangan */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Pejabat Penandatangan (Untuk Kop Surat, Kartu & Laporan)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold text-blue-900">Kepala Sekolah</h4>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  value={formData.namaKepalaSekolah}
                  onChange={(e) =>
                    setFormData({ ...formData, namaKepalaSekolah: e.target.value })
                  }
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={formData.nipKepalaSekolah}
                  onChange={(e) =>
                    setFormData({ ...formData, nipKepalaSekolah: e.target.value })
                  }
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold text-blue-900">Kepala Perpustakaan</h4>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  value={formData.namaKepalaPerpustakaan}
                  onChange={(e) =>
                    setFormData({ ...formData, namaKepalaPerpustakaan: e.target.value })
                  }
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  NIP Kepala Perpustakaan
                </label>
                <input
                  type="text"
                  value={formData.nipKepalaPerpustakaan}
                  onChange={(e) =>
                    setFormData({ ...formData, nipKepalaPerpustakaan: e.target.value })
                  }
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Kebijakan Sirkulasi & Denda */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Coins className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Kebijakan Peminjaman & Tarif Denda Keterlambatan
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maksimal Lama Peminjaman (Hari)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.maksimalHariPinjam}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maksimalHariPinjam: parseInt(e.target.value) || 7,
                  })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Standar sekolah: 7 hari kalender
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tarif Denda per Hari (Rupiah)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={formData.dendaPerHari}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dendaPerHari: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Dikenakan jika melewati batas jatuh tempo
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batas Maksimal Buku per Anggota
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.maksimalBukuPinjam}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maksimalBukuPinjam: parseInt(e.target.value) || 3,
                  })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Jumlah buku aktif sekaligus
              </span>
            </div>
          </div>
        </div>

        {/* Section: Keamanan & Kredensial Administrator */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Key className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Keamanan Akses & Kata Sandi Administrator
            </h3>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Kata sandi standar sistem adalah <strong>admin</strong>. Anda dapat menetapkan kata sandi baru untuk mencegah akses tidak sah ke dashboard perpustakaan sekolah. Kosongkan kolom jika tidak ingin mengubah kata sandi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi Baru Administrator (Opsional)
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ulangi Kata Sandi Baru
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Seluruh Pengaturan & Kata Sandi</span>
            </button>
          </div>
        </div>

      </form>

      {/* Section 4: Cadangan & Pulihkan Database JSON */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <DatabaseIcon className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Pencadangan & Pemulihan Basis Data Perpustakaan
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-900">Ekspor Cadangan (Backup JSON)</h4>
            <p className="text-[11px] text-slate-500">
              Unduh seluruh data perpustakaan (buku, anggota, sirkulasi, kelas, dan logo) dalam 1 file JSON mandiri.
            </p>
            <button
              type="button"
              onClick={exportDatabaseJSON}
              className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Backup JSON</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-900">Pulihkan Data (Restore JSON)</h4>
            <p className="text-[11px] text-slate-500">
              Impor kembali berkas backup JSON yang pernah diunduh untuk memulihkan seluruh koleksi perpustakaan.
            </p>
            <label className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer w-fit">
              <Upload className="w-3.5 h-3.5" />
              <span>Pilih Berkas Backup JSON</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Reset Database */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Reset Data ke Bawaan (Default Demo)
            </h4>
            <p className="text-[11px] text-slate-500">
              Mengembalikan semua koleksi buku, anggota, kelas, dan sirkulasi ke data standar awal SMP Negeri 3 Reteh.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={resetAllData}
        title="Konfirmasi Reset Data Perpustakaan"
        message="Apakah Anda yakin ingin mengatur ulang data aplikasi ke data bawaan awal SMP Negeri 3 Reteh? Semua perubahan baru yang belum dicadangkan akan digantikan."
        confirmText="Ya, Reset Sekarang"
      />
    </div>
  );
};

// Simple Database Icon helper
function DatabaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  );
}
