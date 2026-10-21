# OfferProof — evidence-bearing product-offer API for AI agents

**Status: MVP source in an isolated branch; not yet deployed and not yet earning revenue.** This is an experiment in agent-to-agent commerce, not a business with validated customers.

## The invention

Many AI shopping agents need a compact, structured answer to one question: *what does this product page actually say about this offer right now, and does the page's structured data disagree with other observable page signals?* OfferProof reads one public product page and returns a timestamped JSON evidence packet.

This is deliberately different from a seller-side SEO/readiness agency. It serves the buyer agent with a typed fact result and charges per successful request through x402. It does not guarantee stock, price applicability, checkout success or any AI ranking.

## Current implementation

- Next.js App Router UI and methodology page.
- `POST /api/offer-proof`: accepts JSON `{"url":"https://store.example/products/item"}`.
- Extracts page title, canonical URL, meta description, H1, Product/ProductGroup/Offer/Organization/BreadcrumbList JSON-LD, offer price, currency, availability, Open Graph/microdata price candidates and obvious cart/checkout link candidates.
- Flags disagreements between structured price/currency and observable meta/microdata candidate values.
- Gives an explicit completeness score whose documented weights live in `lib/audit.ts`; the score is not a certification.
- Uses bounded HTTPS fetches, DNS lookup pinning through an Undici dispatcher, checks global routability, rejects private/reserved/local IP targets and non-standard ports, refuses redirects, enforces an 8-second timeout and 1.5 MB response cap, and checks robots.txt before fetching the page.
- x402 route wrapper charges the configured price only for successful responses. Payment acceptance is **disabled by default** and returns a clear 503 until configured.
- `GET /api/health` reports whether payment configuration appears present; it does not prove that a mainnet settlement succeeded.
- Unit tests cover structured facts, mismatch detection, missing data, IP blocking and URL rejection.

## Local development

Requires Node.js 20.18+ (Node 22 is recommended).

```bash
cd apps/offerproof
npm install
cp .env.example .env.local
npm test
npm run typecheck
npm run dev
```

The landing page has a synthetic fixture, clearly labelled as a sample and not a live scan. The paid endpoint intentionally returns `PAYMENTS_NOT_CONFIGURED` by default.

## x402 setup

The official x402 seller guide requires a receiving wallet address, server, and configured payment middleware. Start on Base Sepolia testnet, verify the 402 → payment → successful response path with test funds, then move to mainnet only after the wallet/facilitator and all legal/account requirements are confirmed.

Environment variables:
- `X402_ENABLED=true` explicitly enables the gate.
- `X402_PAY_TO_ADDRESS` is a public EVM receiving address; never enter a private key here.
- `X402_NETWORK=eip155:84532` is Base Sepolia testnet.
- `X402_FACILITATOR_URL=https://x402.org/facilitator` is the testnet facilitator.
- For mainnet Base, use `X402_NETWORK=eip155:8453` and the authorized production facilitator URL in `X402_FACILITATOR_URL`. Do not use the testnet facilitator for mainnet.
- `X402_PRICE_USD=$0.02` is a hypothesis, not a market-validated price.
- `NEXT_PUBLIC_SITE_URL` must be set to the actual HTTPS deployment origin before sitemap output is enabled.

Never commit `.env.local`, real tokens or secrets. The app does not need or accept a wallet private key. A wallet owner still has to choose and authorize the public receiving address; that step cannot be silently inferred.

## Deploy to Vercel

Import the Git repository and set the project Root Directory to `apps/offerproof`. Configure environment variables in the deployment environment. Keep `X402_ENABLED=false` until the main route has passed local tests and an end-to-end testnet payment test. After a successful production build and testnet exercise, set the appropriate receiving address, mainnet network and facilitator. Do not turn on mainnet billing merely because the page builds.

## Revenue math (not a forecast)

At a price hypothesis of $0.02 per successful request:
- 25,000 successful paid requests = $500 gross.
- 1,000 requests = $20 gross.
- zero paid requests = $0.

These figures exclude network costs, hosting, taxes, refunds/failed processing where applicable and any required accounting. The existence of x402 and the fact that competing APIs charge are not evidence that this new endpoint will get 25,000 paid calls. Measure successful unique payers, repeats, output usefulness, response cost and payment settlement. Do not claim revenue until a real settlement is verified.

## Production gates still open

1. Resolve the package tree and get CI typecheck/test/build green.
2. Add persistent rate limits/abuse protection on top of price gating.
3. External review the URL fetcher's DNS/SSRF, parser edge cases, robots behavior, content-size limits and deployment egress rules.
4. Verify the exact x402 facilitator and wallet setup on testnet, then mainnet.
5. Add request-level telemetry with no full URL storage by default; avoid storing product pages or personal data.
6. Register the app's real production URL in environment before sitemap/canonical configuration.
7. Verify paid requests and net economics with actual settlements before deciding whether to continue.

## Non-goals

No scraping behind logins, no private APIs, no form submissions, no automated buying, no broad crawler, no SEO services, no cold outreach and no paid ads. No LLM call is needed for the v1 extraction path.
