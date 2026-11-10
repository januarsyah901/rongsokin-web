"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { PageSkeleton } from "@/components/ui/Skeleton";
import RealtimeBridge from "@/components/providers/RealtimeBridge";
import type { UserRole } from "@/types";

/** Beranda tiap peran. */
const homeFor = (role?: UserRole) =>
  role === "ADMIN" ? "/admin" : role === "COLLECTOR" ? "/collector" : "/dashboard";

/** Halaman yang boleh dibuka tanpa login (profil lapak publik). */
const isPublicPath = (pathname: string) => pathname.startsWith("/pengepul");

/**
 * Hitung tujuan redirect (atau null bila boleh tampil). Dihitung saat render —
 * bukan disimpan di state — supaya tidak ada setState di effect & tidak ada
 * kedipan konten terlarang sebelum redirect.
 */
function guardRedirect(pathname: string, token: string | null, role?: UserRole): string | null {
  if (!token) {
    if (isPublicPath(pathname)) return null;
    return `/login?next=${encodeURIComponent(pathname)}`;
  }
  const startsWith = (p: string) => pathname === p || pathname.startsWith(`${p}/`);
  if (startsWith("/admin") && role !== "ADMIN") return homeFor(role);
  if (startsWith("/collector") && role !== "COLLECTOR") return homeFor(role);
  if (startsWith("/dashboard") && role !== "CUSTOMER") return homeFor(role);
  // Buat setoran hanya untuk customer
  if (startsWith("/orders/new") && role !== "CUSTOMER") return homeFor(role);
  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const initFromStorage = useAuthStore((state) => state.initFromStorage);
  const hydrated = useAuthStore((state) => state.hydrated);
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.user?.role);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const redirect = hydrated ? guardRedirect(pathname, token, role) : null;

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

  if (!hydrated || redirect) {
    return <PageSkeleton />;
  }

  return (
    <>
      <RealtimeBridge />
      {children}
    </>
  );
}
