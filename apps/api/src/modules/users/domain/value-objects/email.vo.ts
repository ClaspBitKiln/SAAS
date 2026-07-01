const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  constructor(private readonly _value: string) {
    const normalized = _value.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new Error('Email: invalid format');
    }
    if (normalized.length > 255) {
      throw new Error('Email: max 255 characters');
    }
    this._value = normalized;
  }

  toString(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }
}
