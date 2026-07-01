export class OrganizationName {
  private readonly value: string;

  constructor(value: string) {
    const v = (value ?? '').trim();
    if (v.length < 2) throw new Error('OrganizationName: минимум 2 символа');
    if (v.length > 255) throw new Error('OrganizationName: максимум 255 символов');
    this.value = v;
  }

  toString(): string {
    return this.value;
  }
}
