"use client";

import { useEffect, useRef, useState } from "react";
import { Marker } from "react-leaflet";
import type L from "leaflet";

interface LatLng {
  lat: number;
  lng: number;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Marker yang MELUNCUR halus ke posisi baru alih-alih melompat (posisi GPS
 * live datang tiap beberapa detik). Interpolasi linear lat/lng via rAF —
 * cukup akurat untuk jarak pendek antar-update. Hormati reduced-motion.
 */
export default function AnimatedMarker({
  position,
  icon,
  duration = 900,
}: {
  position: LatLng;
  icon: L.DivIcon | L.Icon;
  duration?: number;
}) {
  const markerRef = useRef<L.Marker | null>(null);
  // Posisi awal dibekukan; perubahan berikutnya ditangani tween di bawah
  // (kalau prop position diteruskan, react-leaflet akan melompat langsung).
  const [initial] = useState<[number, number]>(() => [position.lat, position.lng]);
  const { lat, lng } = position;

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const from = marker.getLatLng();
    if (from.lat === lat && from.lng === lng) return;
    if (prefersReducedMotion()) {
      marker.setLatLng([lat, lng]);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const k = ease(t);
      marker.setLatLng([from.lat + (lat - from.lat) * k, from.lng + (lng - from.lng) * k]);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    // Update baru di tengah tween → batalkan; tween berikutnya mulai dari
    // posisi marker saat itu (tanpa lompatan).
    return () => cancelAnimationFrame(raf);
  }, [lat, lng, duration]);

  return <Marker ref={markerRef} position={initial} icon={icon} />;
}
