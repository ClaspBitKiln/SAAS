import { clearAuth, getAccessToken, getRefreshToken, saveAuth, type AuthUser } from './auth';

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  name: string;
  tenantId: string | null;
  organizationId: string | null;
}

function loginResponseToUser(data: LoginResponse): AuthUser {
  return {
    userId: data.userId,
    email: data.email,
    name: data.name,
    tenantId: data.tenantId,
    organizationId: data.organizationId,
  };
}

async function refreshTokens(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as LoginResponse;
    saveAuth(
      { accessToken: data.accessToken, refreshToken: data.refreshToken },
      loginResponseToUser(data),
    );
    return data.accessToken;
  } catch {
    return null;
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean },
  retried = false,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (init.auth) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers });

  if (res.status === 401 && init.auth && !retried) {
    const newToken = await refreshTokens();
    if (newToken) return apiFetch<T>(path, init, true);
    clearAuth();
    throw new Error('Session expired');
  }

  return parseResponse<T>(res);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PATCH',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function apiAuthGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'GET', auth: true });
}

export async function apiAuthPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', auth: true, body: JSON.stringify(body) });
}

export async function apiAuthPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PATCH',
    auth: true,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function apiAuthDelete(path: string): Promise<void> {
  await apiFetch<void>(path, { method: 'DELETE', auth: true });
}

export async function apiPublicGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'GET' });
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/login', { email, password });
}

export async function logoutSession(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await apiPost('/auth/logout', { refreshToken });
    } catch {
      /* best effort */
    }
  }
  clearAuth();
}
