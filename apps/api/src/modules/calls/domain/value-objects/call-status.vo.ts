export enum CallStatusEnum {
  RINGING = 'RINGING',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
}

export class CallStatus {
  constructor(readonly value: CallStatusEnum) {
    if (!Object.values(CallStatusEnum).includes(value)) {
      throw new Error(`CallStatus: invalid value ${value}`);
    }
  }

  static ringing(): CallStatus {
    return new CallStatus(CallStatusEnum.RINGING);
  }

  canComplete(): boolean {
    return this.value === CallStatusEnum.RINGING;
  }

  canMarkMissed(): boolean {
    return this.value === CallStatusEnum.RINGING;
  }
}
