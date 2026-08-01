import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Endpoint = { method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; path: string; note: string };
type Section = { title: string; endpoints: Endpoint[] };

const SECTIONS: Section[] = [
  {
    title: 'Auth',
    endpoints: [
      { method: 'POST', path: '/auth/register', note: 'Create a customer or technician account' },
      { method: 'POST', path: '/auth/login', note: 'Log in and receive a JWT' },
      { method: 'GET', path: '/auth/me', note: 'Restore the session from the stored token' },
    ],
  },
  {
    title: 'Public browsing',
    endpoints: [
      { method: 'GET', path: '/categories', note: 'List service categories' },
      { method: 'GET', path: '/services', note: 'List services, filterable by category/price/search' },
      { method: 'GET', path: '/technicians', note: 'List technicians' },
      { method: 'GET', path: '/technicians/:id', note: 'Technician profile with services and reviews' },
    ],
  },
  {
    title: 'Customer flow',
    endpoints: [
      { method: 'GET', path: '/services/:id', note: 'Service detail for the booking page' },
      { method: 'GET', path: '/technicians/:id/availability', note: "Open slots for the service's technician" },
      { method: 'POST', path: '/bookings', note: 'Create a booking' },
      { method: 'GET', path: '/bookings', note: "List the logged-in customer's bookings" },
      { method: 'GET', path: '/bookings/:id', note: 'Booking detail, used on the payment result pages' },
      { method: 'PATCH', path: '/bookings/:id/cancel', note: 'Cancel a booking' },
      { method: 'POST', path: '/payments/create', note: 'Start a Stripe/SSLCommerz checkout' },
      { method: 'POST', path: '/payments/confirm', note: 'Confirm payment and mark the booking PAID' },
      { method: 'GET', path: '/payments', note: 'Payment history' },
      { method: 'POST', path: '/reviews', note: 'Review a completed booking' },
    ],
  },
  {
    title: 'Technician flow',
    endpoints: [
      { method: 'PUT', path: '/technician/profile', note: 'Update bio, experience, location' },
      { method: 'POST', path: '/technician/profile/photo', note: 'Upload a profile photo' },
      { method: 'GET', path: '/services?technicianId=', note: "List the technician's own services" },
      { method: 'POST', path: '/services', note: 'Create a service' },
      { method: 'PUT', path: '/services/:id', note: 'Update a service' },
      { method: 'DELETE', path: '/services/:id', note: 'Delete a service' },
      { method: 'GET', path: '/technician/availability', note: 'Read availability slots' },
      { method: 'PUT', path: '/technician/availability', note: 'Replace availability slots' },
      { method: 'GET', path: '/technician/bookings', note: "List bookings for the technician's services" },
      { method: 'PATCH', path: '/technician/bookings/:id', note: 'Accept, decline, start, or complete a booking' },
    ],
  },
  {
    title: 'Admin flow',
    endpoints: [
      { method: 'GET', path: '/admin/stats', note: 'Platform-wide counts and revenue' },
      { method: 'GET', path: '/admin/users', note: 'List users, filterable by role/status/search' },
      { method: 'PATCH', path: '/admin/users/:id', note: 'Ban or unban a user' },
      { method: 'POST', path: '/admin/categories', note: 'Create a category' },
      { method: 'PUT', path: '/admin/categories/:id', note: 'Update a category' },
      { method: 'DELETE', path: '/admin/categories/:id', note: 'Delete a category (blocked while it has services)' },
    ],
  },
];

const METHOD_STYLES: Record<Endpoint['method'], string> = {
  GET: 'text-blue-600 dark:text-blue-400',
  POST: 'text-emerald-600 dark:text-emerald-400',
  PUT: 'text-amber-600 dark:text-amber-400',
  PATCH: 'text-amber-600 dark:text-amber-400',
  DELETE: 'text-red-600 dark:text-red-400',
};

export default function ApiListPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-4xl font-semibold tracking-tight">API list</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Every backend endpoint this frontend calls, grouped by flow. All paths are relative to{' '}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_API_URL</code>.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {section.endpoints.map((endpoint) => (
                  <li key={`${endpoint.method} ${endpoint.path}`} className="flex flex-wrap items-baseline gap-2 text-sm">
                    <span className={cn('w-14 shrink-0 font-mono text-xs font-semibold', METHOD_STYLES[endpoint.method])}>
                      {endpoint.method}
                    </span>
                    <code className="font-mono text-xs">{endpoint.path}</code>
                    <span className="text-xs text-muted-foreground">{endpoint.note}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
