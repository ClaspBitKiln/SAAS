import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { Agent, fetch as undiciFetch } from "undici";
import * as ipaddr from "ipaddr.js";
import { load } from "cheerio";

const MAX_HTML_BYTES = 1_500_000;
const FETCH_TIMEOUT_MS = 8_000;
const USER_AGENT = "OfferProofBot/0.1 (+https://offerproof.dev/methodology)";

export type CheckStatus = "pass" | "warn" | "fail" | "unknown";
export interface AuditCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  source?: string;
}
export interface OfferProofReport {
  service: "OfferProof";
  version: "0.1.0";
  checkedAt: string;
  inputUrl: string;
  finalUrl: string;
  httpStatus: number;
  elapsedMs: number;
  score: number;
  scoreNote: string;
  facts: {
    title: { value: string | null; source: string | null };
    productName: { value: string | null; source: string | null };
    description: { value: string | null; source: string | null };
    price: { value: string | null; currency: string | null; source: string | null };
    availability: { value: string | null; source: string | null };
    canonicalUrl: string | null;
    productTypes: string[];
    checkoutLinksObserved: number;
  };
  consistency: { status: "consistent" | "mismatch" | "insufficient_evidence"; flags: string[] };
  checks: AuditCheck[];
  limitations: string[];
}

export class PublicFetchError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
    this.name = "PublicFetchError";
  }
}

export function isPublicAddress(input: string): boolean {
  try {
    const address = ipaddr.parse(input);
    if (address.kind() === "ipv6" && (address as ipaddr.IPv6).isIPv4MappedAddress()) {
      return isPublicAddress((address as ipaddr.IPv6).toIPv4Address().toString());
    }
    // ipaddr.js classifies private, loopback, link-local, multicast, documentation,
    // reserved and other non-global ranges separately from globally routable unicast.
    return address.range() === "unicast";
  } catch {
    return false; // Fail closed on unparseable or unsupported address forms.
  }
}

export interface SafeTarget {
  url: URL;
  hostname: string;
  pinnedAddress: string;
  family: number;
}

export async function validatePublicTarget(raw: string): Promise<SafeTarget> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new PublicFetchError("INVALID_URL", "Provide a valid absolute HTTPS URL.");
  }
  if (url.protocol !== "https:") {
    throw new PublicFetchError("HTTPS_REQUIRED", "Only HTTPS product pages are accepted.");
  }
  if (url.username || url.password || url.port && url.port !== "443") {
    throw new PublicFetchError("URL_NOT_ALLOWED", "Credentials and non-standard ports are not allowed.");
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") || hostname.endsWith(".internal") ||
      hostname.endsWith(".test") || hostname.endsWith(".invalid") ||
      isIP(hostname)) {
    throw new PublicFetchError("PRIVATE_HOST_BLOCKED", "Local, private, literal-IP and reserved hosts are not allowed.");
  }
  let records: Array<{address:string; family:number}>;
  try {
    records = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new PublicFetchError("DNS_FAILED", "The hostname could not be resolved.", 422);
  }
  if (!records.length || records.some(record => !isPublicAddress(record.address))) {
    throw new PublicFetchError("PRIVATE_HOST_BLOCKED", "The hostname resolves to a private or reserved address.", 403);
  }
  return { url, hostname, pinnedAddress: records[0].address, family: records[0].family };
}

