import React, { useState, useEffect } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken
} from '../../services/googleAuth';
import {
  listDriveSpreadsheets,
  getSpreadsheetDetails,
  readSheetValues,
  createSchoolLibrarySpreadsheet,
  createStudentTemplateSpreadsheet,
  exportAllDataToSpreadsheet,
  parseStudentsFromSheetValues,
  DriveSpreadsheetFile,
  SpreadsheetDetails
} from '../../services/googleSheetsService';
import { Modal, ConfirmModal } from '../common/Modal';
import {
  FileSpreadsheet,
  Cloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Users,
  BookOpen,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
  Link as LinkIcon,
  Copy,
  Check,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';

export const GoogleSheetsView: React.FC = () => {
  const {
    anggota,
    kelas,
    buku,
    transaksi,
    pengaturan,
    setAllAnggota,
    addMultipleAnggota,
    clearAllAnggota,
    addToast,
    setActiveTab,
  } = useLibrary();

  // Auth state
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  // Drive & Sheets state
  const [recentSpreadsheets, setRecentSpreadsheets] = useState<DriveSpreadsheetFile[]>([]);
  const [loadingDrive, setLoadingDrive] = useState<boolean>(false);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('smpn3_last_connected_sheet_id') || '';
  });
  const [customSheetUrl, setCustomSheetUrl] = useState<string>('');
  const [activeSheetDetails, setActiveSheetDetails] = useState<SpreadsheetDetails | null>(null);
  const [loadingSheetDetails, setLoadingSheetDetails] = useState<boolean>(false);
  const [selectedTabName, setSelectedTabName] = useState<string>('');

  // Import preview state
  const [previewStudents, setPreviewStudents] = useState<any[]>([]);
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isReadingSheet, setIsReadingSheet] = useState<boolean>(false);

  // Confirmation Modals (MANDATORY for mutating/destructive actions)
  const [confirmExportModalOpen, setConfirmExportModalOpen] = useState<boolean>(false);
  const [confirmImportModalOpen, setConfirmImportModalOpen] = useState<boolean>(false);
  const [confirmClearModalOpen, setConfirmClearModalOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Unauthorized domain modal & helper states
  const [showDomainHelpModal, setShowDomainHelpModal] = useState<boolean>(false);
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
  const firebaseSettingsUrl = 'https://console.firebase.google.com/project/united-cinema-n5wls/authentication/settings';

  const handleCopyDomain = (textToCopy: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
      addToast(`Domain "${textToCopy}" disalin ke clipboard!`, 'success');
    }
  };

  // Monitor Auth on load
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setHasToken(!!token);
      },
      () => {
        setGoogleUser(null);
        setHasToken(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch drive spreadsheets when authenticated
  useEffect(() => {
    if (hasToken) {
      loadDriveFiles();
      if (selectedSpreadsheetId) {
        inspectSpreadsheet(selectedSpreadsheetId);
      }
    }
  }, [hasToken]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setHasToken(true);
        addToast(`Berhasil terhubung ke Akun Google: ${res.user.displayName || res.user.email}`, 'success');
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      if (
        err?.code === 'auth/unauthorized-domain' ||
        err?.message?.includes('unauthorized-domain') ||
        err?.message?.includes('unauthorized domain')
      ) {
        setShowDomainHelpModal(true);
        addToast('Domain belum diotorisasi di Firebase! Buka petunjuk untuk menyelesaikannya.', 'info');
      } else {
        addToast(err?.message || 'Gagal masuk dengan Google. Silakan coba lagi.', 'error');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setHasToken(false);
      setRecentSpreadsheets([]);
      setActiveSheetDetails(null);
      addToast('Telah keluar dari Akun Google.', 'info');
    } catch (err: any) {
      addToast('Gagal keluar dari Google.', 'error');
    }
  };

  const loadDriveFiles = async () => {
    setLoadingDrive(true);
    try {
      const files = await listDriveSpreadsheets();
      setRecentSpreadsheets(files);
    } catch (err: any) {
      console.error('Error listing spreadsheets:', err);
      addToast(`Gagal memuat file dari Google Drive: ${err?.message}`, 'error');
    } finally {
      setLoadingDrive(false);
    }
  };

  const inspectSpreadsheet = async (sheetId: string) => {
    if (!sheetId) return;
    setLoadingSheetDetails(true);
    try {
      const details = await getSpreadsheetDetails(sheetId);
      setActiveSheetDetails(details);
      setSelectedSpreadsheetId(sheetId);
      localStorage.setItem('smpn3_last_connected_sheet_id', sheetId);
      if (details.sheets.length > 0) {
        // Prefer sheet named "Data Siswa & Anggota" or first sheet
        const studentTab = details.sheets.find((s) =>
          s.title.toLowerCase().includes('siswa') || s.title.toLowerCase().includes('anggota')
        );
        setSelectedTabName(studentTab ? studentTab.title : details.sheets[0].title);
      }
    } catch (err: any) {
      console.error('Error inspecting spreadsheet:', err);
      addToast(`Gagal membaca spreadsheet: ${err?.message}`, 'error');
    } finally {
      setLoadingSheetDetails(false);
    }
  };

  const handleConnectUrl = () => {
    if (!customSheetUrl.trim()) {
      addToast('Masukkan link atau ID Google Spreadsheet.', 'error');
      return;
    }
    // Match spreadsheet ID from URL or raw ID
    const match = customSheetUrl.match(/[-\w]{25,}/);
    if (!match) {
      addToast('ID atau Link Spreadsheet tidak valid. Contoh: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit', 'error');
      return;
    }
    const sheetId = match[0];
    inspectSpreadsheet(sheetId);
  };

  // Create brand new School Spreadsheet
  const handleCreateNewSpreadsheet = async () => {
    setIsProcessing(true);
    try {
      const title = `Perpustakaan SMPN 3 Reteh - Data Sinkronisasi (${new Date().toLocaleDateString('id-ID')})`;
      const created = await createSchoolLibrarySpreadsheet(title);
      setActiveSheetDetails(created);
      setSelectedSpreadsheetId(created.spreadsheetId);
      localStorage.setItem('smpn3_last_connected_sheet_id', created.spreadsheetId);

      // Auto-export current data into the new spreadsheet
      await exportAllDataToSpreadsheet(created.spreadsheetId, {
        anggota,
        kelas,
        buku,
        transaksi,
        schoolName: pengaturan.namaSekolah,
      });

      addToast(`Spreadsheet baru berhasil dibuat dan disinkronkan ke Google Drive!`, 'success');
      loadDriveFiles();
    } catch (err: any) {
      console.error('Error creating spreadsheet:', err);
      addToast(`Gagal membuat spreadsheet baru: ${err?.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Create Student Template Spreadsheet
  const handleCreateStudentTemplate = async () => {
    setIsProcessing(true);
    try {
      const allowedNames = kelas.filter((k) => k.tingkat !== 'Guru/Staf').map((k) => k.namaKelas);
      const title = `Template Siswa SMPN 3 Reteh - Siap Diisi (${new Date().getFullYear()})`;
      const created = await createStudentTemplateSpreadsheet(title, allowedNames);
      setActiveSheetDetails(created);
      setSelectedSpreadsheetId(created.spreadsheetId);
      localStorage.setItem('smpn3_last_connected_sheet_id', created.spreadsheetId);

      addToast(`Template Siswa Google Sheets berhasil dibuat di Google Drive! Anda dapat membukanya dan mengisi data.`, 'success');
      loadDriveFiles();
    } catch (err: any) {
      console.error('Error creating student template:', err);
      addToast(`Gagal membuat template siswa: ${err?.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Export confirmation
  const handleConfirmExport = async () => {
    if (!selectedSpreadsheetId) {
      addToast('Pilih atau buat spreadsheet terlebih dahulu.', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      await exportAllDataToSpreadsheet(selectedSpreadsheetId, {
        anggota,
        kelas,
        buku,
        transaksi,
        schoolName: pengaturan.namaSekolah,
      });
      addToast('Data perpustakaan berhasil diekspor ke Google Sheets!', 'success');
      setConfirmExportModalOpen(false);
    } catch (err: any) {
      console.error('Error exporting data:', err);
      addToast(`Gagal mengekspor data: ${err?.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Read and Preview Students from Sheet Tab
  const handleReadAndPreview = async () => {
    if (!selectedSpreadsheetId || !selectedTabName) {
      addToast('Pilih lembar (tab) spreadsheet yang ingin dibaca.', 'error');
      return;
    }
    setIsReadingSheet(true);
    try {
      const rawRows = await readSheetValues(selectedSpreadsheetId, `'${selectedTabName}'!A1:Z200`);
      const { parsed, errors } = parseStudentsFromSheetValues(rawRows, kelas);
      if (parsed.length === 0) {
        addToast('Tidak ditemukan data siswa pada lembar ini. Pastikan format kolom sesuai.', 'error');
        return;
      }
      setPreviewStudents(parsed);
      setPreviewErrors(errors);
      setIsPreviewModalOpen(true);
    } catch (err: any) {
      console.error('Error reading sheet:', err);
      addToast(`Gagal membaca lembar sheet: ${err?.message}`, 'error');
    } finally {
      setIsReadingSheet(false);
    }
  };

  // Apply Import Confirmation
  const handleExecuteImport = () => {
    if (previewStudents.length === 0) return;
    setIsProcessing(true);
    try {
      if (importMode === 'replace') {
        const withIds = previewStudents.map((s, idx) => ({
          ...s,
          id: `ang_gs_${Date.now()}_${idx}`,
        }));
        setAllAnggota(withIds);
        addToast(`Berhasil mengganti seluruh data anggota dengan ${withIds.length} siswa dari Google Sheets!`, 'success');
      } else {
        addMultipleAnggota(previewStudents);
        addToast(`Berhasil menambahkan ${previewStudents.length} siswa dari Google Sheets!`, 'success');
      }
      setIsPreviewModalOpen(false);
      setConfirmImportModalOpen(false);
    } catch (err: any) {
      console.error('Error importing students:', err);
      addToast(`Gagal mengimpor siswa: ${err?.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
          <FileSpreadsheet className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-semibold text-emerald-200">
              <Cloud className="w-3.5 h-3.5 text-emerald-300" />
              Integrasi Cloud Google Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Google Sheets & Drive Perpustakaan
            </h1>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Sinkronkan data siswa, buku, dan transaksi peminjaman langsung dengan spreadsheet di akun Google Drive Anda secara aman dan real-time.
            </p>
          </div>

          {/* Google Auth Status / Button */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 shrink-0 flex flex-col items-center sm:items-end gap-3">
            {googleUser && hasToken ? (
              <div className="flex flex-col sm:items-end text-center sm:text-right gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
                    Terhubung Google
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {googleUser.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt={googleUser.displayName || 'Google User'}
                      className="w-8 h-8 rounded-full border border-white/40 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      {(googleUser.displayName || googleUser.email || 'G')[0]}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-bold text-white leading-tight">
                      {googleUser.displayName || 'Akun Google'}
                    </p>
                    <p className="text-xs text-emerald-200 font-mono truncate max-w-[200px]">
                      {googleUser.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="mt-1 text-xs text-red-200 hover:text-white underline cursor-pointer transition-colors"
                >
                  Keluar dari Google
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center sm:items-end gap-2 text-center sm:text-right">
                <p className="text-xs text-emerald-100 max-w-[240px]">
                  Masuk dengan Google untuk mengakses spreadsheet Drive Anda:
                </p>
                {/* Official Sign in with Google Button per SKILL.md */}
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="inline-flex items-center gap-3 px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 font-medium text-sm rounded-lg shadow-md border border-slate-200 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                  <span>{isSigningIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDomainHelpModal(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] text-emerald-100 hover:text-white underline cursor-pointer transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                  <span>Muncul Error (auth/unauthorized-domain)? Klik Solusi</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Status Stats & Empty Action */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Data Anggota</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{anggota.length} Orang</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Katalog Buku</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{buku.length} Judul</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Transaksi Aktif</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {transaksi.filter((t) => t.status !== 'Dikembalikan').length} Pinjaman
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/30 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-red-700 uppercase flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              Kelola Data Anggota
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {anggota.length === 0
                ? 'Data saat ini kosong (siap diinput).'
                : 'Kosongkan data untuk input mandiri atau impor Google Sheets.'}
            </p>
          </div>
          <button
            onClick={() => setConfirmClearModalOpen(true)}
            disabled={anggota.length === 0}
            className="mt-2 w-full py-1.5 px-3 text-xs font-bold rounded-lg border border-red-300 text-red-700 hover:bg-red-600 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {anggota.length === 0 ? 'Data Sudah Kosong' : 'Kosongkan Data Anggota'}
          </button>
        </div>
      </div>

      {!hasToken ? (
        /* Prompt to Login */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              Hubungkan Akun Google untuk Memulai
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Aplikasi memerlukan izin untuk membaca dan menulis spreadsheet di Google Drive Anda. Klik tombol di bawah untuk masuk dengan akun Google Anda secara resmi.
            </p>
          </div>
          <div>
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="inline-flex items-center gap-3 px-6 py-3 bg-white text-slate-800 hover:bg-slate-50 font-bold text-sm rounded-xl shadow-md border border-slate-300 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
              <span>{isSigningIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Authenticated Google Sheets Management Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Spreadsheet Connection & File Picker */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Buat Spreadsheet Baru
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Buat file spreadsheet resmi langsung di Google Drive Anda:
              </p>
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleCreateNewSpreadsheet}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  Buat File Baru + Sinkron Lengkap
                </button>
                <button
                  onClick={handleCreateStudentTemplate}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-60"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Buat Template Siswa Siap Diisi
                </button>
              </div>
            </div>

            {/* Input URL/ID Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-blue-600" />
                Hubungkan Lewat Link / ID
              </h3>
              <p className="text-xs text-slate-500">
                Tempel link atau ID Google Spreadsheet yang sudah Anda miliki:
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  value={customSheetUrl}
                  onChange={(e) => setCustomSheetUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleConnectUrl}
                  disabled={loadingSheetDetails}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {loadingSheetDetails ? 'Membuka...' : 'Hubungkan Spreadsheet'}
                </button>
              </div>
            </div>

            {/* Spreadsheet List from Drive */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-emerald-600" />
                  Spreadsheet di Google Drive
                </h3>
                <button
                  onClick={loadDriveFiles}
                  disabled={loadingDrive}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Segarkan daftar"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingDrive ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingDrive ? (
                <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
                  Memuat file dari Drive...
                </div>
              ) : recentSpreadsheets.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Belum ditemukan file spreadsheet di Drive Anda.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {recentSpreadsheets.map((file) => {
                    const isSelected = selectedSpreadsheetId === file.id;
                    return (
                      <div
                        key={file.id}
                        onClick={() => inspectSpreadsheet(file.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-medium shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold truncate text-slate-800">{file.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {file.modifiedTime
                              ? new Date(file.modifiedTime).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Google Sheets'}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Connected Spreadsheet & Operations */}
          <div className="lg:col-span-2 space-y-6">
            {activeSheetDetails ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
                {/* Active Sheet Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Spreadsheet Terhubung
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      {activeSheetDetails.title}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                      ID: {activeSheetDetails.spreadsheetId}
                    </p>
                  </div>
                  <a
                    href={activeSheetDetails.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <span>Buka di Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Operation Panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Panel 1: Import Siswa dari Google Sheets */}
                  <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <Download className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Impor Data Siswa ke Aplikasi
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Tarik daftar siswa dari lembar spreadsheet ini dan masukkan ke database perpustakaan SMPN 3 Reteh.
                      </p>

                      <div className="pt-2 space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase">
                          Pilih Lembar (Tab):
                        </label>
                        <select
                          value={selectedTabName}
                          onChange={(e) => setSelectedTabName(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        >
                          {activeSheetDetails.sheets.map((sh) => (
                            <option key={sh.sheetId} value={sh.title}>
                              {sh.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleReadAndPreview}
                      disabled={isReadingSheet}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-98 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      {isReadingSheet ? 'Membaca Sheet...' : 'Baca & Pratinjau Siswa'}
                    </button>
                  </div>

                  {/* Panel 2: Export Data ke Google Sheets */}
                  <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Ekspor Data ke Spreadsheet
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Kirim data anggota ({anggota.length}), koleksi buku ({buku.length}), dan riwayat transaksi ({transaksi.length}) ke spreadsheet ini.
                      </p>
                      <div className="pt-2 text-xs text-slate-600 space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                        <p className="flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Format tab: Anggota, Buku, Transaksi, Kelas
                        </p>
                        <p className="flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Header berwarna dan rapi otomatis
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setConfirmExportModalOpen(true)}
                      disabled={isProcessing}
                      className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-98 disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      Ekspor Data Sekarang
                    </button>
                  </div>
                </div>

                {/* Available Tabs Information */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    Lembar / Tab yang Tersedia pada Spreadsheet Ini:
                  </h4>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {activeSheetDetails.sheets.map((s) => (
                      <span
                        key={s.sheetId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium shadow-2xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {s.title}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* No Spreadsheet Selected State */
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-base font-bold text-slate-800">
                    Belum Ada Spreadsheet Terpilih
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Pilih file spreadsheet dari daftar di sebelah kiri, buat file baru otomatis, atau tempelkan tautan spreadsheet Google yang ingin Anda hubungkan.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={handleCreateNewSpreadsheet}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Buat File Baru
                  </button>
                  <button
                    onClick={handleCreateStudentTemplate}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Buat Template Siswa
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Pratinjau Siswa dari Google Sheets */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Pratinjau Data Siswa dari Google Sheets"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                Berhasil membaca {previewStudents.length} siswa dari lembar "{selectedTabName}".
              </p>
              <p className="text-blue-700 mt-0.5">
                Periksa data di bawah sebelum menyimpannya ke sistem perpustakaan.
              </p>
            </div>
          </div>

          {/* Mode Import */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase">
              Pilih Metode Impor:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                  importMode === 'replace'
                    ? 'bg-blue-50 border-blue-400 text-blue-950 font-medium'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <p className="font-bold">Ganti Seluruh Data Siswa (Recommended)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mengosongkan data lama dan menggantinya dengan {previewStudents.length} siswa baru dari spreadsheet ini.
                  </p>
                </div>
              </label>

              <label
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                  importMode === 'append'
                    ? 'bg-blue-50 border-blue-400 text-blue-950 font-medium'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="append"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <p className="font-bold">Tambahkan ke Data Yang Ada</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Menambahkan {previewStudents.length} siswa baru ke daftar anggota saat ini ({anggota.length} orang).
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Preview Table */}
          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">No</th>
                  <th className="py-2 px-3">NISN / No</th>
                  <th className="py-2 px-3">Nama Siswa</th>
                  <th className="py-2 px-3">Kelas Terdeteksi</th>
                  <th className="py-2 px-3">L/P</th>
                  <th className="py-2 px-3">Alamat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewStudents.slice(0, 50).map((st, idx) => {
                  const k = kelas.find((kl) => kl.id === st.kelasId);
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono font-medium text-slate-800">{st.nomorAnggota}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{st.nama}</td>
                      <td className="py-2 px-3">
                        <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                          {k ? k.namaKelas : st.kelasId}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600">{st.jenisKelamin}</td>
                      <td className="py-2 px-3 text-slate-500 truncate max-w-xs">{st.alamat}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {previewStudents.length > 50 && (
            <p className="text-[11px] text-slate-400 text-center">
              Menampilkan 50 siswa pertama dari total {previewStudents.length} siswa yang terdeteksi.
            </p>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsPreviewModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={() => setConfirmImportModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              Simpan {previewStudents.length} Siswa ke Sistem
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal for Export (Mandatory Destructive/Mutating check) */}
      <ConfirmModal
        isOpen={confirmExportModalOpen}
        onClose={() => setConfirmExportModalOpen(false)}
        onConfirm={handleConfirmExport}
        title="Konfirmasi Ekspor Data ke Google Sheets"
        message={`Apakah Anda yakin ingin mengekspor seluruh data perpustakaan (${anggota.length} anggota, ${buku.length} buku, ${transaksi.length} transaksi) ke spreadsheet "${activeSheetDetails?.title || 'terpilih'}"? Tindakan ini akan menimpa isi tab yang sesuai.`}
        confirmText="Ya, Ekspor Sekarang"
        cancelText="Batal"
      />

      {/* Confirmation Modal for Import (Mandatory Destructive/Mutating check) */}
      <ConfirmModal
        isOpen={confirmImportModalOpen}
        onClose={() => setConfirmImportModalOpen(false)}
        onConfirm={handleExecuteImport}
        title="Konfirmasi Impor Siswa dari Google Sheets"
        message={
          importMode === 'replace'
            ? `Apakah Anda yakin ingin mengganti seluruh data anggota (${anggota.length} data lama) dengan ${previewStudents.length} siswa baru dari Google Sheets? Tindakan ini tidak dapat dibatalkan.`
            : `Apakah Anda yakin ingin menambahkan ${previewStudents.length} siswa baru ke daftar anggota saat ini?`
        }
        confirmText={importMode === 'replace' ? 'Ya, Ganti Seluruh Data' : 'Ya, Tambahkan Siswa'}
        cancelText="Batal"
        isDanger={importMode === 'replace'}
      />

      {/* Confirmation Modal for Clear All Members */}
      <ConfirmModal
        isOpen={confirmClearModalOpen}
        onClose={() => setConfirmClearModalOpen(false)}
        onConfirm={() => {
          clearAllAnggota();
          setConfirmClearModalOpen(false);
        }}
        title="Kosongkan Semua Data Anggota"
        message={`Apakah Anda yakin ingin mengosongkan semua data anggota (${anggota.length} orang)? Data yang dikosongkan memungkinkan Anda menginput data siswa dari awal atau mengimpor dari Google Sheets.`}
        confirmText="Ya, Kosongkan Sekarang"
        cancelText="Batal"
        isDanger={true}
      />

      {/* Modal Panduan Solusi auth/unauthorized-domain */}
      <Modal
        isOpen={showDomainHelpModal}
        onClose={() => setShowDomainHelpModal(false)}
        title="Solusi: Domain Belum Diizinkan (auth/unauthorized-domain)"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="block font-bold text-sm text-amber-950 mb-0.5">
                Penyebab Error:
              </strong>
              Firebase Authentication menerapkan proteksi keamanan <strong>Authorized Domains</strong>.
              Karena aplikasi ini dibuka melalui alamat preview/domain dinamis (
              <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded font-bold text-amber-900">
                {currentDomain || 'localhost'}
              </span>
              ), Firebase menolak permintaan login Google sampai domain tersebut didaftarkan pada project Firebase Anda (<strong>united-cinema-n5wls</strong>).
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Domain Aplikasi yang Perlu Ditambahkan:</span>
              <span className="text-[11px] text-slate-500">Klik tombol salin di bawah</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentDomain}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 shadow-xs focus:outline-hidden select-all"
              />
              <button
                type="button"
                onClick={() => handleCopyDomain(currentDomain)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
              >
                {copiedDomain ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedDomain ? 'Tersalin!' : 'Salin Domain'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Langkah Penyelesaian (Hanya 1 Menit):
            </h4>
            <ol className="text-xs text-slate-700 space-y-2.5 bg-white p-3.5 rounded-xl border border-slate-200 list-decimal list-inside leading-relaxed">
              <li>
                Buka menu <strong>Authorized domains</strong> pada Firebase Console:
                <div className="mt-2 ml-4">
                  <a
                    href={firebaseSettingsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors"
                  >
                    <span>Buka Firebase Console Settings (Project: united-cinema-n5wls)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </li>
              <li>
                Pada tab <strong>Settings</strong>, klik sub-menu <strong>Authorized domains</strong> di sebelah kiri.
              </li>
              <li>
                Klik tombol <strong>Add domain</strong> (Tambah domain).
              </li>
              <li>
                Paste/tempel domain yang telah disalin di atas (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-blue-800">{currentDomain}</code>), lalu klik <strong>Save</strong>.
              </li>
              <li>
                Kembali ke halaman ini dan klik tombol <strong>"Coba Masuk Lagi"</strong> di bawah.
              </li>
            </ol>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              Pengaturan domain di Firebase langsung aktif tanpa perlu build ulang.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDomainHelpModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDomainHelpModal(false);
                  handleSignIn();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs transition-colors"
              >
                Coba Masuk Lagi
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
