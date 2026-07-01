export class GetOrganizationQuery {
  constructor(readonly id: string) {}
}

export class ListOrganizationsQuery {
  constructor(
    readonly tenantId: string,
    readonly page: number,
    readonly size: number,
  ) {}
}