async function boundedFetch(url: URL, checkedTarget: SafeTarget, expected: "html" | "text" = "html"): Promise<{status:number; headers:Headers; text:string}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const dispatcher = new Agent({
    connect: {
      lookup(hostname: string, options: any, callback: (...args:any[])=>void) {
        if (hostname.toLowerCase() !== checkedTarget.hostname.toLowerCase()) {
          callback(new Error("Unapproved target hostname"));
          return;
        }
        if (options?.all) callback(null, [{ address: checkedTarget.pinnedAddress, family: checkedTarget.family }]);
        else callback(null, checkedTarget.pinnedAddress, checkedTarget.family);
      }
    }
  });
  try {
    const response = await undiciFetch(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": expected === "html" ? "text/html,application/xhtml+xml;q=0.9" : "text/plain,*/*;q=0.2",
        "Accept-Encoding": "identity"
      },
      signal: controller.signal,
      dispatcher
    });
    if (response.status >= 300 && response.status < 400) {
      throw new PublicFetchError("REDIRECT_BLOCKED", "Redirects are not followed automatically. Scan the final HTTPS URL directly.", 422);
    }
    if (expected === "text" && response.status >= 400 && response.status < 500) {
      await response.body?.cancel().catch(()=>undefined);
      return { status: response.status, headers: response.headers as unknown as Headers, text: "" };
    }
    if (response.status >= 500) {
      throw new PublicFetchError(expected === "text" ? "ROBOTS_UNAVAILABLE" : "REMOTE_SERVER_ERROR",
        expected === "text" ? "The site's robots.txt could not be checked; refusing to fetch the product page." : "The target server failed.",
        503);
    }
    const contentType = response.headers.get("content-type") || "";
    const contentTypeLower = contentType.toLowerCase();
    const isHtml = contentTypeLower.includes("text/html") || contentTypeLower.includes("application/xhtml+xml");
    const isText = contentTypeLower.startsWith("text/") || contentTypeLower.includes("application/octet-stream");
    if (expected === "html" && !isHtml) throw new PublicFetchError("NOT_HTML", "The target did not return an HTML page.", 415);
    if (expected === "text" && response.status >= 200 && response.status < 300 && !isText) {
      throw new PublicFetchError("ROBOTS_UNREADABLE", "The site's robots.txt is not served as readable text; refusing to scan.", 422);
    }
    const length = Number(response.headers.get("content-length") || 0);
    if (length > MAX_HTML_BYTES) throw new PublicFetchError("RESPONSE_TOO_LARGE", "The response exceeds the 1.5 MB limit.", 413);
    if (!response.body) return { status:response.status, headers:response.headers as unknown as Headers, text:"" };
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_HTML_BYTES) {
        await reader.cancel();
        throw new PublicFetchError("RESPONSE_TOO_LARGE", "The response exceeds the 1.5 MB limit.", 413);
      }
      chunks.push(value);
    }
    const all = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.byteLength; }
    return { status:response.status, headers:response.headers as unknown as Headers, text:new TextDecoder("utf-8", {fatal:false}).decode(all) };
  } catch (error) {
    if (error instanceof PublicFetchError) throw error;
    if ((error as Error)?.name === "AbortError") throw new PublicFetchError("FETCH_TIMEOUT", "The page took too long to respond.", 504);
    throw new PublicFetchError("FETCH_FAILED", "The public page could not be fetched.", 422);
  } finally {
    clearTimeout(timer);
    await dispatcher.close().catch(()=>undefined);
  }
}

export function robotsDisallowsPath(robots: string, pathname: string): boolean {
  type Rule = { pattern: string; allow: boolean };
  type Group = { agents: string[]; rules: Rule[] };
  const groups: Group[] = [];
  let group: Group = { agents: [], rules: [] };
  for (const rawLine of robots.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    if (!line) continue;
    const sep = line.indexOf(":");
    if (sep < 0) continue;
    const key = line.slice(0, sep).trim().toLowerCase();
    const value = line.slice(sep + 1).trim();
    if (key === "user-agent") {
      if (group.agents.length && group.rules.length) {
        groups.push(group);
        group = { agents: [], rules: [] };
      }
      group.agents.push(value.toLowerCase());
    } else if ((key === "allow" || key === "disallow") && group.agents.length && value) {
      group.rules.push({ pattern: value, allow: key === "allow" });
    }
  }
  if (group.agents.length) groups.push(group);
  const agentToken = USER_AGENT.split(/[ /]/)[0].toLowerCase();
  const candidates = groups.map(g => ({
    group: g,
    specificity: Math.max(-1, ...g.agents.map(a => a === "*" ? 0 : (agentToken.includes(a) || USER_AGENT.toLowerCase().includes(a) ? a.length : -1)))
  })).filter(x => x.specificity >= 0);
  if (!candidates.length) return false;
  const bestSpecificity = Math.max(...candidates.map(x => x.specificity));
  const rules = candidates.filter(x => x.specificity === bestSpecificity).flatMap(x => x.group.rules);
  let best: { length: number; allow: boolean } | null = null;
  for (const rule of rules) {
    const endAnchor = rule.pattern.endsWith("$");
    const rawPattern = endAnchor ? rule.pattern.slice(0, -1) : rule.pattern;
    const escaped = rawPattern.split("*").map(part => part.replace(/[.*+?^{}()|[\]\\]/g, "\\$&")).join(".*");
    let expression: RegExp;
    try { expression = new RegExp("^" + escaped + (endAnchor ? "$" : "")); } catch { continue; }
    if (!expression.test(pathname)) continue;
    const length = rawPattern.replace(/\*/g, "").length;
    if (!best || length > best.length || (length === best.length && rule.allow)) best = { length, allow: rule.allow };
  }
  return Boolean(best && !best.allow);
}

