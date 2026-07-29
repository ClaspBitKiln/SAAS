# Autonomous Product Plan

This is the execution plan for autonomous development of AI Sales OS.
`docs/NEXT.md` remains the single source of truth for the active slice.

## Operating rules

- Ship one small end-to-end slice at a time.
- Prefer the simplest working implementation.
- Change the approach after two failed attempts with the same method.
- Never fake external delivery, customer activity, payments, or AI confidence.
- Money and risk calculations stay deterministic.
- A slice is done only after lint, build, tests, CI, merge, and evidence.
- Low-risk changes may be merged autonomously after all required checks pass.
- Payments, secrets, customer communication, and irreversible external actions require a real configured channel and explicit safeguards.
- Missing local `gh` is not a blocker: use local `git` for push and the connected
  GitHub integration for PR, checks, and merge.
- Run local validation through `bash scripts/verify-local.sh` so tool caches stay inside
  the workspace.

## North-star workflow

`request → quote → PDF → sent → follow-up → outcome → repeatable revenue`

The product should reduce the time from a customer's raw metal request to a
traceable commercial proposal and the next manager action.

## Execution queue

| Order | Slice | User outcome | Done when |
|---|---|---|---|
| A1 | Proposal PDF | Manager downloads a ready A4 proposal | Merged in PR #14 |
| A2 | Proposal sent tracking | Manager records when and where a proposal was sent | Status, timestamp, channel, UI, unit/E2E tests |
| A3 | Follow-up control | Overdue and upcoming proposal follow-ups are visible | Merged in PR #16 |
| A4 | Request outcome | Manager records won/lost/no-response with reason | Merged in PR #20 |
| A5 | Request activity timeline | Quote, PDF, send, task, and outcome are traceable | Merged in PR #22 |
| A6 | Pilot hardening | One manager completes the workflow without assistance | Production smoke and feedback evidence |
| A7 | Real delivery channel | Send by email from a configured organization account | Code and audit merged in PR #35–#38; Railway SMTP configuration remains external |
| A8 | Deterministic pricing import | Supplier prices feed quote calculation | Merged: validated XLSX/CSV import, provenance, no LLM arithmetic |
| A9 | AI-assisted intake | Raw request becomes reviewed structured lines | Merged: source retained, confidence shown, human confirms |

Progress toward A6: a self-guided pilot checklist based on real organization
state merged in PR #24. Production smoke and feedback from a real manager remain
required before A6 is complete.

Progress toward A9: deterministic pasted-message intake with retained source
and mandatory manager review merged in PR #19. TXT/CSV, XLSX, and text-layer
PDF extraction plus deterministic field-completeness warnings are merged.

Progress toward A8: XLSX/CSV price imports are matched by normalized product
description, unit prices are multiplied by the request quantity, rows without a
positive numeric quantity are left untouched, and the source filename is
retained with the prepared quote.

Client-base import foundation is merged in PR #33. The 17,752-row CRM upload is
deferred until it no longer blocks product work; it must run separately in
bounded batches with deduplication and an import report.

## Deferred until evidence

- Full messenger inbox and telephony platform
- Automatic customer communication without confirmation
- Billing and subscription payments
- Broad analytics, microservices, and speculative refactoring
- AI decisions about price, margin, credit, or counterparty risk

## Autonomous selection rule

Choose the first incomplete slice whose dependencies exist and that can be
shipped safely in one pull request. If a real external credential or customer
action is required, implement the safe internal prerequisite and move to the
next unblocked slice.
