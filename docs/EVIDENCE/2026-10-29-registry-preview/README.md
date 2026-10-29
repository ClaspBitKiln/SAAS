# Registry preview iteration — 2026-10-29

User direction: wholesale B2B company selling across Russia; base/default currency RUB. Core process is company/customer buyer → request → quote → next action. Prioritize INN/KPP and buyer contacts; do not infer that international or multi-currency sales are required. VAT inclusion/rate, delivery and price units must be explicit; this iteration does not implement tax calculations or guess policy.

Implemented `tools/crm_registry/preview.py`: no new dependencies, validates Russian INN checksums, requires exact CRM account INN and provider match, rejects ambiguous branch matches without KPP, preserves populated CRM fields and outputs only an empty-field preview. Records source, processing time, response origin and mandatory review; no CRM writeback. Saved responses are marked unverified. It does not invent phone/email/website or a confidence percentage.

Validation: 12 unittest cases passed, including CLI saved-response origin, 10/12-digit INN, mismatched account/provider, branch ambiguity, no invented facts, no overwrite and missing values. `local_smoke.py` passed against actual local EspoCRM10.0.11: native custom cInn field, INN roundtrip on unique synthetic Account, source-fixture preview and unchanged address/name after preview. Input fixture uses a valid checksum INN but explicitly synthetic names/address; it is not a real DaData result. No production data/real communications touched.

Runtime findings/corrections:

1. Native FieldManager GET for absent cInn returns500; use Metadata to establish absence, then supported POST fieldManager with name=inn (native prefix adds cInn). No core Espo code patched.
2. The earlier pilot currency setting changed only defaultCurrency to RUB, leaving base/list USD. FieldManager rebuild exposed undefined RUB rate/division-by-zero. Corrected locally with currencyList=[RUB], baseCurrency=RUB, defaultCurrency=RUB, full native rebuild PASS. Single base unit, no invented currency conversions or real financial-record migration.
3. After these setup corrections, local integration smoke and all12 tests passed. See local-result.json and source-review.md; source concurrency notes are not an executed writeback/CAS test.

Live DaData and GitHub API domain probes on2026-10-29 still returned proxy403. Active custom allowlist still empty despite saved draft additions. Live enrichment and PR remain blocked; no credential error inferred from network denial. No confirmation/checksum/TLS bypass.

Limits: CLI preview only; no Espo UI button, apply endpoint, automatic field updates, live registry validation or tenant-isolation test. Whole raw address is suggested in billingAddressStreet, not parsed into guessed city/postcode components. Proposed metadata describes source observation, not verification of every CRM field. Before writeback, implement explicit review, reload/version check and conflict handling.

Working branch feat/crm-registry-preview is stacked on docs/select-ready-crm. Existing ready CRM remains selected, no rewrite of its native LeadCapture/import/contact/quote modules. Next highest value is connecting a real permitted registry source after network settings apply, then adding reviewed writeback and testing the manager's workflow. Required runtime instructions saved in environment draft; save does not apply/publish.
