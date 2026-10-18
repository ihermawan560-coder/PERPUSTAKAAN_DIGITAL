import React, { useState, useRef } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { formatTanggalIndo } from '../../utils/formatters';
import {
  CreditCard,
  Printer,
  Download,
  Search,
  BookOpen,
  QrCode,
  ShieldCheck,
  CheckCircle,
  FileDown,
  Eye,
  Layers,
  Sparkles
} from 'lucide-react';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import {
  PrintDocumentData,
  executePrint,
  downloadPrintableDocument
} from '../../utils/printHelper';

export const KartuAnggotaView: React.FC = () => {
  const { anggota, kelas, pengaturan, getKelasById, addToast } = useLibrary();

  const [selectedAnggotaId, setSelectedAnggotaId] = useState<string>(
    anggota[0]?.id || ''
  );
  const [filterKelasId, setFilterKelasId] = useState<string>('all');
  const [searchMember, setSearchMember] = useState('');
  const [showBothSides, setShowBothSides] = useState(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'single' | 'batch'>('single');

  // Filtered members list (sorted alphabetically A-Z)
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

  // Generate HTML for member card (single or batch)
  const generateCardHtml = (member: typeof selectedMember) => {
    if (!member) return '';
    const cls = getKelasById(member.kelasId);
    return `
      <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; margin-bottom: 25px; page-break-inside: avoid; break-inside: avoid;">
        <!-- DEPAN -->
        <div style="width: 380px; height: 235px; border-radius: 12px; border: 1.5px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; background: white; position: relative; font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; justify-content: space-between;">
          <div style="background: linear-gradient(135deg, #1e3a8a, #1e40af); color: white; padding: 10px 14px; border-bottom: 3px solid #f59e0b; display: flex; align-items: center; gap: 10px;">
            ${pengaturan.logoKopUrl ? `<img src="${pengaturan.logoKopUrl}" alt="Logo" style="width: 38px; height: 38px; object-fit: contain; flex-shrink: 0;" />` : ''}
            <div>
              <div style="font-size: 8px; text-transform: uppercase; font-weight: 600; color: #93c5fd; letter-spacing: 0.5px;">Pemerintah Kab. ${pengaturan.kabupaten}</div>
              <div style="font-size: 13px; font-weight: 900; text-transform: uppercase; margin-top: 1px;">${pengaturan.namaSekolah}</div>
              <div style="font-size: 9px; font-weight: bold; color: #fde047; text-transform: uppercase; margin-top: 2px;">KARTU TANDA ANGGOTA PERPUSTAKAAN</div>
            </div>
          </div>
          
          <div style="display: flex; padding: 10px 14px; gap: 12px; font-size: 11px;">
            <div style="width: 70px; height: 90px; border-radius: 6px; background: #f1f5f9; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px dashed #94a3b8; font-weight: bold; color: #64748b; font-size: 9px; text-align: center;">
              PAS FOTO<br>2 x 3
            </div>
            <div style="flex: 1; line-height: 1.35;">
              <div style="display: flex; margin-bottom: 3px;"><span style="width: 85px; color: #64748b; font-weight: 600;">No. Anggota</span><span style="font-weight: 800; color: #1e3a8a; font-family: monospace;">: ${member.nomorAnggota}</span></div>
              <div style="display: flex; margin-bottom: 3px;"><span style="width: 85px; color: #64748b; font-weight: 600;">Nama Lengkap</span><span style="font-weight: 700; color: #0f172a;">: ${member.nama}</span></div>
              <div style="display: flex; margin-bottom: 3px;"><span style="width: 85px; color: #64748b; font-weight: 600;">Kelas / Status</span><span style="font-weight: 600; color: #1e293b;">: ${cls?.namaKelas || '-'} (${member.jenisAnggota})</span></div>
              <div style="display: flex; margin-bottom: 3px;"><span style="width: 85px; color: #64748b; font-weight: 600;">TTL</span><span style="color: #334155;">: ${member.tempatLahir || '-'}, ${member.tanggalLahir || '-'}</span></div>
              <div style="display: flex;"><span style="width: 85px; color: #64748b; font-weight: 600;">Berlaku</span><span style="font-weight: 600; color: #047857;">: Selama Aktif Sekolah</span></div>
              
              <div style="margin-top: 6px; font-family: monospace; font-size: 9px; letter-spacing: 2px; color: #334155; border-top: 1px dashed #e2e8f0; padding-top: 2px;">
                |||| ||| ||||| || |||||| | ${member.nomorAnggota}
              </div>
            </div>
          </div>

          <div style="padding: 0 14px 8px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 8px; color: #475569;">
            <div>NPSN: ${pengaturan.npsn}</div>
            <div style="text-align: center;">
              <div>Sanglar, ${formatTanggalIndo(member.tanggalBergabung)}</div>
              <div style="font-weight: 600; color: #1e293b;">Kepala Perpustakaan,</div>
              <div style="height: 18px; font-style: italic; color: #1e3a8a;">[TTD Digital]</div>
              <div style="font-weight: 700; border-top: 1px solid #0f172a; padding-top: 1px; color: #0f172a;">${pengaturan.namaKepalaPerpustakaan}</div>
              <div>NIP. ${pengaturan.nipKepalaPerpustakaan}</div>
            </div>
          </div>
        </div>

        <!-- BELAKANG -->
        ${showBothSides ? `
        <div style="width: 380px; height: 235px; border-radius: 12px; border: 1.5px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; background: #f8fafc; padding: 12px 14px; position: relative; font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="text-align: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 8px;">
              <div style="font-size: 11px; font-weight: 800; color: #1e3a8a; text-transform: uppercase;">Tata Tertib Anggota Perpustakaan</div>
              <div style="font-size: 8.5px; font-weight: 700; color: #475569; text-transform: uppercase;">${pengaturan.namaSekolah}</div>
            </div>
            <ol style="margin: 0; padding-left: 14px; font-size: 9.5px; color: #334155; line-height: 1.45;">
              <li>Kartu ini wajib dibawa setiap berkunjung dan meminjam buku.</li>
              <li>Peminjaman maksimal ${pengaturan.maksimalBukuPinjam} buku selama ${pengaturan.maksimalHariPinjam} hari.</li>
              <li>Denda keterlambatan: Rp ${pengaturan.dendaPerHari.toLocaleString('id-ID')},- /hari.</li>
              <li>Menjaga keutuhan buku, dilarang mencoret atau merobek buku.</li>
              <li>Buku rusak/hilang wajib diganti sesuai ketentuan sekolah.</li>
              <li>Kartu anggota tidak boleh dipinjamkan kepada orang lain.</li>
            </ol>
          </div>
          <div style="border-top: 1px solid #cbd5e1; padding-top: 6px; text-align: center;">
            <div style="font-size: 9px; font-style: italic; font-weight: bold; color: #1e40af;">"Buku adalah Jendela Dunia, Membaca Membuka Cakrawala"</div>
            <div style="font-size: 8px; color: #64748b; margin-top: 2px;">${pengaturan.alamat}, Kec. ${pengaturan.kecamatan}, Kab. ${pengaturan.kabupaten}</div>
          </div>
        </div>` : ''}
      </div>
    `;
  };

  // Compile print data for single or batch
  const getDocumentData = (): PrintDocumentData => {
    if (printMode === 'single' && selectedMember) {
      return {
        title: `KARTU TANDA ANGGOTA - ${selectedMember.nama}`,
        subtitle: `Nomor Anggota: ${selectedMember.nomorAnggota} | ${memberClass?.namaKelas || '-'}`,
        filename: `kartu_anggota_${selectedMember.nomorAnggota}_${selectedMember.nama.replace(/\s+/g, '_')}`,
        pengaturan,
        bodyHtml: generateCardHtml(selectedMember),
      };
    } else {
      const cardsHtml = filteredAnggota.map((m) => generateCardHtml(m)).join('');
      const classLabel = filterKelasId === 'all' ? 'Seluruh Anggota' : `Kelas ${getKelasById(filterKelasId)?.namaKelas || ''}`;
      return {
        title: `DAFTAR KARTU ANGGOTA PERPUSTAKAAN (${classLabel})`,
        subtitle: `Total: ${filteredAnggota.length} Kartu Anggota Siap Cetak`,
        filename: `daftar_kartu_anggota_${filterKelasId === 'all' ? 'semua' : filterKelasId}_smpn3reteh`,
        pengaturan,
        bodyHtml: cardsHtml,
      };
    }
  };

  // Quick direct print
  const handleDirectPrint = (mode: 'single' | 'batch') => {
    setPrintMode(mode);
    setIsPrintModalOpen(true);
  };

  // Direct download
  const handleDownload = (mode: 'single' | 'batch') => {
    setPrintMode(mode);
    const docData = getDocumentData();
    downloadPrintableDocument(docData);
    addToast('File kartu anggota siap cetak berhasil diunduh!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Cetak Kartu Tanda Anggota (KTA)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cetak kartu resmi anggota perpustakaan SMP Negeri 3 Reteh (satu siswa atau massal per kelas).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Batch Print Button */}
          <button
            onClick={() => handleDirectPrint('batch')}
            className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all flex items-center gap-1.5"
            title="Cetak sekaligus semua anggota pada kelas terpilih"
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Cetak Sekaligus ({filteredAnggota.length} Siswa)</span>
          </button>

          {/* Download HTML Button */}
          <button
            onClick={() => handleDownload('single')}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Unduh Kartu sebagai file HTML siap cetak"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download File</span>
          </button>

          {/* Open Print Dialog / Modal */}
          <button
            onClick={() => handleDirectPrint('single')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu Siswa</span>
          </button>
        </div>
      </div>

      {/* Selector & Controls Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Filter Berdasarkan Kelas
            </label>
            <select
              value={filterKelasId}
              onChange={(e) => {
                setFilterKelasId(e.target.value);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Kelas ({anggota.length} Anggota)</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.namaKelas} ({anggota.filter((a) => a.kelasId === k.id).length} Siswa)
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Anggota yang Ditampilkan
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
                    {a.nama} ({a.nomorAnggota}) - {cls?.namaKelas || '-'} [{a.jenisAnggota}]
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
            <input
              type="checkbox"
              checked={showBothSides}
              onChange={(e) => setShowBothSides(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium">Tampilkan Sisi Depan & Tata Tertib Belakang</span>
          </label>

          <span className="text-slate-500 text-[11px]">
            Ukuran standar kartu ID: 8.5 x 5.4 cm (Skala cetak A4 / Card Stock)
          </span>
        </div>
      </div>

      {/* Printable Cards Preview Area */}
      {selectedMember && (
        <div className="printable-area flex flex-col items-center gap-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {/* FRONT CARD SIDE */}
            <div className="w-[380px] sm:w-[430px] h-[255px] bg-white rounded-2xl border-2 border-slate-300 shadow-xl overflow-hidden relative flex flex-col justify-between selection:bg-transparent">
              {/* Card Header with School Identity */}
              <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white px-4 py-3 border-b-4 border-amber-400 relative">
                <div className="flex items-center gap-3">
                  {pengaturan.logoKopUrl ? (
                    <img
                      src={pengaturan.logoKopUrl}
                      alt="Logo Sekolah"
                      className="w-10 h-10 object-contain flex-shrink-0 drop-shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 flex-shrink-0 border border-white/20">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  )}
                  <div className="leading-tight">
                    <h4 className="text-[9px] uppercase tracking-wider font-semibold text-blue-200">
                      Pemerintah {pengaturan.kabupaten}
                    </h4>
                    <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-tight text-white">
                      {pengaturan.namaSekolah}
                    </h3>
                    <p className="text-[9px] text-amber-300 font-bold uppercase tracking-wider mt-0.5">
                      Kartu Tanda Anggota Perpustakaan
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex gap-4 items-start">
                {/* Photo Placeholder */}
                <div className="w-20 h-24 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-center flex-shrink-0 shadow-inner">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600 mb-1">
                    {selectedMember.nama.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[8px] font-semibold text-slate-500 uppercase">
                    Pas Foto<br />2 x 3
                  </span>
                </div>

                {/* Member Info Fields */}
                <div className="flex-1 space-y-1 text-slate-800 text-[11px]">
                  <div className="flex">
                    <span className="w-24 text-slate-500 font-medium">No. Anggota</span>
                    <span className="font-mono font-black text-blue-900">: {selectedMember.nomorAnggota}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500 font-medium">Nama</span>
                    <span className="font-extrabold text-slate-900 line-clamp-1">: {selectedMember.nama}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500 font-medium">Kelas / Status</span>
                    <span className="font-bold text-slate-800">: {memberClass?.namaKelas || '-'} ({selectedMember.jenisAnggota})</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500 font-medium">TTL</span>
                    <span className="text-slate-700">: {selectedMember.tempatLahir || '-'}, {selectedMember.tanggalLahir || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500 font-medium">Masa Berlaku</span>
                    <span className="font-semibold text-emerald-700">: Selama Menjadi Siswa/i</span>
                  </div>

                  {/* Simulated Barcode */}
                  <div className="pt-2">
                    <div className="flex items-center gap-[2px] h-6 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 w-fit">
                      {[3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 3, 4, 1, 2, 3].map((w, i) => (
                        <div
                          key={i}
                          className={`h-full bg-slate-900 ${i % 2 === 0 ? 'opacity-100' : 'opacity-0'}`}
                          style={{ width: `${w}px` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature Block Bottom Right */}
              <div className="px-4 pb-3 flex justify-between items-end text-[9px] text-slate-700">
                <div className="text-[8px] text-slate-400">
                  NPSN: {pengaturan.npsn}
                </div>

                <div className="text-center">
                  <div>Sanglar, {formatTanggalIndo(selectedMember.tanggalBergabung)}</div>
                  <div className="font-semibold text-slate-800">Kepala Perpustakaan,</div>
                  <div className="h-6 flex items-center justify-center">
                    <span className="font-serif italic text-blue-900 text-[10px] opacity-80">[TTD Digital]</span>
                  </div>
                  <div className="font-bold text-slate-900 border-t border-slate-800 pt-0.5">
                    {pengaturan.namaKepalaPerpustakaan}
                  </div>
                  <div className="text-[8px] text-slate-500">NIP. {pengaturan.nipKepalaPerpustakaan}</div>
                </div>
              </div>
            </div>

            {/* BACK CARD SIDE (TATA TERTIB) */}
            {showBothSides && (
              <div className="w-[380px] sm:w-[430px] h-[255px] bg-slate-50 rounded-2xl border-2 border-slate-300 shadow-xl overflow-hidden p-4 flex flex-col justify-between selection:bg-transparent">
                <div>
                  <div className="text-center border-b border-slate-200 pb-2 mb-2">
                    <h4 className="text-xs font-black uppercase text-blue-900 tracking-tight">
                      Tata Tertib Anggota Perpustakaan
                    </h4>
                    <p className="text-[9px] text-slate-500 font-semibold uppercase">
                      SMP NEGERI 3 RETEH
                    </p>
                  </div>

                  <ol className="text-[10px] text-slate-700 space-y-1 list-decimal pl-4 leading-snug">
                    <li>Kartu ini wajib dibawa saat berkunjung dan meminjam buku.</li>
                    <li>
                      Peminjaman maksimal <strong>{pengaturan.maksimalBukuPinjam} buku</strong> selama{' '}
                      <strong>{pengaturan.maksimalHariPinjam} hari</strong>.
                    </li>
                    <li>
                      Keterlambatan dikenakan denda <strong>Rp {pengaturan.dendaPerHari.toLocaleString('id-ID')},- /hari</strong>.
                    </li>
                    <li>Wajib merawat dan menjaga kebersihan buku yang dipinjam.</li>
                    <li>Buku yang rusak berat atau hilang wajib diganti sesuai aturan sekolah.</li>
                    <li>Kartu anggota tidak dapat dipindahtangankan kepada orang lain.</li>
                  </ol>
                </div>

                <div className="border-t border-slate-200 pt-2 text-center space-y-1">
                  <div className="text-[10px] font-bold italic text-blue-800">
                    "Buku Adalah Jendela Dunia, Membaca Kunci Kesuksesan"
                  </div>
                  <div className="text-[8px] text-slate-400">
                    Alamat: {pengaturan.alamat}, Kec. {pengaturan.kecamatan}, Kab. {pengaturan.kabupaten}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 no-print">
            <button
              onClick={() => handleDirectPrint('single')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Buka Dialog Cetak Kartu</span>
            </button>
            <button
              onClick={() => handleDownload('single')}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File HTML Cetak</span>
            </button>
          </div>
        </div>
      )}

      {/* Universal Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        documentData={getDocumentData()}
      />
    </div>
  );
};
