# Ready-made information capture: source-only review

Scope: read-only source inspection. No service settings, repositories, real email, credentials or customer data changed. No runtime capture/import/mail test executed by this reviewer. Parent's existing local API/REA checks are separate evidence and do not validate the capabilities below.

Revisions:
- EspoCRM tag 10.0.11, exact commit `32d559ba86d3be607599d1325c359668c1178850`. Inspected with `git show 10.0.11:<path>`; current worktree is a different main revision.
- Krayin `5eecae04634a6790bf2fe68904ee3e973cb24e7b`.

## Findings

| Need | EspoCRM 10.0.11 source evidence | Krayin source evidence | Decision |
|---|---|---|---|
| Existing base import | `application/Espo/Tools/Import/Service.php:import/importById/revert`; checks Import scope and target entity create ACL, builds engine from attachment/mapping. `Tools/Import/Import.php`; existing `tests/integration/Espo/Tools/Import/ImportTest.php` | `packages/Webkul/DataTransfer/src/Config/importers.php` registers persons/products/leads; importer implementations under `Helpers/Importers/{Persons,Leads,Products}/Importer.php`; batch jobs under `Jobs/Import/` | Reuse native mapped import for first approved dataset, test mapping/duplicates/errors in a local sample. Do not build another generic CSV importer |
| Website → lead | `Tools/LeadCapture/CaptureService.php:capture/captureForm/getLeadWithPopulatedData/filterData/findLeadDuplicates`; native field allowlist, required-field validation, email/phone duplicate lookup, configured source/pipeline/team, capture log. `Controllers/LeadCapture.php:postActionLeadCapture`; metadata in `Resources/metadata/entityDefs/LeadCapture.json` | `WebForm/Http/Controllers/WebFormController.php:formStore/exposedAttributes/restrictSubmissionToExposedAttributes/findPersonBySubmittedEmail`; allowlists fields, exact/case-insensitive email comparison, server-configured pipeline and lead source; tests `tests/Feature/WebForm/WebFormPersonLookupTest.php`, Security/WebFormSubmission and Enumeration | **Smallest next feature: configure and test native Espo LeadCapture in local instance** rather than writing a new intake service. Public-site rollout remains separate |
| Incoming email capture | `Classes/Jobs/CheckInboundEmails.php:run` delegates group-account Service.fetch; `Core/Mail/Importer/DefaultImporter.php`, DuplicateFinder/ParentFinder/EmailSaver handle mail records and association. Personal and group mailbox infrastructure exists | `Email/Console/Commands/ProcessInboundEmails.php:handle` delegates processMessagesFromAllFolders; `Email/InboundEmailProcessor/WebklexImapEmailProcessor.php:processMessage` saves email details; separate Sendgrid processor | Reuse native mail pipeline only after mailbox credentials, fetch permissions and scheduler are verified. This is ingestion/association, not proof of reliable signature extraction or legal contact enrichment |
| Integration API | Native REST controllers + `Resources/routes.json`; LeadCapture has explicit noAuth public routes, active API-key lookup in CaptureService | Native repositories/controllers and WebForm routes; `Automation/Services/WebhookService.php` includes SSRF guard and endpoint checks | Prefer official integration API; do not expose researcher/admin credentials in website/browser or use them in production connector |
| Source/provenance | `CaptureService.getLeadWithPopulatedData` sets configured leadSource, campaign/team/pipeline; `CaptureService.log` stores target/capture IDs, isCreated, input data and description. Native log is capture-level, not verified per-field attribution/confidence | Lead `lead_source_id` and source table exist; WebForm assigns Web Form source; email records retain message details. No demonstrated general per-field verifiedAt/source-url/confidence system | Use native source/capture log now. Additional per-field evidence fields are a small extension, not already verified capability |
| Multiple companies | Customer Accounts/Contacts and team/ACL do not establish SaaS tenant isolation. Native public capture resolves its configured campaign/team; no tenant ID boundary is established by inspected path | `Contact/.../create_organizations_table.php` stores customer organizations, person.organization_id references them. These are CRM customer records, not proven tenant boundaries. README markets separate Multi Tenant SaaS extension | Pilot one business in isolated instance/DB. Do not describe teams/accounts/organizations as independent SaaS tenants |
| INN / independent web research | No DaData lookup, reliable INN enrichment, supplier crawler, PDF/Excel recognition, LLM confidence calibration established in inspected native paths | Import/webform/mail are not evidence of these capabilities | Still needs separate verified adapter/source access. Do not promise autonomous internet data collection from native capture functionality |

## Native LeadCapture next step: bounded local test

Source-known fields in `Resources/metadata/entityDefs/LeadCapture.json`: `name`, `isActive`, `fieldList`, `duplicateCheck`, `optInConfirmation`, `leadSource`, `formEnabled`; apiKey/formId are readonly/generated. Defaults permit subscriptions, so explicitly disable `subscribeToTargetList` and `subscribeContactToTargetList` for the test. Disable `optInConfirmation` only for synthetic local tests to avoid scheduling confirmation emails; this is not a recommendation to drop consent in production.

Native routes (`Resources/routes.json`): `POST /LeadCapture/form/:id` and `POST /LeadCapture/:apiKey` are noAuth. CaptureService requires an active matching capture. API-key path should be treated as a credential even though this is a public capture endpoint; avoid logging/publishing it. CORS/origin is not authentication. The default controller allow-origin is `*` unless configured.

Test with a unique local-only fixture:
1. Create native capture with fieldList `firstName,lastName,emailAddress,phoneNumber,description`, configured source, field requirements, no subscriptions/emails.
2. Submit synthetic data through native endpoint; verify created Lead and LeadCaptureLogRecord, source and assignee/team behavior.
3. Repeat identical email/phone and verify documented duplicate handling without assuming exact idempotency. Native duplicate lookup ORs email/phone; **not proof of atomic replay-safe idempotency**.
4. Send unlisted `assignedUserId`/status fields; verify ignored/rejected rather than trusted. Missing required field and inactive/bad capture key must fail.
5. Reopen resulting lead in UI/REA, inspect source and history. Save sanitized evidence with no key/header/real-contact values.

For website→CRM production integration, native LeadCapture alone does not replace durable website outbox, unique event idempotency, signature/replay protection, consent, upload controls, rate limits and operational monitoring. A server-side connector may wrap the existing native path, but an entirely new CRM intake subsystem is not justified before this small native test.

## Licensing

EspoCRM source headers AGPLv3 with notice requirements; use native deployment/custom extension with applicable obligations, not copied into a proprietary SAAS without review. Krayin MIT is more permissive for code reuse, but its paid multi-tenant extension must not be presented as open-source/free because core is MIT.

## Parent recommendation

Add one sentence to selection decision: **Espo already contains native web-to-lead, mapped import and mailbox ingestion; the next value is configuring/testing one native LeadCapture, not designing a replacement ingestion module.** Retain NOT VERIFIED until that local test actually runs. This makes the user's “don't reinvent” goal concrete while preserving honest readiness boundaries.
