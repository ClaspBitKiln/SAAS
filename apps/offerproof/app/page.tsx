"use client";

import { useState } from "react";

const sample = {
  service: "OfferProof",
  version: "0.1.0",
  checkedAt: "2026-10-21T12:00:00.000Z",
  inputUrl: "https://shop.example/products/blue-trail-shoe",
  finalUrl: "https://shop.example/products/blue-trail-shoe",
  httpStatus: 200,
  elapsedMs: 384,
  score: 86,
  scoreNote: "Heuristic completeness score, not a purchase-safety certification.",
  facts: {
    title: { value: "Blue Trail Shoe", source: "HTML title" },
    productName: { value: "Blue Trail Shoe", source: "JSON-LD Product" },
    description: { value: "Lightweight shoe for trail running.", source: "JSON-LD Product" },
    price: { value: "89.00", currency: "USD", source: "JSON-LD Offer" },
    availability: { value: "InStock", source: "JSON-LD Offer" },
    canonicalUrl: "https://shop.example/products/blue-trail-shoe",
    productTypes: ["Product", "Offer", "Organization", "BreadcrumbList"],
    checkoutLinksObserved: 1
  },
  consistency: { status: "consistent", flags: [] },
  checks: [
    { id: "product", label: "Product structured data", status: "pass", detail: "A Product JSON-LD object was parsed.", source: "JSON-LD" },
    { id: "offer", label: "Offer price and currency", status: "pass", detail: "Structured Offer states 89.00 USD.", source: "JSON-LD Offer" },
    { id: "availability", label: "Structured availability", status: "pass", detail: "InStock observed.", source: "JSON-LD Offer" },
    { id: "checkout", label: "Cart/checkout link", status: "pass", detail: "1 candidate checkout link observed. Not clicked.", source: "HTML links" }
  ],
  limitations: [
    "This is a demonstration fixture, not the result of a live scan.",
    "A visible cart link is not proof that checkout will succeed; no transaction was attempted."
  ]
};

