'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/store';
import { cn } from '@/lib/utils';

const NAV_ITEMS: Record<'customer' | 'technician' | 'admin', { href: string; label: string }[]> = {
  customer: [{ href: '/dashboard/customer', label: 'Overview' }],
  technician: [{ href: '/dashboard/technician', label: 'Overview' }],
  admin: [{ href: '/dashboard/admin', label: 'Overview' }],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const segment = pathname.split('/')[2] as 'customer' | 'technician' | 'admin' | undefined;
  const items = segment ? NAV_ITEMS[segment] : [];

  return (
    <div className="mx-auto flex max-w-6xl gap-8 p-6">
      <aside className="w-48 shrink-0">
        <p className="mb-4 text-sm font-medium text-muted-foreground">{user?.name}</p>
        <nav className="flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm',
                pathname === item.href ? 'bg-muted font-medium' : 'hover:bg-muted/50'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
