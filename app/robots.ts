import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rongsokin.hallojanu.me";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/cara-kerja", "/search", "/pengepul/"],
      disallow: [
        "/api/",
        "/admin",
        "/collector",
        "/dashboard",
        "/eco",
        "/notifications",
        "/orders",
        "/profile",
        "/reset-password",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
