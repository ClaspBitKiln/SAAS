export enum CallDirectionEnum {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export class CallDirection {
  constructor(readonly value: CallDirectionEnum) {
    if (!Object.values(CallDirectionEnum).includes(value)) {
      throw new Error(`CallDirection: invalid value ${value}`);
    }
  }
}
