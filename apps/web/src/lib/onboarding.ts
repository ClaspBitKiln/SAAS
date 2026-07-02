import { apiPatch, apiPost, apiPublicGet } from './api';

export interface RegisterInput {
  companyName: string;
  userName: string;
  email: string;
  password: string;
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${base || 'company'}-${Date.now().toString(36)}`;
}

export async function registerCompany(input: RegisterInput): Promise<{ userId: string; email: string }> {
  const tenant = await apiPost<{ id: string }>('/tenants', {
    name: input.companyName,
    slug: slugify(input.companyName),
  });
  const org = await apiPost<{ id: string }>('/organizations', {
    tenantId: tenant.id,
    name: input.companyName,
  });
  const user = await apiPost<{ id: string }>('/users', {
    email: input.email,
    name: input.userName,
  });
  const membership = await apiPost<{ id: string }>('/memberships', {
    tenantId: tenant.id,
    userId: user.id,
    organizationId: org.id,
    isDefault: true,
  });
  await apiPatch(`/memberships/${membership.id}/accept`);
  await apiPost('/auth/set-password', { userId: user.id, password: input.password });
  return { userId: user.id, email: input.email };
}

export interface InviteInput {
  tenantId: string;
  organizationId: string;
  invitedBy: string;
  name: string;
  email: string;
}

export async function inviteTeamMember(input: InviteInput): Promise<{ userId: string; membershipId: string }> {
  const user = await apiPost<{ id: string }>('/users', { email: input.email, name: input.name });
  const membership = await apiPost<{ id: string }>('/memberships', {
    tenantId: input.tenantId,
    userId: user.id,
    organizationId: input.organizationId,
    invitedBy: input.invitedBy,
    isDefault: true,
  });
  return { userId: user.id, membershipId: membership.id };
}

export async function activatePendingMemberships(userId: string): Promise<void> {
  const list = await apiPublicGet<{ items: { id: string; status: string }[] }>(`/memberships?userId=${userId}`);
  for (const m of list.items) {
    if (m.status === 'PENDING') {
      await apiPatch(`/memberships/${m.id}/accept`);
    }
  }
}
