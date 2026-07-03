# AI Rules

Rules for all AI features (call summary, autofill, suggestions).

| # | Rule |
|---|------|
| 1 | **AI never invents data** — only extract from transcript or existing CRM records |
| 2 | **AI explains confidence** — low-confidence fields flagged for human review |
| 3 | **AI keeps transcript** — original speech/text stored, immutable |
| 4 | **AI stores source** — every summary links to callId + transcript segment |
| 5 | **Every summary traceable** — audit: who generated, when, which model |
| 6 | **Human confirms CRM writes** — autofill proposes; user accepts (MVP) |
| 7 | **No AI for money/risk decisions** — scoring stays deterministic (see CLAUDE.md) |
| 8 | **English prompts, Russian UI** — product UI locale per user setting |

## Output contract (MVP)

```json
{
  "summary": "string",
  "actionItems": [{ "text": "string", "confidence": 0.0 }],
  "crmSuggestions": [{ "field": "string", "value": "string", "confidence": 0.0 }],
  "source": { "callId": "uuid", "transcriptRef": "string" }
}
```

Violations → reject PR in AI domain reviews.
