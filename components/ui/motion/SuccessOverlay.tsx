"use client";

import { motion } from "motion/react";
import { SuccessCheck } from "./SuccessCheck";

/**
 * Lapisan konfirmasi sukses (centang tergambar) yang tampil SELAGI navigasi
 * berjalan — tidak menunda apa pun; ia hilang bersama halaman saat rute baru
 * selesai dimuat. Tidak menangkap klik (pointer-events-none).
 */
export function SuccessOverlay({ label = "Berhasil" }: { label?: string }) {
  return (
    <motion.div
      role="status"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/30 backdrop-blur-[2px] pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
    >
      <span className="sr-only">{label}</span>
      <motion.div
        className="w-24 h-24 rounded-full bg-brand-500 text-ink flex items-center justify-center shadow-2xl"
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 20 }}
      >
        <SuccessCheck size={52} strokeWidth={2.25} delay={0.05} />
      </motion.div>
    </motion.div>
  );
}
