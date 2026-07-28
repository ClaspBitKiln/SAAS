export enum RequestStatusEnum {
  DRAFT = 'DRAFT',
  SEARCHED = 'SEARCHED',
  QUOTED = 'QUOTED',
  SENT = 'SENT',
}

export class RequestStatus {
  constructor(readonly value: RequestStatusEnum) {
    if (!Object.values(RequestStatusEnum).includes(value)) {
      throw new Error(`RequestStatus: invalid value ${value}`);
    }
  }

  static draft(): RequestStatus {
    return new RequestStatus(RequestStatusEnum.DRAFT);
  }

  static searched(): RequestStatus {
    return new RequestStatus(RequestStatusEnum.SEARCHED);
  }

  static quoted(): RequestStatus {
    return new RequestStatus(RequestStatusEnum.QUOTED);
  }

  static sent(): RequestStatus {
    return new RequestStatus(RequestStatusEnum.SENT);
  }
}
