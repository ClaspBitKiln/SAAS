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
