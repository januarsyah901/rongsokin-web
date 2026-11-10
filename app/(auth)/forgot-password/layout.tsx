import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lupa Kata Sandi",
  description: "Minta tautan untuk mengatur ulang kata sandi akun Rongsok.in.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
