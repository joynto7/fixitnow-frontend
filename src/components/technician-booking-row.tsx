'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateTechnicianBookingStatus, type Booking, type TechnicianBookingAction } from '@/lib/api/bookings';
import { BookingStatusBadge } from '@/components/booking-status-badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function TechnicianBookingRow({ booking }: { booking: Booking }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (action: TechnicianBookingAction) => updateTechnicianBookingStatus(booking.id, action),
    onSuccess: (updated) => {
      toast.success(`Booking marked ${updated.status.replace('_', ' ').toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['technician-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['technician-bookings-summary'] });
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not update booking'),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{booking.service.title}</CardTitle>
            <CardDescription>
              {booking.customer.name} · {new Date(booking.scheduledDate).toLocaleString()}
            </CardDescription>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{booking.address}</p>
        {booking.notes ? <p className="text-sm text-muted-foreground">Notes: {booking.notes}</p> : null}
        <p className="text-lg font-semibold">${Number(booking.price).toFixed(2)}</p>
      </CardContent>
      {booking.status === 'REQUESTED' && (
        <CardFooter className="flex gap-2">
          <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate('ACCEPT')}>
            Accept
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate('DECLINE')}
          >
            Decline
          </Button>
        </CardFooter>
      )}
      {booking.status === 'PAID' && (
        <CardFooter>
          <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate('START')}>
            Start job
          </Button>
        </CardFooter>
      )}
      {booking.status === 'IN_PROGRESS' && (
        <CardFooter>
          <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate('COMPLETE')}>
            Complete job
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
