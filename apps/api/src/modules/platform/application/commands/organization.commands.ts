export class CreateOrganizationCommand {
  constructor(
    readonly tenantId: string,
    readonly name: string,
    readonly inn?: string | null,
    readonly settings?: Record<string, unknown>,
  ) {}
}

export class UpdateOrganizationCommand {
  constructor(
    readonly id: string,
    readonly name?: string,
    readonly inn?: string | null,
    readonly settings?: Record<string, unknown>,
  ) {}
}
