"use client";

import { motion, type HTMLMotionProps } from "motion/react";

const EASE = [0.2, 0.7, 0.2, 1] as const;

/**
 * Muncul halus (fade + naik sedikit) saat masuk viewport — sekali saja.
 * Hanya untuk konten di bawah lipatan; jangan dipakai di hero/above-the-fold.
 */
export function Reveal({
  delay = 0,
  y = 16,
  as = "div",
  ...props
}: HTMLMotionProps<"div"> & { delay?: number; y?: number; as?: "div" | "section" }) {
  const Comp = as === "section" ? motion.section : motion.div;
  return (
    <Comp
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.4, ease: EASE, delay }}
      {...(props as HTMLMotionProps<"div">)}
    />
  );
}
