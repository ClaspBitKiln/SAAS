// ИНН: 10 (юрлицо) или 12 (ИП) цифр — правило из inn-bot (simple_app.py).
export class Inn {
  private readonly value: string;

  constructor(value: string) {
    const v = (value ?? '').trim().replace(/\s/g, '');
    if (!/^\d{10}$|^\d{12}$/.test(v)) {
      throw new Error('Inn: ожидается 10 или 12 цифр');
    }
    this.value = v;
  }

  toString(): string {
    return this.value;
  }

  get length(): number {
    return this.value.length;
  }
}
