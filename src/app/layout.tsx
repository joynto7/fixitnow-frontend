import type { Metadata } from 'next';
import { Big_Shoulders, Public_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { AuthHydrator } from '@/components/auth-hydrator';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { cn } from '@/lib/utils';

const bodyFont = Public_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

const headingFont = Big_Shoulders({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'FixItNow',
  description: 'Book trusted home service technicians for any job, big or small.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(bodyFont.variable, headingFont.variable)}>
      <body className="flex min-h-screen flex-col">
        <Providers>
          <AuthHydrator />
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
