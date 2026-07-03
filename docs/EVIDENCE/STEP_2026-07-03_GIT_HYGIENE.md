# STEP: Git hygiene (docs + WIP isolation)

Date:        2026-07-03
Branch:      `main` (docs/chore) + `feat/contact-company-link` (WIP isolated)
Commits:     `77bfeb7` docs · `a7375be` chore · `fb596ca` WIP (feature branch only)
CI:          [run #82](https://github.com/ClaspBitKiln/SAAS/actions/runs/28662890270) (GREEN)
DoD:         `git status` clean on main ✓ · feature branch pushed ✓ · CI_GREEN ✓

## Actions
1. WIP Contact→Company → `feat/contact-company-link` (`fb596ca`, pushed)
2. `main` product code restored (no companyId / migrations on main)
3. `.env.local` added to `.gitignore`
4. Untracked `docs/**` committed (`77bfeb7`)
5. `.cursor/rules/*` + `CLAUDE.md` chore (`a7375be`)
6. Post-CI snapshot: BUILD_STATUS + this file updated

## Local proof (same HEAD `a7375be`)
`pnpm lint` · `pnpm build` · `pnpm test` · `pnpm test:integration` · `pnpm test:e2e` — all passed (40 e2e tests)

## Isolation
Contact→Company link remains UNPROVEN until post-feedback merge. Branch `feat/contact-company-link` — do not merge before first-user feedback.
