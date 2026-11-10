import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun Rongsok.in untuk menjual rongsok atau mengelola lapak pengepul.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
