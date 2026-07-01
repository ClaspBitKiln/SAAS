export enum MembershipStatusEnum {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REVOKED = 'REVOKED',
}

export class MembershipStatus {
  constructor(readonly value: MembershipStatusEnum) {
    if (!Object.values(MembershipStatusEnum).includes(value)) {
      throw new Error(`MembershipStatus: invalid value ${value}`);
    }
  }

  static pending(): MembershipStatus {
    return new MembershipStatus(MembershipStatusEnum.PENDING);
  }

  static active(): MembershipStatus {
    return new MembershipStatus(MembershipStatusEnum.ACTIVE);
  }

  canAccept(): boolean {
    return this.value === MembershipStatusEnum.PENDING;
  }

  canSuspend(): boolean {
    return this.value === MembershipStatusEnum.ACTIVE;
  }

  canRevoke(): boolean {
    return this.value !== MembershipStatusEnum.REVOKED;
  }
}
