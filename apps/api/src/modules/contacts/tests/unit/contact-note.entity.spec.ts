import { describe, it, expect } from 'vitest';
import { ContactNote } from '../../domain/entities/contact-note.entity';

describe('ContactNote', () => {
  it('creates a note with trimmed body', () => {
    const note = ContactNote.create({
      tenantId: 't1',
      organizationId: 'o1',
      contactId: 'c1',
      body: '  Follow up next week  ',
      createdById: 'u1',
    });
    expect(note.body).toBe('Follow up next week');
    expect(note.organizationId).toBe('o1');
  });

  it('rejects empty body', () => {
    expect(() =>
      ContactNote.create({
        tenantId: 't1',
        organizationId: 'o1',
        contactId: 'c1',
        body: '   ',
      }),
    ).toThrow('Note body is required');
  });
});
