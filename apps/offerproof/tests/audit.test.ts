import { describe, expect, it } from "vitest";
import { buildOfferReport, isPublicAddress, robotsDisallowsPath, validatePublicTarget } from "../lib/audit";

const html = `
<!doctype html><html><head>
<title>Blue Trail Shoe</title>
<meta name="description" content="A lightweight trail-running shoe">
<link rel="canonical" href="https://store.example/products/blue-shoe">
<meta property="product:price:amount" content="89.00">
<meta property="product:price:currency" content="USD">
<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"Product",
  "name":"Blue Trail Shoe",
  "description":"A lightweight trail-running shoe",
  "offers":{"@type":"Offer","price":"89.00","priceCurrency":"USD","availability":"https://schema.org/InStock"}
}
</script>
</head><body><h1>Blue Trail Shoe</h1><a href="/cart">Add to cart</a></body></html>`;

describe("public address guard", () => {
  it("allows a globally routable address", () => expect(isPublicAddress("1.1.1.1")).toBe(true));
  it("blocks private IPv4 and loopback", () => {
    expect(isPublicAddress("10.0.0.5")).toBe(false);
    expect(isPublicAddress("127.0.0.1")).toBe(false);
    expect(isPublicAddress("169.254.169.254")).toBe(false);
    expect(isPublicAddress("192.168.1.1")).toBe(false);
  });
  it("blocks IPv6 loopback and ULA", () => {
    expect(isPublicAddress("::1")).toBe(false);
    expect(isPublicAddress("fd00::1")).toBe(false);
  });
  it("rejects local hosts and non-HTTPS without network lookup", async () => {
    await expect(validatePublicTarget("http://store.example/products/a")).rejects.toMatchObject({code:"HTTPS_REQUIRED"});
    await expect(validatePublicTarget("https://localhost/products/a")).rejects.toMatchObject({code:"PRIVATE_HOST_BLOCKED"});
    await expect(validatePublicTarget("https://127.0.0.1/")).rejects.toMatchObject({code:"PRIVATE_HOST_BLOCKED"});
    await expect(validatePublicTarget("https://user:pass@store.example/")).rejects.toMatchObject({code:"URL_NOT_ALLOWED"});
  });
});

describe("robots policy", () => {
  it("blocks path disallows and honors a longer Allow rule", () => {
    expect(robotsDisallowsPath("User-agent: *\nDisallow: /products\nAllow: /products/public", "/products/private")).toBe(true);
    expect(robotsDisallowsPath("User-agent: *\nDisallow: /products\nAllow: /products/public", "/products/public/1")).toBe(false);
  });
  it("prefers the more specific user-agent group", () => {
    const robots = "User-agent: *\nDisallow: /\n\nUser-agent: OfferProofBot\nAllow: /products/";
    expect(robotsDisallowsPath(robots, "/products/item")).toBe(false);
    expect(robotsDisallowsPath(robots, "/about")).toBe(false);
  });
});

describe("offer report", () => {
  it("extracts price/currency and source-linked facts", () => {
    const report = buildOfferReport("https://store.example/products/blue-shoe", "https://store.example/products/blue-shoe", 200, html, 125);
    expect(report.facts.productName.value).toBe("Blue Trail Shoe");
    expect(report.facts.price.value).toBe("89.00");
    expect(report.facts.price.currency).toBe("USD");
    expect(report.facts.availability.value).toBe("InStock");
    expect(report.facts.canonicalUrl).toBe("https://store.example/products/blue-shoe");
    expect(report.consistency.status).toBe("consistent");
    expect(report.score).toBeGreaterThan(70);
  });

  it("marks conflicting price candidates", () => {
    const conflicting = html.replace('content="89.00"', 'content="99.00"');
    const report = buildOfferReport("https://store.example/products/blue-shoe", "https://store.example/products/blue-shoe", 200, conflicting, 125);
    expect(report.consistency.status).toBe("mismatch");
    expect(report.consistency.flags.some(flag => flag.includes("price"))).toBe(true);
  });

  it("does not invent a product when schema is absent", () => {
    const report = buildOfferReport("https://store.example/page", "https://store.example/page", 200, "<html><head><title>About</title></head><body><h1>About</h1></body></html>", 10);
    expect(report.facts.price.value).toBeNull();
    expect(report.facts.availability.value).toBeNull();
    expect(report.consistency.status).toBe("insufficient_evidence");
  });
});
