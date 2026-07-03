'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { apiAuthGet, apiAuthPatch, apiAuthPost } from '@/lib/api';
import { getAuthUser } from '@/lib/auth';
import { ru } from '@/lib/ru';

interface Contact {
  id: string;
  name: string;
  phone: string | null;
}

interface ContactList {
  items: Contact[];
}

interface Call {
  id: string;
  contactId: string;
  phone: string;
  direction: string;
  status: string;
}

interface CallList {
  items: Call[];
  total: number;
}

export default function CallsPage() {
  const user = getAuthUser();
  const orgId = user?.organizationId;
  const [calls, setCalls] = useState<Call[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [contactId, setContactId] = useState('');
  const [direction, setDirection] = useState<'OUTBOUND' | 'INBOUND'>('OUTBOUND');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCalls = useCallback(async () => {
    if (!orgId) {
      setError(ru.calls.noOrg);
      return;
    }
    try {
      const data = await apiAuthGet<CallList>(`/calls?organizationId=${orgId}`);
      setCalls(data.items);
      setError(null);
    } catch {
      setError(ru.calls.loadError);
    }
  }, [orgId]);

  const loadContacts = useCallback(async () => {
    if (!orgId) return;
    try {
      const data = await apiAuthGet<ContactList>(`/contacts?organizationId=${orgId}`);
      setContacts(data.items);
    } catch {
      /* optional */
    }
  }, [orgId]);

  useEffect(() => {
    void loadCalls();
    void loadContacts();
  }, [loadCalls, loadContacts]);

  async function onLogCall(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiAuthPost('/calls', { contactId, direction, phone });
      setShowForm(false);
      setContactId('');
      setPhone('');
      await loadCalls();
    } catch (err) {
      setError(err instanceof Error ? err.message : ru.calls.logError);
    } finally {
      setSaving(false);
    }
  }

  async function onComplete(id: string) {
    try {
      await apiAuthPatch(`/calls/${id}/complete`);
      await loadCalls();
    } catch {
      setError(ru.calls.completeError);
    }
  }

  async function onMiss(id: string) {
    try {
      await apiAuthPatch(`/calls/${id}/miss`);
      await loadCalls();
    } catch {
      setError(ru.calls.missError);
    }
  }

  const contactName = (id: string) => contacts.find((c) => c.id === id)?.name ?? id.slice(0, 8);
  const directionLabel = (d: string) => (d === 'OUTBOUND' ? ru.calls.outbound : ru.calls.inbound);

  return (
    <RequireAuth>
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{ru.calls.title}</h1>
            <p className="mt-2 text-slate-400">{ru.calls.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            disabled={!orgId || contacts.length === 0}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
          >
            {ru.calls.logCall}
          </button>
        </div>

        {contacts.length === 0 && orgId && (
          <p className="mt-4 text-sm text-slate-500">{ru.calls.addContactFirst}</p>
        )}

        {error && <p className="mt-4 text-sm text-amber-400">{error}</p>}

        {showForm && (
          <form onSubmit={onLogCall} className="mt-6 max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h2 className="mb-4 text-sm font-medium">{ru.calls.logCallTitle}</h2>
            <div className="grid gap-3">
              <select
                required
                value={contactId}
                onChange={(e) => {
                  const id = e.target.value;
                  setContactId(id);
                  const c = contacts.find((x) => x.id === id);
                  if (c?.phone) setPhone(c.phone);
                }}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="">{ru.calls.selectContact}</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as 'OUTBOUND' | 'INBOUND')}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="OUTBOUND">{ru.calls.outbound}</option>
                <option value="INBOUND">{ru.calls.inbound}</option>
              </select>
              <input
                required
                placeholder={ru.common.phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm hover:bg-blue-500 disabled:opacity-50"
              >
                {saving ? ru.common.saving : ru.calls.startCall}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                {ru.common.cancel}
              </button>
            </div>
          </form>
        )}

        <ul className="mt-6 divide-y divide-slate-800 rounded-lg border border-slate-800">
          {calls.length === 0 && !error && <li className="px-4 py-6 text-sm text-slate-500">{ru.calls.empty}</li>}
          {calls.map((call) => (
            <li key={call.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <div className="font-medium">{contactName(call.contactId)}</div>
                <div className="text-slate-500">
                  {call.phone} · {directionLabel(call.direction)} · {call.status}
                </div>
              </div>
              {call.status === 'RINGING' && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => onComplete(call.id)} className="text-green-400 hover:underline">
                    {ru.calls.complete}
                  </button>
                  <button type="button" onClick={() => onMiss(call.id)} className="text-amber-400 hover:underline">
                    {ru.calls.missed}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </RequireAuth>
  );
}
