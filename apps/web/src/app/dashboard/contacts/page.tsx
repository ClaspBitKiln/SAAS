'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { apiAuthDelete, apiAuthGet, apiAuthPatch, apiAuthPost } from '@/lib/api';
import { getAuthUser } from '@/lib/auth';
import { ru } from '@/lib/ru';
import { useOrgMembers } from '@/lib/use-org-members';

interface Company {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyId: string | null;
  ownerUserId: string | null;
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

const emptyForm = { name: '', email: '', phone: '', companyId: '', ownerUserId: '' };

export default function ContactsPage() {
  const user = getAuthUser();
  const orgId = user?.organizationId;
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const members = useOrgMembers(orgId);
  const [search, setSearch] = useState('');
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

  const companyNameById = useCallback(
    (id: string | null) => {
      if (!id) return null;
      return companies.find((c) => c.id === id)?.name ?? null;
    },
    [companies],
  );

  const memberNameById = useCallback(
    (id: string | null) => {
      if (!id) return null;
      return members.find((m) => m.userId === id)?.name ?? null;
    },
    [members],
  );

  const loadCompanies = useCallback(async () => {
    if (!orgId) return;
    try {
      const data = await apiAuthGet<{ items: Company[] }>('/companies?size=100');
      setCompanies(data.items);
    } catch {
      /* optional */
    }
  }, [orgId]);

  const loadContacts = useCallback(async () => {
    if (!orgId) {
      setError(ru.common.noOrg);
      return;
    }
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      const query = params.toString();
      const data = await apiAuthGet<ContactList>(`/contacts${query ? `?${query}` : ''}`);
      setContacts(data.items);
      setError(null);
    } catch {
      setError(ru.contacts.loadError);
    }
  }, [orgId, search]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

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
    setForm({
      name: c.name,
      email: c.email ?? '',
      phone: c.phone ?? '',
      companyId: c.companyId ?? '',
      ownerUserId: c.ownerUserId ?? '',
    });
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
        companyId: form.companyId || undefined,
        ownerUserId: form.ownerUserId || undefined,
      };
      if (editingId) {
        await apiAuthPatch(`/contacts/${editingId}`, {
          ...body,
          companyId: form.companyId ? form.companyId : null,
          ownerUserId: form.ownerUserId ? form.ownerUserId : null,
        });
      } else {
        await apiAuthPost('/contacts', body);
      }
      closeForm();
      await loadContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : ru.common.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm(ru.contacts.deleteConfirm)) return;
    try {
      await apiAuthDelete(`/contacts/${id}`);
      if (notesContactId === id) setNotesContactId(null);
      await loadContacts();
    } catch {
      setError(ru.common.deleteFailed);
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
      setError(ru.contacts.notesLoadError);
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
      setError(err instanceof Error ? err.message : ru.contacts.noteSaveError);
    } finally {
      setNoteSaving(false);
    }
  }

  return (
    <RequireAuth>
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{ru.contacts.title}</h1>
            <p className="mt-2 text-slate-400">{ru.contacts.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            disabled={!orgId}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
          >
            {ru.contacts.new}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-amber-400">{error}</p>}

        <div className="mt-4 max-w-lg">
          <input
            type="search"
            placeholder={ru.contacts.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {showForm && (
          <form onSubmit={onSubmit} className="mt-6 max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h2 className="mb-4 text-sm font-medium">{editingId ? ru.contacts.edit : ru.contacts.new}</h2>
            <div className="grid gap-3">
              <input
                required
                placeholder={ru.common.name}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <input
                type="email"
                placeholder={ru.common.email}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <input
                placeholder={ru.common.phone}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <select
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="">{ru.contacts.noCompany}</option>
                {companies.map((co) => (
                  <option key={co.id} value={co.id}>
                    {co.name}
                  </option>
                ))}
              </select>
              <select
                value={form.ownerUserId}
                onChange={(e) => setForm({ ...form, ownerUserId: e.target.value })}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="">{ru.common.noOwner}</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {ru.common.owner}: {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm hover:bg-blue-500 disabled:opacity-50"
              >
                {saving ? ru.common.saving : ru.common.save}
              </button>
              <button type="button" onClick={closeForm} className="rounded-md px-4 py-2 text-sm text-slate-400 hover:text-white">
                {ru.common.cancel}
              </button>
            </div>
          </form>
        )}

        <ul className="mt-6 divide-y divide-slate-800 rounded-lg border border-slate-800">
          {contacts.length === 0 && !error && <li className="px-4 py-6 text-sm text-slate-500">{ru.contacts.empty}</li>}
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-slate-500">
                  {c.email ?? c.phone ?? '—'}
                  {c.companyId && (
                    <span className="ml-2 text-slate-400">
                      · {companyNameById(c.companyId) ?? ru.contacts.companyFallback}
                    </span>
                  )}
                  {c.ownerUserId && memberNameById(c.ownerUserId) && (
                    <span className="ml-2 text-slate-400">
                      · {ru.common.ownerShort}: {memberNameById(c.ownerUserId)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 text-sm">
                <button type="button" onClick={() => openNotes(c.id)} className="text-slate-300 hover:underline">
                  {ru.contacts.notes}
                </button>
                <button type="button" onClick={() => openEdit(c)} className="text-blue-400 hover:underline">
                  {ru.common.edit}
                </button>
                <button type="button" onClick={() => onDelete(c.id)} className="text-red-400 hover:underline">
                  {ru.common.delete}
                </button>
              </div>
            </li>
          ))}
        </ul>

        {notesContactId && (
          <div className="mt-6 max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium">{ru.contacts.notes}</h2>
              <button
                type="button"
                onClick={() => setNotesContactId(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                {ru.common.close}
              </button>
            </div>
            <form onSubmit={onAddNote} className="mb-4 grid gap-2">
              <textarea
                required
                rows={3}
                placeholder={ru.contacts.addNote}
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={noteSaving}
                className="w-fit rounded-md bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-500 disabled:opacity-50"
              >
                {noteSaving ? ru.common.saving : ru.contacts.addNoteBtn}
              </button>
            </form>
            {notesLoading ? (
              <p className="text-sm text-slate-500">{ru.contacts.loadingNotes}</p>
            ) : notes.length === 0 ? (
              <p className="text-sm text-slate-500">{ru.contacts.noNotes}</p>
            ) : (
              <ul className="space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm">
                    <p className="whitespace-pre-wrap">{n.body}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(n.createdAt).toLocaleString('ru-RU')}</p>
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
