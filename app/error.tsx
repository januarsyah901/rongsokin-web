"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

/**
 * Error boundary per-route: crash di satu halaman tidak lagi menampilkan layar
 * putih / pesan bawaan Next berbahasa Inggris.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-status-error/10 flex items-center justify-center">
        <AlertTriangle size={26} className="text-status-error" aria-hidden="true" />
      </div>
      <div className="space-y-1 max-w-sm" role="alert">
        <h1 className="font-display text-xl font-extrabold tracking-tight text-ink">
          Terjadi kesalahan
        </h1>
        <p className="text-sm text-ink-muted">
          Halaman ini gagal dimuat. Coba lagi, atau kembali ke beranda bila masalah berlanjut.
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-mute pt-1">Kode: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-2xl px-6 py-3 text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-ink cursor-pointer"
        >
          Coba lagi
        </button>
        <Link
          href="/"
          className="rounded-2xl px-6 py-3 text-sm font-semibold border border-ink text-ink hover:bg-surface-sunken"
        >
          Ke Beranda
        </Link>
      </div>
    </main>
  );
}
