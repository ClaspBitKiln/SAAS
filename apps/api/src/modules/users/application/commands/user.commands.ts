export class CreateUserCommand {
  constructor(
    readonly email: string,
    readonly name: string,
    readonly avatarUrl?: string | null,
    readonly locale?: string,
    readonly timezone?: string,
  ) {}
}

export class UpdateUserCommand {
  constructor(
    readonly id: string,
    readonly name?: string,
    readonly avatarUrl?: string | null,
    readonly locale?: string,
    readonly timezone?: string,
  ) {}
}

export class ActivateUserCommand {
  constructor(readonly id: string) {}
}

export class DisableUserCommand {
  constructor(readonly id: string) {}
}
