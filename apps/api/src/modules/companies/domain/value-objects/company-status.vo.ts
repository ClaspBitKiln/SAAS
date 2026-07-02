export enum CompanyStatusEnum {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export class CompanyStatus {
  constructor(readonly value: CompanyStatusEnum) {
    if (!Object.values(CompanyStatusEnum).includes(value)) {
      throw new Error(`CompanyStatus: invalid value ${value}`);
    }
  }

  static active(): CompanyStatus {
    return new CompanyStatus(CompanyStatusEnum.ACTIVE);
  }
}
