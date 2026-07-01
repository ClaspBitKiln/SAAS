export enum UserStatusEnum {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
}

export class UserStatus {
  constructor(readonly value: UserStatusEnum) {
    if (!Object.values(UserStatusEnum).includes(value)) {
      throw new Error(`UserStatus: invalid value ${value}`);
    }
  }

  static invited(): UserStatus {
    return new UserStatus(UserStatusEnum.INVITED);
  }

  static active(): UserStatus {
    return new UserStatus(UserStatusEnum.ACTIVE);
  }

  canActivate(): boolean {
    return this.value === UserStatusEnum.INVITED;
  }

  canDisable(): boolean {
    return this.value !== UserStatusEnum.DISABLED;
  }
}
