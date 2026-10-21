# TRIZ / inventive-operator design brief — autonomous revenue machine

Date: 2026-10-21. This is a hypothesis portfolio, not a revenue forecast. The brief intentionally scores the revenue mechanism and product physics first; distribution channel ranking is out of scope per the founder's direction.

## 1. The contradiction

AI agents are increasingly able to execute multi-step work, but each new paid service often expects a human to create an account, enter billing details, store API keys, or negotiate a contract. x402 is an open HTTP-native payment standard designed for programmatic payments. Its official site reports 75.41M transactions, $24.24M volume, 94.06K buyers and 22K sellers in the last 30 days at the time of research. These are ecosystem totals, not proof that a new product will earn revenue.

At the same time, agents acting on public pages must distinguish product facts from markup, stale data, inconsistent price/availability, blocked pages, and unknowns. A merchant-readiness audit is already a crowded and increasingly commoditized formulation; competitors publicly list free scans and paid plans from $7.99–$9/month, and some agencies quote $2,250+ for human-led audits. Do not build yet another generic readiness-score clone.

## 2. TRIZ application

### Ideal Final Result (IFR)
An authorized buyer agent receives a compact, timestamped, evidence-bearing product-offer fact packet in one HTTP call and pays only when the service successfully returns it. No account, sales call, subscription, human analysis or API key handoff is required. The service performs only bounded read-only checks and does not purchase products, log in, or execute page-provided code.

### Contradictions
- **More verification vs. lower latency/cost:** use one bounded fetch, parse already-present public markup, and return explicit confidence/unknowns instead of expensive model reasoning.
- **More automation vs. safety:** allow public pages only; block private/reserved addresses; do not submit forms, log in, or call seller business APIs.
- **Low-friction purchase vs. monetization:** use pay-per-success HTTP-native micropayments rather than a human checkout or subscription.
- **Comprehensive report vs. trustworthy claims:** report observed fields, source snippets and timestamps; label unavailable values unknown; do not infer a price or guarantee that a product is buyable.
- **Useful free test vs. abuse risk:** provide a static example and a bounded health/metadata endpoint; payment-gate the compute-heavy audit endpoint after a receive wallet and mainnet configuration are authorized.

### Relevant inventive principles
1. **Segmentation:** separate buyer-agent verification from merchant SEO/readiness products.
2. **Prior action:** verify the offer before an agent recommends or buys it.
3. **Feedback:** later add a recheck/diff endpoint only after one-shot demand is demonstrated.
4. **Universality:** support ordinary HTTP/HTML and common Product/Offer JSON-LD first; add platform integrations only when earned.
5. **Intermediary:** act as a neutral verification layer between a buyer agent and a merchant page.
6. **Parameter change:** replace monthly seats and human account setup with one successful request = one micro-payment.
7. **Self-service:** return a predictable JSON schema and example call; no human fulfillment.
8. **Local quality:** constrain scope to an individual product offer, its price/currency/availability, canonical page and explicit source evidence.
9. **Taking out / trimming:** do not build a marketplace, account system, chatbot, AI content generator, or complete web crawler into v1.
10. **Feedback and preflight:** include separate fields for tested, missing, and unknown rather than a misleading binary "safe/unsafe" score.

## 3. Candidate concepts (initial qualitative score, 0–5 per dimension)

Weights are deliberately qualitative; scores are hypotheses to be tested, not market facts. Dimensions: severity/urgency, measurable output, autonomous fulfillment, low marginal cost, one-shot self-service monetization, low ongoing support, distinct value, lower competition/legal risk.

| Candidate | Severity | Output clarity | Autonomy | Cost | Pay-per-use fit | Support | Distinct value | Risk-adjusted total / 40 | Verdict |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **OfferProof: buyer-agent product-offer verification API** | 4 | 5 | 5 | 4 | 5 | 4 | 4 | **31** | Prototype |
| MCP configuration/permission linter | 3 | 4 | 5 | 5 | 3 | 4 | 3 | 27 | Runner-up; strong open-source competition |
| Public API/schema drift and breaking-change diff | 4 | 4 | 5 | 5 | 4 | 3 | 3 | 28 | Runner-up; many mature developer tools |
| Automatic cloud idle-resource recovery | 5 | 5 | 2 | 4 | 4 | 1 | 4 | 25 | Reject for v1: broad permissions and costly mistakes |
| Subscription/duplicate-charge recovery agent | 5 | 4 | 2 | 4 | 3 | 1 | 3 | 22 | Reject: financial access, disputes and KYC |
| Local PDF/file repair engine | 3 | 5 | 5 | 5 | 3 | 4 | 2 | 27 | Possible, but crowded and easy to commoditize |
| DMARC / domain configuration monitor | 4 | 4 | 5 | 5 | 3 | 3 | 2 | 26 | Existing free and low-cost alternatives |
| Alt-text/image bulk enrichment | 3 | 4 | 5 | 3 | 3 | 3 | 2 | 23 | Existing products start around $5–$19/month |
| SEO/schema/readiness scanner for merchants | 3 | 4 | 5 | 4 | 3 | 3 | 1 | 23 | Generic category is already crowded; do not clone |
| Pay-per-call source-backed public fact extraction | 4 | 4 | 4 | 3 | 5 | 3 | 3 | 26 | Keep as a general service pattern, but narrow to offers first |

## 4. Chosen product: OfferProof (working title)

**One sentence:** a low-latency, evidence-bearing API that helps an AI shopping agent verify what one public product page actually says before it compares or purchases.

