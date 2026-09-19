import type { Metadata } from 'next';
import { Providers } from './providers';
import { Shell } from '@/components/shell';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Novellia Pets | A little care, all together', template: '%s | Novellia Pets' },
  description: 'Your pets, their medical history, and what comes next. A shared fictional demo.',
};
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
