import Link from 'next/link';
import { ru } from '@/lib/ru';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">{ru.appName}</h1>
      <p className="mt-3 max-w-md text-slate-400">{ru.home.tagline}</p>
      <div className="mt-8 flex gap-4">
        <Link href="/register" className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium hover:bg-blue-500">
          {ru.home.getStarted}
        </Link>
        <Link href="/login" className="rounded-md border border-slate-700 px-6 py-2.5 text-sm hover:border-slate-500">
          {ru.home.signIn}
        </Link>
      </div>
    </div>
  );
}
