import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cari Pengepul",
  description: "Cari pengepul rongsok terdekat di Yogyakarta berdasarkan jenis sampah dan jarak.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
