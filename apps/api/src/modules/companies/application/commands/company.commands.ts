export class CreateCompanyCommand {
  constructor(
    readonly organizationId: string,
    readonly name: string,
    readonly inn?: string | null,
    readonly website?: string | null,
    readonly phone?: string | null,
    readonly email?: string | null,
  ) {}
}

export class UpdateCompanyCommand {
  constructor(
    readonly id: string,
    readonly organizationId: string,
    readonly name?: string,
    readonly inn?: string | null,
    readonly website?: string | null,
    readonly phone?: string | null,
    readonly email?: string | null,
  ) {}
}

export class DeleteCompanyCommand {
  constructor(readonly id: string, readonly organizationId: string) {}
}
