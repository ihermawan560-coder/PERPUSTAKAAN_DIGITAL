export type Role = 'admin';

export interface UserSession {
  username: string;
  name: string;
  role: Role;
  loginTime: string;
  expiresAt: number; // Expiration timestamp in ms
  sessionToken: string; // Anti-tampering token
}

export interface KelasItem {
  id: string;
  namaKelas: string; // e.g. "VII-A"
  tingkat: '7' | '8' | '9' | 'Guru/Staf';
  waliKelas: string;
  ruangan?: string;
  keterangan?: string;
}

export const DAFTAR_MAPEL = [
  'Matematika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Pendidikan Pancasila',
  'Pendidikan Agama Islam',
  'IPA',
  'IPS',
  'PJOK',
  'Prakarya dan Seni',
  'Informatika',
  'BMR',
] as const;

export type MataPelajaran = typeof DAFTAR_MAPEL[number];

export interface BukuItem {
  id: string;
  nomorBuku: string; // e.g. "510/MAT/VII/01"
  isbn: string;
  judul: string;
  pengarang: string;
  penerbit: string;
  tahunTerbit: number;
  kategori: string; // "Pelajaran", "Fiksi", "Sains", "Sejarah", "Agama", "Referensi", "Kamus", "Muatan Lokal"
  mataPelajaran?: MataPelajaran; // Specific subject if category is Pelajaran/Muatan Lokal
  tingkatKelas?: '7' | '8' | '9' | 'Semua';
  kurikulum?: 'Kurikulum Merdeka' | 'Kurikulum 2013' | 'Muatan Lokal Riau';
  semester?: 'Semester 1' | 'Semester 2' | '1 Tahun Penuh';
  jumlahTotal: number;
  jumlahTersedia: number;
  lokasiRak: string; // "Rak A-01"
  sinopsis?: string;
  coverWarna?: string;
}

export interface AnggotaItem {
  id: string;
  nomorAnggota: string; // NISN or NIP e.g. "2024001"
  nama: string;
  jenisAnggota: 'Siswa' | 'Guru' | 'Staf';
  kelasId: string; // Ref to KelasItem
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  tempatLahir?: string;
  tanggalLahir?: string;
  telepon: string;
  alamat: string;
  tanggalBergabung: string;
  status: 'Aktif' | 'Nonaktif';
  fotoUrl?: string;
}

export type StatusPeminjaman = 'Dipinjam' | 'Dikembalikan' | 'Terlambat';

export interface TransaksiItem {
  id: string;
  kodeTransaksi: string; // e.g. "TRX-202610-001"
  anggotaId: string;
  bukuId: string;
  tanggalPinjam: string; // YYYY-MM-DD
  tanggalJatuhTempo: string; // YYYY-MM-DD
  tanggalKembali?: string; // YYYY-MM-DD
  status: StatusPeminjaman;
  denda: number; // in Rupiah
  statusDenda?: 'Lunas' | 'Belum Lunas' | 'Tanpa Denda';
  kondisiBukuSaatKembali?: 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Hilang';
  catatan?: string;
  petugas: string;
}

export interface PengaturanSekolah {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  desaKelurahan: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  telepon: string;
  email: string;
  website: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  namaKepalaPerpustakaan: string;
  nipKepalaPerpustakaan: string;
  
  // Logo & Kop Surat
  logoKopUrl?: string; // Base64 data URL or external URL for school letterhead logo
  posisiLogoKop?: 'kiri' | 'tengah' | 'kiri-kanan'; // Layout of logo on letterhead
  
  // Kebijakan Peminjaman
  maksimalHariPinjam: number; // default 7 hari
  dendaPerHari: number; // default 1000
  maksimalBukuPinjam: number; // default 3 buku

  // Administrator Security
  adminPassword?: string; // Optional custom administrator password (defaults to 'admin')
}

export type ActiveTab = 
  | 'dashboard'
  | 'kelas'
  | 'buku'
  | 'stok-pelajaran'
  | 'anggota'
  | 'transaksi'
  | 'kartu-anggota'
  | 'riwayat'
  | 'laporan'
  | 'pengaturan'
  | 'google-sheets';

