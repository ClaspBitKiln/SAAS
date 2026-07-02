export class GetCompanyQuery {
  constructor(readonly id: string, readonly organizationId: string) {}
}

export class ListCompaniesQuery {
  constructor(
    readonly organizationId: string,
    readonly page: number,
    readonly size: number,
    readonly q?: string,
  ) {}
}
