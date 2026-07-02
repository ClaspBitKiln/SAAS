'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { apiAuthDelete, apiAuthGet, apiAuthPatch, apiAuthPost } from '@/lib/api';
import { getAuthUser } from '@/lib/auth';

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface ContactList {
  items: Contact[];
  total: number;
}

interface ContactNote {
  id: string;
  body: string;
  createdAt: string;
}

const emptyForm = { name: '', email: '', phone: '' };

export default function ContactsPage() {
  const user = getAuthUser();
  const orgId = user?.organizationId;
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notesContactId, setNotesContactId] = useState<string | null>(null);
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [noteBody, setNoteBody] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  const loadContacts = useCallback(async () => {
    if (!orgId) {
      setError('No organization context. Complete onboarding first.');
      return;
    }
    try {
      const data = await apiAuthGet<ContactList>(`/contacts?organizationId=${orgId}`);
      setContacts(data.items);
      setError(null);
    } catch {
      setError('Could not load contacts');
    }
  }, [orgId]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(c: Contact) {
    setEditingId(c.id);
    setForm({ name: c.name, email: c.email ?? '', phone: c.phone ?? '' });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    try {
      const body = {
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
      };
      if (editingId) {
        await apiAuthPatch(`/contacts/${editingId}`, body);
      } else {
        await apiAuthPost('/contacts', { organizationId: orgId, ...body });
      }
      closeForm();
      await loadContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this contact?')) return;
    try {
      await apiAuthDelete(`/contacts/${id}`);
      if (notesContactId === id) setNotesContactId(null);
      await loadContacts();
    } catch {
      setError('Delete failed');
    }
  }

  async function openNotes(contactId: string) {
    setNotesContactId(contactId);
    setNoteBody('');
    setNotesLoading(true);
    try {
      const data = await apiAuthGet<ContactNote[]>(`/contacts/${contactId}/notes`);
      setNotes(data);
    } catch {
      setError('Could not load notes');
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  }

  async function onAddNote(e: FormEvent) {
    e.preventDefault();
    if (!notesContactId || !noteBody.trim()) return;
    setNoteSaving(true);
    try {
      const created = await apiAuthPost<ContactNote>(`/contacts/${notesContactId}/notes`, {
        body: noteBody.trim(),
      });
      setNotes((prev) => [created, ...prev]);
      setNoteBody('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save note');
    } finally {
      setNoteSaving(false);
    }
  }

  return (
    <RequireAuth>
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Contacts</h1>
            <p className="mt-2 text-slate-400">CRM contacts for your organization.</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            disabled={!orgId}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
          >
            New contact
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-amber-400">{error}</p>}

        {showForm && (
          <form onSubmit={onSubmit} className="mt-6 max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h2 className="mb-4 text-sm font-medium">{editingId ? 'Edit contact' : 'New contact'}</h2>
            <div className="grid gap-3">
              <input
                required
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm hover:bg-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={closeForm} className="rounded-md px-4 py-2 text-sm text-slate-400 hover:text-white">
                Cancel
              </button>
            </div>
          </form>
        )}

        <ul className="mt-6 divide-y divide-slate-800 rounded-lg border border-slate-800">
          {contacts.length === 0 && !error && <li className="px-4 py-6 text-sm text-slate-500">No contacts yet.</li>}
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-slate-500">{c.email ?? c.phone ?? '—'}</div>
              </div>
              <div className="flex gap-2 text-sm">
                <button type="button" onClick={() => openNotes(c.id)} className="text-slate-300 hover:underline">
                  Notes
                </button>
                <button type="button" onClick={() => openEdit(c)} className="text-blue-400 hover:underline">
                  Edit
                </button>
                <button type="button" onClick={() => onDelete(c.id)} className="text-red-400 hover:underline">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>

        {notesContactId && (
          <div className="mt-6 max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium">Notes</h2>
              <button
                type="button"
                onClick={() => setNotesContactId(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <form onSubmit={onAddNote} className="mb-4 grid gap-2">
              <textarea
                required
                rows={3}
                placeholder="Add a note…"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={noteSaving}
                className="w-fit rounded-md bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-500 disabled:opacity-50"
              >
                {noteSaving ? 'Saving…' : 'Add note'}
              </button>
            </form>
            {notesLoading ? (
              <p className="text-sm text-slate-500">Loading notes…</p>
            ) : notes.length === 0 ? (
              <p className="text-sm text-slate-500">No notes yet.</p>
            ) : (
              <ul className="space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm">
                    <p className="whitespace-pre-wrap">{n.body}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
