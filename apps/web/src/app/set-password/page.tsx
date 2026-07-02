'use client';

import { FormEvent, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiPost, loginRequest } from '@/lib/api';
import { activatePendingMemberships } from '@/lib/onboarding';
import { saveAuth } from '@/lib/auth';

function SetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const userId = params.get('userId') ?? '';
  const email = params.get('email') ?? '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!userId) {
      setError('Invalid invite link — missing userId');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiPost('/auth/set-password', { userId, password });
      await activatePendingMemberships(userId);
      if (email) {
        const data = await loginRequest(email, password);
        saveAuth(
          { accessToken: data.accessToken, refreshToken: data.refreshToken },
          {
            userId: data.userId,
            email: data.email,
            name: data.name,
            tenantId: data.tenantId,
            organizationId: data.organizationId,
          },
        );
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set password');
    } finally {
      setLoading(false);
    }
  }

  if (!userId) {
    return (
      <div className="text-center">
        <p className="text-red-300">Invalid invite link.</p>
        <Link href="/login" className="mt-4 inline-block text-sm text-blue-400 hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <h1 className="mb-1 text-2xl font-semibold">Set your password</h1>
      <p className="mb-6 text-sm text-slate-400">
        {email ? `Activate account for ${email}` : 'Choose a password to activate your account'}
      </p>
      {error && <p className="mb-4 rounded-md bg-red-950/50 px-3 py-2 text-sm text-red-300">{error}</p>}
      <label className="mb-6 block text-sm">
        <span className="mb-1 block text-slate-400">Password (min 8 chars)</span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Activate account'}
      </button>
    </form>
  );
}

export default function SetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div className="text-slate-400">Loading…</div>}>
        <SetPasswordForm />
      </Suspense>
    </div>
  );
}
