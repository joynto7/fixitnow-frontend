import { Suspense } from 'react';
import { ServicesBrowser } from '@/components/services-browser';

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}>
      <ServicesBrowser />
    </Suspense>
  );
}
