"use client";

/** Cadangan terakhir bila root layout sendiri gagal dirender (tanpa CSS app). */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#e8ebe6",
          color: "#0e0f0c",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Terjadi kesalahan</h1>
          <p style={{ fontSize: 14, marginBottom: 20 }}>Rongsok.in gagal dimuat. Silakan coba lagi.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#9fe870",
              border: 0,
              borderRadius: 16,
              padding: "12px 24px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  );
}
