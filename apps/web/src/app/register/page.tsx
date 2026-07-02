'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginRequest } from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import { registerCompany } from '@/lib/onboarding';

export default function RegisterPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { email: registeredEmail } = await registerCompany({ companyName, userName, email, password });
      const data = await loginRequest(registeredEmail, password);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <h1 className="mb-1 text-2xl font-semibold">Create workspace</h1>
        <p className="mb-6 text-sm text-slate-400">Register your company and admin account</p>
        {error && <p className="mb-4 rounded-md bg-red-950/50 px-3 py-2 text-sm text-red-300">{error}</p>}
        <label className="mb-4 block text-sm">
          <span className="mb-1 block text-slate-400">Company name</span>
          <input
            required
            minLength={2}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
          />
        </label>
        <label className="mb-4 block text-sm">
          <span className="mb-1 block text-slate-400">Your name</span>
          <input
            required
            minLength={2}
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
          />
        </label>
        <label className="mb-4 block text-sm">
          <span className="mb-1 block text-slate-400">Work email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
          />
        </label>
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
          {loading ? 'Creating…' : 'Create workspace'}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
