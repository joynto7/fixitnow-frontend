import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { AuthHydrator } from '@/components/auth-hydrator';

export const metadata: Metadata = {
  title: 'FixItNow',
  description: 'Book trusted home service technicians for any job, big or small.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AuthHydrator />
          {children}
        </Providers>
      </body>
    </html>
  );
}
