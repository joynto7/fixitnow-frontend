import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { AuthHydrator } from '@/components/auth-hydrator';
import { Navbar } from '@/components/layout/navbar';

export const metadata: Metadata = {
  title: 'FixItNow',
  description: 'Book trusted home service technicians for any job, big or small.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <AuthHydrator />
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
