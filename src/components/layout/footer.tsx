'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();
  // Auth pages use their own full-height branded layout (AuthShell), which
  // already has a wordmark and copyright line — the marketing footer below it
  // was pure redundant clutter, not a second piece of real content.
  if (pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-heading text-lg font-semibold">FixItNow</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Trusted home service technicians, booked in minutes.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Explore</p>
          <Link href="/services" className="hover:underline">
            Browse services
          </Link>
          <Link href="/auth/register" className="hover:underline">
            Become a technician
          </Link>
          <Link href="/api-list" className="hover:underline">
            API list
          </Link>
        </div>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-6 py-4 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} FixItNow. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
