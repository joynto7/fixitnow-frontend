'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listTechnicianBookings, type BookingStatus } from '@/lib/api/bookings';
import { useAuthStore } from '@/lib/auth/store';
import { TechnicianBookingRow } from '@/components/technician-booking-row';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const FILTERS: { label: string; value: BookingStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Requested', value: 'REQUESTED' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Paid', value: 'PAID' },
  { label: 'In progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Declined', value: 'DECLINED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function TechnicianBookingsPage() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const [filter, setFilter] = useState<BookingStatus | 'ALL'>('ALL');

  const bookingsQuery = useQuery({
    queryKey: ['technician-bookings', filter],
    queryFn: () => listTechnicianBookings({ limit: 50, status: filter === 'ALL' ? undefined : filter }),
    enabled: isHydrated,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Booking requests</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? 'default' : 'outline'}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-4">
        {bookingsQuery.isPending ? (
          <>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </>
        ) : bookingsQuery.isError ? (
          <p className="text-sm text-destructive">Couldn&apos;t load bookings.</p>
        ) : bookingsQuery.data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bookings here yet.</p>
        ) : (
          bookingsQuery.data.items.map((booking) => <TechnicianBookingRow key={booking.id} booking={booking} />)
        )}
      </div>
    </div>
  );
}
