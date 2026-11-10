import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dampak Eco",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
