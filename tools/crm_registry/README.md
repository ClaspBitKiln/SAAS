# Company registry preview (EspoCRM pilot)

Standalone Python stdlib adapter; no CRM writes, email sending, model calls or new dependencies. It supplements the chosen ready CRM's native intake rather than implementing another CRM. It is a CLI component, not a button integrated into EspoCRM.

## Contract

The caller supplies an existing Account snapshot with `id` and `cInn`, plus an INN. The adapter validates Russian 10/12-digit checksums, requires the snapshot INN to match, and accepts only exact provider INN matches. Multiple matching branches require an explicit KPP. Empty/not-found responses do not become fabricated facts.

Output separates proposed values, empty-field-only patch and preserved manager fields; it always requires review and reports `applied:false`. It does not infer phone, email, website, creditworthiness or confidence. Full registry address is retained as a complete string; no city/street parsing is guessed.

Source URL, processing/observation time and response origin are included. `saved-response-unverified` means a supplied local JSON file: timestamp denotes processing, not verified source freshness. Such a file is not proof of a current registry lookup. Existing CRM snapshot consistency/tenant permissions belong to the caller; matching cInn alone is not tenant authorization.

## Usage

```bash
python3 -m unittest discover -s tools/crm_registry -v

# Actual DaData request; key must already be injected, never put it on command line.
python3 tools/crm_registry/preview.py --inn 7707083893 --account /path/to/account.json

# Offline preview: result is explicitly labelled saved-response-unverified.
python3 tools/crm_registry/preview.py --inn 7707083893 \
  --account /path/to/account.json --response /path/to/saved-response.json
```

No key in chat, Git or output. urllib uses configured proxy/CA; no TLS/checksum bypass. Operational errors do not echo provider payloads or secrets. The live request timeout is 15 seconds, response size limit 2 MiB. Provider failure exits nonzero without applying data. Live DaData remains unverified in this environment because the proxy denies its domain.

`local_smoke.py` targets only the isolated pilot at loopback port8090. It reads `ESPO_RESEARCH_PASSWORD`, checks native Metadata, creates `cInn` with the supported FieldManager API if absent, creates a unique synthetic Account, and previews a clearly synthetic provider response. It verifies no registry address/name update occurred. This is local CRM integration evidence, not live registry evidence. Run only against the disposable pilot:

```bash
set -a
. /workspace/research/espo-runtime/.env
set +a
python3 tools/crm_registry/local_smoke.py
```

Field definition request uses `name: inn`; Espo adds the `c` prefix. Do not submit `cInn` as the creation name. FieldManager's GET for a missing field returns500 in tested10.0.11, so absence is checked through Metadata instead. The smoke never changes an existing incompatible field or a production instance.

## Pilot currency configuration correction

Setting only defaultCurrency=RUB while baseCurrency/list remain USD causes Currency/DatabasePopulator rebuild failure. Local pilot is now single-currency RUB using supported config:set commands:

```bash
cd /workspace/research/espo-runtime
docker compose -p rea-espo exec -T crm bin/command config:set currencyList '["RUB"]' --type=json
docker compose -p rea-espo exec -T crm bin/command config:set baseCurrency RUB
docker compose -p rea-espo exec -T crm bin/command config:set defaultCurrency RUB
docker compose -p rea-espo exec -T crm bin/command rebuild
```

This is a local setup correction with no real monetary records, not a currency conversion or an instruction to migrate production financial data. No cross-currency rates were invented.

## Before adding write-back

A separate review/apply operation must reload the authorized Account, recompute the empty-field patch, and send its current versionNumber via X-Version-Number. On409, reread/review; never retry an old patch blindly. Source facts are evidence, not a blanket verifiedAt for every contact field. Scheduled collection, durable retries and web UI integration are not implemented here.
