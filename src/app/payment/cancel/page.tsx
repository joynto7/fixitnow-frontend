'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getBookingById } from '@/lib/api/bookings';
import { useAuthStore } from '@/lib/auth/store';
import { BookingStatusBadge } from '@/components/booking-status-badge';
import { Button } from '@/components/ui/button';

function PaymentCancelContent() {
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
      <h1 className="text-2xl font-semibold">Payment cancelled</h1>
      <p className="mt-2 text-muted-foreground">
        Your booking hasn&apos;t been paid for yet. You can retry from your bookings list.
      </p>
      {bookingId && bookingQuery.data ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-muted-foreground">{bookingQuery.data.service.title}</p>
          <BookingStatusBadge status={bookingQuery.data.status} />
        </div>
      ) : null}
      <Button className="mt-6" render={<Link href="/dashboard/customer">Back to your bookings</Link>} />
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md py-16 text-center text-sm text-muted-foreground">Loading…</div>}>
      <PaymentCancelContent />
    </Suspense>
  );
}
