export const metadata = {
  title: "Methodology — OfferProof",
  description: "What OfferProof observes, scores and cannot verify."
};

export default function MethodologyPage() {
  return <main className="wrap methodologyPage">
    <a className="brand" href="/"><span className="brandMark">O</span> OfferProof</a>
    <div className="eyebrow">METHOD / LIMITATIONS</div>
    <h1>Evidence first.<br/><em>No invented certainty.</em></h1>
    <p>OfferProof reads one public HTTPS product page and returns facts that were observable in the HTML response. It does not log in, execute page JavaScript, submit forms, click checkout, or place an order.</p>
    <h2>What the first version checks</h2>
    <ul>
      <li>HTTP response and HTML title.</li>
      <li>Canonical URL, meta description and first H1.</li>
      <li>JSON-LD Product, ProductGroup, Offer, Organization and BreadcrumbList objects when present.</li>
      <li>Price, currency and availability fields explicitly supplied by Product/Offer structured data.</li>
      <li>Observable Open Graph/microdata price candidates and mismatches against structured Offer values.</li>
      <li>Text/URL patterns that look like cart or checkout links. These links are never clicked.</li>
    </ul>
    <h2>How the score works</h2>
    <p>The 0–100 completeness score is a private heuristic whose weights are documented in the source code. A passing item adds its full weight, a warning adds a fraction, and an unknown adds only a small fraction. The score is not an official certification, ranking factor, purchase guarantee or measure of business quality.</p>
    <h2>Privacy and safety</h2>
    <p>Only public HTTPS URLs are accepted. The API rejects local/private/reserved address targets, pins the vetted DNS result for the fetch, blocks redirects and caps body size and time. It does not request credentials. The initial version should be kept behind x402 payment configuration before public use; additional rate-limiting and external security review remain production gates.</p>
    <h2>What can be wrong or missing</h2>
    <p>Client-rendered JavaScript, regional pricing, cookies, logged-in stock, variant selection, image-only data, robots restrictions, transient page errors and seller-side changes may not be visible. Structured data can be wrong while syntactically valid. An unknown field means unknown, not false. Always verify before a consequential purchase.</p>
    <p><a className="primary" href="/">Back to OfferProof</a></p>
  </main>;
}
