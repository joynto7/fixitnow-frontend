import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/star-rating';
import type { Service } from '@/lib/api/services';

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>{service.title}</CardTitle>
        <CardDescription>{service.category.name}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        {service.description ? <p className="line-clamp-2 text-sm text-muted-foreground">{service.description}</p> : null}
        <p className="text-lg font-semibold">${Number(service.price).toFixed(2)}</p>
        <div className="mt-auto flex items-center justify-between gap-2 text-sm">
          <span className="truncate">{service.technician.user.name}</span>
          <StarRating rating={service.technician.avgRating} totalReviews={service.technician.totalReviews} />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          render={<Link href={`/technicians/${service.technicianId}`}>View technician</Link>}
        />
      </CardFooter>
    </Card>
  );
}
