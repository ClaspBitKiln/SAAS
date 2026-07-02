export class PlainPassword {
  constructor(readonly value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 8) {
      throw new Error('Password: must be at least 8 characters');
    }
    this.value = trimmed;
  }
}
