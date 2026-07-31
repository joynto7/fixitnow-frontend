import { StarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StarRating({
  rating,
  totalReviews,
  className,
}: {
  rating: number;
  totalReviews?: number;
  className?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex text-amber-500">
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon key={i} className="size-4" fill={i < rounded ? 'currentColor' : 'none'} />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {rating.toFixed(1)}
        {totalReviews !== undefined ? ` (${totalReviews})` : ''}
      </span>
    </div>
  );
}
