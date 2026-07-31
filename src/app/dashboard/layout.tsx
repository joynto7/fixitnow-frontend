'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/store';
import { cn } from '@/lib/utils';

const NAV_ITEMS: Record<'customer' | 'technician' | 'admin', { href: string; label: string }[]> = {
  customer: [{ href: '/dashboard/customer', label: 'Overview' }],
  technician: [
    { href: '/dashboard/technician', label: 'Overview' },
    { href: '/dashboard/technician/bookings', label: 'Bookings' },
  ],
  admin: [
    { href: '/dashboard/admin', label: 'Overview' },
    { href: '/dashboard/admin/users', label: 'Users' },
    { href: '/dashboard/admin/categories', label: 'Categories' },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const authCheckFailed = useAuthStore((state) => state.authCheckFailed);
  const segment = pathname.split('/')[2];
  const items = NAV_ITEMS[segment as keyof typeof NAV_ITEMS] ?? [];

  useEffect(() => {
    // Only redirect on a confirmed logged-out state. If the auth check merely
    // failed to complete (network/server error), the existing session might
    // still be valid - don't bounce the user away over a transient hiccup.
    if (isHydrated && !user && !authCheckFailed) {
      router.replace('/auth/login');
    }
  }, [isHydrated, user, authCheckFailed, router]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6 sm:flex-row sm:gap-8">
      <aside className="shrink-0 sm:w-48">
        <p className="mb-4 text-sm font-medium text-muted-foreground">{user?.name}</p>
        <nav className="flex gap-1 overflow-x-auto sm:flex-col">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'shrink-0 rounded-md px-3 py-2 text-sm',
                pathname === item.href ? 'bg-muted font-medium' : 'hover:bg-muted/50'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      {/* min-w-0 lets the table's own overflow-x-auto wrapper scroll instead of the flex item stretching past the viewport */}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
