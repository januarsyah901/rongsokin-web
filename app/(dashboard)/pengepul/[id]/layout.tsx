import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil Lapak Pengepul",
  description: "Lihat profil, katalog harga, dan ulasan lapak pengepul di Rongsok.in.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
