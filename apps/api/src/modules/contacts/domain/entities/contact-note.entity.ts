import { newId } from '../../../../shared/infrastructure/uuid';

const MAX_BODY_LENGTH = 4000;

export class ContactNote {
  private constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly organizationId: string,
    readonly contactId: string,
    readonly body: string,
    readonly createdById: string | null,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(input: {
    tenantId: string;
    organizationId: string;
    contactId: string;
    body: string;
    createdById?: string | null;
  }): ContactNote {
    const body = input.body.trim();
    if (body.length < 1) throw new Error('Note body is required');
    if (body.length > MAX_BODY_LENGTH) throw new Error(`Note body must be at most ${MAX_BODY_LENGTH} characters`);
    const now = new Date();
    return new ContactNote(
      newId(),
      input.tenantId,
      input.organizationId,
      input.contactId,
      body,
      input.createdById ?? null,
      now,
      now,
    );
  }

  static rehydrate(props: {
    id: string;
    tenantId: string;
    organizationId: string;
    contactId: string;
    body: string;
    createdById: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ContactNote {
    return new ContactNote(
      props.id,
      props.tenantId,
      props.organizationId,
      props.contactId,
      props.body,
      props.createdById,
      props.createdAt,
      props.updatedAt,
    );
  }
}