function typesOf(node: any): string[] {
  const type = node?.["@type"];
  if (!type) return [];
  return (Array.isArray(type) ? type : [type]).filter(x => typeof x === "string");
}
function collectObjects(value: any, out: any[] = []): any[] {
  if (Array.isArray(value)) { for (const v of value) collectObjects(v,out); return out; }
  if (value && typeof value === "object") {
    out.push(value);
    for (const [key,v] of Object.entries(value)) if (key === "@graph" || key === "itemListElement") collectObjects(v,out);
  }
  return out;
}
function firstText(...values: unknown[]): string | null {
  for (const value of values) if (typeof value === "string" && value.trim()) return value.trim().slice(0,500);
  return null;
}
function normalizeAvailability(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const tail = value.split(/[\/#]/).pop() || value;
  return tail.replace(/([a-z])([A-Z])/g,"$1 $2");
}

export function buildOfferReport(rawUrl: string, finalUrl: string, status: number, htmlText: string, elapsedMs: number, checkedAt = new Date().toISOString()): OfferProofReport {
  const $ = load(htmlText);
  const title = firstText($("title").first().text());
  const metaDescription = firstText($('meta[name="description"]').attr("content"));
  const canonicalRaw = $('link[rel="canonical"]').first().attr("href");
  let canonicalUrl: string | null = null;
  try { if (canonicalRaw) canonicalUrl = new URL(canonicalRaw, finalUrl).toString(); } catch {}
  const h1 = firstText($("h1").first().text());
  const productTypes = new Set<string>();
  const jsonldObjects: any[] = [];
  let jsonldParseErrors = 0;
  $('script[type="application/ld+json"]').each((_, el) => {
    const content = $(el).contents().text().trim();
    if (!content) return;
    try {
      for (const node of collectObjects(JSON.parse(content))) jsonldObjects.push(node);
    } catch { jsonldParseErrors++; }
  });
  for (const obj of jsonldObjects) for (const type of typesOf(obj)) productTypes.add(type);
  const product = jsonldObjects.find(obj => typesOf(obj).some(t => ["Product","ProductGroup"].includes(t)));
  const offerValue = product?.offers ?? jsonldObjects.find(obj => typesOf(obj).includes("Offer"));
  const offer = Array.isArray(offerValue) ? offerValue[0] : offerValue;
  const schemaName = firstText(product?.name, offer?.name);
  const productName = schemaName || h1;
  const productNameSource = schemaName ? "JSON-LD Product/Offer" : h1 ? "visible H1" : null;
  const schemaDescription = firstText(product?.description, metaDescription);
  const price = offer?.price != null ? String(offer.price) : offer?.priceSpecification?.price != null ? String(offer.priceSpecification.price) : null;
  const currency = firstText(offer?.priceCurrency);
  const availability = normalizeAvailability(offer?.availability);
  const metaPrice = firstText(
    $('meta[property="product:price:amount"]').attr("content"),
    $('meta[property="og:price:amount"]').attr("content"),
    $('[itemprop="price"]').first().attr("content"),
    $('[itemprop="price"]').first().text()
  );
  const metaCurrency = firstText(
    $('meta[property="product:price:currency"]').attr("content"),
    $('meta[property="og:price:currency"]').attr("content"),
    $('[itemprop="priceCurrency"]').first().attr("content")
  );
  const productTypeList = [...productTypes].filter(t => ["Product","ProductGroup","Offer","Organization","BreadcrumbList"].includes(t));
  const links = $("a[href]").toArray();
  const checkoutLinksObserved = links.filter(el => {
    const label = (($(el).text() || "") + " " + ($(el).attr("href") || "") + " " + ($(el).attr("aria-label") || "")).toLowerCase();
    return /add.to.cart|add-to-cart|\/cart|\/checkout|buy.now|buy-now|basket|корзин|купить/.test(label);
  }).length;
  const flags: string[] = [];
  if (price !== null && metaPrice !== null && Number(price.replace(",", ".")) !== Number(metaPrice.replace(",", "."))) flags.push("Structured Offer price differs from a meta/microdata price candidate.");
  if (currency && metaCurrency && currency.toUpperCase() !== metaCurrency.toUpperCase()) flags.push("Structured Offer currency differs from a meta/microdata currency candidate.");
  if (product && !offer) flags.push("Product schema exists but no Offer was found.");
  if (!product && !offer) flags.push("No Product/Offer JSON-LD object was found.");
  const hasProduct = Boolean(product);
  const checks: AuditCheck[] = [
    {id:"http",label:"Public HTML response",status:status >= 200 && status < 300 ? "pass" : "fail",detail:`Received HTTP ${status}.`,source:"HTTP"},
    {id:"canonical",label:"Canonical URL",status:canonicalUrl ? "pass" : "warn",detail:canonicalUrl || "No rel=canonical link observed.",source:"HTML link[rel=canonical]"},
    {id:"title",label:"Page title",status:title ? "pass" : "warn",detail:title || "No title text observed.",source:"HTML title"},
    {id:"description",label:"Meta description",status:metaDescription ? "pass" : "warn",detail:metaDescription || "No meta description observed.",source:"HTML meta description"},
    {id:"h1",label:"Visible H1",status:h1 ? "pass" : "warn",detail:h1 || "No H1 text observed.",source:"HTML h1"},
    {id:"product",label:"Product structured data",status:hasProduct ? "pass" : "warn",detail:hasProduct ? "A Product/ProductGroup JSON-LD object was parsed." : "No Product/ProductGroup JSON-LD object was parsed.",source:"JSON-LD"},
    {id:"offer",label:"Offer price and currency",status:price && currency ? "pass" : price || currency ? "warn" : "fail",detail:price && currency ? `Structured Offer states ${price} ${currency}.` : "Price/currency pair not both present in Product/Offer JSON-LD.",source:"JSON-LD Offer"},
    {id:"availability",label:"Structured availability",status:availability ? "pass" : "warn",detail:availability || "No Offer availability observed.",source:"JSON-LD Offer"},
    {id:"org",label:"Organization identity",status:productTypes.has("Organization") ? "pass" : "warn",detail:productTypes.has("Organization") ? "Organization type found." : "Organization JSON-LD type not observed.",source:"JSON-LD"},
    {id:"breadcrumb",label:"Breadcrumbs",status:productTypes.has("BreadcrumbList") ? "pass" : "warn",detail:productTypes.has("BreadcrumbList") ? "BreadcrumbList type found." : "BreadcrumbList JSON-LD type not observed.",source:"JSON-LD"},
    {id:"checkout",label:"Cart/checkout link",status:checkoutLinksObserved ? "pass" : "unknown",detail:checkoutLinksObserved ? `${checkoutLinksObserved} candidate cart/checkout links observed. Not clicked.` : "No obvious cart/checkout link text or URL observed; not tested.",source:"HTML links"},
    {id:"jsonld",label:"JSON-LD parsing",status:jsonldParseErrors ? "warn" : productTypes.size ? "pass" : "unknown",detail:jsonldParseErrors ? `${jsonldParseErrors} JSON-LD block(s) failed to parse.` : productTypes.size ? "All observed JSON-LD blocks parsed." : "No JSON-LD blocks observed.",source:"HTML script[type=application/ld+json]"},
  ];
  const weights: Record<string,number> = {http:15,canonical:7,title:5,description:3,h1:4,product:18,offer:18,availability:8,org:5,breadcrumb:4,checkout:5,jsonld:8};
  let score = 0;
  for (const check of checks) {
    const weight = weights[check.id] ?? 0;
    if (check.status === "pass") score += weight;
    if (check.status === "warn") score += Math.round(weight * 0.35);
    if (check.status === "unknown") score += Math.round(weight * 0.2);
  }
  score = Math.max(0,Math.min(100,score));
  const limitations = [
    "This is a heuristic based on one bounded HTML response, not an official standard or certification.",
    "Client-rendered JavaScript, geographic/personalized pricing, login-gated offers, image-only prices and later redirects may not be visible.",
    "A visible cart/checkout link is not evidence that checkout will succeed; no forms, login, checkout or transactions were attempted.",
    "Structured data can be syntactically valid yet inaccurate or misleading. Compare with the live offer before acting.",
    "No search ranking, AI recommendation, stock availability, delivery, or purchase outcome is guaranteed.",
    "The scanner does not execute JavaScript or inspect private seller systems."
  ];
  const consistencyStatus = flags.some(f=>f.includes("differs")) ? "mismatch" : price && currency && hasProduct ? "consistent" : "insufficient_evidence";
  return {
    service:"OfferProof",version:"0.1.0",checkedAt,inputUrl:rawUrl,finalUrl,httpStatus:status,elapsedMs,score,
    scoreNote:"Heuristic completeness score, not a purchase-safety certification.",
    facts:{
      title:{value:title,source:title ? "HTML title" : null},
      productName:{value:productName,source:productNameSource},
      description:{value:schemaDescription,source:product?.description ? "JSON-LD Product" : metaDescription ? "HTML meta description" : null},
      price:{value:price || metaPrice,currency:currency || metaCurrency,source:price ? "JSON-LD Offer" : metaPrice ? "Open Graph/microdata price candidate" : null},
      availability:{value:availability,source:availability ? "JSON-LD Offer" : null},
      canonicalUrl,productTypes:productTypeList,checkoutLinksObserved
    },
    consistency:{status:consistencyStatus,flags},
    checks,
    limitations
  };
}

export async function auditPublicOffer(rawUrl: string): Promise<OfferProofReport> {
  const started = Date.now();
  const checkedAt = new Date().toISOString();
  const target = await validatePublicTarget(rawUrl);
  const robotsUrl = new URL("/robots.txt", target.url);
  const robotsTarget: SafeTarget = { ...target, url: robotsUrl };
  const robots = await boundedFetch(robotsUrl, robotsTarget, "text");
  if (robots.status === 403) {
    throw new PublicFetchError("ROBOTS_FORBIDDEN", "The site's robots.txt denies automated access; scan stopped.", 403);
  }
  if (robots.status >= 200 && robots.status < 300 && robotsDisallowsPath(robots.text, target.url.pathname + target.url.search)) {
    throw new PublicFetchError("ROBOTS_DISALLOW", "The site's robots.txt disallows OfferProof from reading this path; scan stopped.", 403);
  }
  const fetched = await boundedFetch(target.url, target, "html");
  if (fetched.status < 200 || fetched.status >= 300) throw new PublicFetchError("HTTP_ERROR", `The target returned HTTP ${fetched.status}.`, 422);
  const elapsed = Date.now() - started;
  return buildOfferReport(rawUrl, target.url.toString(), fetched.status, fetched.text, elapsed, checkedAt);
}
