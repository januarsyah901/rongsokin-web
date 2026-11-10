"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { useLogin } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/apiError";
import type { UserRole } from "@/types";

const homeFor = (role: UserRole) =>
  role === "ADMIN" ? "/admin" : role === "COLLECTOR" ? "/collector" : "/dashboard";

/** Hanya path internal (cegah open redirect lewat ?next=//evil.com). */
const safeNext = (next: string | null) =>
  next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : null;

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const expired = searchParams.get("expired") === "1";
  const { mutate: login, isPending } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    login(
      { email, password },
      {
        onSuccess: (data) => {
          toast.success(`Selamat datang kembali, ${data.data.user.name}!`);
          // Kembali ke halaman asal (mis. link notifikasi) bila ada; guard layout
          // tetap mengalihkan bila halaman itu bukan untuk peran ini.
          router.replace(next || homeFor(data.data.user.role));
        },
        onError: (err: unknown) => {
          const errMsg = getApiErrorMessage(err, "Login gagal. Silakan coba lagi.");
          setError(errMsg);
          toast.error(errMsg);
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Logo size={40} />
        <span className="font-display font-extrabold text-xl tracking-tight text-ink">
          Rongsok.in
        </span>
      </Link>

      <div className="w-full max-w-md bg-surface-raised rounded-2xl p-8 mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            Masuk akun
          </h1>
          <p className="text-sm text-ink-muted mt-1.5">Lanjutkan perjalanan cuanmu.</p>
        </div>

        {expired && !error && (
          <div
            role="status"
            className="mb-5 p-3 bg-status-warning/15 rounded-xl text-ink text-xs font-semibold text-center"
          >
            Sesi kamu telah berakhir. Silakan masuk kembali.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 p-3 bg-status-error/10 rounded-xl text-status-error text-xs font-semibold text-center"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="login-email"
              className="text-xs font-bold text-ink uppercase tracking-wider mb-2 block"
            >
              Email
            </label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="budi@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="text-xs font-bold text-ink uppercase tracking-wider mb-2 block"
            >
              Kata Sandi
            </label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Masukkan kata sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs font-semibold text-ink-muted hover:text-ink">
              Lupa sandi?
            </Link>
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={isPending}>
            {isPending ? "Memproses…" : "Masuk"} {!isPending && <ArrowRight size={16} />}
          </Button>
        </form>

        <div className="mb-6"></div>

        <p className="text-center text-sm text-ink-muted">
          Belum punya akun?{" "}
          <Link href="/register" className="text-ink font-bold hover:underline">
            Daftar di sini
          </Link>
        </p>
      </div>

      <p className="mt-8 text-[10px] text-mute text-center uppercase tracking-widest font-bold">
        &copy; 2026 RONGSOK.IN MARKETPLACE
      </p>
    </div>
  );
}
