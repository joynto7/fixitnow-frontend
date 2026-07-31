import Link from 'next/link';
import { WrenchIcon, CalendarCheckIcon, ShieldCheckIcon } from 'lucide-react';

const POINTS = [
  { icon: WrenchIcon, text: 'Vetted technicians across every trade' },
  { icon: CalendarCheckIcon, text: 'Pick a time slot and book in minutes' },
  { icon: ShieldCheckIcon, text: 'Pay securely, track every job to completion' },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl">
      <div className="hidden flex-1 flex-col justify-between overflow-hidden rounded-r-2xl bg-primary px-10 py-12 text-primary-foreground lg:flex">
        <Link href="/" className="font-heading text-2xl font-semibold">
          FixItNow
        </Link>
        <div>
          <p className="font-heading text-4xl leading-tight font-semibold text-wrap-balance">
            Home repairs, handled.
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm opacity-90">
                <Icon className="mt-0.5 size-4 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs opacity-70">&copy; {new Date().getFullYear()} FixItNow</p>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
