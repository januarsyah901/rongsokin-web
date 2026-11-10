import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Atur Ulang Kata Sandi",
  description: "Atur ulang kata sandi akun Rongsok.in.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
