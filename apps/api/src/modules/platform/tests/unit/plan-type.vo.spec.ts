import { describe, it, expect } from 'vitest';
import { PlanType, PlanTypeEnum } from '../../domain/value-objects/plan-type.vo';

describe('PlanType VO', () => {
  it('free() возвращает FREE', () => {
    expect(PlanType.free().value).toBe(PlanTypeEnum.FREE);
  });

  it('принимает валидные планы', () => {
    expect(new PlanType(PlanTypeEnum.PRO).value).toBe('PRO');
  });

  it('отклоняет недопустимый план', () => {
    expect(() => new PlanType('ENTERPRISE' as PlanTypeEnum)).toThrow();
  });
});
