import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sales OS',
  description: 'CRM для B2B-продаж',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
