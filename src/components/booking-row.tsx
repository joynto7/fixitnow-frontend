'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cancelBooking, CANCELLABLE_STATUSES, type Booking } from '@/lib/api/bookings';
import { createPaymentSession } from '@/lib/api/payments';
import { createReview } from '@/lib/api/reviews';
import { ApiError } from '@/lib/api/error';
import { reviewFormSchema, type ReviewFormValues } from '@/lib/validations/booking';
import { BookingStatusBadge } from '@/components/booking-status-badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldError } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RATING_ITEMS: Record<string, string> = { '5': '5 stars', '4': '4 stars', '3': '3 stars', '2': '2 stars', '1': '1 star' };

export function BookingRow({ booking }: { booking: Booking }) {
  const queryClient = useQueryClient();
  const [reviewed, setReviewed] = useState(false);

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(booking.id),
    onSuccess: () => {
      toast.success('Booking cancelled');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not cancel booking'),
  });

  const payMutation = useMutation({
    mutationFn: (provider: 'STRIPE' | 'SSLCOMMERZ') => createPaymentSession({ bookingId: booking.id, provider }),
    onSuccess: ({ redirectUrl }) => {
      window.location.assign(redirectUrl);
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not start payment'),
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { rating: 5, comment: '' },
  });

  const reviewMutation = useMutation({
    mutationFn: (values: ReviewFormValues) =>
      createReview({ bookingId: booking.id, rating: Number(values.rating), comment: values.comment || undefined }),
    onSuccess: () => {
      toast.success('Thanks for your review!');
      setReviewed(true);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        setReviewed(true);
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Could not submit review');
    },
  });

  const canCancel = CANCELLABLE_STATUSES.includes(booking.status);
  const canPay = booking.status === 'ACCEPTED';
  const hasFooterActions = canPay || canCancel;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{booking.service.title}</CardTitle>
            <CardDescription>
              {booking.technician.user.name} · {new Date(booking.scheduledDate).toLocaleString()}
            </CardDescription>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{booking.address}</p>
        <p className="text-lg font-semibold">${Number(booking.price).toFixed(2)}</p>
      </CardContent>
      {hasFooterActions && (
        <CardFooter className="flex flex-wrap items-center gap-2">
          {canPay && (
            <>
              <Button size="sm" disabled={payMutation.isPending} onClick={() => payMutation.mutate('STRIPE')}>
                Pay with Stripe
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={payMutation.isPending}
                onClick={() => payMutation.mutate('SSLCOMMERZ')}
              >
                Pay with SSLCommerz
              </Button>
            </>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => {
                if (window.confirm('Cancel this booking?')) {
                  cancelMutation.mutate();
                }
              }}
            >
              Cancel
            </Button>
          )}
        </CardFooter>
      )}
      {booking.status === 'COMPLETED' && (
        <CardContent className="border-t pt-4">
          {reviewed ? (
            <p className="text-sm text-muted-foreground">You&apos;ve reviewed this booking.</p>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={handleSubmit((values) => reviewMutation.mutate(values))}>
              <p className="text-sm font-medium">Leave a review</p>
              <Field className="w-32">
                <Controller
                  control={control}
                  name="rating"
                  render={({ field }) => (
                    <Select items={RATING_ITEMS} value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(RATING_ITEMS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={errors.rating ? [errors.rating] : undefined} />
              </Field>
              <Field>
                <Textarea placeholder="How did it go? (optional)" {...register('comment')} />
                <FieldError errors={errors.comment ? [errors.comment] : undefined} />
              </Field>
              <Button type="submit" size="sm" className="self-start" disabled={reviewMutation.isPending}>
                {reviewMutation.isPending ? 'Submitting...' : 'Submit review'}
              </Button>
            </form>
          )}
        </CardContent>
      )}
    </Card>
  );
}
