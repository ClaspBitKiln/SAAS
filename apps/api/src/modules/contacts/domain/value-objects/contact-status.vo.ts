export enum ContactStatusEnum {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export class ContactStatus {
  constructor(readonly value: ContactStatusEnum) {
    if (!Object.values(ContactStatusEnum).includes(value)) {
      throw new Error(`ContactStatus: invalid value ${value}`);
    }
  }

  static active(): ContactStatus {
    return new ContactStatus(ContactStatusEnum.ACTIVE);
  }
}
