import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return [];
  const site = raw.replace(/\/$/, "");
  return [
    { url: site, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${site}/methodology`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 }
  ];
}
