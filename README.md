# Rongsok.in

Marketplace daur ulang sampah berbasis geolokasi yang menghubungkan **penjual sampah (Customer)** dengan **pengepul (Collector)** di sekitar Yogyakarta. Dibuat untuk **Lomba OLIVIA XI 2026**.

🔗 **Live:** [rongsokin.hallojanu.me](https://rongsokin.hallojanu.me) (self-hosted — web & API satu origin, API di `/api/v1`)

## Fitur Utama

- **War & Forward order** — customer bisa broadcast pesanan ke semua pengepul terdekat (War/FCFS) atau langsung mengirim ke satu pengepul pilihan dari lapaknya (Forward/private).
- **Real-time** via Socket.IO — status pesanan, antrean masuk, dan live tracking lokasi saat penjemputan/pengantaran.
- **Peta rute** (Leaflet) antara pengepul dan customer, lengkap dengan navigasi ke Google Maps.
- **KYC ringan** — verifikasi NIK dari foto KTP via OCR (Gemini Vision, fallback Tesseract.js), tanpa menyimpan foto KTP demi privasi.
- **Eco Impact & Leaderboard** — dampak lingkungan (estimasi km emisi motor tercegah) dari sampah yang berhasil didaur ulang, kartu share yang bisa diunduh, serta papan peringkat.
- **Rating & ulasan** dua arah antara customer dan pengepul.
- **Notifikasi in-app** (lonceng + Notification API browser).
- **Dashboard admin** untuk kelola kategori sampah.

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand) — state management
- [TanStack Query](https://tanstack.com/query) — data fetching & caching
- [Socket.IO Client](https://socket.io/) — realtime
- [React Leaflet](https://react-leaflet.js.org/) — peta
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) — form & validasi
- [Tesseract.js](https://github.com/naptha/tesseract.js) — OCR fallback

Backend: Express + Prisma + PostgreSQL (PostGIS) — lihat [be-rongsok.in](https://github.com/januarsyah901/be-rongsok.in).

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Frontend butuh backend [be-rongsok.in](https://github.com/januarsyah901/be-rongsok.in) yang berjalan lokal. Jalankan BE di port 4000 (port 3000 dipakai Next.js), lalu copy `.env.example` menjadi `.env.local`:

```bash
# di repo backend
PORT=4000 npm run dev

# di repo ini
cp .env.example .env.local
npm run dev
```

Isi `.env.example`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000

# OCR KTP (opsional — tanpa ini otomatis fallback ke Tesseract.js)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

# Harus sama dengan KYC_ATTESTATION_SECRET di backend (min 32 karakter)
KYC_ATTESTATION_SECRET=
```

> Jangan arahkan `.env.local` ke API produksi untuk development — API produksi
> membatasi CORS ke origin `https://rongsokin.hallojanu.me` dan memakai data asli.

Aplikasi berjalan di [http://localhost:3000](http://localhost:3000).

## Struktur Proyek

```
app/
  (auth)/        # login, register, forgot/reset password
  (dashboard)/    # dashboard customer & collector, orders, profile, admin, eco
  api/ktp-ocr/    # route server-side untuk OCR KTP (Gemini)
components/       # komponen UI & fitur
hooks/            # data-fetching hooks (TanStack Query) & socket
lib/              # helper (axios, socket, eco-impact, utils, dll)
store/            # Zustand stores
types/             # tipe TypeScript bersama
```
