'use client';

import { FormEvent, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiPost, loginRequest } from '@/lib/api';
import { activatePendingMemberships } from '@/lib/onboarding';
import { saveAuth } from '@/lib/auth';
import { ru } from '@/lib/ru';

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
      setError(ru.setPassword.missingUserId);
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
      setError(err instanceof Error ? err.message : ru.setPassword.error);
    } finally {
      setLoading(false);
    }
  }

  if (!userId) {
    return (
      <div className="text-center">
        <p className="text-red-300">{ru.setPassword.invalidLink}</p>
        <Link href="/login" className="mt-4 inline-block text-sm text-blue-400 hover:underline">
          {ru.setPassword.goSignIn}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <h1 className="mb-1 text-2xl font-semibold">{ru.setPassword.title}</h1>
      <p className="mb-6 text-sm text-slate-400">
        {email ? ru.setPassword.activateFor(email) : ru.setPassword.activateGeneric}
      </p>
      {error && <p className="mb-4 rounded-md bg-red-950/50 px-3 py-2 text-sm text-red-300">{error}</p>}
      <label className="mb-6 block text-sm">
        <span className="mb-1 block text-slate-400">{ru.setPassword.passwordHint}</span>
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
        {loading ? ru.setPassword.submitting : ru.setPassword.submit}
      </button>
    </form>
  );
}

export default function SetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div className="text-slate-400">{ru.common.loading}</div>}>
        <SetPasswordForm />
      </Suspense>
    </div>
  );
}
