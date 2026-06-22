// VO: имя арендатора. Неизменяемо, валидируется в конструкторе (ADR-009/DDD).
export class TenantName {
  private readonly value: string;

  constructor(value: string) {
    const v = (value ?? '').trim();
    if (v.length < 2) throw new Error('TenantName: минимум 2 символа');
    if (v.length > 255) throw new Error('TenantName: максимум 255 символов');
    this.value = v;
  }

  toString(): string {
    return this.value;
  }

  equals(other: TenantName): boolean {
    return other instanceof TenantName && other.value === this.value;
  }
}
