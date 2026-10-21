import type { MetadataRoute } from "next";

function siteOrigin(): string | undefined {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  return vercel ? `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}` : undefined;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const site = siteOrigin();
  if (!site) return [];
  return [
    { url: site, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${site}/methodology`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 }
  ];
}
