'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { getUploadUrl } from '@/lib/api/client';
import { StarRating } from '@/components/star-rating';
import type { Technician } from '@/lib/api/technicians';

export function HeroCarousel({ technicians }: { technicians: Technician[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || technicians.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % technicians.length), 4000);
    return () => clearInterval(id);
  }, [paused, technicians.length]);

  if (technicians.length === 0) return null;

  return (
    <div
      className="relative h-72 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-4px_rgba(15,23,42,0.08)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {technicians.map((tech, i) => {
        const photoUrl = getUploadUrl(tech.photoUrl);
        return (
          <Link
            key={tech.id}
            href={`/technicians/${tech.id}`}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
            className={`absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center transition-opacity duration-700 ${
              i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <div className="relative size-20 overflow-hidden rounded-full ring-4 ring-primary/20">
              {photoUrl ? (
                <Image src={photoUrl} alt="" fill sizes="80px" unoptimized className="object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-glow)_100%)] text-xl font-semibold text-white">
                  {tech.user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <p className="font-heading text-lg font-semibold">{tech.user.name}</p>
            <StarRating rating={tech.avgRating} totalReviews={tech.totalReviews} />
            <span className="text-xs text-muted-foreground">{tech.location ?? 'Available now'}</span>
          </Link>
        );
      })}

      {technicians.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous technician"
            onClick={() => setIndex((i) => (i - 1 + technicians.length) % technicians.length)}
            className="absolute top-1/2 left-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm hover:bg-background"
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next technician"
            onClick={() => setIndex((i) => (i + 1) % technicians.length)}
            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm hover:bg-background"
          >
            <ChevronRightIcon className="size-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {technicians.map((tech, i) => (
              <button
                key={tech.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
