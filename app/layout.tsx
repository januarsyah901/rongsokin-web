import type { Metadata, Viewport } from "next";
import { Manrope, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

import QueryProvider from "@/components/providers/QueryProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const fontDisplay = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const fontBody = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rongsokin.hallojanu.me";
const DESCRIPTION =
  "Jual rongsok & sampah daur ulang langsung ke pengepul terdekat di Yogyakarta. Dijemput atau antar sendiri, harga transparan, pembayaran tercatat.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Rongsok.in — Jual Rongsok ke Pengepul Terdekat",
    template: "%s · Rongsok.in",
  },
  description: DESCRIPTION,
  applicationName: "Rongsok.in",
  keywords: ["rongsok", "pengepul", "daur ulang", "sampah", "Yogyakarta", "bank sampah", "jual barang bekas"],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Rongsok.in",
    title: "Rongsok.in — Jual Rongsok ke Pengepul Terdekat",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rongsok.in — Jual Rongsok ke Pengepul Terdekat",
    description: DESCRIPTION,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0e0f0c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body bg-surface text-ink pb-20 md:pb-0">
        <QueryProvider>
          {children}
        </QueryProvider>
        <ConfirmDialog />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: "16px",
              background: "#0e0f0c",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              padding: "12px 16px",
            },
            success: { iconTheme: { primary: "#9fe870", secondary: "#0e0f0c" } },
          }}
        />
      </body>
    </html>
  );
}
