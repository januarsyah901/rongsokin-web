import api from './axios';
import { getApiErrorMessage } from './apiError';

export interface UploadResult {
  /** URL publik (Cloudinary) hasil unggah ke backend. */
  url: string;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5MB — sama dengan limit multer di BE
// Whitelist sama dengan BE (src/middlewares/upload.js) — SVG ditolak.
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * Unggah foto lewat backend (POST /upload, wajib login).
 *
 * Gagal = lempar Error berpesan Indonesia. Dulu ada fallback ke object URL lokal
 * (`blob:`) yang lalu ikut terkirim ke backend seolah-olah URL asli — foto rusak
 * permanen di sisi lawan transaksi. Sekarang pemanggil WAJIB menangani error.
 */
export async function uploadToCloudinary(file: File | Blob): Promise<UploadResult> {
  if (file.size > MAX_BYTES) {
    throw new Error('Foto terlalu besar. Maksimal 5MB.');
  }
  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Format foto tidak didukung. Gunakan JPG, PNG, atau WEBP.');
  }

  const formData = new FormData();
  // Backend expects a single file field named 'image'
  formData.append('image', file);

  let data: { status?: string; data?: { url?: unknown } } | undefined;
  try {
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    data = res.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err, 'Gagal mengunggah foto. Coba lagi.'));
  }

  const url = data?.data?.url;
  if (data?.status === 'success' && typeof url === 'string' && /^https?:\/\//.test(url)) {
    return { url };
  }
  throw new Error('Gagal mengunggah foto. Coba lagi.');
}
