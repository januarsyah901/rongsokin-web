import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cara Kerja",
  description: "Cara kerja Rongsok.in: foto rongsok, pilih dijemput atau antar, pengepul menimbang, kamu menyetujui harga.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
