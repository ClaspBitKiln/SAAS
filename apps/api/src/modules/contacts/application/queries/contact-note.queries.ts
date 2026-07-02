export class ListContactNotesQuery {
  constructor(
    readonly contactId: string,
    readonly organizationId: string,
  ) {}
}