### User / customer
The direct customer is an automated shopping, sourcing or catalog-validation agent that can use an authorized wallet and wants a consistent, typed result. Human developers can use the same endpoint during testing.

### Why this is not a generic site readiness scanner
Generic merchant-side readiness tools tell the seller how to optimize their store. OfferProof serves the buyer side and compares observed visible text with JSON-LD Offer data. Its output is product facts + provenance + mismatch flags, not a promise of AI-search ranking.

### v1 input/output
Input: one product-page URL, plus an optional currency preference (never treat it as source truth).

Output JSON:
- requested URL, final canonical URL, checked_at, HTTP status
- visible product name, page title and a short excerpt
- structured Product/Offer name, price, currency and availability if present
- observed price/availability candidates from structured data vs. visible page
- mismatch flags and a documented confidence label
- source evidence: where each field came from (JSON-LD, Open Graph or visible markup)
- unknowns, fetch warnings, content limitations and elapsed time
- no unsupported "buyability" guarantee, no investment/security/legal advice, no purchase attempt.

### Safety envelope
Read-only public HTTPS pages only in production; block localhost, private/reserved IP literals and DNS resolutions; deny redirects to private addresses; use bounded time/body size; allow only HTML content; never submit forms, authenticate, execute page JavaScript, read arbitrary files, scan arbitrary ports or call internal APIs. This is not a malware or security scan. A production implementation needs a robust resolver/pinned-connection or trusted fetch sandbox to close DNS-rebinding edge cases before unrestricted public deployment.

### Monetization hypothesis
- $0.01 per successful OfferProof request (x402, stablecoin on a supported network). This is a pricing hypothesis, not evidence of actual sales.
- Do not charge failed/invalid requests; x402 route wrappers should settle only a successful response.
- Later offer a bulk batch endpoint only if repeated use is observed.
- Avoid subscriptions and mandatory account creation at first.
- Gross revenue scenarios, before chain/hosting cost: 50,000 successful calls = $500 at $0.01; 1,000 = $10; 0 = $0. Do not assume any call volume.

### Hard truth
x402 may remove checkout friction for a machine, but it does not create demand. A public receive wallet and production configuration are required before accepting real payments. The wallet owner, account access and legal/tax obligations cannot safely be invented or silently assumed by an assistant. Until configured and verified, keep live payments disabled and report zero revenue.

## 4A. Red-team update — 2026-10-21

Current primary-source checks confirm the market is already active and the generic idea would be a weak clone:
- Santos exposes a public API that costs **0.015 USDC per quick audit** and **0.075 USDC per full Agent Readiness audit**, paid per successful call with x402: https://api.santosautomation.com/docs and https://api.santosautomation.com/agent-readiness-audit
- AgentReady offers free audits and paid Shopify plans at **$9/month, $29/month and $79/month**, including publishing, maintenance and drift detection: https://joinagentready.com/pricing

Therefore OfferProof should not position itself as a broad readiness audit. The narrower hypothesis is **buyer-side cross-source offer consistency**: detect conflicts between Product/Offer structured values and other observable price/currency signals, and return field-level evidence for a downstream agent. The proposed **$0.01 per successful request** is a price test below Santos's $0.015 quick audit, not a proven advantage or demand signal.

At $0.01, reaching $500 gross requires **50,000 successfully paid requests**, before fees and tax. That is a demanding target. The current implementation should be treated as a technical prototype until the narrower mismatch coverage is tested on public pages and an independent buyer-agent actually pays and repeats. If it cannot outperform a general audit for the specific job, stop or pivot instead of adding features.

## 5. Stop/go gates

1. **Build gate:** scanner works on at least 20 publicly accessible test fixtures across common valid/invalid/missing schema cases; URL safety tests pass.
2. **Truth gate:** every returned claim is traceable to the fetched public HTML, not model invention. Score logic and missing-data treatment are documented.
3. **Payment gate:** x402 testnet flow succeeds before mainnet; mainnet only with owner-provided receiving address and authorized environment values. Verify payment settlement and successful response before claiming revenue.
4. **Cost gate:** cap response body, concurrency, request rate and function time. Set a daily spend ceiling. Prefer no LLM call in v1.
5. **Demand gate:** inspect real paid-call evidence, distinct buyers and repeats. If no successful paid calls after 30 days of legitimate exposure, do not endlessly add features; reassess value and maybe switch to a better-ranked concept.
6. **Safety gate:** suspend immediately if SSRF guard, payment settlement, output integrity, or cost cap fails.

## 6. Sources reviewed
- x402 official overview and live ecosystem metrics: https://x402.org/
- x402 official seller implementation guide (wallet prerequisite, testnet vs mainnet, middleware): https://docs.x402.org/getting-started/quickstart-for-sellers
- Coinbase/CDP Bazaar docs for machine discovery/calling of paid endpoints: https://docs.cdp.coinbase.com/api-reference/v2/rest-api/x402-facilitator/bazaar-mcp-server
- Existing $1-per-call site readiness audit example: https://x402.new/services/oblique-markets-api-v1-paid-agent-readiness-audit
- Existing API with stated $0.015 / $0.075 USDC audit prices: https://www.santosautomation.com/agent-readiness-audit
- Existing merchant readiness products list paid subscriptions: https://joinagentready.com/pricing and https://apps.shopify.com/agentreadyapp
- Google structured data testing guidance (important to differentiate SEO structured-data compliance from actual agent purchase readiness): https://developers.google.com/search/docs/appearance/structured-data
- TRIZ business-model design case: https://the-trizjournal.com/using-triz-create-innovative-business-models-products/
