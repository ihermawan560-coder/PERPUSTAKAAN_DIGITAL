import React, { useState } from 'react';
import {
  Printer,
  Download,
  X,
  FileSpreadsheet,
  Maximize2,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  CheckCircle,
  FileText
} from 'lucide-react';
import {
  PrintDocumentData,
  executePrint,
  downloadPrintableDocument
} from '../../utils/printHelper';
import { useLibrary } from '../../context/LibraryContext';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentData: PrintDocumentData;
  onDownloadCsv?: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  documentData,
  onDownloadCsv,
}) => {
  const { addToast } = useLibrary();
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePrintClick = () => {
    setIsPrinting(true);
    executePrint(documentData, (msg, type) => {
      addToast(msg, type);
    });
    setTimeout(() => setIsPrinting(false), 1500);
  };

  const handleDownloadHtmlClick = () => {
    downloadPrintableDocument(documentData);
    addToast(
      'File dokumen siap cetak berhasil diunduh! Buka file tersebut untuk langsung mencetak atau simpan ke PDF.',
      'success'
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-100 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-700 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">
                Pratinjau & Dialog Cetak Dokumen
              </h3>
              <p className="text-[11px] text-slate-400">
                {documentData.title} &bull; SMP Negeri 3 Reteh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 mr-2 text-xs">
              <button
                onClick={() => setZoomLevel((prev) => Math.max(60, prev - 10))}
                className="p-1.5 hover:text-white text-slate-400 hover:bg-slate-700 rounded transition-colors"
                title="Perkecil Tampilan"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] font-mono text-slate-300">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((prev) => Math.min(140, prev + 10))}
                className="p-1.5 hover:text-white text-slate-400 hover:bg-slate-700 rounded transition-colors"
                title="Perbesar Tampilan"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action Buttons */}
            {onDownloadCsv && (
              <button
                onClick={onDownloadCsv}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
                title="Unduh Data Mentah Format Excel / CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Unduh</span> CSV
              </button>
            )}

            <button
              onClick={handleDownloadHtmlClick}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              title="Unduh File HTML Siap Cetak Mandiri / PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh File Cetak</span>
            </button>

            <button
              onClick={handlePrintClick}
              disabled={isPrinting}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isPrinting ? 'Membuka...' : 'Cetak Sekarang'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
              aria-label="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Helpful Info Notice */}
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 sm:px-6 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>
              <strong>Petunjuk Cetak:</strong> Klik <strong>Cetak Sekarang</strong> untuk membuka dialog cetak browser (pilih <em>"Save as PDF"</em> untuk menyimpan sebagai PDF). Jika dialog terblokir di layar ini, klik <strong>Unduh File Cetak</strong>.
            </span>
          </div>
        </div>

        {/* Preview Viewport Container */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-slate-200/90">
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease',
            }}
            className="w-full max-w-[850px] bg-white shadow-xl rounded p-8 sm:p-12 text-slate-900 border border-slate-300"
          >
            {/* Kop Surat Sekolah SMP Negeri 3 Reteh */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 pb-3 border-b-[3px] border-double border-slate-900 mb-5">
              {documentData.pengaturan.logoKopUrl ? (
                <img
                  src={documentData.pengaturan.logoKopUrl}
                  alt="Logo Kop"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0"
                />
              ) : null}
              <div className="text-center flex-1">
                <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-800">
                  Pemerintah Kabupaten {documentData.pengaturan.kabupaten}
                </h4>
                <h3 className="text-xs sm:text-sm font-extrabold tracking-wider uppercase text-slate-900">
                  Dinas Pendidikan dan Kebudayaan
                </h3>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-blue-950 uppercase mt-0.5">
                  {documentData.pengaturan.namaSekolah}
                </h1>
                <p className="text-[10px] sm:text-[11px] text-slate-600 mt-0.5">
                  {documentData.pengaturan.alamat}, {documentData.pengaturan.desaKelurahan}, Kec. {documentData.pengaturan.kecamatan}, {documentData.pengaturan.kabupaten}, {documentData.pengaturan.provinsi}
                </p>
                <p className="text-[10px] text-slate-500">
                  NPSN: {documentData.pengaturan.npsn} &bull; Telp: {documentData.pengaturan.telepon} &bull; Email: {documentData.pengaturan.email}
                </p>
              </div>
              {documentData.pengaturan.posisiLogoKop === 'kiri-kanan' && documentData.pengaturan.logoKopUrl ? (
                <img
                  src={documentData.pengaturan.logoKopUrl}
                  alt="Logo Kanan"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0"
                />
              ) : documentData.pengaturan.logoKopUrl ? (
                <div className="w-16 sm:w-20 opacity-0 pointer-events-none flex-shrink-0" />
              ) : null}
            </div>

            {/* Document Title Header */}
            <div className="text-center my-4">
              <h2 className="text-sm sm:text-base font-extrabold uppercase underline decoration-2 underline-offset-4 text-slate-900">
                {documentData.title}
              </h2>
              {documentData.subtitle && (
                <p className="text-xs text-slate-600 mt-1 italic">
                  {documentData.subtitle}
                </p>
              )}
            </div>

            {/* Injected HTML Body Content */}
            <div
              className="my-5 text-xs sm:text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: documentData.bodyHtml }}
            />

            {/* Signatures Footer */}
            <div className="mt-12 pt-4 grid grid-cols-2 text-center text-xs text-slate-800 border-t border-slate-200">
              <div>
                <p className="text-slate-600">Mengetahui,</p>
                <p className="font-semibold text-slate-900">
                  Kepala {documentData.pengaturan.namaSekolah}
                </p>
                <div className="h-16 flex items-center justify-center">
                  <span className="font-serif italic text-slate-400 text-[10px]">
                    [Tanda Tangan & Cap Resmi]
                  </span>
                </div>
                <p className="font-bold underline text-slate-900">
                  {documentData.pengaturan.namaKepalaSekolah}
                </p>
                <p className="text-[11px] text-slate-500">
                  NIP. {documentData.pengaturan.nipKepalaSekolah}
                </p>
              </div>

              <div>
                <p className="text-slate-600">
                  Sanglar,{' '}
                  {new Intl.DateTimeFormat('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }).format(new Date())}
                </p>
                <p className="font-semibold text-slate-900">
                  Kepala Perpustakaan
                </p>
                <div className="h-16 flex items-center justify-center">
                  <span className="font-serif italic text-slate-400 text-[10px]">
                    [Tanda Tangan & Cap Resmi]
                  </span>
                </div>
                <p className="font-bold underline text-slate-900">
                  {documentData.pengaturan.namaKepalaPerpustakaan}
                </p>
                <p className="text-[11px] text-slate-500">
                  NIP. {documentData.pengaturan.nipKepalaPerpustakaan}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white px-4 py-3 sm:px-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Dokumen diformat standar resmi kertas A4 untuk perpustakaan sekolah</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
            >
              Tutup Pratinjau
            </button>
            <button
              onClick={handlePrintClick}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
