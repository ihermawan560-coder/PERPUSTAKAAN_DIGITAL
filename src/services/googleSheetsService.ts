import { getAccessToken } from './googleAuth';
import { AnggotaItem, BukuItem, KelasItem, TransaksiItem } from '../types';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface SheetMetadata {
  sheetId: number;
  title: string;
  index: number;
}

export interface SpreadsheetDetails {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheets: SheetMetadata[];
}

/**
 * Helper to execute an authenticated request with the cached Google access token
 */
async function authorizedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Belum terhubung ke Akun Google. Silakan klik "Sign in with Google" terlebih dahulu.');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    throw new Error('Sesi autentikasi Google telah berakhir. Silakan masuk kembali dengan Google.');
  }
  return res;
}

/**
 * List Google Spreadsheets from Google Drive
 */
export async function listDriveSpreadsheets(): Promise<DriveSpreadsheetFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=30&fields=files(id,name,modifiedTime,webViewLink)`;

  const res = await authorizedFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal mengambil daftar spreadsheet (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Get spreadsheet details including all sheets/tabs
 */
export async function getSpreadsheetDetails(spreadsheetId: string): Promise<SpreadsheetDetails> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,spreadsheetUrl,sheets.properties`;
  const res = await authorizedFetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal membuka spreadsheet (${res.status})`);
  }

  const data = await res.json();
  const sheets: SheetMetadata[] = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
    index: s.properties.index,
  }));

  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Spreadsheet Tanpa Judul',
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    sheets,
  };
}

/**
 * Read values from a spreadsheet range
 */
export async function readSheetValues(spreadsheetId: string, range: string): Promise<string[][]> {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`;
  const res = await authorizedFetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal membaca isi lembar spreadsheet (${res.status})`);
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Update values in a spreadsheet range
 */
export async function updateSheetValues(
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<void> {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`;

  const res = await authorizedFetch(url, {
    method: 'PUT',
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal memperbarui spreadsheet (${res.status})`);
  }
}

/**
 * Create a brand-new pre-formatted Google Spreadsheet in Google Drive
 */
export async function createSchoolLibrarySpreadsheet(title: string): Promise<SpreadsheetDetails> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';

  const body = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Data Siswa & Anggota',
          gridProperties: { rowCount: 150, columnCount: 12, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Katalog Buku',
          gridProperties: { rowCount: 200, columnCount: 14, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Sirkulasi Transaksi',
          gridProperties: { rowCount: 150, columnCount: 12, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Daftar Kelas',
          gridProperties: { rowCount: 30, columnCount: 6, frozenRowCount: 1 },
        },
      },
    ],
  };

  const res = await authorizedFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal membuat spreadsheet baru di Google Drive (${res.status})`);
  }

  const data = await res.json();
  const sheets: SheetMetadata[] = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
    index: s.properties.index,
  }));

  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || title,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`,
    sheets,
  };
}

/**
 * Export data to Google Sheets with styled headers
 */
export async function exportAllDataToSpreadsheet(
  spreadsheetId: string,
  data: {
    anggota: AnggotaItem[];
    kelas: KelasItem[];
    buku: BukuItem[];
    transaksi: TransaksiItem[];
    schoolName: string;
  }
): Promise<void> {
  // 1. Data Siswa & Anggota sheet
  const anggotaRows: any[][] = [
    [
      'No',
      'NISN / No. Anggota',
      'Nama Lengkap',
      'Kelas',
      'Jenis Anggota',
      'L/P',
      'Tempat Lahir',
      'Tanggal Lahir',
      'No. Telepon / WA',
      'Alamat',
      'Tgl Bergabung',
      'Status',
    ],
  ];

  data.anggota.forEach((item, idx) => {
    const k = data.kelas.find((kl) => kl.id === item.kelasId);
    anggotaRows.push([
      idx + 1,
      item.nomorAnggota || '',
      item.nama,
      k ? k.namaKelas : item.kelasId,
      item.jenisAnggota || 'Siswa',
      item.jenisKelamin || 'Laki-laki',
      item.tempatLahir || '',
      item.tanggalLahir || '',
      item.telepon || '',
      item.alamat || '',
      item.tanggalBergabung || '',
      item.status || 'Aktif',
    ]);
  });

  // 2. Data Buku sheet
  const bukuRows: any[][] = [
    [
      'No',
      'Nomor Buku',
      'ISBN',
      'Judul Buku',
      'Pengarang',
      'Penerbit',
      'Tahun Terbit',
      'Kategori',
      'Mata Pelajaran',
      'Tingkat Kelas',
      'Total Eksemplar',
      'Tersedia',
      'Lokasi Rak',
      'Sinopsis',
    ],
  ];

  data.buku.forEach((b, idx) => {
    bukuRows.push([
      idx + 1,
      b.nomorBuku || '',
      b.isbn || '',
      b.judul,
      b.pengarang,
      b.penerbit,
      b.tahunTerbit || '',
      b.kategori,
      b.mataPelajaran || '',
      b.tingkatKelas || '',
      b.jumlahTotal,
      b.jumlahTersedia,
      b.lokasiRak || '',
      b.sinopsis || '',
    ]);
  });

  // 3. Transaksi sheet
  const transaksiRows: any[][] = [
    [
      'No',
      'Kode Transaksi',
      'Nama Peminjam',
      'NISN / No Anggota',
      'Judul Buku',
      'No Buku',
      'Tgl Pinjam',
      'Jatuh Tempo',
      'Tgl Kembali',
      'Status',
      'Denda (Rp)',
      'Petugas',
    ],
  ];

  data.transaksi.forEach((t, idx) => {
    const a = data.anggota.find((ang) => ang.id === t.anggotaId);
    const b = data.buku.find((bk) => bk.id === t.bukuId);
    transaksiRows.push([
      idx + 1,
      t.kodeTransaksi,
      a ? a.nama : 'Anggota Tidak Ditemukan',
      a ? a.nomorAnggota : '',
      b ? b.judul : 'Buku Tidak Ditemukan',
      b ? b.nomorBuku : '',
      t.tanggalPinjam,
      t.tanggalJatuhTempo,
      t.tanggalKembali || '-',
      t.status,
      t.denda || 0,
      t.petugas || 'Admin',
    ]);
  });

  // 4. Kelas sheet
  const kelasRows: any[][] = [
    ['No', 'ID Kelas', 'Nama Kelas', 'Tingkat', 'Wali Kelas', 'Ruangan', 'Keterangan'],
  ];

  data.kelas.forEach((kl, idx) => {
    kelasRows.push([
      idx + 1,
      kl.id,
      kl.namaKelas,
      kl.tingkat,
      kl.waliKelas || '',
      kl.ruangan || '',
      kl.keterangan || '',
    ]);
  });

  // Batch write values
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const body = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: "'Data Siswa & Anggota'!A1:L",
        values: anggotaRows,
      },
      {
        range: "'Katalog Buku'!A1:N",
        values: bukuRows,
      },
      {
        range: "'Sirkulasi Transaksi'!A1:L",
        values: transaksiRows,
      },
      {
        range: "'Daftar Kelas'!A1:G",
        values: kelasRows,
      },
    ],
  };

  const res = await authorizedFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal menyimpan data ke lembar spreadsheet (${res.status})`);
  }
}

