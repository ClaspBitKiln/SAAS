export enum RequestSourceEnum {
  MANUAL = 'MANUAL',
  FILE = 'FILE',
}

export class RequestSource {
  constructor(readonly value: RequestSourceEnum) {
    if (!Object.values(RequestSourceEnum).includes(value)) {
      throw new Error(`RequestSource: invalid value ${value}`);
    }
  }

  static manual(): RequestSource {
    return new RequestSource(RequestSourceEnum.MANUAL);
  }

  static file(): RequestSource {
    return new RequestSource(RequestSourceEnum.FILE);
  }
}
