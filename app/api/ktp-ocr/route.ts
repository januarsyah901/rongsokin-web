import { NextRequest, NextResponse } from "next/server";
import { signKycAttestation } from "@/lib/kycAttestation";

// Baca NIK + Nama dari foto KTP pakai Gemini (vision) — DI SERVER.
// API key TIDAK pernah sampai ke browser: cuma dibaca dari process.env di sini.
// Set GEMINI_API_KEY di Environment Variables Vercel (punyamu sendiri).
export const runtime = "nodejs";
export const maxDuration = 30;

// Model bisa diganti tanpa ubah kode lewat env GEMINI_MODEL.
// Default: gemini-3.8-flash (gemini-2.5-flash sudah tak tersedia untuk key baru).
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
// Cadangan bila model utama 503/404 (dipisah koma, bisa diubah lewat env).
const MODELS = [
  MODEL,
  ...(process.env.GEMINI_FALLBACK_MODELS || "gemini-3.1-flash-lite,gemini-flash-lite-latest,gemini-3.5-flash")
    .split(",")
    .map((m) => m.trim())
    .filter((m) => m && m !== MODEL),
];

const PROMPT = `Kamu pembaca KTP Indonesia. Dari gambar ini, ekstrak NIK (16 digit angka) dan Nama lengkap pemilik.
Balas HANYA dengan JSON valid, tanpa teks atau penjelasan lain, bentuk persis:
{"nik":"<16 digit angka saja, atau string kosong jika tak terbaca>","nama":"<nama lengkap HURUF KAPITAL, atau string kosong>","terbaca":<true jika NIK & nama jelas terbaca; false jika foto buram/terpotong/silau/bukan KTP>,"alasan":"<jika terbaca=false, satu kalimat singkat kenapa>"}
Aturan: NIK harus tepat 16 digit angka (hapus spasi/titik). Kalau ragu atau gambar tidak jelas, set terbaca=false dan kosongkan nik.`;

// ── Guard: route ini memakai kuota Gemini milik project, jadi jangan jadi
// proxy gratis untuk publik. ─────────────────────────────────────────────────
const MAX_BASE64_CHARS = 7 * 1024 * 1024; // ≈5MB gambar
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

// Rate limit per IP, in-memory. Di Vercel tiap instance punya memori sendiri,
// jadi ini best-effort (menahan spam dari satu klien), bukan batas global.
const RATE_MAX = 8;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }
  let b = hits.get(ip);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + RATE_WINDOW_MS };
    hits.set(ip, b);
  }
  b.count += 1;
  return b.count > RATE_MAX;
}

// Hanya terima request dari halaman app sendiri (browser selalu mengirim Origin
// untuk POST fetch). Bukan pengaman mutlak — curl bisa memalsukan header — tapi
// menutup pemakaian langsung dari situs lain.
function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const ip =
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_BASE64_CHARS + 4096) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Key belum diset di Vercel → 503 supaya FE jatuh ke OCR lokal (tetap jalan).
    return NextResponse.json({ error: "gemini_not_configured" }, { status: 503 });
  }

  let imageBase64 = "";
  let mimeType = "image/jpeg";
  try {
    const body = await req.json();
    imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64 : "";
    if (typeof body?.mimeType === "string" && body.mimeType) mimeType = body.mimeType;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!imageBase64) {
    return NextResponse.json({ error: "no_image" }, { status: 400 });
  }
  if (imageBase64.length > MAX_BASE64_CHARS) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }
  if (!ALLOWED_MIME.has(mimeType)) {
    return NextResponse.json({ error: "bad_mime" }, { status: 400 });
  }

  const requestBody = JSON.stringify({
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
          { text: PROMPT },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json", temperature: 0 },
  });

  // Semua model dipanggil PARALEL. Tanda tangan KYC hanya terbit bila minimal
  // DUA model berbeda membaca NIK yang persis sama: model (terutama "lite")
  // bisa berhalusinasi NIK dari gambar kosong, tapi dua halusinasi yang
  // kebetulan identik 16 digit praktis mustahil.
  const reads = (await Promise.all(MODELS.map((m) => readKtp(m, apiKey, requestBody)))).filter(
    (r): r is KtpRead => r !== null
  );
  if (reads.length === 0) {
    return NextResponse.json({ error: "gemini_error" }, { status: 502 });
  }

  const readable = reads.filter((r) => r.terbaca);
  const votes = new Map<string, KtpRead[]>();
  for (const r of readable) votes.set(r.nik, [...(votes.get(r.nik) || []), r]);
  const [bestNik, bestReads] = [...votes.entries()].sort((a, b) => b[1].length - a[1].length)[0] || ["", []];
  const agreed = bestReads.length >= 2;

  if (agreed) {
    const nama = bestReads.find((r) => r.nama)?.nama || "";
    return NextResponse.json({
      nik: bestNik,
      nama,
      terbaca: true,
      alasan: "",
      attestation: signKycAttestation(bestNik, nama),
    });
  }

  // Tidak ada kesepakatan → jangan terbitkan bukti. Kalau hasil antar model
  // berbeda, besar kemungkinan foto tidak jelas / bukan KTP.
  const conflicting = votes.size > 1 || (readable.length > 0 && readable.length < reads.length);
  return NextResponse.json({
    nik: "",
    nama: "",
    terbaca: false,
    alasan: conflicting
      ? "Hasil pembacaan KTP tidak konsisten. Foto ulang dengan lebih jelas."
      : reads.find((r) => r.alasan)?.alasan || "Foto kurang jelas",
    attestation: null,
  });
}

interface KtpRead {
  nik: string;
  nama: string;
  terbaca: boolean;
  alasan: string;
}

async function readKtp(model: string, apiKey: string, body: string): Promise<KtpRead | null> {
  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body,
        signal: AbortSignal.timeout(20_000),
      }
    );
  } catch (err) {
    console.error("Gemini unreachable", model, (err as Error).message);
    return null;
  }
  if (!res.ok) {
    // Detail error Gemini cukup di log server — jangan bocorkan ke client.
    const detail = await res.text().catch(() => "");
    console.error("Gemini error", model, res.status, detail.slice(0, 200));
    return null;
  }

  const data = await res.json().catch(() => null);
  const parts = data?.candidates?.[0]?.content?.parts;
  const text: string | undefined = Array.isArray(parts)
    ? (parts.find((p: { text?: string }) => typeof p?.text === "string")?.text ?? undefined)
    : undefined;
  if (!text) return null;

  let parsed: { nik?: unknown; nama?: unknown; terbaca?: unknown; alasan?: unknown } | null = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Kadang model bungkus pakai ```json ... ``` → ambil blok JSON-nya.
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        parsed = JSON.parse(m[0]);
      } catch {
        parsed = null;
      }
    }
  }
  if (!parsed) return null;

  const nikDigits = String(parsed.nik ?? "").replace(/\D/g, "");
  const nik = nikDigits.length === 16 ? nikDigits : "";
  return {
    nik,
    nama: String(parsed.nama ?? "").trim().toUpperCase(),
    terbaca: parsed.terbaca === true && nik.length === 16,
    alasan: String(parsed.alasan ?? ""),
  };
}
