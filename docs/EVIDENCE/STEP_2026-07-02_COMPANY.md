# STEP: Company aggregate (MVP CRM slice)

Commit:      `fab5d9f`
CI:          [run #78](https://github.com/ClaspBitKiln/SAAS/actions/runs/28600344202) (GREEN)
Production:  Railway auto-deploy after push (expected SUCCESS)
DoD:         CRUD `/companies` org-scoped; `?q=` on name/inn/email; unique INN per org; UI `/dashboard/companies`
Isolation:   `organizationId` in where; e2e `company-search.e2e-spec.ts`
Decision:    Founder «решай сам» → Company chosen as next MVP slice (B2B юрлица для металлотрейдинга)
