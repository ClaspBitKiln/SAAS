# ADR-027 — E-Metall external integration

**Status:** Accepted (2026-07-02)  
**Context:** MagicMet sells metal; inbound requests arrive by email with PDF/Excel attachments. E-Metall provides Filter, Parse, and Search as external AI modules (API + MCP).

## Decision

1. Integrate E-Metall as an **external adapter** in `apps/api/src/modules/e-metall/` — no embedded ML.
2. Use **outbound HTTP client** + **inbound webhook** for async jobs.
3. Gate with `EMETALL_ENABLED` + `EMETALL_API_KEY`; stub when disabled.
4. Map results to CRM incrementally: Contact first, then Deal/Quote (separate slices).
5. Do **not** build procurement ERP, warehouse, or supplier catalog inside Sales OS.

## Non-goals

- Replicating E-Metall catalog or scoring models.
- Email IMAP ingestion in this ADR (Communication module, later).
- MCP bridge in MVP slice.

## Consequences

- New env vars in `.env.example`.
- JWT-protected job endpoints; webhook uses shared secret header.
- Feature flag allows CI_GREEN without vendor credentials.

## Related

`docs/integrations/e-metall.md`, ADR-011 (module boundaries), inn-bot adapter pattern.
