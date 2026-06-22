export enum PlanTypeEnum {
  FREE = 'FREE',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
}

export class PlanType {
  constructor(readonly value: PlanTypeEnum) {
    if (!Object.values(PlanTypeEnum).includes(value)) {
      throw new Error(`PlanType: недопустимое значение ${value}`);
    }
  }

  static free(): PlanType {
    return new PlanType(PlanTypeEnum.FREE);
  }

  equals(other: PlanType): boolean {
    return other instanceof PlanType && other.value === this.value;
  }
}
