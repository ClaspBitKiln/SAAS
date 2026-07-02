export class GetRequestQuery {
  constructor(readonly id: string) {}
}

export class ListRequestsQuery {
  constructor(
    readonly organizationId: string,
    readonly page: number,
    readonly size: number,
  ) {}
}
