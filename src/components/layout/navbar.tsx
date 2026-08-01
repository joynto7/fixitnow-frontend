'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { MenuIcon } from 'lucide-react';
import { useAuthStore } from '@/lib/auth/store';
import { clearAuthCookie } from '@/lib/auth/cookie';
import { ROLE_DASHBOARD_PATH } from '@/lib/auth/constants';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const authCheckFailed = useAuthStore((state) => state.authCheckFailed);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    queryClient.clear();
    clearAuthCookie();
    clearAuth();
    router.push('/');
  };

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-xl font-semibold">
          <svg viewBox="0 0 32 32" className="size-6" aria-hidden="true">
            <rect width="32" height="32" rx="7" fill="#363b44" />
            <g transform="rotate(45 16 16)">
              <circle cx="16" cy="8" r="5.5" fill="#f4f6f8" />
              <circle cx="16" cy="8" r="3" fill="#363b44" />
              <rect x="14.2" y="1.2" width="3.6" height="4.8" fill="#363b44" />
              <rect x="14" y="12" width="4" height="16" rx="2" fill="#f4f6f8" />
            </g>
          </svg>
          FixItNow
        </Link>
        <nav className="hidden items-center gap-4 sm:flex">
          <Link href="/services" className="text-sm">
            Browse services
          </Link>
          <ModeToggle />
          {!isHydrated || (!user && authCheckFailed) ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline">{user.name}</Button>} />
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  render={<Link href={`/dashboard/${ROLE_DASHBOARD_PATH[user.role]}`}>Dashboard</Link>}
                />
                <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" render={<Link href="/auth/login">Log in</Link>} />
              <Button render={<Link href="/auth/register">Sign up</Link>} />
            </>
          )}
        </nav>
        <div className="flex items-center gap-2 sm:hidden">
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Menu" />}>
              <MenuIcon className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href="/services">Browse services</Link>} />
              {!isHydrated || (!user && authCheckFailed) ? null : user ? (
                <>
                  <DropdownMenuItem
                    render={<Link href={`/dashboard/${ROLE_DASHBOARD_PATH[user.role]}`}>Dashboard</Link>}
                  />
                  <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem render={<Link href="/auth/login">Log in</Link>} />
                  <DropdownMenuItem render={<Link href="/auth/register">Sign up</Link>} />
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
