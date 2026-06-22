export enum TenantStatusEnum {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

// VO статуса арендатора с допустимыми переходами.
export class TenantStatus {
  constructor(readonly value: TenantStatusEnum) {
    if (!Object.values(TenantStatusEnum).includes(value)) {
      throw new Error(`TenantStatus: недопустимое значение ${value}`);
    }
  }

  static active(): TenantStatus {
    return new TenantStatus(TenantStatusEnum.ACTIVE);
  }

  isActive(): boolean {
    return this.value === TenantStatusEnum.ACTIVE;
  }

  canTransitionTo(next: TenantStatusEnum): boolean {
    // ACTIVE <-> SUSPENDED разрешены; в то же состояние — нет.
    return this.value !== next;
  }
}
