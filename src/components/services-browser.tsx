'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { listCategories } from '@/lib/api/categories';
import { listServices } from '@/lib/api/services';
import { listTechnicians } from '@/lib/api/technicians';
import { ServiceCard } from '@/components/service-card';
import { TechnicianCard } from '@/components/technician-card';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 9;
const MIN_RATING_OPTIONS: Record<string, string> = { any: 'Any', '3': '3+', '4': '4+', '4.5': '4.5+' };

function ResultsGrid<T>({
  query,
  emptyLabel,
  errorLabel,
  renderItem,
}: {
  query: { isPending: boolean; isError: boolean; data?: { items: T[] } };
  emptyLabel: string;
  errorLabel: string;
  renderItem: (item: T) => React.ReactNode;
}) {
  if (query.isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-56 w-full" />
        ))}
      </div>
    );
  }
  if (query.isError) {
    return <p className="text-sm text-destructive">{errorLabel}</p>;
  }
  const items = query.data?.items ?? [];
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(renderItem)}</div>;
}

export function ServicesBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: listCategories });
  const categoryItems: Record<string, string> = {
    all: 'All categories',
    ...Object.fromEntries((categoriesQuery.data ?? []).map((category) => [category.id, category.name])),
  };

  const updateParams = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }
    router.push(`${pathname}?${next.toString()}`);
  };

  // --- Services section ---
  const categoryId = searchParams.get('categoryId') ?? undefined;
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const search = searchParams.get('search') ?? '';
  const page = Number(searchParams.get('page') ?? '1');

  const [searchInput, setSearchInput] = useState(search);
  const [minPriceInput, setMinPriceInput] = useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);

  const servicesQuery = useQuery({
    queryKey: ['services', { categoryId, minPrice, maxPrice, search, page }],
    queryFn: () =>
      listServices({
        categoryId,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        search: search || undefined,
        page,
        limit: PAGE_SIZE,
      }),
  });
  const servicesTotalPages = servicesQuery.data ? Math.max(1, Math.ceil(servicesQuery.data.meta.total / PAGE_SIZE)) : 1;

  // --- Technicians section ---
  const techCategoryId = searchParams.get('techCategoryId') ?? undefined;
  const location = searchParams.get('location') ?? '';
  const minRating = searchParams.get('minRating') ?? '';
  const techSearch = searchParams.get('techSearch') ?? '';
  const techPage = Number(searchParams.get('techPage') ?? '1');

  const [locationInput, setLocationInput] = useState(location);
  const [techSearchInput, setTechSearchInput] = useState(techSearch);

  const techniciansQuery = useQuery({
    queryKey: ['technicians', { techCategoryId, location, minRating, techSearch, techPage }],
    queryFn: () =>
      listTechnicians({
        categoryId: techCategoryId,
        location: location || undefined,
        minRating: minRating ? Number(minRating) : undefined,
        search: techSearch || undefined,
        page: techPage,
        limit: PAGE_SIZE,
      }),
  });
  const techniciansTotalPages = techniciansQuery.data
    ? Math.max(1, Math.ceil(techniciansQuery.data.meta.total / PAGE_SIZE))
    : 1;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <section>
        <h1 className="text-2xl font-semibold">Browse services</h1>
        <form
          className="mt-4 flex flex-wrap items-end gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            updateParams({ search: searchInput, minPrice: minPriceInput, maxPrice: maxPriceInput, page: undefined });
          }}
        >
          <Field className="w-48">
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <Select
              items={categoryItems}
              value={categoryId ?? 'all'}
              onValueChange={(value) => updateParams({ categoryId: value === 'all' ? undefined : String(value), page: undefined })}
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field className="w-28">
            <FieldLabel htmlFor="minPrice">Min price</FieldLabel>
            <Input
              id="minPrice"
              type="number"
              min={0}
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
            />
          </Field>
          <Field className="w-28">
            <FieldLabel htmlFor="maxPrice">Max price</FieldLabel>
            <Input
              id="maxPrice"
              type="number"
              min={0}
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
            />
          </Field>
          <Field className="w-56">
            <FieldLabel htmlFor="search">Search</FieldLabel>
            <Input
              id="search"
              placeholder="Leak fix, deep clean..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </Field>
          <Button type="submit">Apply filters</Button>
        </form>

        <div className="mt-6">
          <ResultsGrid
            query={servicesQuery}
            emptyLabel="No services match your filters."
            errorLabel="Couldn't load services. Please try again."
            renderItem={(service) => <ServiceCard key={service.id} service={service} />}
          />
          <Pagination page={page} totalPages={servicesTotalPages} onPageChange={(p) => updateParams({ page: String(p) })} />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold">Browse technicians</h2>
        <form
          className="mt-4 flex flex-wrap items-end gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            updateParams({ location: locationInput, techSearch: techSearchInput, techPage: undefined });
          }}
        >
          <Field className="w-48">
            <FieldLabel htmlFor="techCategory">Category</FieldLabel>
            <Select
              items={categoryItems}
              value={techCategoryId ?? 'all'}
              onValueChange={(value) =>
                updateParams({ techCategoryId: value === 'all' ? undefined : String(value), techPage: undefined })
              }
            >
              <SelectTrigger id="techCategory">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryItems).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field className="w-40">
            <FieldLabel htmlFor="location">Location</FieldLabel>
            <Input id="location" placeholder="Dhaka..." value={locationInput} onChange={(e) => setLocationInput(e.target.value)} />
          </Field>
          <Field className="w-32">
            <FieldLabel htmlFor="minRating">Min rating</FieldLabel>
            <Select
              items={MIN_RATING_OPTIONS}
              value={minRating || 'any'}
              onValueChange={(value) =>
                updateParams({ minRating: value === 'any' ? undefined : String(value), techPage: undefined })
              }
            >
              <SelectTrigger id="minRating">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MIN_RATING_OPTIONS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field className="w-56">
            <FieldLabel htmlFor="techSearch">Search</FieldLabel>
            <Input
              id="techSearch"
              placeholder="Technician name..."
              value={techSearchInput}
              onChange={(e) => setTechSearchInput(e.target.value)}
            />
          </Field>
          <Button type="submit">Apply filters</Button>
        </form>

        <div className="mt-6">
          <ResultsGrid
            query={techniciansQuery}
            emptyLabel="No technicians match your filters."
            errorLabel="Couldn't load technicians. Please try again."
            renderItem={(technician) => <TechnicianCard key={technician.id} technician={technician} />}
          />
          <Pagination
            page={techPage}
            totalPages={techniciansTotalPages}
            onPageChange={(p) => updateParams({ techPage: String(p) })}
          />
        </div>
      </section>
    </div>
  );
}
