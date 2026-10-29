# Current product scope — wholesale sales in Russia

User direction, 2026-10-29: build the CRM for a wholesale B2B sales company operating across the Russian Federation. Base and default currency: RUB. The first company is Magic Metal; the initial workflow remains a simple ready CRM rather than a new ERP implementation.

First workflow: company INN/KPP → buyer contact → customer request → sourcing and costing → reviewed commercial proposal → next contact → outcome. Reuse native CRM entities, intake and import where validated; add adapters only for gaps.

Financial and product data requirements:

- RUB is the base currency. Do not add multi-currency conversion until required and supplied with verified rates.
- Record whether each price includes VAT and its applicable rate/status; do not invent the company's taxation policy.
- Keep kg/tonne/metre/piece quantities and price basis separate. Convert only with a verified conversion factor.
- Separate purchase amount, delivery, additional costs, sale amount, markup and margin. Unknown costs remain unknown.
- Supplier catalogue entries do not establish confirmed stock, current price or delivery dates.
- Every enrichment needs an actual source and time; protect manager-entered fields and require review of uncertain matches.

First CRM priorities: company/buyer contacts, INN/KPP, responsible manager, request history, proposals and next actions. Procurement depth, accounting/ERP, payment integrations and independent-client SaaS isolation require separate verified stages. No production access changes, paid service or external messaging follows implicitly from this scope.
