import React from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { BookOpen } from 'lucide-react';

interface SchoolHeaderProps {
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export const SchoolHeader: React.FC<SchoolHeaderProps> = ({
  title,
  subtitle,
  compact = false,
}) => {
  const { pengaturan } = useLibrary();

  if (compact) {
    return (
      <div className="flex items-center gap-3 border-b pb-2 mb-3">
        {pengaturan.logoKopUrl ? (
          <img
            src={pengaturan.logoKopUrl}
            alt="Logo Sekolah"
            className="w-9 h-9 object-contain flex-shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
            <BookOpen className="w-5 h-5 text-amber-300" />
          </div>
        )}
        <div className="leading-tight">
          <h2 className="text-sm font-black tracking-tight text-slate-900 uppercase">
            {pengaturan.namaSekolah}
          </h2>
          <p className="text-[11px] text-slate-600">
            Unit Perpustakaan Digital & Literasi Sekolah
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-center mb-6">
      <div className="flex items-center justify-center gap-4 sm:gap-6 mb-3">
        {/* Left School Logo */}
        {pengaturan.logoKopUrl ? (
          <div className="flex-shrink-0 flex items-center justify-center">
            <img
              src={pengaturan.logoKopUrl}
              alt="Logo Kop Surat"
              className="h-16 sm:h-20 w-auto max-w-[85px] max-h-[85px] object-contain drop-shadow-sm"
            />
          </div>
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex flex-col items-center justify-center shadow-md border-2 border-amber-400 p-2 flex-shrink-0">
            <BookOpen className="w-8 h-8 text-amber-300" />
            <span className="text-[9px] font-extrabold tracking-widest uppercase mt-0.5 text-blue-100">
              SMPN 3
            </span>
          </div>
        )}

        <div className="text-center flex-1 max-w-xl">
          <h3 className="text-xs sm:text-sm font-semibold tracking-wider text-slate-700 uppercase">
            Pemerintah {pengaturan.kabupaten}
          </h3>
          <h4 className="text-xs sm:text-sm font-bold tracking-wider text-slate-800 uppercase">
            Dinas Pendidikan dan Kebudayaan
          </h4>
          <h1 className="text-lg sm:text-2xl font-black tracking-tight text-blue-900 uppercase mt-0.5">
            {pengaturan.namaSekolah}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-600 mt-1 max-w-xl mx-auto">
            {pengaturan.alamat}, {pengaturan.desaKelurahan}, Kec. {pengaturan.kecamatan}, {pengaturan.kabupaten}, {pengaturan.provinsi} | Kode Pos: {pengaturan.kodePos}
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-500">
            NPSN: {pengaturan.npsn} | Telp: {pengaturan.telepon} | Email: {pengaturan.email}
          </p>
        </div>

        {/* Right balance logo if dua-sisi selected, otherwise placeholder for symmetry */}
        {pengaturan.posisiLogoKop === 'kiri-kanan' && pengaturan.logoKopUrl ? (
          <div className="hidden sm:flex flex-shrink-0 items-center justify-center">
            <img
              src={pengaturan.logoKopUrl}
              alt="Logo Kanan"
              className="h-16 sm:h-20 w-auto max-w-[85px] max-h-[85px] object-contain drop-shadow-sm"
            />
          </div>
        ) : (
          <div className="hidden sm:block w-16 sm:w-20 flex-shrink-0 opacity-0 pointer-events-none" />
        )}
      </div>

      {/* Double line Kop Surat separator (Thick line and thin line) */}
      <div className="border-b-[3px] border-slate-900 my-1"></div>
      <div className="border-b-[1px] border-slate-900 mb-4"></div>

      {title && (
        <div className="mt-4 mb-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase underline decoration-2 underline-offset-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-600 mt-1">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
};
