import { isAxiosError } from 'axios';

/**
 * Pesan BE yang masih berbahasa Inggris → padanan Indonesia untuk ditampilkan
 * ke pengguna. Pesan BE yang sudah berbahasa Indonesia diteruskan apa adanya.
 */
const TRANSLATIONS: Record<string, string> = {
  'Invalid email or password': 'Email atau kata sandi salah.',
  'Email already registered': 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.',
  'Validation failed': 'Data yang dikirim tidak valid. Periksa kembali isianmu.',
  'Order not found': 'Pesanan tidak ditemukan.',
  'Order already taken': 'Pesanan ini sudah diambil pengepul lain.',
  'Invalid state': 'Status pesanan sudah berubah. Muat ulang halaman.',
  'Invalid action': 'Aksi tidak dikenali.',
  'Only collectors can manage profiles': 'Hanya akun pengepul yang bisa mengatur lapak.',
  'Collector profile not found': 'Profil lapak belum dibuat. Lengkapi profil lapak dulu.',
  'Profile not found': 'Profil tidak ditemukan.',
  'lat and lng are required': 'Lokasi belum diatur.',
  'No file uploaded. Please upload a valid image file.': 'Tidak ada foto yang dipilih.',
  'Server storage configuration error. Cloudinary is not configured.':
    'Layanan unggah foto sedang tidak tersedia. Coba lagi nanti.',
  'Unauthorized, no token': 'Sesi berakhir. Silakan masuk kembali.',
  'Unauthorized, invalid token': 'Sesi berakhir. Silakan masuk kembali.',
  'Unauthorized, user no longer exists': 'Akun tidak ditemukan. Silakan masuk kembali.',
  'transactionProofUrl tidak valid': 'Bukti transaksi tidak valid. Unggah ulang fotonya.',
};

/** Heuristik kasar: pesan BE berbahasa Inggris yang belum ada di kamus. */
const looksEnglish = (msg: string) =>
  /^(forbidden|unauthori[sz]ed|invalid|either|only|not found|internal|cannot|failed|error)\b/i.test(msg) ||
  /\b(is required|must be|not allowed|server error)\b/i.test(msg);

const STATUS_FALLBACK: Record<number, string> = {
  400: 'Permintaan tidak valid.',
  401: 'Sesi berakhir. Silakan masuk kembali.',
  403: 'Kamu tidak punya akses untuk melakukan aksi ini.',
  404: 'Data tidak ditemukan.',
  409: 'Data sudah berubah. Muat ulang halaman lalu coba lagi.',
  413: 'File terlalu besar.',
  422: 'Data yang dikirim tidak valid. Periksa kembali isianmu.',
  429: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
};

export const getApiStatus = (err: unknown): number | undefined =>
  isAxiosError(err) ? err.response?.status : undefined;

/**
 * Ubah error (Axios / Error biasa) jadi pesan Indonesia yang jelas.
 * - Tanpa respons (offline / server mati) → pesan koneksi.
 * - 403/409/429 → pesan BE (sudah Indonesia) atau padanan per status.
 * - 5xx → pesan generik server.
 */
export function getApiErrorMessage(err: unknown, fallback = 'Terjadi kesalahan. Coba lagi.'): string {
  if (isAxiosError(err)) {
    if (!err.response) {
      if (err.code === 'ECONNABORTED') return 'Koneksi terlalu lambat. Coba lagi.';
      return 'Tidak dapat terhubung ke server. Periksa koneksi internetmu.';
    }
    const status = err.response.status;
    const raw = (err.response.data as { message?: unknown } | undefined)?.message;
    const msg = typeof raw === 'string' ? raw.trim() : '';

    if (status >= 500) return 'Server sedang bermasalah. Coba lagi beberapa saat lagi.';
    if (msg) {
      if (TRANSLATIONS[msg]) return TRANSLATIONS[msg];
      if (msg.startsWith('Forbidden')) return STATUS_FALLBACK[403];
      if (!looksEnglish(msg)) return msg;
    }
    return STATUS_FALLBACK[status] ?? fallback;
  }
  if (err instanceof Error && err.message && !looksEnglish(err.message)) return err.message;
  return fallback;
}
