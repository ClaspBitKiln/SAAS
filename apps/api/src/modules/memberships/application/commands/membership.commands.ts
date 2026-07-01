export class InviteMembershipCommand {
  constructor(
    readonly tenantId: string,
    readonly userId: string,
    readonly organizationId: string,
    readonly invitedBy?: string | null,
    readonly roleId?: string | null,
    readonly isDefault?: boolean,
  ) {}
}

export class AcceptMembershipCommand {
  constructor(readonly id: string) {}
}

export class SuspendMembershipCommand {
  constructor(readonly id: string) {}
}

export class RevokeMembershipCommand {
  constructor(readonly id: string) {}
}

export class SetDefaultMembershipCommand {
  constructor(readonly id: string) {}
}

export class ChangeMembershipRoleCommand {
  constructor(readonly id: string, readonly roleId: string | null) {}
}
