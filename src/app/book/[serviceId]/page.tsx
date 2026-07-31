'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getServiceById } from '@/lib/api/services';
import { createBooking } from '@/lib/api/bookings';
import { getTechnicianAvailability } from '@/lib/api/technicians';
import type { AvailabilitySlot } from '@/lib/api/technicians';
import { ApiError, stripFieldPrefix } from '@/lib/api/error';
import { bookingFormSchema, type BookingFormValues } from '@/lib/validations/booking';
import { useAuthStore } from '@/lib/auth/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function BookServicePage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const serviceQuery = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => getServiceById(serviceId),
  });
  const technicianId = serviceQuery.data?.technicianId;
  const availabilityQuery = useQuery({
    queryKey: ['technician-availability', technicianId],
    queryFn: () => getTechnicianAvailability(technicianId!),
    enabled: !!technicianId,
  });

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: { availabilitySlotId: '', address: '', notes: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: BookingFormValues) =>
      createBooking({
        serviceId,
        availabilitySlotId: values.availabilitySlotId,
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
              <Field data-invalid={!!errors.availabilitySlotId}>
                <FieldLabel>Date &amp; time</FieldLabel>
                <Controller
                  control={control}
                  name="availabilitySlotId"
                  render={({ field }) => (
                    <SlotPicker
                      slots={availabilityQuery.data ?? []}
                      isPending={availabilityQuery.isPending}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <FieldError errors={errors.availabilitySlotId ? [errors.availabilitySlotId] : undefined} />
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

function SlotPicker({
  slots,
  isPending,
  value,
  onChange,
}: {
  slots: AvailabilitySlot[];
  isPending: boolean;
  value: string;
  onChange: (id: string) => void;
}) {
  if (isPending) {
    return <Skeleton className="h-24 w-full" />;
  }
  if (slots.length === 0) {
    return <p className="text-sm text-muted-foreground">This technician hasn&apos;t published any availability yet.</p>;
  }

  const byDate = new Map<string, AvailabilitySlot[]>();
  for (const slot of slots) {
    const key = slot.date.slice(0, 10);
    byDate.set(key, [...(byDate.get(key) ?? []), slot]);
  }

  return (
    <div className="flex flex-col gap-3">
      {[...byDate.entries()].map(([date, daySlots]) => (
        <div key={date}>
          <p className="mb-1.5 text-sm font-medium">
            {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <div className="flex flex-wrap gap-2">
            {daySlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                disabled={slot.isBooked}
                onClick={() => onChange(slot.id)}
                className={cn(
                  'rounded-md border px-2.5 py-1.5 text-sm transition-colors',
                  slot.isBooked
                    ? 'cursor-not-allowed border-dashed text-muted-foreground line-through'
                    : value === slot.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {slot.startTime}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
