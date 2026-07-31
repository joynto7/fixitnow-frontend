'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listCategories, type Category } from '@/lib/api/categories';
import { listServices, createService, updateService, deleteService, type Service } from '@/lib/api/services';
import { ApiError, stripFieldPrefix } from '@/lib/api/error';
import { serviceFormSchema, type ServiceFormValues } from '@/lib/validations/technician';
import { useAuthStore } from '@/lib/auth/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TechnicianServicesManager() {
  const technicianId = useAuthStore((state) => state.user?.technicianProfile?.id);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Service | 'new' | null>(null);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: listCategories });
  const servicesQuery = useQuery({
    queryKey: ['my-services', technicianId],
    queryFn: () => listServices({ technicianId, limit: 50 }),
    enabled: !!technicianId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['my-services'] });

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      toast.success('Service deleted');
      invalidate();
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not delete service'),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {servicesQuery.isPending || categoriesQuery.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : servicesQuery.isError ? (
          <p className="text-sm text-destructive">Couldn&apos;t load your services.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {servicesQuery.data.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No services yet.</p>
            ) : (
              servicesQuery.data.items.map((service) => (
                <div key={service.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{service.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {service.category.name} · ${Number(service.price).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(service)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm(`Delete "${service.title}"?`)) {
                          deleteMutation.mutate(service.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {editing ? (
          <ServiceForm
            service={editing === 'new' ? undefined : editing}
            categories={categoriesQuery.data ?? []}
            onDone={() => {
              setEditing(null);
              invalidate();
            }}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <Button variant="outline" className="self-start" onClick={() => setEditing('new')}>
            Add service
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ServiceForm({
  service,
  categories,
  onDone,
  onCancel,
}: {
  service?: Service;
  categories: Category[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: service?.title ?? '',
      description: service?.description ?? '',
      price: service?.price ?? '',
      categoryId: service?.categoryId ?? categories[0]?.id ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ServiceFormValues) => {
      const input = {
        title: values.title,
        description: values.description || undefined,
        price: Number(values.price),
        categoryId: values.categoryId,
      };
      return service ? updateService(service.id, input) : createService(input);
    },
    onSuccess: () => {
      toast.success(service ? 'Service updated' : 'Service created');
      onDone();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.errorDetails) {
        error.errorDetails.forEach(({ field, message }) => {
          setError(stripFieldPrefix(field) as keyof ServiceFormValues, { message });
        });
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Could not save service');
    },
  });

  const categoryItems = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border p-4"
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
    >
      <Field data-invalid={!!errors.title}>
        <FieldLabel htmlFor="title">Title</FieldLabel>
        <Input id="title" aria-invalid={!!errors.title} {...register('title')} />
        <FieldError errors={errors.title ? [errors.title] : undefined} />
      </Field>
      <Field data-invalid={!!errors.description}>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Textarea id="description" aria-invalid={!!errors.description} {...register('description')} />
        <FieldError errors={errors.description ? [errors.description] : undefined} />
      </Field>
      <Field data-invalid={!!errors.price}>
        <FieldLabel htmlFor="price">Price ($)</FieldLabel>
        <Input id="price" inputMode="decimal" aria-invalid={!!errors.price} {...register('price')} />
        <FieldError errors={errors.price ? [errors.price] : undefined} />
      </Field>
      <Field data-invalid={!!errors.categoryId}>
        <FieldLabel htmlFor="categoryId">Category</FieldLabel>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <Select items={categoryItems} value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="categoryId" aria-invalid={!!errors.categoryId}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError errors={errors.categoryId ? [errors.categoryId] : undefined} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : service ? 'Save changes' : 'Create service'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
