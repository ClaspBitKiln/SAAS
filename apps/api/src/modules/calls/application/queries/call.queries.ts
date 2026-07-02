export class GetCallQuery {
  constructor(readonly id: string, readonly organizationId: string) {}
}

export class ListCallsByContactQuery {
  constructor(
    readonly contactId: string,
    readonly organizationId: string,
    readonly page: number,
    readonly size: number,
  ) {}
}

export class ListCallsByOrganizationQuery {
  constructor(readonly organizationId: string, readonly page: number, readonly size: number) {}
}
