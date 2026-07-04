'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { apiAuthGet, apiAuthPatch, apiAuthPost } from '@/lib/api';
import { getAuthUser } from '@/lib/auth';
import { ru } from '@/lib/ru';
import { useOrgMembers } from '@/lib/use-org-members';

interface TaskItem {
  id: string;
  title: string;
  type: string;
  status: string;
  dueAt: string;
  assigneeUserId: string;
  contactId: string | null;
  companyId: string | null;
}

interface NamedRef {
  id: string;
  name: string;
}

const typeLabels: Record<string, string> = {
  CALL: ru.tasks.typeCall,
  MESSAGE: ru.tasks.typeMessage,
  MEETING: ru.tasks.typeMeeting,
  TODO: ru.tasks.typeTodo,
};

function defaultDue(): string {
  const d = new Date();
  d.setHours(d.getHours() + 3, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = { title: '', dueAt: defaultDue(), type: 'CALL', assigneeUserId: '', contactId: '', companyId: '' };

export default function TasksPage() {
  const user = getAuthUser();
  const orgId = user?.organizationId;
  const members = useOrgMembers(orgId);
  const [todayTasks, setTodayTasks] = useState<TaskItem[]>([]);
  const [openTasks, setOpenTasks] = useState<TaskItem[]>([]);
  const [contacts, setContacts] = useState<NamedRef[]>([]);
  const [companies, setCompanies] = useState<NamedRef[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) {
      setError(ru.common.noOrg);
      return;
    }
    try {
      const [today, open] = await Promise.all([
        apiAuthGet<TaskItem[]>('/tasks/today'),
        apiAuthGet<{ items: TaskItem[] }>('/tasks?status=OPEN&size=100'),
      ]);
      setTodayTasks(today);
      setOpenTasks(open.items);
      setError(null);
    } catch {
      setError(ru.tasks.loadError);
    }
  }, [orgId]);

  const loadRefs = useCallback(async () => {
    if (!orgId) return;
    try {
      const [c, co] = await Promise.all([
        apiAuthGet<{ items: NamedRef[] }>('/contacts?size=100'),
        apiAuthGet<{ items: NamedRef[] }>('/companies?size=100'),
      ]);
      setContacts(c.items);
      setCompanies(co.items);
    } catch {
      /* optional */
    }
  }, [orgId]);

  useEffect(() => {
    void load();
    void loadRefs();
  }, [load, loadRefs]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    try {
      await apiAuthPost('/tasks', {
        title: form.title,
        dueAt: new Date(form.dueAt).toISOString(),
        type: form.type,
        assigneeUserId: form.assigneeUserId || undefined,
        contactId: form.contactId || undefined,
        companyId: form.companyId || undefined,
      });
      setShowForm(false);
      setForm({ ...emptyForm, dueAt: defaultDue() });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : ru.common.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function onComplete(id: string) {
    try {
      await apiAuthPatch(`/tasks/${id}/complete`, {});
      await load();
    } catch {
      setError(ru.common.saveFailed);
    }
  }

  async function onCancel(id: string) {
    if (!confirm(ru.tasks.cancelConfirm)) return;
    try {
      await apiAuthPatch(`/tasks/${id}/cancel`, {});
      await load();
    } catch {
      setError(ru.common.saveFailed);
    }
  }

  function refName(list: NamedRef[], id: string | null): string | null {
    if (!id) return null;
    return list.find((r) => r.id === id)?.name ?? null;
  }

  function memberName(id: string): string | null {
    return members.find((m) => m.userId === id)?.name ?? null;
  }

  function renderTask(t: TaskItem, highlightOverdue: boolean) {
    const overdue = new Date(t.dueAt).getTime() < Date.now();
    const context = [refName(contacts, t.contactId), refName(companies, t.companyId), memberName(t.assigneeUserId)]
      .filter(Boolean)
      .join(' · ');
    return (
      <li key={t.id} className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="font-medium">
            <span className="mr-2 rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300">
              {typeLabels[t.type] ?? t.type}
            </span>
            {t.title}
          </div>
          <div className="text-sm text-slate-500">
            {new Date(t.dueAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            {highlightOverdue && overdue && <span className="ml-2 text-red-400">{ru.tasks.overdue}</span>}
            {context && <span className="ml-2 text-slate-400">· {context}</span>}
          </div>
        </div>
        <div className="flex gap-2 text-sm">
          <button type="button" onClick={() => void onComplete(t.id)} className="text-green-400 hover:underline">
            {ru.tasks.done}
          </button>
          <button type="button" onClick={() => void onCancel(t.id)} className="text-slate-400 hover:underline">
            {ru.tasks.cancelTask}
          </button>
        </div>
      </li>
    );
  }

  return (
    <RequireAuth>
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{ru.tasks.title}</h1>
            <p className="mt-2 text-slate-400">{ru.tasks.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            disabled={!orgId}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
          >
            {ru.tasks.new}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-amber-400">{error}</p>}

        {showForm && (
          <form onSubmit={onSubmit} className="mt-6 max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h2 className="mb-4 text-sm font-medium">{ru.tasks.new}</h2>
            <div className="grid gap-3">
              <input
                required
                placeholder={ru.tasks.titleField}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-slate-400">
                  {ru.tasks.due}
                  <input
                    type="datetime-local"
                    required
                    value={form.dueAt}
                    onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  {ru.tasks.type}
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="CALL">{ru.tasks.typeCall}</option>
                    <option value="MESSAGE">{ru.tasks.typeMessage}</option>
                    <option value="MEETING">{ru.tasks.typeMeeting}</option>
                    <option value="TODO">{ru.tasks.typeTodo}</option>
                  </select>
                </label>
              </div>
              <select
                value={form.contactId}
                onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="">{ru.tasks.forContact}</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="">{ru.tasks.forCompany}</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={form.assigneeUserId}
                onChange={(e) => setForm({ ...form, assigneeUserId: e.target.value })}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  {ru.tasks.assignee}: {ru.tasks.me}
                </option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {ru.tasks.assignee}: {m.name}
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

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">{ru.tasks.today}</h2>
        <ul className="mt-2 divide-y divide-slate-800 rounded-lg border border-slate-800">
          {todayTasks.length === 0 && <li className="px-4 py-6 text-sm text-slate-500">{ru.tasks.todayEmpty}</li>}
          {todayTasks.map((t) => renderTask(t, true))}
        </ul>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">{ru.tasks.all}</h2>
        <ul className="mt-2 divide-y divide-slate-800 rounded-lg border border-slate-800">
          {openTasks.length === 0 && <li className="px-4 py-6 text-sm text-slate-500">{ru.tasks.empty}</li>}
          {openTasks.map((t) => renderTask(t, false))}
        </ul>
      </div>
    </RequireAuth>
  );
}
