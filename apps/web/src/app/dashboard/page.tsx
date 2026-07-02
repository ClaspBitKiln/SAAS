'use client';

import { RequireAuth } from '@/components/RequireAuth';
import { getAuthUser } from '@/lib/auth';

export default function DashboardPage() {
  const user = getAuthUser();

  return (
    <RequireAuth>
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-slate-400">Welcome back, {user?.name ?? 'User'}.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {['Contacts', 'Calls', 'AI Summary'].map((label) => (
            <div key={label} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-semibold">—</div>
            </div>
          ))}
        </div>
      </div>
    </RequireAuth>
  );
}
