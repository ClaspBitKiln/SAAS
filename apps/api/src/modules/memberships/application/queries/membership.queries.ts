export class GetMembershipQuery {
  constructor(readonly id: string) {}
}

export class ListMembershipsByUserQuery {
  constructor(
    readonly userId: string,
    readonly page: number,
    readonly size: number,
  ) {}
}

export class ListMembershipsByOrganizationQuery {
  constructor(
    readonly organizationId: string,
    readonly page: number,
    readonly size: number,
  ) {}
}
