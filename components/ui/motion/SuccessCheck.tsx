"use client";

import { motion } from "motion/react";

/**
 * Ikon centang yang "tergambar" (lingkaran → centang). Ukuran & warna lewat
 * props supaya bisa menggantikan <CheckCircle2 /> tanpa mengubah tampilan.
 */
export function SuccessCheck({
  size = 24,
  className = "",
  strokeWidth = 2,
  delay = 0,
}: {
  size?: number;
  className?: string;
  strokeWidth?: number;
  delay?: number;
}) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 22, delay }}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, ease: "easeOut", delay }}
      />
      <motion.path
        d="m9 12 2 2 4-4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.25, ease: "easeOut", delay: delay + 0.25 }}
      />
    </motion.svg>
  );
}
