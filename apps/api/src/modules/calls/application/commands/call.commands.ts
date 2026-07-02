import { CallDirectionEnum } from '../../domain/value-objects/call-direction.vo';

export class StartCallCommand {
  constructor(
    readonly contactId: string,
    readonly direction: CallDirectionEnum,
    readonly phone: string,
    readonly organizationId: string,
  ) {}
}

export class CompleteCallCommand {
  constructor(readonly id: string, readonly organizationId: string) {}
}

export class MissCallCommand {
  constructor(readonly id: string, readonly organizationId: string) {}
}
