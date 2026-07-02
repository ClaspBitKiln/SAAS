export class Inn {
  constructor(private readonly _value: string) {
    const digits = _value.replace(/\s/g, '');
    if (!/^\d{10}$|^\d{12}$/.test(digits)) {
      throw new Error('Inn: must be 10 or 12 digits');
    }
    this._value = digits;
  }

  toString(): string {
    return this._value;
  }
}
