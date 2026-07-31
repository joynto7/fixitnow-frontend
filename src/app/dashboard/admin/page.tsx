'use client';

import { useQuery } from '@tanstack/react-query';
import { getPlatformStats } from '@/lib/api/admin';
import { useAuthStore } from '@/lib/auth/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getPlatformStats,
    enabled: isHydrated,
  });
  const stats = statsQuery.data;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Platform overview</h1>

      {statsQuery.isError ? (
        <p className="text-sm text-destructive">Couldn&apos;t load platform stats.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total users" value={stats?.users.total} />
          <StatCard label="Customers" value={stats?.users.customers} />
          <StatCard label="Technicians" value={stats?.users.technicians} />
          <StatCard label="Banned users" value={stats?.users.banned} />
          <StatCard label="Total bookings" value={stats?.bookings.total} />
          <StatCard label="Categories" value={stats?.categories} />
          <StatCard label="Total revenue" value={stats ? `$${stats.revenue.toFixed(2)}` : undefined} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bookings by status</CardTitle>
        </CardHeader>
        <CardContent>
          {statsQuery.isPending ? (
            <Skeleton className="h-8 w-full" />
          ) : statsQuery.isError ? (
            <p className="text-sm text-destructive">Couldn&apos;t load booking stats.</p>
          ) : Object.keys(stats!.bookings.byStatus).length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings yet.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {Object.entries(stats!.bookings.byStatus).map(([status, count]) => (
                <p key={status} className="text-sm">
                  <span className="text-muted-foreground">{status}: </span>
                  <span className="font-medium">{count}</span>
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {value === undefined ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-semibold">{value}</p>}
      </CardContent>
    </Card>
  );
}
