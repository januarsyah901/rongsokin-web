/**
 * Sumber tile peta. CARTO basemaps kini mewajibkan API key — semua tile tampil
 * "API KEY REQUIRED" (termasuk di domain produksi), jadi peta rute, radius, dan
 * pemilih lokasi tidak terbaca. Default pindah ke tile standar OpenStreetMap
 * (wajib atribusi). Bisa diganti lewat env bila punya penyedia ber-key.
 */
export const MAP_TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const MAP_TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';

/** Batas zoom tile OSM standar. */
export const MAP_TILE_MAX_ZOOM = 19;
