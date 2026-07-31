'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getBookingById } from '@/lib/api/bookings';
import { useAuthStore } from '@/lib/auth/store';
import { BookingStatusBadge } from '@/components/booking-status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const bookingQuery = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBookingById(bookingId!),
    enabled: !!bookingId && isHydrated,
  });

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold">Payment successful</h1>
      {!bookingId ? (
        <p className="mt-2 text-muted-foreground">Your payment went through.</p>
      ) : bookingQuery.isPending ? (
        <Skeleton className="mx-auto mt-4 h-16 w-full" />
      ) : bookingQuery.isError || !bookingQuery.data ? (
        <p className="mt-2 text-muted-foreground">
          Your payment went through — check your dashboard for the latest status.
        </p>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-muted-foreground">{bookingQuery.data.service.title}</p>
          <BookingStatusBadge status={bookingQuery.data.status} />
        </div>
      )}
      <Button className="mt-6" render={<Link href="/dashboard/customer">Go to your bookings</Link>} />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md py-16 text-center text-sm text-muted-foreground">Loading…</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
