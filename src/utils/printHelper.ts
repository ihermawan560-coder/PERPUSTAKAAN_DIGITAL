import { PengaturanSekolah } from '../types';

export interface PrintDocumentData {
  title: string;
  subtitle?: string;
  filename: string;
  bodyHtml: string;
  pengaturan: PengaturanSekolah;
  extraStyles?: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Returns complete standalone HTML document for printing
 */
export function buildPrintableHtml(data: PrintDocumentData): string {
  const {
    title,
    subtitle,
    bodyHtml,
    pengaturan,
    extraStyles = '',
    orientation = 'portrait',
  } = data;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${pengaturan.namaSekolah}</title>
  <style>
    @page {
      size: A4 ${orientation};
      margin: 12mm 15mm 15mm 15mm;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 20px;
      font-size: 11pt;
      line-height: 1.4;
    }

    /* Print toolbar (hidden during printing) */
    .print-toolbar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #1e293b;
      color: #ffffff;
      padding: 12px 20px;
      margin: -20px -20px 24px -20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .print-toolbar .title {
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .print-toolbar .actions {
      display: flex;
      gap: 8px;
    }

    .btn-print {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-print:hover {
      background: #1d4ed8;
    }

    .btn-close {
      background: #475569;
      color: white;
      border: none;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
    }

    .doc-page {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      padding: 30px 40px;
      border-radius: 4px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    }

    /* Kop Surat Resmi */
    .kop-container {
      text-align: center;
      margin-bottom: 16px;
      border-bottom: 3px double #000;
      padding-bottom: 8px;
    }

    .kop-header-gov {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 0;
      letter-spacing: 0.5px;
    }

    .kop-header-dept {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 2px 0 0;
      letter-spacing: 0.5px;
    }

    .kop-school-name {
      font-size: 17pt;
      font-weight: 900;
      text-transform: uppercase;
      margin: 4px 0 2px;
      letter-spacing: 1px;
    }

    .kop-school-address {
      font-size: 9.5pt;
      margin: 2px 0;
      color: #1e293b;
    }

    .kop-school-meta {
      font-size: 9pt;
      margin: 0;
      color: #334155;
    }

    /* Document Title */
    .document-title {
      text-align: center;
      margin: 18px 0 14px;
    }

    .document-title h2 {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 0;
      text-decoration: underline;
      letter-spacing: 0.5px;
    }

    .document-title p {
      font-size: 10pt;
      margin: 4px 0 0;
      font-style: italic;
    }

    /* Standard tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 9.5pt;
    }

    table.data-table th, table.data-table td {
      border: 1px solid #334155;
      padding: 6px 8px;
      vertical-align: top;
    }

    table.data-table th {
      background-color: #f1f5f9;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      font-size: 9pt;
    }

    /* Signatures */
    .signature-grid {
      display: flex;
      justify-content: space-between;
      margin-top: 35px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .sig-col {
      width: 42%;
      text-align: center;
      font-size: 10pt;
    }

    .sig-space {
      height: 65px;
    }

    .sig-name {
      font-weight: bold;
      text-decoration: underline;
      margin: 0;
    }

    .sig-nip {
      margin: 2px 0 0;
      font-size: 9.5pt;
    }

    /* ID Card Specific styling */
    .card-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 25px;
      justify-content: center;
      margin: 20px 0;
    }

    .member-card {
      width: 380px;
      height: 240px;
      border: 1px solid #94a3b8;
      border-radius: 12px;
      background: white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      overflow: hidden;
      position: relative;
      font-family: system-ui, -apple-system, sans-serif;
    }

    @media print {
      body {
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
        font-size: 10pt !important;
      }

      .print-toolbar {
        display: none !important;
      }

      .doc-page {
        max-width: 100% !important;
        width: 100% !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }

      table.data-table th {
        background-color: #e2e8f0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

    ${extraStyles}
  </style>
</head>
<body>
  <div class="print-toolbar">
    <div class="title">
      <span>🖨️ Pratinjau Dokumen Cetak: <strong>${title}</strong></span>
    </div>
    <div class="actions">
      <button class="btn-print" onclick="window.print()">
        Cetak Sekarang / Simpan PDF
      </button>
      <button class="btn-close" onclick="window.close()">
        Tutup
      </button>
    </div>
  </div>

  <div class="doc-page">
    <!-- Kop Surat Sekolah -->
    <div class="kop-container" style="display: flex; align-items: center; justify-content: center; gap: 16px; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 16px;">
      ${pengaturan.logoKopUrl ? `<img src="${pengaturan.logoKopUrl}" alt="Logo Kop" style="width: 75px; height: 75px; max-width: 80px; object-fit: contain; flex-shrink: 0;" />` : ''}
      <div style="text-align: center; flex: 1;">
        <div class="kop-header-gov">Pemerintah Kabupaten ${pengaturan.kabupaten}</div>
        <div class="kop-header-dept">Dinas Pendidikan dan Kebudayaan</div>
        <div class="kop-school-name">${pengaturan.namaSekolah}</div>
        <div class="kop-school-address">${pengaturan.alamat}, ${pengaturan.desaKelurahan}, Kec. ${pengaturan.kecamatan}, ${pengaturan.kabupaten}, ${pengaturan.provinsi} | Kode Pos: ${pengaturan.kodePos}</div>
        <div class="kop-school-meta">NPSN: ${pengaturan.npsn} | Telp: ${pengaturan.telepon} | Email: ${pengaturan.email}</div>
      </div>
      ${pengaturan.posisiLogoKop === 'kiri-kanan' && pengaturan.logoKopUrl ? `<img src="${pengaturan.logoKopUrl}" alt="Logo Kanan" style="width: 75px; height: 75px; max-width: 80px; object-fit: contain; flex-shrink: 0;" />` : (pengaturan.logoKopUrl ? `<div style="width: 75px; flex-shrink: 0;"></div>` : '')}
    </div>

    <!-- Judul Dokumen -->
    <div class="document-title">
      <h2>${title}</h2>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
    </div>

    <!-- Konten Dokumen -->
    ${bodyHtml}

    <!-- Tanda Tangan Resmi Pengesahan -->
    <div class="signature-grid">
      <div class="sig-col">
        <p>Mengetahui,</p>
        <p style="font-weight: 600;">Kepala ${pengaturan.namaSekolah}</p>
        <div class="sig-space"></div>
        <p class="sig-name">${pengaturan.namaKepalaSekolah}</p>
        <p class="sig-nip">NIP. ${pengaturan.nipKepalaSekolah}</p>
      </div>

      <div class="sig-col">
        <p>Sanglar, ${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</p>
        <p style="font-weight: 600;">Kepala Perpustakaan</p>
        <div class="sig-space"></div>
        <p class="sig-name">${pengaturan.namaKepalaPerpustakaan}</p>
        <p class="sig-nip">NIP. ${pengaturan.nipKepalaPerpustakaan}</p>
      </div>
    </div>
  </div>

  <script>
    // Auto-trigger print when loaded
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.print();
        } catch(e) {
          console.warn('Auto print not supported:', e);
        }
      }, 500);
    });
  </script>
</body>
</html>`;
}

/**
 * Downloads a standalone HTML document that opens ready for printing or saving to PDF
 */
export function downloadPrintableDocument(data: PrintDocumentData): void {
  const fullHtml = buildPrintableHtml(data);
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = data.filename.endsWith('.html') ? data.filename : `${data.filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Direct print attempt using isolated iframe with fallback
 */
export function executePrint(
  data: PrintDocumentData,
  onNotify?: (message: string, type: 'info' | 'success' | 'error') => void
): boolean {
  try {
    const existingFrame = document.getElementById('print-execution-frame');
    if (existingFrame) {
      existingFrame.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'print-execution-frame';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '10px';
    iframe.style.height = '10px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(buildPrintableHtml(data));
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          if (onNotify) {
            onNotify('Membuka dialog cetak...', 'success');
          }
        } catch (iframeErr) {
          console.warn('Iframe print restricted:', iframeErr);
          // Try standard window.print
          try {
            window.print();
            if (onNotify) {
              onNotify('Membuka dialog cetak...', 'info');
            }
          } catch (winErr) {
            console.error('window.print also blocked:', winErr);
            // Auto fallback: download printable document
            downloadPrintableDocument(data);
            if (onNotify) {
              onNotify(
                'Dialog cetak terblokir oleh browser. File dokumen cetak telah otomatis diunduh!',
                'info'
              );
            }
          }
        }
      }, 400);

      return true;
    }
  } catch (err) {
    console.warn('Execution error during print:', err);
  }

  // Fallback
  try {
    window.print();
    return true;
  } catch {
    downloadPrintableDocument(data);
    if (onNotify) {
      onNotify('File dokumen cetak telah diunduh!', 'info');
    }
    return false;
  }
}
