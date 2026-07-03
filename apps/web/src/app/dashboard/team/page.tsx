'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { apiAuthGet, apiPublicGet } from '@/lib/api';
import { getAuthUser } from '@/lib/auth';
import { inviteTeamMember } from '@/lib/onboarding';
import { ru } from '@/lib/ru';

interface Membership {
  id: string;
  userId: string;
  status: string;
}

interface MembershipList {
  items: Membership[];
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
}

interface TeamMember {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  status: string;
}

export default function TeamPage() {
  const user = getAuthUser();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTeam = useCallback(async () => {
    const orgId = user?.organizationId;
    if (!orgId) return;
    try {
      const list = await apiAuthGet<MembershipList>(`/memberships?organizationId=${orgId}`);
      const resolved = await Promise.all(
        list.items.map(async (m) => {
          const u = await apiPublicGet<UserInfo>(`/users/${m.userId}`);
          return { membershipId: m.id, userId: m.userId, name: u.name, email: u.email, status: m.status };
        }),
      );
      setMembers(resolved);
    } catch {
      setError(ru.team.loadError);
    }
  }, [user?.organizationId]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    if (!user?.tenantId || !user.organizationId) {
      setError(ru.team.noOrg);
      return;
    }
    setError(null);
    setInviteLink(null);
    setLoading(true);
    try {
      const { userId } = await inviteTeamMember({
        tenantId: user.tenantId,
        organizationId: user.organizationId,
        invitedBy: user.userId,
        name,
        email,
      });
      const link = `${window.location.origin}/set-password?userId=${userId}&email=${encodeURIComponent(email)}`;
      setInviteLink(link);
      setName('');
      setEmail('');
      await loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : ru.team.inviteError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <RequireAuth>
      <div>
        <h1 className="text-2xl font-semibold">{ru.team.title}</h1>
        <p className="mt-2 text-slate-400">{ru.team.subtitle}</p>

        <form onSubmit={onInvite} className="mt-6 max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-4 text-sm font-medium text-slate-300">{ru.team.inviteTitle}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder={ru.common.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <input
              type="email"
              required
              placeholder={ru.common.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? ru.team.inviting : ru.team.sendInvite}
          </button>
          {inviteLink && (
            <div className="mt-3 rounded-md bg-slate-950 p-3 text-xs">
              <p className="mb-1 text-slate-400">{ru.team.shareLink}</p>
              <code className="break-all text-blue-300">{inviteLink}</code>
            </div>
          )}
        </form>

        {error && <p className="mt-4 text-sm text-amber-400">{error}</p>}

        <ul className="mt-8 divide-y divide-slate-800 rounded-lg border border-slate-800">
          {members.length === 0 && <li className="px-4 py-6 text-sm text-slate-500">{ru.team.empty}</li>}
          {members.map((m) => (
            <li key={m.membershipId} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-slate-500">{m.email}</div>
              </div>
              <span className="text-slate-500">{m.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </RequireAuth>
  );
}