/**
 * Create a simple blank template for student enrollment
 */
export async function createStudentTemplateSpreadsheet(title: string, allowedKelas: string[]): Promise<SpreadsheetDetails> {
  const details = await createSchoolLibrarySpreadsheet(title);

  // Template student rows for guidance
  const templateRows: any[][] = [
    [
      'NISN / No Anggota',
      'Nama Siswa',
      'Kelas (Contoh: VII.1, VII.2, VIII.1, VIII.2, IX.1, IX.2)',
      'Jenis Kelamin (Laki-laki / Perempuan)',
      'Tempat Lahir',
      'Tanggal Lahir (YYYY-MM-DD)',
      'No. Telepon / WA Orang Tua',
      'Alamat Lengkap',
    ],
    [
      '0089213401',
      'Contoh Nama Siswa 1',
      allowedKelas[0] || 'VII.1',
      'Laki-laki',
      'Sanglar, Reteh',
      '2012-05-14',
      '0852-1234-5678',
      'Parit 1 RT 02 Sanglar, Reteh',
    ],
    [
      '0089213402',
      'Contoh Nama Siswa 2',
      allowedKelas[1] || 'VII.2',
      'Perempuan',
      'Sanglar, Reteh',
      '2012-08-20',
      '0813-9876-5432',
      'Dusun Sukaramai RT 03, Sanglar',
    ],
  ];

  await updateSheetValues(details.spreadsheetId, "'Data Siswa & Anggota'!A1:H3", templateRows);
  return details;
}

/**
 * Parse raw 2D array from Google Sheets into structured AnggotaItem array
 */
