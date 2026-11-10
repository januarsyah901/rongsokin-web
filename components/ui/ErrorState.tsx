"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { getApiErrorMessage } from "@/lib/apiError";

/** Kotak error seragam dengan tombol "Coba lagi" — pengganti layar kosong diam-diam. */
export function ErrorState({
  error,
  title = "Gagal memuat data",
  onRetry,
  retrying = false,
  className = "",
}: {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`bg-surface-raised rounded-2xl p-6 flex flex-col items-center text-center gap-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-status-error/10 flex items-center justify-center">
        <AlertTriangle size={22} className="text-status-error" aria-hidden="true" />
      </div>
      <div>
        <h4 className="font-bold text-ink text-sm">{title}</h4>
        <p className="text-xs text-ink-muted mt-1">{getApiErrorMessage(error, "Terjadi kesalahan. Coba lagi.")}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-ink px-4 py-2 text-xs font-bold text-ink hover:bg-surface-sunken disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={14} className={retrying ? "animate-spin" : ""} aria-hidden="true" />
          Coba lagi
        </button>
      )}
    </div>
  );
}
