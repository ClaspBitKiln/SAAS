# Independent review of ready-CRM selection

Scope: read-only review of DECISION.md, saved verification script, upstream licenses and selected source files. No services or repository files changed; no tests rerun.

## Conclusion

EspoCRM 10.0.11 is a defensible **single-company local pilot** selection. The document correctly limits the outcome: the seven candidates were not equally runtime-tested, enrichment is not implemented, admin CRUD is not tenant isolation, and the existing SAAS is preserved. There is no source/licensing reason in this sample to reverse the pilot decision. This is not evidence that EspoCRM is the best production SaaS foundation or fastest CRM overall.

## Must fix before claiming the reported verification coverage

1. **Assignee persistence is claimed but not asserted.** `docs/EVIDENCE/2026-10-28-crm-selection/verify-chain.py` sends `assignedUserId=uid`, then only asserts `tr['parentId']` and `tr['dateEnd']`. Add assertions for `assignedUserId == uid` and `parentType == 'Contact'`, or narrow DECISION.md's statement that assignment was checked after reading. Similarly, the note read verifies only `post`; assert `parentId == contact ID` and `parentType == 'Contact'` to establish persistence of the note's link. This is a validation-coverage issue, not evidence that EspoCRM fails these operations.

2. **Narrow the Docker generalization.** DECISION.md says “latest 10.x больше не поддерживает такую установку”. Official `espo-docker-current/docker-entrypoint.sh:start` returns early for legacy mounts, while `warnLegacyInstallation` permits an existing legacy installation if `bin/command` exists, warning upgrades are unavailable. The observed HTTP 500 establishes failure of this **fresh root-volume installation**, not that all existing root-mounted installations cannot run. Suggested wording: “Новый пустой whole-root volume был определён как legacy; штатная инициализация была пропущена. Перешли на рекомендуемые отдельные тома.” Docker source HEAD: `a2f3e9cba6edb596afdafca2b9ac6d639fd29c5c`.

## Licensing and source checks confirmed

- EspoCRM tag `10.0.11^{commit}` resolves to `32d559ba86d3be607599d1325c359668c1178850`, matching the decision. `LICENSE.txt` is AGPLv3. At this exact revision `application/Espo/Core/Acl/DefaultAccessChecker.php` header explicitly requires appropriate UI notices and retaining the “EspoCRM” word. DECISION.md's warning about notices/source obligations is warranted; do not promise a closed rebranded fork.
- Krayin HEAD `5eecae04634a6790bf2fe68904ee3e973cb24e7b`: root `composer.json`/LICENSE is MIT; README “Krayin CRM Multi Tenant SaaS” links a separate extension. This proves the separate extension is offered, **not** its current price nor absence of every possible open-source tenant mechanism. The decision's cautious “not verified” wording is correct. `Contact/src/Repositories/PersonRepository.php` uses customer `organization_id`; that field must not be treated as a SaaS tenant boundary.
- Frappe CRM HEAD `be370a1916f03dfee1a4a811b1004bc0f712860b`: root LICENSE is AGPLv3; `docker/init.sh` explicitly obtains the Frappe framework, WhatsApp and CRM apps. The operational-dependency statement is supported. This does not prove poorer UX, performance or product quality; DECISION.md avoids those claims.
- Twenty HEAD `d06bf84ce6bdaa99744dcf41e673d1e21dac35ed`: root LICENSE has AGPL core, explicitly marked Enterprise files and listed MIT packages. Whole-project MIT reuse would be wrong; the decision correctly distinguishes these boundaries.

## Next-step gates (not blockers to local pilot selection)

- Test a non-admin sales-manager account: own/team visibility and denied reads/writes. An admin-only PASS does not establish production RBAC. Separate company/customer records from tenant isolation.
- Measure the manager UI chain end to end; current REA creates the company through UI but contact/note/task creation is API-backed. Do not present all five operations as REA UI-completed.
- For enrichment, implement source/time/per-field evidence and overwrite protection, with account-scoped credentials and network allowlists. Existing ready CRM CRUD does not supply internet research or verified INN/phone/email enrichment.
- Keep per-company isolated instances until a tested SaaS tenancy design exists. Backup restore, real-user usability and deployment recovery remain unverified.
