export enum RequestStatusEnum {
  DRAFT = 'DRAFT',
  SEARCHED = 'SEARCHED',
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
}
