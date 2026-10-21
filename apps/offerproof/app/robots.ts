import type { MetadataRoute } from "next";

function siteOrigin(): string | undefined {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  return vercel ? `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}` : undefined;
}

export default function robots(): MetadataRoute.Robots {
  const site = siteOrigin();
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    ...(site ? { sitemap: `${site}/sitemap.xml` } : {})
  };
}
