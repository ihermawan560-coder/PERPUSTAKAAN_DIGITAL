/**
 * Preset official school and education logos as clean SVG Data URLs
 */

// Preset 1: Tut Wuri Handayani (Kemendikbud)
export const LOGO_TUT_WURI = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="%230284c7" stroke="%23f59e0b" stroke-width="3"/>
  <circle cx="50" cy="50" r="42" fill="none" stroke="%23ffffff" stroke-width="1.5" stroke-dasharray="3,2"/>
  <!-- Sayap dan Obor -->
  <path d="M50 20 L55 35 L45 35 Z" fill="%23f59e0b"/>
  <circle cx="50" cy="18" r="4" fill="%23ef4444"/>
  <path d="M50 35 L50 65 M40 45 Q50 55 60 45 M35 52 Q50 68 65 52 M30 60 Q50 80 70 60" fill="none" stroke="%23ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Buku Terbuka Bawah -->
  <path d="M50 72 L32 64 Q50 76 50 82 Q50 76 68 64 Z" fill="%23fef08a" stroke="%23b45309" stroke-width="1.2"/>
  <text x="50" y="94" font-family="Arial, sans-serif" font-size="7" font-weight="900" fill="%23ffffff" text-anchor="middle" letter-spacing="1">TUT WURI</text>
</svg>`;

// Preset 2: Lambang Perpustakaan & Obor Literasi
export const LOGO_LITERASI = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M50 6 L88 22 L88 60 Q50 96 50 96 Q50 96 12 60 L12 22 Z" fill="%231e3a8a" stroke="%23fbbf24" stroke-width="3"/>
  <!-- Api Obor -->
  <path d="M50 20 Q56 26 52 34 Q60 30 50 44 Q42 34 46 26 Z" fill="%23f59e0b"/>
  <path d="M50 24 Q53 28 50 34 Q47 28 50 24 Z" fill="%23ef4444"/>
  <!-- Buku Terbuka -->
  <path d="M50 52 L26 40 L26 66 L50 78 L74 66 L74 40 Z" fill="%23ffffff" stroke="%230f172a" stroke-width="1.5"/>
  <path d="M50 52 L50 78" stroke="%230f172a" stroke-width="2"/>
  <path d="M30 47 L46 56 M30 54 L46 63 M70 47 L54 56 M70 54 L54 63" stroke="%2394a3b8" stroke-width="1.5"/>
  <!-- Bintang -->
  <polygon points="50,8 52,14 58,14 53,18 55,24 50,20 45,24 47,18 42,14 48,14" fill="%23fbbf24"/>
</svg>`;

// Preset 3: Lambang SMP Negeri 3 Reteh (Sanglar - Inhil)
export const LOGO_SMPN3_RETEH = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%231e3a8a"/>
      <stop offset="100%" stop-color="%23047857"/>
    </linearGradient>
  </defs>
  <!-- Perisai Segi Lima -->
  <polygon points="50,4 94,30 78,92 22,92 6,30" fill="url(%23grad)" stroke="%23f59e0b" stroke-width="3"/>
  <polygon points="50,9 89,32 75,87 25,87 11,32" fill="none" stroke="%23ffffff" stroke-width="1.2" opacity="0.8"/>
  <!-- Pita Tulisan -->
  <rect x="18" y="22" width="64" height="12" rx="3" fill="%23f59e0b"/>
  <text x="50" y="31" font-family="Arial, sans-serif" font-size="7.5" font-weight="900" fill="%230f172a" text-anchor="middle" letter-spacing="0.5">SMPN 3 RETEH</text>
  <!-- Buku dan Obor -->
  <path d="M50 40 Q55 45 52 52 Q58 48 50 62 Q44 52 48 45 Z" fill="%23fbbf24"/>
  <path d="M50 64 L30 54 L30 74 L50 82 L70 74 L70 54 Z" fill="%23ffffff" stroke="%231e3a8a" stroke-width="1.5"/>
  <path d="M50 64 L50 82" stroke="%231e3a8a" stroke-width="1.5"/>
  <!-- Tiga Bintang -->
  <polygon points="50,12 51,14 53,14 51,15 52,17 50,16 48,17 49,15 47,14 49,14" fill="%23ffffff"/>
  <polygon points="38,15 39,17 41,17 39,18 40,20 38,19 36,20 37,18 35,17 37,17" fill="%23ffffff"/>
  <polygon points="62,15 63,17 65,17 63,18 64,20 62,19 60,20 61,18 59,17 61,17" fill="%23ffffff"/>
  <text x="50" y="90" font-family="Arial, sans-serif" font-size="5" font-weight="bold" fill="%23fde047" text-anchor="middle">SANGLAR - RIAU</text>
</svg>`;

export interface LogoPresetOption {
  id: string;
  name: string;
  description: string;
  dataUrl: string;
}

export const PRESET_LOGOS: LogoPresetOption[] = [
  {
    id: 'smpn3reteh',
    name: 'Logo Resmi SMPN 3 Reteh',
    description: 'Perisai biru-emas khas SMP Negeri 3 Reteh Sanglar',
    dataUrl: LOGO_SMPN3_RETEH,
  },
  {
    id: 'tutwuri',
    name: 'Tut Wuri Handayani',
    description: 'Lambang resmi Kementerian Pendidikan Dasar & Menengah',
    dataUrl: LOGO_TUT_WURI,
  },
  {
    id: 'literasi',
    name: 'Lambang Obor & Buku',
    description: 'Logo lambang perpustakaan sekolah & literasi',
    dataUrl: LOGO_LITERASI,
  },
];
