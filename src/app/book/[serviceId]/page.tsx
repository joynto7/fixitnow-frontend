'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getServiceById } from '@/lib/api/services';
import { createBooking } from '@/lib/api/bookings';
import { ApiError, stripFieldPrefix } from '@/lib/api/error';
import { bookingFormSchema, type BookingFormValues } from '@/lib/validations/booking';
import { useAuthStore } from '@/lib/auth/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookServicePage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const serviceQuery = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => getServiceById(serviceId),
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: { scheduledDate: '', address: '', notes: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: BookingFormValues) =>
      createBooking({
        serviceId,
        scheduledDate: new Date(values.scheduledDate).toISOString(),
        address: values.address,
        notes: values.notes || undefined,
      }),
    onSuccess: () => {
      toast.success("Booking requested — the technician will accept or decline it soon.");
      router.push('/dashboard/customer');
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.errorDetails) {
        error.errorDetails.forEach(({ field, message }) => {
          setError(stripFieldPrefix(field) as keyof BookingFormValues, { message });
        });
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Could not create the booking');
    },
  });

  if (!isHydrated || serviceQuery.isPending) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-6 py-12">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">Log in to book this service</h1>
        <Button className="mt-4" render={<Link href="/auth/login">Log in</Link>} />
      </div>
    );
  }

  if (user.role !== 'CUSTOMER') {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">Only customers can book services</h1>
        <p className="mt-2 text-muted-foreground">You&apos;re signed in as a {user.role.toLowerCase()}.</p>
      </div>
    );
  }

  if (serviceQuery.isError || !serviceQuery.data) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">Service not found</h1>
      </div>
    );
  }

  const service = serviceQuery.data;

  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>Book {service.title}</CardTitle>
          <CardDescription>
            {service.technician.user.name} · ${Number(service.price).toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <FieldGroup>
              <Field data-invalid={!!errors.scheduledDate}>
                <FieldLabel htmlFor="scheduledDate">Date &amp; time</FieldLabel>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  aria-invalid={!!errors.scheduledDate}
                  {...register('scheduledDate')}
                />
                <FieldError errors={errors.scheduledDate ? [errors.scheduledDate] : undefined} />
              </Field>
              <Field data-invalid={!!errors.address}>
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <Input id="address" aria-invalid={!!errors.address} {...register('address')} />
                <FieldError errors={errors.address ? [errors.address] : undefined} />
              </Field>
              <Field data-invalid={!!errors.notes}>
                <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
                <Textarea id="notes" aria-invalid={!!errors.notes} {...register('notes')} />
                <FieldError errors={errors.notes ? [errors.notes] : undefined} />
              </Field>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? 'Requesting...' : 'Request booking'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
