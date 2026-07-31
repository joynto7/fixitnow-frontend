'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getTechnicianById } from '@/lib/api/technicians';
import { ApiError } from '@/lib/api/error';
import { StarRating } from '@/components/star-rating';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function TechnicianProfilePage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ['technician', id],
    queryFn: () => getTechnicianById(id),
  });

  if (query.isPending) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-6 py-10">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">{notFound ? 'Technician not found' : 'Something went wrong'}</h1>
        <p className="mt-2 text-muted-foreground">
          {notFound ? "This technician doesn't exist or is no longer active." : 'Please try again in a moment.'}
        </p>
      </div>
    );
  }

  const technician = query.data;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">{technician.user.name}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <StarRating rating={technician.avgRating} totalReviews={technician.totalReviews} />
          {technician.location ? <span>{technician.location}</span> : null}
          {technician.experienceYears !== null ? <span>{technician.experienceYears} yrs experience</span> : null}
        </div>
        {technician.bio ? <p className="max-w-2xl text-muted-foreground">{technician.bio}</p> : null}
      </div>

      <Separator className="my-8" />

      <section>
        <h2 className="mb-4 text-xl font-semibold">Services</h2>
        {technician.services.length === 0 ? (
          <p className="text-sm text-muted-foreground">No services listed yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {technician.services.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <CardTitle>{service.title}</CardTitle>
                  <CardDescription>{service.category.name}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    {service.description ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
                    ) : null}
                    <p className="mt-1 text-lg font-semibold">${Number(service.price).toFixed(2)}</p>
                  </div>
                  <Button disabled title="Booking opens in a future update">
                    Book now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator className="my-8" />

      <section>
        <h2 className="mb-4 text-xl font-semibold">Reviews</h2>
        {technician.reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {technician.reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{review.customer.name}</span>
                    <StarRating rating={review.rating} />
                  </div>
                  {review.comment ? <p className="text-sm text-muted-foreground">{review.comment}</p> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
