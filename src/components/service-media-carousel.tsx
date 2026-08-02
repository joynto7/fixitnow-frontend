'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { WrenchIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { ServiceMedia } from '@/lib/api/services';

export function ServiceMediaCarousel({ media }: { media: ServiceMedia[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (media.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % media.length), 3500);
    return () => clearInterval(id);
  }, [media.length]);

  if (media.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-glow)_100%)]">
        <WrenchIcon className="size-8 text-white/80" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="group relative h-28 overflow-hidden rounded-xl bg-muted">
      {media.map((item, i) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          {item.type === 'PHOTO' ? (
            <Image
              src={item.url}
              alt=""
              fill
              sizes="(min-width: 1024px) 320px, 50vw"
              unoptimized
              className="object-cover"
            />
          ) : (
            <video src={item.url} controls muted playsInline preload="metadata" className="size-full object-cover" />
          )}
        </div>
      ))}
      {media.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous media"
            onClick={() => setIndex((i) => (i - 1 + media.length) % media.length)}
            className="absolute top-1/2 left-1 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <ChevronLeftIcon className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Next media"
            onClick={() => setIndex((i) => (i + 1) % media.length)}
            className="absolute top-1/2 right-1 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <ChevronRightIcon className="size-3.5" />
          </button>
          <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
            {media.map((item, i) => (
              <span
                key={item.id}
                className={`h-1 rounded-full transition-all ${i === index ? 'w-3 bg-white' : 'w-1 bg-white/50'}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
