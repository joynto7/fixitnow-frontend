'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/store';
import { clearAuthCookie } from '@/lib/auth/cookie';
import { ROLE_DASHBOARD_PATH } from '@/lib/auth/constants';
import { Button } from '@/components/ui/button';
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
        <Link href="/" className="text-lg font-semibold">
          FixItNow
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/services" className="text-sm">
            Browse services
          </Link>
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
      </div>
    </header>
  );
}
