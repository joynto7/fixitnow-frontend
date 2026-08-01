import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/star-rating';
import { getUploadUrl } from '@/lib/api/client';
import type { Technician } from '@/lib/api/technicians';

export function TechnicianCard({ technician }: { technician: Technician }) {
  const photoUrl = getUploadUrl(technician.photoUrl);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center gap-3">
        <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
          {photoUrl ? (
            <Image src={photoUrl} alt="" fill sizes="40px" unoptimized className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-sm font-semibold text-muted-foreground">
              {technician.user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <CardTitle>{technician.user.name}</CardTitle>
          <CardDescription>{technician.location ?? 'Location not specified'}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        <StarRating rating={technician.avgRating} totalReviews={technician.totalReviews} />
        {technician.bio ? <p className="line-clamp-2 text-sm text-muted-foreground">{technician.bio}</p> : null}
        <div className="mt-auto flex flex-wrap gap-1">
          {technician.services.slice(0, 3).map((service) => (
            <span key={service.id} className="rounded-full bg-muted px-2 py-0.5 text-xs">
              {service.category.name}
            </span>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          render={<Link href={`/technicians/${technician.id}`}>View profile</Link>}
        />
      </CardFooter>
    </Card>
  );
}
