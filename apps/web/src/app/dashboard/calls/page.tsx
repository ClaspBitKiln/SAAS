'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { apiAuthGet, apiAuthPatch, apiAuthPost } from '@/lib/api';
import { getAuthUser } from '@/lib/auth';

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
      setError('No organization context.');
      return;
    }
    try {
      const data = await apiAuthGet<CallList>(`/calls?organizationId=${orgId}`);
      setCalls(data.items);
      setError(null);
    } catch {
      setError('Could not load calls');
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
      setError(err instanceof Error ? err.message : 'Could not log call');
    } finally {
      setSaving(false);
    }
  }

  async function onComplete(id: string) {
    try {
      await apiAuthPatch(`/calls/${id}/complete`);
      await loadCalls();
    } catch {
      setError('Could not complete call');
    }
  }

  async function onMiss(id: string) {
    try {
      await apiAuthPatch(`/calls/${id}/miss`);
      await loadCalls();
    } catch {
      setError('Could not mark call as missed');
    }
  }

  const contactName = (id: string) => contacts.find((c) => c.id === id)?.name ?? id.slice(0, 8);

  return (
    <RequireAuth>
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Calls</h1>
            <p className="mt-2 text-slate-400">Log and track calls with your contacts.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            disabled={!orgId || contacts.length === 0}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
          >
            Log call
          </button>
        </div>

        {contacts.length === 0 && orgId && (
          <p className="mt-4 text-sm text-slate-500">Add a contact first to log calls.</p>
        )}

        {error && <p className="mt-4 text-sm text-amber-400">{error}</p>}

        {showForm && (
          <form onSubmit={onLogCall} className="mt-6 max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h2 className="mb-4 text-sm font-medium">Log call</h2>
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
                <option value="">Select contact</option>
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
                <option value="OUTBOUND">Outbound</option>
                <option value="INBOUND">Inbound</option>
              </select>
              <input
                required
                placeholder="Phone"
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
                {saving ? 'Saving…' : 'Start call'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <ul className="mt-6 divide-y divide-slate-800 rounded-lg border border-slate-800">
          {calls.length === 0 && !error && <li className="px-4 py-6 text-sm text-slate-500">No calls yet.</li>}
          {calls.map((call) => (
            <li key={call.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <div className="font-medium">{contactName(call.contactId)}</div>
                <div className="text-slate-500">
                  {call.phone} · {call.direction} · {call.status}
                </div>
              </div>
              {call.status === 'RINGING' && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => onComplete(call.id)} className="text-green-400 hover:underline">
                    Complete
                  </button>
                  <button type="button" onClick={() => onMiss(call.id)} className="text-amber-400 hover:underline">
                    Missed
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