export function parseStudentsFromSheetValues(
  rawRows: string[][],
  kelasLookup: KelasItem[]
): {
  parsed: Omit<AnggotaItem, 'id'>[];
  errors: string[];
} {
  if (!rawRows || rawRows.length < 2) {
    return { parsed: [], errors: ['Sheet kosong atau tidak memiliki baris data setelah header.'] };
  }

  const headers = rawRows[0].map((h) => (h || '').toString().trim().toLowerCase());
  const rows = rawRows.slice(1);

  // Identify column indices
  let colNisn = headers.findIndex((h) => h.includes('nisn') || h.includes('nomor') || h.includes('no. anggota') || h.includes('nis'));
  let colNama = headers.findIndex((h) => h.includes('nama'));
  let colKelas = headers.findIndex((h) => h.includes('kelas') || h.includes('rombel'));
  let colJk = headers.findIndex((h) => h.includes('kelamin') || h.includes('jk') || h === 'l/p');
  let colTempat = headers.findIndex((h) => h.includes('tempat'));
  let colTglLahir = headers.findIndex((h) => h.includes('tanggal lahir') || h.includes('tgl lahir'));
  let colTelepon = headers.findIndex((h) => h.includes('telepon') || h.includes('hp') || h.includes('wa') || h.includes('kontak'));
  let colAlamat = headers.findIndex((h) => h.includes('alamat'));

  // Fallbacks if headers were position-based
  if (colNama === -1 && rows[0].length >= 2) colNama = 1;
  if (colNisn === -1 && rows[0].length >= 1) colNisn = 0;
  if (colKelas === -1 && rows[0].length >= 3) colKelas = 2;

  const parsed: Omit<AnggotaItem, 'id'>[] = [];
  const errors: string[] = [];

  rows.forEach((row, rowIdx) => {
    const rawNama = (row[colNama] || '').toString().trim();
    if (!rawNama) return; // skip empty rows

    const rawNisn = colNisn !== -1 ? (row[colNisn] || '').toString().trim() : '';
    const rawKelas = colKelas !== -1 ? (row[colKelas] || '').toString().trim() : '';
    const rawJk = colJk !== -1 ? (row[colJk] || '').toString().trim().toLowerCase() : '';
    const rawTempat = colTempat !== -1 ? (row[colTempat] || '').toString().trim() : '';
    const rawTglLahir = colTglLahir !== -1 ? (row[colTglLahir] || '').toString().trim() : '';
    const rawTelp = colTelepon !== -1 ? (row[colTelepon] || '').toString().trim() : '';
    const rawAlamat = colAlamat !== -1 ? (row[colAlamat] || '').toString().trim() : '';

    // Match class
    let matchedKelasId = 'k-71';
    if (rawKelas) {
      const cleanKelas = rawKelas.toUpperCase().replace(/\s+/g, '');
      const found = kelasLookup.find(
        (k) =>
          k.namaKelas.toUpperCase().replace(/\s+/g, '') === cleanKelas ||
          k.id.toUpperCase() === cleanKelas
      );
      if (found) {
        matchedKelasId = found.id;
      } else {
        // approximate match
        if (cleanKelas.includes('VII.1') || cleanKelas.includes('7.1') || cleanKelas.includes('VII1')) matchedKelasId = 'k-71';
        else if (cleanKelas.includes('VII.2') || cleanKelas.includes('7.2') || cleanKelas.includes('VII2')) matchedKelasId = 'k-72';
        else if (cleanKelas.includes('VIII.1') || cleanKelas.includes('8.1') || cleanKelas.includes('VIII1')) matchedKelasId = 'k-81';
        else if (cleanKelas.includes('VIII.2') || cleanKelas.includes('8.2') || cleanKelas.includes('VIII2')) matchedKelasId = 'k-82';
        else if (cleanKelas.includes('IX.1') || cleanKelas.includes('9.1') || cleanKelas.includes('IX1')) matchedKelasId = 'k-91';
        else if (cleanKelas.includes('IX.2') || cleanKelas.includes('9.2') || cleanKelas.includes('IX2')) matchedKelasId = 'k-92';
        else if (cleanKelas.includes('GURU') || cleanKelas.includes('STAF')) matchedKelasId = 'k-guru';
      }
    }

    // Match Gender
    let jenisKelamin: 'Laki-laki' | 'Perempuan' = 'Laki-laki';
    if (rawJk.startsWith('p') || rawJk.includes('perempuan') || rawJk === 'wanita' || rawJk === 'f') {
      jenisKelamin = 'Perempuan';
    }

    parsed.push({
      nomorAnggota: rawNisn || `008${Date.now().toString().slice(-7)}${rowIdx}`,
      nama: rawNama,
      jenisAnggota: matchedKelasId === 'k-guru' ? 'Guru' : 'Siswa',
      kelasId: matchedKelasId,
      jenisKelamin,
      tempatLahir: rawTempat || 'Sanglar',
      tanggalLahir: rawTglLahir || '2012-01-01',
      telepon: rawTelp || '-',
      alamat: rawAlamat || 'Kecamatan Reteh, Inhil',
      tanggalBergabung: new Date().toISOString().split('T')[0],
      status: 'Aktif',
      fotoUrl: '',
    });
  });

  return { parsed, errors };
}
