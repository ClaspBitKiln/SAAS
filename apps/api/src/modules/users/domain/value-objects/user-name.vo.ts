export class UserName {
  constructor(private readonly _value: string) {
    const trimmed = _value.trim();
    if (trimmed.length < 2 || trimmed.length > 255) {
      throw new Error('UserName: length must be 2–255');
    }
    this._value = trimmed;
  }

  toString(): string {
    return this._value;
  }
}
