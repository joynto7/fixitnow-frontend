'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from '@/lib/api/categories';
import { ApiError, stripFieldPrefix } from '@/lib/api/error';
import { categoryFormSchema, type CategoryFormValues } from '@/lib/validations/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminCategoriesManager() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Category | 'new' | null>(null);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: listCategories });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories'] });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      toast.success('Category deleted');
      invalidate();
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not delete category'),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {categoriesQuery.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : categoriesQuery.isError ? (
          <p className="text-sm text-destructive">Couldn&apos;t load categories.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {categoriesQuery.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories yet.</p>
            ) : (
              categoriesQuery.data.map((category) => (
                <div key={category.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{category.name}</p>
                    {category.description ? (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(category)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm(`Delete "${category.name}"? This fails if services still use it.`)) {
                          deleteMutation.mutate(category.id);
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
          <CategoryForm
            category={editing === 'new' ? undefined : editing}
            onDone={() => {
              setEditing(null);
              invalidate();
            }}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <Button variant="outline" className="self-start" onClick={() => setEditing('new')}>
            Add category
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryForm({
  category,
  onDone,
  onCancel,
}: {
  category?: Category;
  onDone: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: CategoryFormValues) => {
      const input = { name: values.name, description: values.description || undefined };
      return category ? updateCategory(category.id, input) : createCategory(input);
    },
    onSuccess: () => {
      toast.success(category ? 'Category updated' : 'Category created');
      onDone();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.errorDetails) {
        error.errorDetails.forEach(({ field, message }) => {
          setError(stripFieldPrefix(field) as keyof CategoryFormValues, { message });
        });
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Could not save category');
    },
  });

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border p-4"
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
    >
      <Field data-invalid={!!errors.name}>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <Input id="name" aria-invalid={!!errors.name} {...register('name')} />
        <FieldError errors={errors.name ? [errors.name] : undefined} />
      </Field>
      <Field data-invalid={!!errors.description}>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Textarea id="description" aria-invalid={!!errors.description} {...register('description')} />
        <FieldError errors={errors.description ? [errors.description] : undefined} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : category ? 'Save changes' : 'Create category'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
