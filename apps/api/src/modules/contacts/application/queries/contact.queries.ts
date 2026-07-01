export class GetContactQuery {
  constructor(readonly id: string) {}
}

export class ListContactsQuery {
  constructor(
    readonly organizationId: string,
    readonly page: number,
    readonly size: number,
  ) {}
}
