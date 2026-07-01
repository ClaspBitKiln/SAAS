export class CreateContactCommand {
  constructor(
    readonly organizationId: string,
    readonly name: string,
    readonly phone?: string | null,
    readonly email?: string | null,
  ) {}
}

export class UpdateContactCommand {
  constructor(
    readonly id: string,
    readonly name?: string,
    readonly phone?: string | null,
    readonly email?: string | null,
  ) {}
}

export class DeleteContactCommand {
  constructor(readonly id: string) {}
}
