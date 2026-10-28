# Magic Metal: evidence audit, 2026-10-28

Scope: source inspection, targeted existing pure-logic tests and local deterministic probes. No website deployment, real request, SMTP message, supplier query, REA run, or tenant-isolation verification performed. Checkout remains unchanged.

## Revisions

- `main`: `02984205f8826610e0bec89b561d6f9964e09d4d`.
- `rfq-workbench-mvp`: `9076da450939425f58a53f25bb628e7b249bdf92` (2026-09-16).
- `feat/auto-quote-engine-v2`: `5082d41dfaaa257ca4d226c1202c4ca7d6cbd4dd` (2026-09-09).
- License: root package.json declares MIT. Do not infer rights over external supplier/catalog material from this declaration.

## What exists and what can be reused

| Area | Evidence at main, unless noted | Verified status | Decision |
|---|---|---|---|
| Website intake and original files | `src/app/(frontend)/api/request/route.ts:POST`, `src/collections/Requests.ts`, `RequestFiles.ts`: validates consent/contact, 4 MB aggregate file cap, signature/extension checks, persists files then request using Payload | PARTIAL: source reviewed; actual DB, SMTP and webhook not exercised | ADAPT API boundary; keep website independent |
| Excel/PDF ingestion | Intake accepts and retains XLSX/PDF; inspected intake/procurement paths do not parse their content; `normalizeRFQ` accepts text | PARTIAL; document recognition not demonstrated | Reuse upload requirements, use SAAS parser through explicit contract |
| RFQ normalization | `src/lib/procurement/normalize.ts:normalizeRFQ`, `types.ts:NormalizedField`: per-field raw/value/confidence, grade/standard/size/quantity extraction | WORKING for tested pure-logic cases, not general document recognition | ADAPT field evidence pattern; confidence means rule presence, not calibrated probability |
| Identity matching | `productIdentity.ts:buildProductIdentityKey`, `payloadAdapter.ts`: normalized product/designation/standard/dimensions | NOT VERIFIED as complete identity: grade/coating are not separate identity fields | ADAPT only after explicit grade/coating/unit requirements |
| Supplier catalog adapters | `payloadAdapter.ts`, `routeRegistry.ts`, `logisticsRegistry.ts`, `SupplierSources.ts`, `SupplierOffers.ts` | PARTIAL: code and fixtures, actual commercial data not verified | ADAPT source lineage and freshness; catalog entries do not prove stock |
| Procurement scoring and risk | `ranking.ts:rankOffers`, `risk.ts:assessOfferRisk`, `reliability.ts` | WORKING for targeted tested cases, unsafe general readiness gate remains | ADAPT with mandatory blockers, reject risk-count readiness |
| Margin | `margin.ts:calculateMargin/calculateMinimumSellingPrice` | WORKING for 6 existing tests | ADAPT deterministic distinction margin vs markup |
| Quote boundary | `quote.ts:buildClientQuote` removes internal supplier/purchase/margin fields | WORKING for 3 tests; unknown selling price represented as numeric 0 plus warning | ADAPT redaction, REJECT unknown=0 representation |
| Agents | `agentBridge.ts:createProcurementTask/runProcurementAgent`, `agentSwarm.ts` | PARTIAL: typed task/results/evidence and deterministic roles exist; not proof of autonomous external procurement or safe LLM runtime | ADAPT evidence contracts, not permissions implementation |
| RFQ workbench branch | `src/lib/procurement/workbench.ts:evaluateOption/tons/compareOptions`, `RFQWorkbench.tsx`, API search route; branch-only diff 35 files +2213/-133 | PARTIAL: additional UI/manual review and tests exist, branch app not run | ADAPT explicit price/stock/expenses/source confirmation |
| Auto-quote branch | `src/lib/tubeMaster.ts:matchesCapability/matchesOffer/rankOffers`, `DealCalculationDashboard.tsx`, internal tubes route; branch-only diff 19 files +1539/-2 | PARTIAL, matching defect reproduced below | ADAPT distinction capability vs offer; REJECT early-return matching and comparing incomparable raw prices |

## Confirmed defects and gaps

