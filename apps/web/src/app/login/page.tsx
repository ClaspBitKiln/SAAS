'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginRequest } from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import { ru } from '@/lib/ru';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
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
    } catch {
      setError(ru.login.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <h1 className="mb-1 text-2xl font-semibold">{ru.appName}</h1>
        <p className="mb-6 text-sm text-slate-400">{ru.login.subtitle}</p>
        {error && <p className="mb-4 rounded-md bg-red-950/50 px-3 py-2 text-sm text-red-300">{error}</p>}
        <label className="mb-4 block text-sm">
          <span className="mb-1 block text-slate-400">{ru.common.email}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
          />
        </label>
        <label className="mb-6 block text-sm">
          <span className="mb-1 block text-slate-400">{ru.login.password}</span>
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
          {loading ? ru.login.submitting : ru.login.submit}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">
          {ru.login.newHere}{' '}
          <Link href="/register" className="text-blue-400 hover:underline">
            {ru.login.createWorkspace}
          </Link>
        </p>
      </form>
    </div>
  );
}
