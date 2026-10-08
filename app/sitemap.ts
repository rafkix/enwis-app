import type { MetadataRoute } from "next";

// Next.js metadata-route convention: this file automatically becomes
// /sitemap.xml at build time — no separate static file needed. Only
// public, unauthenticated routes belong here; dashboard/profile/billing
// pages require auth and shouldn't be indexed.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://app.enwis.uz";

  return [
    {
      url: `${base}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${base}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/forgot-password`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}