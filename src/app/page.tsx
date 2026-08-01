'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listCategories } from '@/lib/api/categories';
import { listServices } from '@/lib/api/services';
import { listTechnicians } from '@/lib/api/technicians';
import { ServiceCard } from '@/components/service-card';
import { TechnicianCard } from '@/components/technician-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: listCategories });
  const servicesQuery = useQuery({
    queryKey: ['services', { limit: 6 }],
    queryFn: () => listServices({ limit: 6 }),
  });
  const techniciansQuery = useQuery({
    queryKey: ['technicians', { limit: 4 }],
    queryFn: () => listTechnicians({ limit: 4 }),
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <section className="flex flex-col items-start gap-4 rounded-3xl bg-[linear-gradient(135deg,var(--hero-glow)_0%,var(--background)_65%)] px-8 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Your trusted home service platform</h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Book vetted technicians for plumbing, electrical, cleaning, and more — pick a time slot and get it done.
        </p>
        <Button size="lg" render={<Link href="/services">Browse services</Link>} />
      </section>

      <section className="py-8">
        <h2 className="mb-4 text-xl font-semibold">Categories</h2>
        {categoriesQuery.isPending ? (
          <div className="flex gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
        ) : categoriesQuery.isError ? (
          <p className="text-sm text-destructive">Couldn&apos;t load categories.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categoriesQuery.data.map((category) => (
              <Button
                key={category.id}
                variant="outline"
                size="sm"
                render={<Link href={`/services?categoryId=${category.id}`}>{category.name}</Link>}
              />
            ))}
          </div>
        )}
      </section>

      <section className="py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Featured services</h2>
          <Link href="/services" className="text-sm text-primary underline-offset-4 hover:underline">
            View all
          </Link>
        </div>
        {servicesQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-56 w-full" />
            ))}
          </div>
        ) : servicesQuery.isError ? (
          <p className="text-sm text-destructive">Couldn&apos;t load services. Please try again.</p>
        ) : servicesQuery.data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No services yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {servicesQuery.data.items.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </section>

      <section className="py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Top-rated technicians</h2>
          <Link href="/services" className="text-sm text-primary underline-offset-4 hover:underline">
            View all
          </Link>
        </div>
        {techniciansQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-56 w-full" />
            ))}
          </div>
        ) : techniciansQuery.isError ? (
          <p className="text-sm text-destructive">Couldn&apos;t load technicians. Please try again.</p>
        ) : techniciansQuery.data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No technicians yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {techniciansQuery.data.items.map((technician) => (
              <TechnicianCard key={technician.id} technician={technician} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
