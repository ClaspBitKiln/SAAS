'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { apiAuthDelete, apiAuthGet, apiAuthPatch, apiAuthPost } from '@/lib/api';
import { getAuthUser } from '@/lib/auth';
import { ru } from '@/lib/ru';

interface Company {
  id: string;
  name: string;
  inn: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
}

interface CompanyList {
  items: Company[];
  total: number;
}

const emptyForm = { name: '', inn: '', email: '', phone: '', website: '' };

export default function CompaniesPage() {
  const user = getAuthUser();
  const orgId = user?.organizationId;
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadCompanies = useCallback(async () => {
    if (!orgId) {
      setError(ru.common.noOrg);
      return;
    }
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      const query = params.toString();
      const data = await apiAuthGet<CompanyList>(`/companies${query ? `?${query}` : ''}`);
      setCompanies(data.items);
      setError(null);
    } catch {
      setError(ru.companies.loadError);
    }
  }, [orgId, search]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(c: Company) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      inn: c.inn ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      website: c.website ?? '',
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
        inn: form.inn || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        website: form.website || undefined,
      };
      if (editingId) {
        await apiAuthPatch(`/companies/${editingId}`, body);
      } else {
        await apiAuthPost('/companies', body);
      }
      closeForm();
      await loadCompanies();
    } catch {
      setError(ru.common.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm(ru.companies.deleteConfirm)) return;
    try {
      await apiAuthDelete(`/companies/${id}`);
      await loadCompanies();
    } catch {
      setError(ru.common.deleteFailed);
    }
  }

  return (
    <RequireAuth>
      <div className="p-6 text-slate-100">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{ru.companies.title}</h1>
          <button
            type="button"
            onClick={openCreate}
            disabled={!orgId}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
          >
            {ru.companies.new}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-amber-400">{error}</p>}

        <div className="mt-4 max-w-lg">
          <input
            type="search"
            placeholder={ru.companies.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {showForm && (
          <form onSubmit={onSubmit} className="mt-6 max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h2 className="mb-4 text-sm font-medium">{editingId ? ru.companies.edit : ru.companies.new}</h2>
            <div className="grid gap-3">
              <input
                required
                placeholder={ru.companies.companyName}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <input
                placeholder={ru.companies.inn}
                value={form.inn}
                onChange={(e) => setForm({ ...form, inn: e.target.value })}
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
              <input
                placeholder={ru.companies.website}
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm hover:bg-blue-500 disabled:opacity-50"
              >
                {saving ? ru.common.saving : ru.common.save}
              </button>
              <button type="button" onClick={closeForm} className="rounded-md border border-slate-700 px-4 py-2 text-sm">
                {ru.common.cancel}
              </button>
            </div>
          </form>
        )}

        <ul className="mt-6 divide-y divide-slate-800 rounded-lg border border-slate-800">
          {companies.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-slate-400">
                  {[c.inn && `ИНН ${c.inn}`, c.email, c.phone].filter(Boolean).join(' · ') || ru.companies.noDetails}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => openEdit(c)} className="text-sm text-blue-400 hover:underline">
                  {ru.common.edit}
                </button>
                <button type="button" onClick={() => void onDelete(c.id)} className="text-sm text-red-400 hover:underline">
                  {ru.common.delete}
                </button>
              </div>
            </li>
          ))}
          {companies.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">{ru.companies.empty}</li>}
        </ul>
      </div>
    </RequireAuth>
  );
}
