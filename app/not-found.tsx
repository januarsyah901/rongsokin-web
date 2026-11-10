import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Halaman Tidak Ditemukan",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center bg-surface">
      <Link href="/" className="flex items-center gap-2" aria-label="Rongsok.in — beranda">
        <Logo size={40} />
        <span className="font-display font-extrabold text-xl tracking-tight text-ink">Rongsok.in</span>
      </Link>
      <div className="bg-surface-raised rounded-2xl p-8 max-w-md w-full space-y-3">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-mute">Error 404</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          Halaman tidak ditemukan
        </h1>
        <p className="text-sm text-ink-muted">
          Tautan yang kamu buka mungkin salah ketik atau halamannya sudah dipindah.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 pt-3 justify-center">
          <Link
            href="/"
            className="rounded-2xl px-6 py-3 text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-ink"
          >
            Ke Beranda
          </Link>
          <Link
            href="/search"
            className="rounded-2xl px-6 py-3 text-sm font-semibold border border-ink text-ink hover:bg-surface-sunken"
          >
            Cari Pengepul
          </Link>
        </div>
      </div>
    </main>
  );
}
