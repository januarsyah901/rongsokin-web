import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rongsokin.hallojanu.me";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/cara-kerja", "/search", "/login", "/register"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }));
}
