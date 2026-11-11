"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

/**
 * Angka yang menghitung naik ke `value`. Mulai saat terlihat (sekali), lalu
 * tiap kali `value` berubah ia beranimasi dari nilai sebelumnya. Teks ditulis
 * langsung ke DOM (tanpa re-render React per frame) supaya ringan di HP murah.
 */
export function CountUp({
  value,
  from = 0,
  duration = 0.8,
  format = (n: number) => Math.round(n).toLocaleString("id-ID"),
  className,
}: {
  value: number;
  from?: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  // Nilai awal dibekukan: teks awal tak pernah berubah lewat React (DOM diubah
  // langsung oleh animasi), jadi tidak ada konflik rekonsiliasi.
  const [initial] = useState(from);
  const current = useRef(initial);
  const formatRef = useRef(format);
  useEffect(() => {
    formatRef.current = format;
  }, [format]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) {
      current.current = value;
      el.textContent = formatRef.current(value);
      return;
    }
    const controls = animate(current.current, value, {
      duration,
      ease: [0.2, 0.7, 0.2, 1],
      onUpdate: (v) => {
        current.current = v;
        el.textContent = formatRef.current(v);
      },
    });
    return () => controls.stop();
  }, [value, inView, reduce, duration]);

  return (
    <span ref={ref} className={className}>
      {format(initial)}
    </span>
  );
}
