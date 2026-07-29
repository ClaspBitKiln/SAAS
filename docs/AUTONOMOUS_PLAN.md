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
| A7 | Real delivery channel | Send by email from a configured organization account | Explicit confirmation, delivery result, audit |
| A8 | Deterministic pricing import | Supplier prices feed quote calculation | Validated import, provenance, no LLM arithmetic |
| A9 | AI-assisted intake | Raw request becomes reviewed structured lines | Source retained, confidence shown, human confirms |

Progress toward A6: a self-guided pilot checklist based on real organization
state merged in PR #24. Production smoke and feedback from a real manager remain
required before A6 is complete.

Progress toward A9: deterministic pasted-message intake with retained source
and mandatory manager review merged in PR #19. AI confidence and attachment
extraction remain incomplete.

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
