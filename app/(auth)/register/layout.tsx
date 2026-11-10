import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Daftar Rongsok.in sebagai penjual rongsok atau pengepul. Verifikasi KTP cepat tanpa menyimpan foto KTP.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
