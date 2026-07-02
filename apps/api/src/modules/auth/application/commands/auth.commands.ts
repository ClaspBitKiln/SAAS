export class SetPasswordCommand {
  constructor(
    readonly userId: string,
    readonly password: string,
  ) {}
}

export class LoginCommand {
  constructor(
    readonly email: string,
    readonly password: string,
  ) {}
}

export class RefreshSessionCommand {
  constructor(readonly refreshToken: string) {}
}

export class LogoutSessionCommand {
  constructor(readonly refreshToken: string) {}
}
