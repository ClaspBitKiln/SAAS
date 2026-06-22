// Запросы Tenant (CQRS read).
export class GetTenantQuery {
  constructor(readonly id: string) {}
}

export class ListTenantsQuery {
  constructor(readonly page: number, readonly size: number) {}
}
