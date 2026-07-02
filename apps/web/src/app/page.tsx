import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Sales OS</h1>
      <p className="mt-3 max-w-md text-slate-400">AI-powered CRM for B2B sales teams. Register, invite your team, manage contacts and calls.</p>
      <div className="mt-8 flex gap-4">
        <Link href="/register" className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium hover:bg-blue-500">
          Get started
        </Link>
        <Link href="/login" className="rounded-md border border-slate-700 px-6 py-2.5 text-sm hover:border-slate-500">
          Sign in
        </Link>
      </div>
    </div>
  );
}
