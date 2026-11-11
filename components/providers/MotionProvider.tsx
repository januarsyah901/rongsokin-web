"use client";

import { MotionConfig } from "motion/react";

/**
 * Konfigurasi animasi global. `reducedMotion="user"` → animasi transform/layout
 * otomatis dimatikan bila OS pengguna menyetel "kurangi gerakan".
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
