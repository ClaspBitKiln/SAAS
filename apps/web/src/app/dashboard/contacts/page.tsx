'use client';

import { useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { apiGet, getApiBaseUrl } from '@/lib/api';
import { getAccessToken, getAuthUser } from '@/lib/auth';

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

export default function ContactsPage() {
  const user = getAuthUser();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    const orgId = user?.organizationId;
    if (!token || !orgId) {
      setError('No organization context. Complete onboarding first.');
      return;
    }
    apiGet<ContactList>(`/contacts?organizationId=${orgId}`, token)
      .then((data) => setContacts(data.items))
      .catch(() => setError(`Could not load contacts. API: ${getApiBaseUrl()}`));
  }, [user?.organizationId]);

  return (
    <RequireAuth>
      <div>
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <p className="mt-2 text-slate-400">CRM contacts for your organization.</p>
        {error && <p className="mt-4 text-sm text-amber-400">{error}</p>}
        <ul className="mt-6 divide-y divide-slate-800 rounded-lg border border-slate-800">
          {contacts.length === 0 && !error && (
            <li className="px-4 py-6 text-sm text-slate-500">No contacts yet.</li>
          )}
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-4 py-3">
              <span className="font-medium">{c.name}</span>
              <span className="text-sm text-slate-500">{c.email ?? c.phone ?? '—'}</span>
            </li>
          ))}
        </ul>
      </div>
    </RequireAuth>
  );
}
