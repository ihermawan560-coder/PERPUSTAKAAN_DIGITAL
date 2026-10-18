import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { AnggotaItem } from '../../types';
import { formatTanggalIndo, exportToCSV } from '../../utils/formatters';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  CreditCard,
  History,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  School,
  GraduationCap,
  ArrowUpDown,
  LayoutGrid,
  List,
  Download,
  ClipboardList,
  Sparkles,
  Check,
  CheckSquare,
  FileText,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Upload,
  FileSpreadsheet,
  FileUp,
  FileCheck,
  AlertTriangle,
  ArrowRightLeft,
  Cloud
} from 'lucide-react';
import { Modal, ConfirmModal } from '../common/Modal';

// Sample 30 alphabetical students of VII.1
const SAMPLE_VII_1_NAMES = [
  'Adelia Fitri Ramadhani',
  'Aditya Pratama',
  'Ahmad Danial',
  'Aisyah Putri Az-Zahra',
  'Alfi Syahrin',
  'Amanda Nur Azizah',
  'Andika Firmansyah',
  'Angga Saputra',
  'Annisa Nur Ramadhani',
  'Bayu Aji Pamungkas',
  'Bima Satria Nugraha',
  'Cantika Dwi Lestari',
  'Dedi Kurniawan',
  'Della Septiana',
  'Dimas Wahyu Pratama',
  'Fajar Ramadhan',
  'Farhan Maulana',
  'Gita Rahmawati',
  'Hafiz Al-Ghifari',
  'Indah Permatasari',
  'Kevin Ardiansyah',
  'Laila Safitri',
  'Muhammad Al-Fatih',
  'Muhammad Rizky Pratama',
  'Nabila Zahra',
  'Nurul Hidayah',
  'Raditya Putra',
  'Rahmat Hidayat',
  'Salsabila Khairunnisa',
  'Zaki Mubarak'
];

/**
 * Robust CSV parser that supports comma, semicolon, tab, and quotes.
 */
function parseCSVString(text: string): string[][] {
  const rawLines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (rawLines.length === 0) return [];

  // Detect delimiter from first non-empty line
  const firstLine = rawLines[0];
  let delimiter = ',';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
  else if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

  const rows: string[][] = [];

  for (const line of rawLines) {
    const row: string[] = [];
    let insideQuotes = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    rows.push(row);
  }
  return rows;
}

