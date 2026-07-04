export class CreateContactCommand {
  constructor(
    readonly organizationId: string,
    readonly name: string,
    readonly phone?: string | null,
    readonly email?: string | null,
    readonly companyId?: string | null,
    readonly ownerUserId?: string | null,
    readonly currentUserId?: string,
  ) {}
}

export class UpdateContactCommand {
  constructor(
    readonly id: string,
    readonly organizationId: string,
    readonly name?: string,
    readonly phone?: string | null,
    readonly email?: string | null,
    readonly companyId?: string | null,
    readonly ownerUserId?: string | null,
  ) {}
}

export class DeleteContactCommand {
  constructor(readonly id: string, readonly organizationId: string) {}
}
