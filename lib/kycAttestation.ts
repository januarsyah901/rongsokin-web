// HANYA untuk dipakai di server (route handler) — butuh secret dari env.
import crypto from "crypto";

// Tanda tangan hasil OCR KTP untuk backend. Format HARUS identik dengan
// rongsokin-api/be-rongsok/src/utils/kyc.js:
//   base64url(JSON{ nik, nama, exp }) + "." + base64url(HMAC-SHA256(body))
// Secret bersama: KYC_ATTESTATION_SECRET (diset di Vercel DAN di BE).

const TTL_SECONDS = 15 * 60; // cukup untuk mengisi sisa form register

export function signKycAttestation(nik: string, nama: string): string | null {
  const secret = process.env.KYC_ATTESTATION_SECRET;
  if (!secret || secret.length < 32) return null;
  const body = Buffer.from(
    JSON.stringify({ nik, nama, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}
