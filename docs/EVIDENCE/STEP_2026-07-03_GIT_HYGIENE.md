# STEP: Git hygiene (docs + WIP isolation)

Date:        2026-07-03
Branch:      `main` (docs/chore) + `feat/contact-company-link` (WIP isolated)
Commit:      TBD after push
CI:          TBD
DoD:         `git status` clean on main; WIP Contact→Company on feature branch only; docs/** tracked; `.env.local` gitignored

## Actions
1. WIP Contact→Company → `feat/contact-company-link` (`fb596ca`)
2. `main` product code restored (no companyId / migrations on main)
3. `.env.local` added to `.gitignore`
4. Untracked `docs/**` committed to main
5. `.cursor/rules/*` + `CLAUDE.md` chore commit

## Isolation
Contact→Company link remains UNPROVEN until post-feedback merge. See branch `feat/contact-company-link`.
