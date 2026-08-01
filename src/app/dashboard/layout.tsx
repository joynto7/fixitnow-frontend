'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboardIcon, ClipboardListIcon, UsersIcon, TagIcon, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/lib/auth/store';
import { cn } from '@/lib/utils';

const NAV_ITEMS: Record<'customer' | 'technician' | 'admin', { href: string; label: string; icon: LucideIcon }[]> = {
  customer: [{ href: '/dashboard/customer', label: 'Overview', icon: LayoutDashboardIcon }],
  technician: [
    { href: '/dashboard/technician', label: 'Overview', icon: LayoutDashboardIcon },
    { href: '/dashboard/technician/bookings', label: 'Bookings', icon: ClipboardListIcon },
  ],
  admin: [
    { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboardIcon },
    { href: '/dashboard/admin/users', label: 'Users', icon: UsersIcon },
    { href: '/dashboard/admin/categories', label: 'Categories', icon: TagIcon },
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
      <aside className="shrink-0 sm:w-56">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-4px_rgba(15,23,42,0.08)] sm:sticky sm:top-6">
          <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{segment}</p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto sm:flex-col">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-accent font-medium text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      {/* min-w-0 lets the table's own overflow-x-auto wrapper scroll instead of the flex item stretching past the viewport */}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
