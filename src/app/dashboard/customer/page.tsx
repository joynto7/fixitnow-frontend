'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listMyBookings } from '@/lib/api/bookings';
import { listMyPayments } from '@/lib/api/payments';
import { useAuthStore } from '@/lib/auth/store';
import { BookingRow } from '@/components/booking-row';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const UPCOMING_STATUSES = new Set(['ACCEPTED', 'PAID', 'IN_PROGRESS']);

export default function CustomerDashboardPage() {
  // Gate on isHydrated: the auth store's token is only set once AuthHydrator's
  // getMe() resolves, which races with this query firing on mount otherwise -
  // an ungated call silently 401s if it wins the race.
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);
  const bookingsQuery = useQuery({
    queryKey: ['bookings'],
    queryFn: () => listMyBookings({ limit: 50 }),
    enabled: isHydrated,
  });
  const paymentsQuery = useQuery({ queryKey: ['payments'], queryFn: listMyPayments, enabled: isHydrated });

  const bookings = bookingsQuery.data?.items ?? [];
  const upcomingCount = bookings.filter((b) => UPCOMING_STATUSES.has(b.status)).length;
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;
  const totalSpent = (paymentsQuery.data ?? [])
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          {user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Your dashboard'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your bookings.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming bookings" value={bookingsQuery.isPending ? undefined : upcomingCount} />
        <StatCard label="Completed jobs" value={bookingsQuery.isPending ? undefined : completedCount} />
        <StatCard label="Total spent" value={paymentsQuery.isPending ? undefined : `$${totalSpent.toFixed(2)}`} />
      </div>

      <div>
        <h2 className="font-heading text-xl font-semibold">Your bookings</h2>
        <div className="mt-4 flex flex-col gap-4">
          {bookingsQuery.isPending ? (
            <>
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </>
          ) : bookingsQuery.isError ? (
            <p className="text-sm text-destructive">Couldn&apos;t load your bookings.</p>
          ) : bookingsQuery.data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No bookings yet —{' '}
              <Link href="/services" className="underline">
                browse services
              </Link>{' '}
              to get started.
            </p>
          ) : (
            bookingsQuery.data.items.map((booking) => <BookingRow key={booking.id} booking={booking} />)
          )}
        </div>
      </div>

      <div>
        <h2 className="font-heading text-xl font-semibold">Payment history</h2>
        <div className="mt-4">
          {paymentsQuery.isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : paymentsQuery.isError ? (
            <p className="text-sm text-destructive">Couldn&apos;t load your payment history.</p>
          ) : paymentsQuery.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-3">Service</th>
                    <th className="p-3">Provider</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Paid at</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsQuery.data.map((payment) => (
                    <tr key={payment.id} className="border-t">
                      <td className="p-3">{payment.booking.service.title}</td>
                      <td className="p-3">{payment.provider}</td>
                      <td className="p-3">${Number(payment.amount).toFixed(2)}</td>
                      <td className="p-3">{payment.status}</td>
                      <td className="p-3">{payment.paidAt ? new Date(payment.paidAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
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
