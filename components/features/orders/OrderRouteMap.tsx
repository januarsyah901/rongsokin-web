"use client";

import dynamic from "next/dynamic";

// Leaflet butuh window → dynamic import ssr:false
const Inner = dynamic(() => import("./OrderRouteMapInner"), {
  ssr: false,
  loading: () => (
    <div aria-hidden="true" className="shimmer rounded-2xl bg-surface h-[240px] border border-ink-faint" />
  ),
});

interface LatLng {
  lat: number;
  lng: number;
}

export default function OrderRouteMap(props: {
  customer?: LatLng | null;
  collector: LatLng;
  live?: LatLng | null;
  height?: number;
}) {
  return <Inner {...props} />;
}
