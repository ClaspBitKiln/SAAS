// Команды Tenant (CQRS write).
export class CreateTenantCommand {
  constructor(readonly name: string, readonly slug: string, readonly plan?: string) {}
}

export class ActivateTenantCommand {
  constructor(readonly id: string) {}
}

export class SuspendTenantCommand {
  constructor(readonly id: string) {}
}
