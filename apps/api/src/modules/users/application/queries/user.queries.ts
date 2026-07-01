export class GetUserQuery {
  constructor(readonly id: string) {}
}

export class GetUserByEmailQuery {
  constructor(readonly email: string) {}
}

export class ListUsersQuery {
  constructor(
    readonly page: number,
    readonly size: number,
  ) {}
}