1. **Unknown costs become zero.** `main:src/lib/procurement/landedCost.ts:calculateLandedCost` defaults every omitted expense with `?? 0`. Local execution with `{purchase:100}` returns `freight:0`, all other expenses 0, `total:100`. This violates the requested unknown-cost rule. Require each expense to have unknown/confirmed/not-applicable state; calculate final margin only when required costs are confirmed.
2. **Price confirmation is not stock confirmation.** `main:src/lib/procurement/payloadAdapter.ts` maps source `availability: 'price-confirmed'` to `'in-stock'` and confidence 0.98. This is a source-level finding; real supplier availability was not checked. Split price and stock evidence.
3. **Ranking can recommend incomplete offers.** `main:ranking.ts` recommends first-ranked result when `risks.length < 3`; this is not a mandatory-price/stock/cost gate. The RFQ branch improves `isPurchasable` (rejects missing price/unknown stock/unresolved match/stale price or availability), but `landedCost` still zero-fills missing expenses. Do not wholesale merge either scoring path.
4. **Capability exact-size shortcut bypasses grade and standard.** At `5082d4...:src/lib/tubeMaster.ts:matchesCapability`, a matching `specificSizes` entry returns true before grade/standard validation. Local execution using 219x8, requested 09Г2С/ГОСТ 8732 and capability steel 20/ASTM A106 returned `true`. Treat as BROKEN for this negative case. `matchesOffer` performs explicit grade/standard comparisons separately.
5. **Unit/currency comparison boundary incomplete.** Auto-quote `rankOffers` sorts raw numeric prices without converting price basis/currency. Main Offer has `unit`/currency but no distinct priceUnit/priceBasis. RFQ `workbench.ts:tons` correctly maps 2000 кг → 2 т and refuses 20 м; local execution confirmed both. Preserve refusal of dimensional conversions without verified mass-per-length/piece data.
6. **Webhook delivery lacks durable retry/replay/idempotency.** Main `POST` optionally sends HMAC SHA256 of raw JSON in `x-magicmet-signature`; signature optional if secret absent, request ID may be null when persistence fails; no event ID, timestamp signature header, durable outbox or idempotency key in inspected route. `crmDelivered` only records HTTP success.
7. **Website authentication is not SaaS isolation.** `Requests.ts`/`RequestFiles.ts` use `isAuthenticated`, not tenant predicates. These collections should stay website-owned. Do not reuse as a multi-tenant CRM repository.
8. Request in-memory rate limiting is per-process; upload stream is parsed before checking actual total bytes when Content-Length absent. Signature checks are not antivirus or archive-bomb protection.

## Tests actually executed

Existing `main` suites: `tests/int/procurement-engine.int.spec.ts` 5, `procurement-margin.int.spec.ts` 6, `procurement-risk.int.spec.ts` 7, `procurement-quote.int.spec.ts` 3. **4 files, 21 tests passed**, 2026-10-28 14:47 UTC (19:47 Asia/Yekaterinburg), 583 ms runner duration. Dependencies of full website were not installed: used already-installed SAAS Vitest 2.1.9 with temporary config `/tmp/magic-audit-vitest.mjs`, alias `@` → website src; no website setup file. Website pins Vitest 4.0.18, so this is evidence for selected deterministic functions only, not the official complete website test workflow. Branch test files reviewed but not executed. Negative probes above used Node type stripping on exact source / branch-file copies under /tmp.

## Proposed site → SaaS contract (design, not implemented)

- Website remains owner of public catalog, consent and initial intake. SaaS owns org-scoped CRM processing; never accept tenantId/organizationId from browser fields.
- Server-to-server `POST /api/v1/integrations/magic-metal/requests`; per-site credential maps to exactly one organization. HMAC over timestamp + event ID + exact raw body; constant-time verification, bounded clock skew and persisted replay protection. Require signing, do not silently accept unsigned events.
- Envelope `{schemaVersion,eventId,eventType:'website.request.created',occurredAt,externalRequestId,contact,request,attachments,consent}`. Persist unique `(integrationId,eventId)` plus request and outbox atomically. Duplicate identical event returns original acceptance; conflicting payload → 409.
- Files use server-authorized retrieval or bounded upload; metadata `{externalFileId,name,mime,size,sha256}`. Enforce host allowlist/SSRF protections, count/byte/expansion caps, quarantine scanning, org-bound object keys and download authorization. Do not place private file URLs in browser-readable contracts.
- Return 202 with receiptId only after durable acceptance; website retries transient failures via durable outbox and preserves original request/files. 400 malformed, 401 signature, 409 conflict, 413 limit, 429 retryable. Track delivery state separately from processing state.
- Processing preserves original document and per-field source coordinates, parser/version, completeness and review warnings. Manager confirms uncertain identity/unit, sourcing, costs and external sending. No customer outreach in intake job.

## Next value

First fix price/quantity/basis validation in SAAS with regression tests; then implement signed idempotent website intake and cross-org file/job tests. Reimplement selected principles independently rather than merging historical site branches. No changes to production or repository files made in this audit.