export const AnggotaView: React.FC = () => {
  const {
    anggota,
    kelas,
    addAnggota,
    addMultipleAnggota,
    updateAnggota,
    updateMultipleAnggotaKelas,
    deleteAnggota,
    clearAllAnggota,
    setActiveTab,
    getKelasById,
    addToast,
    targetAnggotaKelasFilter,
    setTargetAnggotaKelasFilter,
  } = useLibrary();

  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState<string>('all');
  const [filterJenis, setFilterJenis] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'abjad-asc' | 'abjad-desc' | 'nomor-asc' | 'terbaru'>('abjad-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState<boolean>(false);


  // Multi-select for batch actions (e.g. Ganti Kelas Siswa Terpilih)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchTargetKelasId, setBatchTargetKelasId] = useState<string>('');

  // Single member class move modal
  const [movingAnggota, setMovingAnggota] = useState<AnggotaItem | null>(null);
  const [targetMoveKelasId, setTargetMoveKelasId] = useState<string>('');
  const [autoFollowNewClass, setAutoFollowNewClass] = useState<boolean>(true);

  // Sync external filter requests (e.g. from KelasView "Lihat Siswa")
  useEffect(() => {
    if (targetAnggotaKelasFilter && targetAnggotaKelasFilter !== 'all') {
      setFilterKelas(targetAnggotaKelasFilter);
      setTargetAnggotaKelasFilter('all');
    }
  }, [targetAnggotaKelasFilter, setTargetAnggotaKelasFilter]);

  // Single form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnggota, setEditingAnggota] = useState<AnggotaItem | null>(null);
  const [formData, setFormData] = useState<Omit<AnggotaItem, 'id'>>({
    nomorAnggota: '',
    nama: '',
    jenisAnggota: 'Siswa',
    kelasId: kelas[0]?.id || '',
    jenisKelamin: 'Laki-laki',
    tempatLahir: 'Sanglar, Reteh',
    tanggalLahir: '2012-01-01',
    telepon: '0852-6712-4411',
    alamat: 'Kec. Reteh, Kab. Indragiri Hilir',
    tanggalBergabung: new Date().toISOString().slice(0, 10),
    status: 'Aktif',
    fotoUrl: '',
  });

  // Bulk / CSV import modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState<'csv' | 'paste'>('csv');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bulkKelasId, setBulkKelasId] = useState<string>(() => {
    const k71 = kelas.find((k) => k.namaKelas === 'VII.1' || k.id === 'k-71');
    return k71 ? k71.id : kelas[0]?.id || '';
  });
  const [bulkRawText, setBulkRawText] = useState<string>('');
  const [bulkAutoSort, setBulkAutoSort] = useState<boolean>(true);
  const [bulkYear, setBulkYear] = useState<string>('2012');

  // Delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Helper to guess gender from typical Indonesian names
  const guessGender = (name: string): 'Laki-laki' | 'Perempuan' => {
    const lower = name.toLowerCase();
    const femaleHints = [
      'putri', 'nur', 'siti', 'aisyah', 'amanda', 'cantika', 'della', 'gita',
      'indah', 'laila', 'nabila', 'salsabila', 'ayu', 'rahma', 'safitri', 'anisa',
      'annisa', 'lestari', 'dewi', 'fitria', 'wulandari', 'zahra', 'hidayah', 'tiara',
      'khairunisa', 'intan', 'wulan'
    ];
    for (const hint of femaleHints) {
      if (lower.includes(hint)) return 'Perempuan';
    }
    return 'Laki-laki';
  };

  // Handle CSV file selection and parsing
  const handleFileUpload = (file: File) => {
    if (!file) return;
    setUploadedFileName(file.name);
    setUploadedFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setBulkRawText(text);
        addToast(`Berkas "${file.name}" berhasil dibaca!`, 'info');
      }
    };
    reader.onerror = () => {
      addToast('Gagal membaca berkas CSV. Pastikan format teks valid.', 'error');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Download Sample Template CSV
  const handleDownloadTemplate = () => {
    const templateHeaders = [
      'NISN',
      'Nama Lengkap',
      'Jenis Kelamin (L/P)',
      'Kelas',
      'Tempat Lahir',
      'Tanggal Lahir (YYYY-MM-DD)',
      'Nomor HP/WA',
      'Alamat Domisili'
    ];
    const templateRows = [
      ['0089213401', 'Adelia Fitri Ramadhani', 'P', 'VII.1', 'Sanglar', '2012-04-12', '0852-6711-2001', 'Dusun Sukaramai RT 01/RW 01, Sanglar, Reteh'],
      ['0089213402', 'Aditya Pratama', 'L', 'VII.1', 'Sanglar', '2012-02-18', '0852-6711-2002', 'Parit 3 Sanglar Luar, Reteh'],
      ['0089213403', 'Ahmad Danial', 'L', 'VII.1', 'Pulau Kijang', '2012-06-25', '0852-6711-2003', 'Jl. Penunjang Parit 2, Reteh'],
      ['0089213404', 'Aisyah Putri Az-Zahra', 'P', 'VII.1', 'Sanglar', '2012-08-14', '0852-6711-2004', 'Jl. Utama No. 12, Sanglar, Reteh'],
      ['0089213405', 'Alfi Syahrin', 'L', 'VII.1', 'Tembilahan', '2012-01-20', '0852-6711-2005', 'Parit Melati RT 02, Sanglar']
    ];
    exportToCSV('Template_Impor_Siswa_SMPN3_Reteh', [templateHeaders, ...templateRows]);
    addToast('Template CSV berhasil diunduh. Silakan isi dan unggah kembali.', 'success');
  };

  // Parse bulk text / CSV into student list
  const parsedBulkStudents = useMemo(() => {
    if (!bulkRawText.trim()) return [];

    const parsedRows = parseCSVString(bulkRawText);
    if (parsedRows.length === 0) return [];

    let startIndex = 0;
    let nameCol = -1;
    let nisnCol = -1;
    let genderCol = -1;
    let kelasCol = -1;
    let tempatCol = -1;
    let tglCol = -1;
    let telpCol = -1;
    let alamatCol = -1;

    // Check if row 0 is header
    const firstRow = parsedRows[0].map((c) => c.toLowerCase());
    const isHeader = firstRow.some((c) =>
      c.includes('nama') ||
      c.includes('name') ||
      c.includes('nisn') ||
      c.includes('siswa') ||
      c.includes('kelas') ||
      c.includes('gender')
    );

    if (isHeader) {
      startIndex = 1;
      firstRow.forEach((col, idx) => {
        if (col.includes('nama') || col.includes('name') || col.includes('siswa')) nameCol = idx;
        else if (col.includes('nisn') || col.includes('no_anggota') || col.includes('nomor')) nisnCol = idx;
        else if (col.includes('gender') || col.includes('kelamin') || col.includes('jk') || col.includes('l/p')) genderCol = idx;
        else if (col.includes('kelas') || col.includes('rombel')) kelasCol = idx;
        else if (col.includes('tempat')) tempatCol = idx;
        else if (col.includes('tanggal') || col.includes('tgl') || col.includes('lahir')) tglCol = idx;
        else if (col.includes('telepon') || col.includes('telp') || col.includes('hp') || col.includes('wa')) telpCol = idx;
        else if (col.includes('alamat') || col.includes('domisili')) alamatCol = idx;
      });
    }

    let items: Array<{
      nomorAnggota: string;
      nama: string;
      jenisAnggota: 'Siswa';
      kelasId: string;
      jenisKelamin: 'Laki-laki' | 'Perempuan';
      tempatLahir: string;
      tanggalLahir: string;
      telepon: string;
      alamat: string;
      tanggalBergabung: string;
      status: 'Aktif';
      fotoUrl: string;
    }> = [];

    for (let i = startIndex; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      if (row.length === 0 || (row.length === 1 && !row[0].trim())) continue;

      let rawName = '';
      let rawNisn = '';
      let rawGender: 'Laki-laki' | 'Perempuan' | null = null;
      let rawKelasId = bulkKelasId;
      let rawTempat = 'Sanglar, Reteh';
      let rawTgl = `${bulkYear}-05-${String(((i - startIndex) % 28) + 1).padStart(2, '0')}`;
      let rawTelp = `0852-6711-${String(2000 + i + 1).padStart(4, '0')}`;
      let rawAlamat = 'Sanglar, Kec. Reteh, Kab. Indragiri Hilir';

      if (isHeader && nameCol !== -1) {
        rawName = row[nameCol] || '';
        if (nisnCol !== -1 && row[nisnCol]) rawNisn = row[nisnCol];
        if (genderCol !== -1 && row[genderCol]) {
          const val = row[genderCol].toLowerCase();
          rawGender = val.startsWith('p') || val.includes('perempuan') ? 'Perempuan' : 'Laki-laki';
        }
        if (kelasCol !== -1 && row[kelasCol]) {
          const matchedK = kelas.find((k) =>
            k.namaKelas.toLowerCase() === row[kelasCol].toLowerCase() ||
            k.namaKelas.toLowerCase().replace(/[\s\.\-]/g, '') === row[kelasCol].toLowerCase().replace(/[\s\.\-]/g, '')
          );
          if (matchedK) rawKelasId = matchedK.id;
        }
        if (tempatCol !== -1 && row[tempatCol]) rawTempat = row[tempatCol];
        if (tglCol !== -1 && row[tglCol]) rawTgl = row[tglCol];
        if (telpCol !== -1 && row[telpCol]) rawTelp = row[telpCol];
        if (alamatCol !== -1 && row[alamatCol]) rawAlamat = row[alamatCol];
      } else {
        // Fallback: positional parsing
        if (row.length === 1) {
          rawName = row[0];
        } else {
          for (const cell of row) {
            const trimmed = cell.trim();
            if (/^\d{8,12}$/.test(trimmed)) {
              rawNisn = trimmed;
            } else if (/^(l|p|laki-laki|perempuan)$/i.test(trimmed)) {
              rawGender = /^p/i.test(trimmed) ? 'Perempuan' : 'Laki-laki';
            } else if (trimmed.length > 2 && !/^\d+$/.test(trimmed) && !rawName) {
              rawName = trimmed;
            }
          }
          if (!rawName && row[0]) rawName = row[0];
        }
      }

      // Clean name from leading numbering (e.g. "1. ", "01. ", "#1 ")
      rawName = rawName.replace(/^\s*\d+[\.\)\-\#\s]+/, '').trim();
      if (!rawName) continue;

      const finalGender = rawGender || guessGender(rawName);
      const finalNisn = rawNisn || `008921${String(3400 + i + 1).padStart(4, '0')}`;

      items.push({
        nomorAnggota: finalNisn,
        nama: rawName,
        jenisAnggota: 'Siswa',
        kelasId: rawKelasId,
        jenisKelamin: finalGender,
        tempatLahir: rawTempat,
        tanggalLahir: rawTgl,
        telepon: rawTelp,
        alamat: rawAlamat,
        tanggalBergabung: new Date().toISOString().slice(0, 10),
        status: 'Aktif',
        fotoUrl: '',
      });
    }

    if (bulkAutoSort) {
      items.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
      // re-index NISN after sorting if auto-generated
      items = items.map((it, idx) => ({
        ...it,
        nomorAnggota: it.nomorAnggota.startsWith('008921')
          ? `008921${String(3400 + idx + 1).padStart(4, '0')}`
          : it.nomorAnggota,
      }));
    }

    return items;
  }, [bulkRawText, bulkKelasId, bulkAutoSort, bulkYear, kelas]);

  // Filter & Sort
  const filteredAnggota = useMemo(() => {
    const result = anggota.filter((a) => {
      const matchSearch =
        a.nama.toLowerCase().includes(search.toLowerCase()) ||
        a.nomorAnggota.toLowerCase().includes(search.toLowerCase()) ||
        a.alamat.toLowerCase().includes(search.toLowerCase()) ||
        a.telepon.includes(search);

      const aKelas = getKelasById(a.kelasId);
      const matchKelas =
        filterKelas === 'all' ||
        a.kelasId === filterKelas ||
        (aKelas && aKelas.id === filterKelas);

      const matchJenis = filterJenis === 'all' || a.jenisAnggota === filterJenis;
      const matchStatus = filterStatus === 'all' || a.status === filterStatus;

      return matchSearch && matchKelas && matchJenis && matchStatus;
    });

    return result.sort((a, b) => {
      if (sortOrder === 'abjad-asc') {
        return a.nama.localeCompare(b.nama, 'id');
      }
      if (sortOrder === 'abjad-desc') {
        return b.nama.localeCompare(a.nama, 'id');
      }
      if (sortOrder === 'nomor-asc') {
        return a.nomorAnggota.localeCompare(b.nomorAnggota);
      }
      return (b.id || '').localeCompare(a.id || '');
    });
  }, [anggota, search, filterKelas, filterJenis, filterStatus, sortOrder, getKelasById]);

  // Statistics for selected class
  const classStats = useMemo(() => {
    const list =
      filterKelas === 'all'
        ? anggota
        : anggota.filter((a) => {
            const aK = getKelasById(a.kelasId);
            return a.kelasId === filterKelas || (aK && aK.id === filterKelas);
          });
    const total = list.length;
    const laki = list.filter((a) => a.jenisKelamin === 'Laki-laki').length;
    const perempuan = list.filter((a) => a.jenisKelamin === 'Perempuan').length;
    const currentKelasObj = getKelasById(filterKelas);
    return {
      total,
      laki,
      perempuan,
      nama: currentKelasObj ? `Kelas ${currentKelasObj.namaKelas}` : 'Semua Kelas',
      kelasObj: currentKelasObj,
    };
  }, [anggota, filterKelas, getKelasById]);

  // Multi-select helpers
  const isAllSelected =
    filteredAnggota.length > 0 &&
    filteredAnggota.every((item) => selectedIds.includes(item.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAnggota.map((item) => item.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleApplyBatchKelasChange = () => {
    if (!batchTargetKelasId) {
      addToast('Silakan pilih kelas tujuan terlebih dahulu.', 'error');
      return;
    }
    if (selectedIds.length === 0) {
      addToast('Tidak ada siswa yang dipilih.', 'error');
      return;
    }
    updateMultipleAnggotaKelas(selectedIds, batchTargetKelasId);
    // Switch filter directly to the target class so user immediately sees their moved students!
    setFilterKelas(batchTargetKelasId);
    setSortOrder('abjad-asc');
    setSelectedIds([]);
    setBatchTargetKelasId('');
  };

  const handleOpenMoveClass = (item: AnggotaItem) => {
    setMovingAnggota(item);
    const resolvedK = getKelasById(item.kelasId);
    setTargetMoveKelasId(resolvedK?.id || item.kelasId || kelas[0]?.id || '');
    setAutoFollowNewClass(true);
  };

  const handleConfirmSingleClassMove = () => {
    if (!movingAnggota || !targetMoveKelasId) return;
    const targetK = getKelasById(targetMoveKelasId);
    updateAnggota(movingAnggota.id, { kelasId: targetMoveKelasId });
    addToast(
      `Siswa "${movingAnggota.nama}" berhasil dipindahkan ke Kelas ${targetK?.namaKelas || targetMoveKelasId}!`,
      'success'
    );
    if (autoFollowNewClass) {
      setFilterKelas(targetMoveKelasId);
      setSortOrder('abjad-asc');
    }
    setMovingAnggota(null);
  };

  const handleOpenAdd = () => {
    setEditingAnggota(null);
    const count = anggota.length + 1;
    const currentSelectedK = filterKelas !== 'all' ? getKelasById(filterKelas) : null;
    const defaultKelas = currentSelectedK || kelas.find((k) => k.namaKelas === 'VII.1') || kelas[0];
    setFormData({
      nomorAnggota: `008921${String(3400 + count).padStart(4, '0')}`,
      nama: '',
      jenisAnggota: 'Siswa',
      kelasId: defaultKelas?.id || 'k-71',
      jenisKelamin: 'Laki-laki',
      tempatLahir: 'Sanglar, Reteh',
      tanggalLahir: '2012-05-10',
      telepon: '0852-6712-4411',
      alamat: 'Dusun Sukaramai RT 02/RW 01, Sanglar, Reteh',
      tanggalBergabung: new Date().toISOString().slice(0, 10),
      status: 'Aktif',
      fotoUrl: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AnggotaItem) => {
    setEditingAnggota(item);
    const resolvedK = getKelasById(item.kelasId);
    setFormData({
      nomorAnggota: item.nomorAnggota,
      nama: item.nama,
      jenisAnggota: item.jenisAnggota,
      kelasId: resolvedK?.id || item.kelasId || kelas[0]?.id || '',
      jenisKelamin: item.jenisKelamin,
      tempatLahir: item.tempatLahir || '',
      tanggalLahir: item.tanggalLahir || '',
      telepon: item.telepon,
      alamat: item.alamat,
      tanggalBergabung: item.tanggalBergabung,
      status: item.status,
      fotoUrl: item.fotoUrl || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.nomorAnggota.trim()) return;

    if (editingAnggota) {
      const isClassChanged = editingAnggota.kelasId !== formData.kelasId;
      updateAnggota(editingAnggota.id, formData);
      const targetK = getKelasById(formData.kelasId);
      if (isClassChanged) {
        addToast(
          `Siswa "${formData.nama}" berhasil dipindahkan ke Kelas ${targetK?.namaKelas || 'tujuan'}!`,
          'success'
        );
        // Automatically switch filter so the student stays visible!
        if (filterKelas !== 'all') {
          setFilterKelas(formData.kelasId);
          setSortOrder('abjad-asc');
        }
      }
    } else {
      addAnggota(formData);
      if (filterKelas !== 'all' && filterKelas !== formData.kelasId) {
        setFilterKelas(formData.kelasId);
      }
    }
    setIsModalOpen(false);
  };

  const handleSaveBulk = () => {
    if (parsedBulkStudents.length === 0) return;
    addMultipleAnggota(parsedBulkStudents);
    setIsImportModalOpen(false);
    setBulkRawText('');
    setUploadedFileName('');
    setUploadedFileSize('');
    setFilterKelas(bulkKelasId);
    setSortOrder('abjad-asc');
  };

  const handleLoadSampleVII1 = () => {
    const k71 = kelas.find((k) => k.namaKelas === 'VII.1' || k.id === 'k-71');
    if (k71) setBulkKelasId(k71.id);
    setBulkRawText(SAMPLE_VII_1_NAMES.join('\n'));
    setBulkAutoSort(true);
    setImportTab('paste');
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteAnggota(deleteId);
      setDeleteId(null);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'No',
      'NISN / No. Anggota',
      'Nama Siswa / Anggota',
      'Jenis Anggota',
      'Kelas',
      'Jenis Kelamin',
      'Tempat Lahir',
      'Tanggal Lahir',
      'Telepon/WA',
      'Alamat',
      'Tanggal Bergabung',
      'Status'
    ];
    const rows = filteredAnggota.map((a, idx) => {
      const cls = getKelasById(a.kelasId);
      return [
        idx + 1,
        a.nomorAnggota,
        a.nama,
        a.jenisAnggota,
        cls?.namaKelas || '-',
        a.jenisKelamin,
        a.tempatLahir || '-',
        a.tanggalLahir || '-',
        a.telepon,
        a.alamat,
        a.tanggalBergabung,
        a.status
      ];
    });
    const filename = `Data_Anggota_${classStats.nama.replace(/\s+/g, '_')}_Abjad_${new Date().toISOString().slice(0, 10)}`;
    exportToCSV(filename, [headers, ...rows]);
  };

  const vii1Kelas = kelas.find((k) => k.namaKelas === 'VII.1' || k.id === 'k-71');
  const countVII1 = vii1Kelas ? anggota.filter((a) => a.kelasId === vii1Kelas.id).length : 0;

  return (
    <div className="space-y-6">
      {/* Hidden file input for CSV upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv,text/csv,text/plain"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Data Anggota Perpustakaan
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data keanggotaan siswa, pendidik, dan tenaga kependidikan SMP Negeri 3 Reteh (Tersusun Berdasarkan Abjad).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Google Sheets Sync Hub Button */}
          <button
            onClick={() => setActiveTab('google-sheets')}
            className="px-3.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            title="Sinkronkan & Kelola dengan Google Sheets & Drive"
          >
            <Cloud className="w-4 h-4 text-teal-200" />
            <span>Google Sheets</span>
          </button>

          {/* Primary CSV Upload Button */}
          <button
            onClick={() => {
              const k71 = kelas.find((k) => k.namaKelas === 'VII.1' || k.id === 'k-71');
              if (k71) setBulkKelasId(k71.id);
              setImportTab('csv');
              setIsImportModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unggah Berkas CSV</span>
          </button>

          {/* Quick Paste Button */}
          <button
            onClick={() => {
              const k71 = kelas.find((k) => k.namaKelas === 'VII.1' || k.id === 'k-71');
              if (k71) setBulkKelasId(k71.id);
              setImportTab('paste');
              setIsImportModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Tempel Teks</span>
          </button>

          {/* Single Add Button */}
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Anggota Baru</span>
          </button>

          {/* Clear Members Button */}
          <button
            onClick={() => setIsConfirmClearOpen(true)}
            disabled={anggota.length === 0}
            className="px-3 py-2.5 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Kosongkan seluruh data anggota"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Kosongkan Data</span>
          </button>
        </div>
      </div>

      {/* Dynamic Class & Rombel Switcher Hub */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Pilih & Ganti Rombel Kelas
            </h3>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              (Klik nama rombel untuk langsung mengganti kelas yang ditampilkan)
            </span>
          </div>

          {filterKelas !== 'all' && (
            <button
              onClick={() => setFilterKelas('all')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Tampilkan Semua Kelas</span>
            </button>
          )}
        </div>

        {/* Scrollable Interactive Class Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setFilterKelas('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
              filterKelas === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <span>Semua Kelas</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                filterKelas === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {anggota.length}
            </span>
          </button>

          {kelas.map((k) => {
            const countInK = anggota.filter((a) => {
              const aK = getKelasById(a.kelasId);
              return a.kelasId === k.id || (aK && aK.id === k.id);
            }).length;
            const isSelected = filterKelas === k.id;

            return (
              <button
                key={k.id}
                onClick={() => {
                  if (isSelected) {
                    setFilterKelas('all');
                  } else {
                    setFilterKelas(k.id);
                    setSortOrder('abjad-asc');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm ring-2 ring-amber-300/50'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title={`Klik untuk menampilkan Kelas ${k.namaKelas} (Wali: ${k.waliKelas || '-'})`}
              >
                <span>Kelas {k.namaKelas}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-slate-950/15 text-slate-950 font-black' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {countInK}
                </span>
              </button>
            );
          })}
        </div>

        {/* Adaptive Dynamic Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-xl p-4 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border border-blue-800/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-black text-amber-400 border border-white/10 text-sm shrink-0">
              {classStats.kelasObj ? classStats.kelasObj.namaKelas : 'SEMUA'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-white">
                  {classStats.kelasObj ? `Rombel Kelas ${classStats.kelasObj.namaKelas}` : 'Semua Anggota & Rombel Siswa'}
                </span>
                <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  {classStats.total} Siswa Terdaftar (L: {classStats.laki}, P: {classStats.perempuan})
                </span>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  Urut Abjad A-Z
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-1">
                {classStats.kelasObj ? (
                  <>
                    Wali Kelas: <strong className="text-white">{classStats.kelasObj.waliKelas || '-'}</strong> &bull; Ruangan: {classStats.kelasObj.ruangan || '-'} &bull; {classStats.kelasObj.keterangan || `Tingkat ${classStats.kelasObj.tingkat}`}
                  </>
                ) : (
                  <>SMP Negeri 3 Reteh &bull; Terdaftar {kelas.length} Rombel Aktif & Tenaga Pendidik</>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Quick Ganti Kelas dropdown directly in banner */}
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/20">
              <span className="text-[11px] text-blue-200 font-semibold whitespace-nowrap">Ganti Kelas:</span>
              <select
                value={filterKelas}
                onChange={(e) => {
                  setFilterKelas(e.target.value);
                  setSortOrder('abjad-asc');
                }}
                className="bg-slate-900 text-amber-300 font-bold text-xs py-1 px-2.5 rounded-lg border border-amber-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                title="Pilih kelas yang ingin ditampilkan"
              >
                <option value="all" className="bg-slate-900 text-white">Semua Kelas ({anggota.length})</option>
                {kelas.map((k) => {
                  const cCount = anggota.filter((a) => a.kelasId === k.id || getKelasById(a.kelasId)?.id === k.id).length;
                  return (
                    <option key={k.id} value={k.id} className="bg-slate-900 text-white">
                      Kelas {k.namaKelas} ({cCount} Siswa)
                    </option>
                  );
                })}
              </select>
            </div>

            {filterKelas !== 'all' && (
              <button
                onClick={() => setFilterKelas('all')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20 cursor-pointer"
                title="Beralih menampilkan seluruh kelas"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Semua Kelas</span>
              </button>
            )}

            <button
              onClick={() => {
                setActiveTab('kartu-anggota');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-950" />
              <span>Cetak Kartu Siswa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama siswa, NISN, alamat, atau nomor HP..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Kelas */}
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Kelas</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  Kelas {k.namaKelas}
                </option>
              ))}
            </select>

            {/* Sort Order Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="abjad-asc">Urut Abjad: A &rarr; Z</option>
                <option value="abjad-desc">Urut Abjad: Z &rarr; A</option>
                <option value="nomor-asc">Urut NISN / Nomor</option>
                <option value="terbaru">Terbaru Masuk</option>
              </select>
            </div>

            {/* Filter Jenis */}
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Jenis</option>
              <option value="Siswa">Siswa</option>
              <option value="Guru">Guru</option>
              <option value="Staf">Staf</option>
            </select>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Grid Kartu"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Tabel Roster"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5"
              title="Unduh Data CSV / Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Stats summary bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5 px-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              {classStats.nama}:
            </span>
            <span className="text-blue-600 font-bold">{classStats.total} Anggota</span>
            <span>&bull;</span>
            <span className="text-slate-600">L: {classStats.laki}</span>
            <span>&bull;</span>
            <span className="text-slate-600">P: {classStats.perempuan}</span>
            <span>&bull;</span>
            <span className="bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
              Tersortir Abjad: {sortOrder === 'abjad-asc' ? 'A sampai Z' : sortOrder === 'abjad-desc' ? 'Z sampai A' : sortOrder}
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            Menampilkan {filteredAnggota.length} dari total {anggota.length} data
          </div>
        </div>
      </div>

      {/* Sticky Batch Class Switcher Toolbar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-2 z-20 bg-slate-900 text-white rounded-2xl p-3.5 shadow-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
              {selectedIds.length}
            </span>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{selectedIds.length} Siswa Terpilih</span>
                <span className="text-[10px] text-amber-300 font-normal">
                  (Pindahkan rombel sekaligus)
                </span>
              </p>
              <p className="text-[11px] text-slate-400">
                Pilih rombel tujuan di samping untuk memindahkan kelas seluruh siswa terpilih ini.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-700">
              <span className="text-xs text-slate-300 whitespace-nowrap">Pindahkan ke:</span>
              <select
                value={batchTargetKelasId}
                onChange={(e) => setBatchTargetKelasId(e.target.value)}
                className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-white">-- Pilih Kelas Tujuan --</option>
                {kelas.map((k) => (
                  <option key={k.id} value={k.id} className="bg-slate-900 text-white">
                    Kelas {k.namaKelas} ({k.keterangan || k.tingkat})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleApplyBatchKelasChange}
              disabled={!batchTargetKelasId}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Ganti Kelas ({selectedIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Roster Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                      title="Pilih semua siswa di tampilan ini"
                    />
                  </th>
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-3">NISN / No. Anggota</th>
                  <th className="py-3 px-4">Nama Lengkap Siswa</th>
                  <th className="py-3 px-3 text-center">L/P</th>
                  <th className="py-3 px-3">Kelas (Pilih/Ganti Langsung)</th>
                  <th className="py-3 px-3">Tempat, Tgl Lahir</th>
                  <th className="py-3 px-3">No. HP / WA</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredAnggota.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 px-4 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {anggota.length === 0 ? 'Data Anggota Saat Ini Kosong' : 'Tidak ada siswa yang cocok dengan filter'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {anggota.length === 0
                              ? 'Data telah dikosongkan agar Anda dapat menginput sendiri atau mengimpor data siswa baru.'
                              : 'Coba ubah kata kunci pencarian atau ganti filter kelas di atas.'}
                          </p>
                        </div>
                        {anggota.length === 0 && (
                          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                            <button
                              onClick={handleOpenAdd}
                              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Input Siswa Manual</span>
                            </button>
                            <button
                              onClick={() => setActiveTab('google-sheets')}
                              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Cloud className="w-4 h-4" />
                              <span>Buka Google Sheets & Sync</span>
                            </button>
                            <button
                              onClick={() => {
                                setIsImportModalOpen(true);
                                setImportTab('csv');
                              }}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                              <span>Upload File CSV</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAnggota.map((item, idx) => {
                    const kelasInfo = getKelasById(item.kelasId);
                    const isSelected = selectedIds.includes(item.id);

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-amber-50/60' : 'hover:bg-blue-50/40'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-800">
                          {item.nomorAnggota}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {item.nama}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.jenisKelamin === 'Perempuan'
                                ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {item.jenisKelamin === 'Perempuan' ? 'P' : 'L'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {/* Inline Direct Class Selector */}
                          <div className="relative inline-block">
                            <select
                              value={kelasInfo?.id || item.kelasId}
                              onChange={(e) => {
                                const newKId = e.target.value;
                                updateAnggota(item.id, { kelasId: newKId });
                                const newK = getKelasById(newKId);
                                addToast(
                                  `Kelas "${item.nama}" berhasil diubah ke Kelas ${newK?.namaKelas || newKId}!`,
                                  'success'
                                );
                                if (filterKelas !== 'all' && filterKelas !== newKId) {
                                  setFilterKelas(newKId);
                                  setSortOrder('abjad-asc');
                                }
                              }}
                              className="bg-slate-50 hover:bg-amber-50 focus:bg-white border border-slate-200 hover:border-amber-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                              title="Klik untuk langsung mengganti rombel kelas siswa ini"
                            >
                              {kelas.map((k) => (
                                <option key={k.id} value={k.id}>
                                  Kelas {k.namaKelas}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {item.tempatLahir ? `${item.tempatLahir}, ` : ''}{item.tanggalLahir || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          {item.telepon}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'Aktif'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenMoveClass(item)}
                              className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Ganti / Pindahkan Kelas Siswa"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Data Lengkap"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteId(item.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Members Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnggota.length === 0 ? (
            <div className="col-span-full bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  {anggota.length === 0 ? 'Data Anggota Saat Ini Kosong' : 'Tidak ada anggota yang cocok dengan filter'}
                </p>
                <p className="text-xs text-slate-500">
                  {anggota.length === 0
                    ? 'Data telah dikosongkan agar Anda dapat menginput sendiri atau mengimpor data siswa baru.'
                    : 'Coba ubah kata kunci pencarian atau ganti filter kelas di bagian atas.'}
                </p>
              </div>
              {anggota.length === 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    onClick={handleOpenAdd}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Input Siswa Manual</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('google-sheets')}
                    className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>Buka Google Sheets & Sync</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsImportModalOpen(true);
                      setImportTab('csv');
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Upload File CSV</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            filteredAnggota.map((item, idx) => {
              const kelasInfo = getKelasById(item.kelasId);
              const isAktif = item.status === 'Aktif';
              const isSelected = selectedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between relative group ${
                    isSelected ? 'border-amber-400 ring-2 ring-amber-300/50 bg-amber-50/20' : 'border-slate-200/80'
                  }`}
                >
                  {/* Select Checkbox top-left */}
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                      title="Pilih siswa ini"
                    />
                  </div>

                  {/* Alphabetical Order Rank Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" title="Urutan Abjad">
                      #{idx + 1}
                    </span>
                    <button
                      onClick={() => handleOpenMoveClass(item)}
                      className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                      title="Ganti / Pindahkan Kelas Siswa"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Edit Anggota"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Anggota"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-start gap-3 mb-3 pl-6 pr-16">
                      {/* Avatar */}
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white shadow-sm shrink-0 ${
                          item.jenisKelamin === 'Perempuan'
                            ? 'bg-gradient-to-tr from-pink-500 to-rose-600'
                            : 'bg-gradient-to-tr from-blue-600 to-indigo-700'
                        }`}
                      >
                        {item.nama.substring(0, 2).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 leading-tight truncate" title={item.nama}>
                          {item.nama}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="font-mono text-[10px] text-blue-700 font-bold">
                            {item.nomorAnggota}
                          </span>
                          <span className="text-slate-300">&bull;</span>

                          {/* Inline Direct Class Selector on Card */}
                          <select
                            value={kelasInfo?.id || item.kelasId}
                            onChange={(e) => {
                              const newKId = e.target.value;
                              updateAnggota(item.id, { kelasId: newKId });
                              const newK = getKelasById(newKId);
                              addToast(
                                `Kelas "${item.nama}" berhasil diubah ke Kelas ${newK?.namaKelas || newKId}!`,
                                'success'
                              );
                              if (filterKelas !== 'all' && filterKelas !== newKId) {
                                setFilterKelas(newKId);
                                setSortOrder('abjad-asc');
                              }
                            }}
                            className="text-[10px] font-bold py-0.5 px-1.5 bg-blue-50 hover:bg-amber-100 text-blue-900 border border-blue-200 hover:border-amber-300 rounded-md focus:outline-none cursor-pointer transition-colors"
                            title="Klik untuk langsung mengganti rombel kelas siswa ini"
                          >
                            {kelas.map((k) => (
                              <option key={k.id} value={k.id}>
                                Kelas {k.namaKelas}
                              </option>
                            ))}
                          </select>

                          <span className="text-slate-300">&bull;</span>
                          <span className={`text-[9px] font-bold px-1 rounded ${
                            item.jenisKelamin === 'Perempuan' ? 'text-pink-600 bg-pink-50' : 'text-blue-600 bg-blue-50'
                          }`}>
                            {item.jenisKelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Member Details */}
                    <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {item.tempatLahir ? `${item.tempatLahir}, ` : ''}{formatTanggalIndo(item.tanggalLahir)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-[11px]">{item.telepon}</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1 text-[11px]" title={item.alamat}>
                          {item.alamat}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer status & Actions */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isAktif
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isAktif ? (
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-slate-400" />
                      )}
                      <span>{item.status}</span>
                    </span>

                    <button
                      onClick={() => {
                        setActiveTab('kartu-anggota');
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Cetak Kartu</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Comprehensive CSV & Bulk Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setUploadedFileName('');
          setUploadedFileSize('');
        }}
        title="Impor Data Siswa & Anggota Perpustakaan"
      >
        <div className="space-y-4">
          {/* Tabs: Upload File vs Paste Text */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setImportTab('csv')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                importTab === 'csv'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unggah Berkas CSV (.csv)</span>
            </button>

            <button
              type="button"
              onClick={() => setImportTab('paste')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                importTab === 'paste'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Tempel Teks (Salin-Tempel)</span>
            </button>

            <div className="ml-auto">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-2.5 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold border border-emerald-300 transition-colors flex items-center gap-1.5"
                title="Unduh Contoh Berkas CSV yang Siap Diisi"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Format CSV</span>
              </button>
            </div>
          </div>

          {/* Configuration Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Kelas Tujuan Default
              </label>
              <select
                value={bulkKelasId}
                onChange={(e) => setBulkKelasId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {kelas.map((k) => (
                  <option key={k.id} value={k.id}>
                    Kelas {k.namaKelas} ({k.keterangan || k.tingkat})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-0.5">
                *Jika file CSV menyertakan kolom kelas, sistem akan memetakan otomatis.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun Lahir Default
              </label>
              <input
                type="number"
                value={bulkYear}
                onChange={(e) => setBulkYear(e.target.value)}
                placeholder="2012"
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Digunakan jika data tanggal lahir tidak diisi.
              </p>
            </div>

            <div className="flex flex-col justify-center gap-1.5 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={bulkAutoSort}
                  onChange={(e) => setBulkAutoSort(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>Urutkan Abjad (A - Z) Otomatis</span>
              </label>
              <p className="text-[10px] text-slate-500">
                Siswa langsung diurutkan dari nama A sampai Z.
              </p>
            </div>
          </div>

          {/* TAB 1: CSV File Upload Dropzone */}
          {importTab === 'csv' && (
            <div className="space-y-3">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/70 scale-[1.01]'
                    : uploadedFileName
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/20'
                }`}
              >
                <div className="flex flex-col items-center justify-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 transition-colors ${
                    uploadedFileName ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {uploadedFileName ? (
                      <FileCheck className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Upload className="w-6 h-6 text-slate-600" />
                    )}
                  </div>

                  {uploadedFileName ? (
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Berkas Terpilih: <span className="text-emerald-700">{uploadedFileName}</span> ({uploadedFileSize})
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Klik di sini atau seret berkas lain jika ingin mengganti.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Klik untuk memilih berkas CSV atau seret ke area ini
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Mendukung pemisah Koma (,), Titik-Koma (;), atau Tab (Excel). Format berkas .csv atau .txt.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tips for CSV headers */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Kolom yang Dikenali Otomatis: </span>
                  <span className="font-mono text-[10px] text-blue-800 bg-blue-50 px-1 py-0.5 rounded">
                    NISN, Nama Lengkap, Jenis Kelamin (L/P), Kelas, Tempat Lahir, Tanggal Lahir, Telepon, Alamat
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Direct Paste Textarea */}
          {importTab === 'paste' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Tempel Daftar Nama Siswa / Teks CSV
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSampleVII1}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors"
                  >
                    Muat Contoh 30 Siswa Kelas VII.1 (Urut Abjad)
                  </button>
                  {bulkRawText && (
                    <button
                      type="button"
                      onClick={() => {
                        setBulkRawText('');
                        setUploadedFileName('');
                        setUploadedFileSize('');
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-600"
                    >
                      Kosongkan
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={6}
                value={bulkRawText}
                onChange={(e) => setBulkRawText(e.target.value)}
                placeholder="Contoh format:&#10;Adelia Fitri Ramadhani&#10;Aditya Pratama&#10;Ahmad Danial&#10;... atau format CSV:&#10;NISN,Nama Siswa,JK,Kelas,Tempat Lahir,Tanggal Lahir,Telepon,Alamat&#10;0089213401,Adelia Fitri Ramadhani,P,VII.1,Sanglar,2012-04-12,0852-6711-2001,Sanglar"
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedBulkStudents.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Pratinjau Data Siswa:
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {parsedBulkStudents.length} Siswa Terbaca
                  </span>
                  {bulkAutoSort && (
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      Tersusun Abjad (A - Z)
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Siap disimpan ke perpustakaan
                </span>
              </div>

              <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl shadow-inner">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-[10px] text-slate-600 font-bold uppercase sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5 text-center w-10">No</th>
                      <th className="py-2 px-3">NISN / No. Anggota</th>
                      <th className="py-2 px-3">Nama Lengkap Siswa</th>
                      <th className="py-2 px-2 text-center">L/P</th>
                      <th className="py-2 px-3">Kelas</th>
                      <th className="py-2 px-3">TTL</th>
                      <th className="py-2 px-3">Alamat Domisili</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedBulkStudents.map((st, i) => {
                      const matchedK = getKelasById(st.kelasId);
                      return (
                        <tr key={i} className="hover:bg-blue-50/30">
                          <td className="py-1.5 px-2.5 text-center font-bold text-slate-400 font-mono">
                            {i + 1}
                          </td>
                          <td className="py-1.5 px-3 font-mono text-blue-800 font-semibold">
                            {st.nomorAnggota}
                          </td>
                          <td className="py-1.5 px-3 font-bold text-slate-900">
                            {st.nama}
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                st.jenisKelamin === 'Perempuan'
                                  ? 'bg-pink-100 text-pink-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {st.jenisKelamin === 'Perempuan' ? 'P' : 'L'}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 font-semibold text-slate-700">
                            {matchedK?.namaKelas || '-'}
                          </td>
                          <td className="py-1.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                            {st.tempatLahir ? `${st.tempatLahir}, ` : ''}{st.tanggalLahir}
                          </td>
                          <td className="py-1.5 px-3 text-[11px] text-slate-500 truncate max-w-[160px]">
                            {st.alamat}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsImportModalOpen(false);
                setUploadedFileName('');
                setUploadedFileSize('');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveBulk}
              disabled={parsedBulkStudents.length === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Simpan & Daftarkan {parsedBulkStudents.length} Siswa</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Single Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAnggota ? 'Edit Data Anggota' : 'Daftarkan Anggota Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NISN / Nomor Anggota *
              </label>
              <input
                type="text"
                required
                value={formData.nomorAnggota}
                onChange={(e) => setFormData({ ...formData, nomorAnggota: e.target.value })}
                placeholder="Contoh: 0089213401"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Anggota
              </label>
              <select
                value={formData.jenisAnggota}
                onChange={(e) =>
                  setFormData({ ...formData, jenisAnggota: e.target.value as any })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Siswa">Siswa</option>
                <option value="Guru">Pendidik / Guru</option>
                <option value="Staf">Tenaga Kependidikan / Staf</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap Siswa / Anggota *
            </label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Contoh: Muhammad Rizky Pratama"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kelas / Rombel
              </label>
              <select
                value={formData.kelasId}
                onChange={(e) => setFormData({ ...formData, kelasId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {kelas.map((k) => (
                  <option key={k.id} value={k.id}>
                    Kelas {k.namaKelas} ({k.keterangan || k.tingkat})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Kelamin
              </label>
              <select
                value={formData.jenisKelamin}
                onChange={(e) =>
                  setFormData({ ...formData, jenisKelamin: e.target.value as any })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tempat Lahir
              </label>
              <input
                type="text"
                value={formData.tempatLahir}
                onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                placeholder="Contoh: Sanglar, Reteh"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={formData.tanggalLahir}
                onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={formData.telepon}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                placeholder="Contoh: 0852-6712-4411"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Keanggotaan
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Domisili
            </label>
            <input
              type="text"
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              placeholder="Contoh: Parit 4 Sanglar Dalam, Reteh"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
              {editingAnggota ? 'Perbarui Anggota' : 'Daftarkan Anggota'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Pindahkan / Ganti Kelas Siswa */}
      <Modal
        isOpen={!!movingAnggota}
        onClose={() => setMovingAnggota(null)}
        title="Pindahkan Rombel / Ganti Kelas Siswa"
      >
        {movingAnggota && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 font-medium">Nama Siswa / Anggota:</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{movingAnggota.nama}</p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {movingAnggota.nomorAnggota}
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-slate-600">
                  Kelas Saat Ini: <strong className="text-slate-900 font-bold">Kelas {getKelasById(movingAnggota.kelasId)?.namaKelas || movingAnggota.kelasId}</strong>
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Pilih Kelas Tujuan Baru:
              </label>
              <select
                value={targetMoveKelasId}
                onChange={(e) => setTargetMoveKelasId(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
              >
                {kelas.map((k) => (
                  <option key={k.id} value={k.id}>
                    Kelas {k.namaKelas} ({k.keterangan || k.tingkat}) &bull; Wali: {k.waliKelas || '-'}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors">
              <input
                type="checkbox"
                checked={autoFollowNewClass}
                onChange={(e) => setAutoFollowNewClass(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="font-medium">Langsung beralih ke tampilan kelas baru setelah dipindahkan</span>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMovingAnggota(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleClassMove}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4 text-slate-950" />
                <span>Simpan & Pindahkan Kelas</span>
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
        title="Konfirmasi Hapus Anggota"
        message="Apakah Anda yakin ingin menghapus data anggota ini? Anggota yang masih memiliki peminjaman aktif tidak dapat dihapus."
      />

      {/* Kosongkan Semua Data Anggota Confirmation */}
      <ConfirmModal
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        onConfirm={() => {
          clearAllAnggota();
          setIsConfirmClearOpen(false);
        }}
        title="Kosongkan Seluruh Data Anggota"
        message={`Apakah Anda yakin ingin mengosongkan semua data siswa dan anggota (${anggota.length} orang)? Setelah dikosongkan, Anda dapat menginput data siswa dari awal secara manual, mengimpor dari Google Sheets, atau mengunggah berkas CSV.`}
        confirmText="Ya, Kosongkan Sekarang"
        cancelText="Batal"
        isDanger={true}
      />
    </div>
  );
};
