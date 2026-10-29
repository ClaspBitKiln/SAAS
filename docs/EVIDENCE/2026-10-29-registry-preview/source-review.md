# EspoCRM 10.0.11: custom Account enrichment fields

Read-only source review at tag `10.0.11`, commit `32d559ba86d3be607599d1325c359668c1178850`. No API/CLI mutations or tests performed by this reviewer.

## Supported admin API, no upstream patch

`application/Espo/Resources/routes.json` declares:
- `POST /Admin/fieldManager/:scope` → FieldManager.create
- `GET /Admin/fieldManager/:scope/:name` → FieldManager.read
- `PUT`/`PATCH /Admin/fieldManager/:scope/:name` → update

With normal API prefix: **POST `/api/v1/Admin/fieldManager/Account`**.

`application/Espo/Controllers/FieldManager.php:checkControllerAccess` requires admin. `postActionCreate` calls tool.create then `dataManager.rebuild([$scope])`; on rebuild error it deletes the new field definition and raises error. Caller should still verify final metadata/schema after failure rather than infer perfect atomic rollback.

Minimal proposed bodies, issued one at a time after checking existing definitions:

```json
{"name":"inn","type":"varchar","maxLength":12,"label":"ИНН","audited":true}
{"name":"registrySource","type":"varchar","maxLength":255,"label":"Источник реквизитов","audited":true}
{"name":"registryCheckedAt","type":"datetime","label":"Реквизиты получены","audited":true}
```

**Important naming:** `Tools/FieldManager/FieldManager.php:create` calls `Tools/EntityManager/NameUtil.php:addCustomPrefix` for standard Account. Default result is `c` + ucfirst(input), so `inn` → `cInn`, `registrySource` → `cRegistrySource`, `registryCheckedAt` → `cRegistryCheckedAt`. Sending `cInn` would yield **cCInn**. If `customPrefixDisabled` is configured, prefix is omitted; verify returned actual names and do not guess. Do not change this global configuration to force a naming scheme.

Check `GET /api/v1/Admin/fieldManager/Account/cInn` etc first, then compare type/maxLength/meaning and reuse compatible fields. Existing incompatible definitions require explicit migration design; do not silently change or delete them. Define INN as string, not int, preserving leading zeros. Enforce RU 10/12-digit/checksum logic in adapter; maxLength alone does not establish tax-ID validity. Do not mark unique/index globally without assessing current duplicates and instance/tenant model.

`registrySource` above is a source label/identifier (e.g. DaData findById party), not URL. If storing a real external URL, use an additional `url` field with allowed scheme/host handling. A single aggregate source+timestamp is NOT per-field lineage/confidence. CheckedAt should record actual provider result retrieval, not manager confirmation unless separately labelled. Do not claim phone/email verified if absent from provider.

Metadata writes are handled by native FieldManager and custom metadata; no upstream file edits needed. New fields aren't automatically proof of good UI layout; native Layout Manager can add them separately after preview flow. No dedicated field-create CLI was found in the inspected commands (EntityUtil/Rebuild exist); the supported admin HTTP endpoint is the clearest route. No need to manually write custom JSON or run a shell command copied from an unrelated Espo version.

## Supported optimistic update

Account metadata (`Modules/Crm/Resources/metadata/entityDefs/Account.json`) has `optimisticConcurrencyControl:true`.

1. GET `/api/v1/Account/{id}`; retain integer `versionNumber` and the exact fields proposed for change.
2. Send minimal PUT/PATCH Account payload with only intended updates, plus HTTP **`X-Version-Number: <observed integer>`**. Do not put versionNumber in request body: `Core/Record/Service.php:filterInputSystemAttributes` removes it.
3. `Core/Record/UpdateParamsFetcher.php:fetch` reads X-Version-Number and creates UpdateParams. `Core/Record/Service.php:update` checks entity edit ACL, applies proposed data, then invokes `processConcurrencyControl` when header exists.
4. `Core/Record/ConcurrencyControl/OptimisticProcessor.php:process` compares fetched version; on mismatched version it identifies written attributes that would differ from current fetched values. Service throws `ConflictSilent` with `modified` and JSON current values/versionNumber; ordinary HTTP conflict is 409.
5. On conflict, re-read and recompute preview; do not retry blindly or overwrite fields now filled by a manager. Missing version header does NOT provide optimistic checking. A stale request with no effective conflicting write can pass, so a 409 on every stale version must not be assumed.

This is source-confirmed native optimistic checking, NOT a demonstrated atomic database compare-and-swap under arbitrary concurrent requests. Race behavior needs runtime tests. If an adapter writes monetary/legal state, stronger server-side coordination may be necessary. For enrichment, combine minimal allowlisted patch, fill-only-empty policy, version header, re-read and audit record. Do not accept field names or Account IDs from untrusted documents as unrestricted write instructions.
