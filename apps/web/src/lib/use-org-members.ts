'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiAuthGet, apiPublicGet } from '@/lib/api';

export interface OrgMember {
  userId: string;
  name: string;
}

interface MembershipItem {
  id: string;
  userId: string;
  status: string;
}

/** Active members of the current organization (for owner selects). */
export function useOrgMembers(orgId: string | null | undefined): OrgMember[] {
  const [members, setMembers] = useState<OrgMember[]>([]);

  const load = useCallback(async () => {
    if (!orgId) return;
    try {
      const list = await apiAuthGet<{ items: MembershipItem[] }>(`/memberships?organizationId=${orgId}`);
      const active = list.items.filter((m) => m.status === 'ACTIVE');
      const resolved = await Promise.all(
        active.map(async (m) => {
          const u = await apiPublicGet<{ id: string; name: string }>(`/users/${m.userId}`);
          return { userId: m.userId, name: u.name };
        }),
      );
      setMembers(resolved);
    } catch {
      /* optional — selects degrade to empty */
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  return members;
}