export default function Home() {
  const [showSample, setShowSample] = useState(false);
  const [status, setStatus] = useState<string>("not checked");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [schemaInput, setSchemaInput] = useState<string>(JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Example product",
    "offers": {
      "@type": "Offer",
      "price": "29.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  }, null, 2));
  const [schemaResult, setSchemaResult] = useState<Record<string, unknown> | null>(null);

  const curlCommand = 'curl -X POST "$OFFERPROOF_URL/api/offer-proof" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"url":"https://shop.example/products/example"}\'';
  async function copyCurl() {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  async function checkStatus() {
    setBusy(true);
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      const data = await response.json();
      setStatus(data.paymentsEnabled ? "payment gate configured" : "payments not configured");
    } catch {
      setStatus("API unreachable");
    } finally {
      setBusy(false);
    }
  }

  function validateSchemaLocally() {
    try {
      const parsed: unknown = JSON.parse(schemaInput);
      const nodes: Array<Record<string, unknown>> = [];
      const walk = (value: unknown) => {
        if (Array.isArray(value)) {
          value.forEach(walk);
        } else if (value && typeof value === "object") {
          const object = value as Record<string, unknown>;
          nodes.push(object);
          Object.values(object).forEach(child => {
            if (child && typeof child === "object") walk(child);
          });
        }
      };
      walk(parsed);
      const types = (object: Record<string, unknown>) => {
        const raw = object["@type"];
        return (Array.isArray(raw) ? raw : [raw]).filter((item): item is string => typeof item === "string");
      };
      const product = nodes.find(object => types(object).some(type => type === "Product" || type === "ProductGroup"));
      const embeddedOffers = product?.offers;
      const offer = (Array.isArray(embeddedOffers) ? embeddedOffers[0] : embeddedOffers) as Record<string, unknown> | undefined
        ?? nodes.find(object => types(object).includes("Offer"));
      const priceValue = offer?.price ?? (offer?.priceSpecification as Record<string, unknown> | undefined)?.price ?? null;
      const currency = typeof offer?.priceCurrency === "string" ? offer.priceCurrency : null;
      const availability = typeof offer?.availability === "string" ? offer.availability.split(/[\\/#]/).pop() : null;
      const flags: string[] = [];
      if (!product) flags.push("No Product/ProductGroup object was found.");
      if (!offer) flags.push("No Offer object was found.");
      if (priceValue === null) flags.push("No explicit price was found.");
      if (!currency) flags.push("No priceCurrency was found.");
      if (!availability) flags.push("No availability was found.");
      setSchemaResult({
        validJson: true,
        productFound: Boolean(product),
        productName: typeof product?.name === "string" ? product.name : null,
        offerFound: Boolean(offer),
        price: priceValue === null ? null : String(priceValue),
        currency,
        availability: availability || null,
        typesFound: [...new Set(nodes.flatMap(types))],
        warnings: flags,
        privacy: "Processed locally in this browser. No request was sent to a server."
      });
    } catch (error) {
      setSchemaResult({
        validJson: false,
        error: error instanceof Error ? error.message : "Invalid JSON",
        privacy: "Processed locally in this browser. No request was sent to a server."
      });
    }
  }

  return (
    <main>
      <nav className="nav wrap">
        <a className="brand" href="/" aria-label="OfferProof home"><span className="brandMark">O</span> OfferProof</a>
        <div className="navRight"><a href="#free-check">Free check</a><a href="#how">How it works</a><a href="#api">API</a><a href="#limits">Limits</a></div>
      </nav>

      <section className="hero wrap">
        <div className="heroCopy">
          <div className="eyebrow"><span className="pulse" /> BUILT FOR MACHINE BUYERS</div>
          <h1>Verify the offer<br/><em>before</em> the agent acts.</h1>
          <p className="lead">One bounded read of a public product page. A structured packet of product facts, price, availability, and evidence — designed for an AI agent that needs to make a better next decision.</p>
          <div className="heroActions">
            <a className="primary" href="#api">Use the API <span aria-hidden="true">↗</span></a>
            <button className="secondary" onClick={() => setShowSample(v => !v)}>{showSample ? "Hide sample" : "See sample output"}</button>
          </div>
          <div className="factsStrip">
            <div><strong>$0.01*</strong><span>per successful request</span></div>
            <div><strong>No account</strong><span>protocol-native payment</span></div>
            <div><strong>Read only</strong><span>never places an order</span></div>
          </div>
          <p className="priceNote">*Pricing hypothesis, deliberately below the observed $0.015 quick-audit competitor. Live requests remain disabled until the operator configures and verifies a receiving wallet and payment facilitator.</p>
        </div>
        <div className="heroVisual" aria-label="Conceptual diagram of a product page being checked">
          <div className="orbit orbitA" /><div className="orbit orbitB" />
          <div className="docCard">
            <div className="docTop"><span className="dots"><i/><i/><i/></span><span className="docURL">/products/item</span><span className="lock">↗</span></div>
            <div className="productMock"><div className="productShape"><div className="shoe"><span/></div></div><div className="mockLines"><span className="line long"/><span className="line medium"/><span className="mockPrice">$89.00 <small>USD</small></span><span className="stock"><b/> In stock · observed</span></div></div>
          </div>
          <div className="proofCard"><div className="proofIcon">✓</div><div><strong>Facts reconciled</strong><span>JSON-LD ↔ page signals</span></div><span className="proofState">EVIDENCE</span></div>
          <div className="microLabel labelA">SOURCE: PRODUCT SCHEMA</div><div className="microLabel labelB">READ-ONLY CHECK</div>
        </div>
      </section>

      {showSample && <section className="wrap sampleSection">
        <div className="sampleHeading"><div><div className="eyebrow">DEMO FIXTURE</div><h2>What the agent receives</h2></div><span className="sampleBadge">SYNTHETIC SAMPLE — NOT A LIVE SCAN</span></div>
        <pre className="sampleJson">{JSON.stringify(sample, null, 2)}</pre>
      </section>}

      <section className="localCheck wrap" id="free-check">
        <div className="localIntro">
          <div className="eyebrow">FREE · IN-BROWSER</div>
          <h2>Check a Product/Offer snippet — without uploading it.</h2>
          <p>Paste JSON-LD from a product page. OfferProof parses the fields locally, shows missing values, and never sends the snippet to a server. This checks syntax and presence only; it cannot establish that the seller's offer is truthful.</p>
        </div>
        <div className="localTool">
          <label htmlFor="schemaInput">Product JSON-LD</label>
          <textarea id="schemaInput" spellCheck={false} value={schemaInput} onChange={event => setSchemaInput(event.target.value)} />
          <div className="localActions">
            <button className="primary" onClick={validateSchemaLocally}>Validate locally</button>
            <button className="secondary" onClick={() => setSchemaInput("")}>Clear</button>
          </div>
          {schemaResult && <pre className="localResult">{JSON.stringify(schemaResult, null, 2)}</pre>}
          <p className="localPrivacy"><span>●</span> Local-only processing. No login, no file upload, no telemetry from this tool.</p>
        </div>
      </section>

      <section className="method" id="how">
        <div className="wrap">
          <div className="sectionIntro"><div className="eyebrow">ONE JOB, DONE WELL</div><h2>A small verification layer between the agent and the product page.</h2><p>Not a search engine, not a store, and not a checkout bot. OfferProof returns what it can actually observe — and marks the rest as unknown.</p></div>
          <div className="threeSteps">
            <article><span className="stepNo">01</span><div className="stepIcon">↗</div><h3>Read one public page</h3><p>HTTPS only, bounded response size and runtime, no login, no form submission, no checkout attempt.</p></article>
            <article><span className="stepNo">02</span><div className="stepIcon">{ }</div><h3>Compare claims</h3><p>Extract Product/Offer JSON-LD and observable page signals. Flag price or currency discrepancies where evidence exists.</p></article>
            <article><span className="stepNo">03</span><div className="stepIcon">≋</div><h3>Return evidence</h3><p>Typed JSON, timestamp, source labels, confidence limitations and explicit unknowns — ready for the calling agent.</p></article>
          </div>
        </div>
      </section>

      <section className="apiSection wrap" id="api">
        <div className="apiIntro"><div className="eyebrow">MACHINE-TO-MACHINE COMMERCE</div><h2>Pay only when a useful response succeeds.</h2><p>OfferProof is designed for x402-compatible clients. The HTTP 402 handshake advertises the price; an authorized client can pay and retry without creating an API account.</p><div className="apiStatus"><span className="statusDot"/><span>Runtime status: <strong>{status}</strong></span><button onClick={checkStatus} disabled={busy}>{busy ? "Checking…" : "Check API"}</button></div><p className="priceNote">The current workspace has not configured a live payment destination. A status check does not send or receive money.</p></div>
        <div className="codeCard"><div className="codeTop"><span><i/> REQUEST EXAMPLE</span><span className="codeLang">CURL</span></div><pre><code>{curlCommand}</code></pre><button className="copyButton" onClick={copyCurl}>{copied ? "Copied ✓" : "Copy request"}</button><div className="codeFoot"><span>POST /api/offer-proof</span><span>JSON response</span></div></div>
      </section>

      <section className="limitsSection" id="limits"><div className="wrap limitsGrid"><div><div className="eyebrow">TRUST OVER MAGIC</div><h2>What it does not claim.</h2></div><div className="limitList"><p><b>Not a guarantee.</b> A correct schema does not prove that a product is in stock, that a price applies to your location, or that checkout works.</p><p><b>Not an official score.</b> The completeness score is our own heuristic, not a search-engine standard or security certification.</p><p><b>Not a purchasing agent.</b> It does not log in, submit forms, interact with cart/checkout, execute website JavaScript, or make transactions.</p><p><b>Not an unrestricted crawler.</b> Requests are bounded and private/reserved targets are rejected. Full production use requires continued SSRF and rate-limit testing.</p></div></div></section>

      <footer className="wrap footer"><a className="brand" href="/"><span className="brandMark">O</span> OfferProof</a><span>Evidence-first facts for autonomous agents.</span><div><a href="/methodology">Methodology</a><a href="/api/health">API status</a></div></footer>
    </main>
  );
}
