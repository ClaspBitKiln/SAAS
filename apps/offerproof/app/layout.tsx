import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OfferProof — verifiable product facts for AI agents",
  description: "A pay-per-success API that checks public product-page facts and JSON-LD consistency, with source evidence for autonomous buyer agents.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    title: "OfferProof",
    description: "Verify the offer before an AI agent acts.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
