export class CreateContactNoteCommand {
  constructor(
    readonly contactId: string,
    readonly organizationId: string,
    readonly body: string,
    readonly createdById: string | null,
  ) {}
}
