const DEFAULT_ITEMS = [
  'Vetted technicians',
  'Book in minutes',
  'Secure payments',
  'Real-time tracking',
  'Verified reviews',
];

export function RunningBanner({ items = DEFAULT_ITEMS }: { items?: string[] }) {
  const track = [...items, ...items];

  return (
    <div className="w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
      <div className="flex w-max animate-marquee gap-8 py-2">
        {track.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-2 text-sm font-medium whitespace-nowrap text-primary"
          >
            <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
