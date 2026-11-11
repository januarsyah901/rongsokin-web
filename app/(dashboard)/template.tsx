/**
 * Transisi halaman ringan untuk area dashboard: fade-in 200ms murni CSS (tanpa
 * JS, tanpa transform — elemen fixed/sticky di dalamnya tidak terpengaruh).
 * Dimatikan otomatis oleh prefers-reduced-motion (lihat globals.css).
 */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-fade flex flex-1 flex-col">{children}</div>;
}
