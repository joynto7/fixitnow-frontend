'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listMyBookings } from '@/lib/api/bookings';
import { listMyPayments } from '@/lib/api/payments';
import { useAuthStore } from '@/lib/auth/store';
import { BookingRow } from '@/components/booking-row';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomerDashboardPage() {
  // Gate on isHydrated: the auth store's token is only set once AuthHydrator's
  // getMe() resolves, which races with this query firing on mount otherwise -
  // an ungated call silently 401s if it wins the race.
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const bookingsQuery = useQuery({
    queryKey: ['bookings'],
    queryFn: () => listMyBookings({ limit: 50 }),
    enabled: isHydrated,
  });
  const paymentsQuery = useQuery({ queryKey: ['payments'], queryFn: listMyPayments, enabled: isHydrated });

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold">Your bookings</h1>
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
        <h2 className="text-xl font-semibold">Payment history</h2>
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
