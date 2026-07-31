'use client';

import { useQuery } from '@tanstack/react-query';
import { listTechnicianBookings } from '@/lib/api/bookings';
import { useAuthStore } from '@/lib/auth/store';
import { TechnicianProfileForm } from '@/components/technician-profile-form';
import { TechnicianServicesManager } from '@/components/technician-services-manager';
import { TechnicianAvailabilityManager } from '@/components/technician-availability-manager';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const EARNING_STATUSES = new Set(['PAID', 'IN_PROGRESS', 'COMPLETED']);
const UPCOMING_STATUSES = new Set(['ACCEPTED', 'PAID', 'IN_PROGRESS']);

export default function TechnicianDashboardPage() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const bookingsQuery = useQuery({
    queryKey: ['technician-bookings-summary'],
    queryFn: () => listTechnicianBookings({ limit: 100 }),
    enabled: isHydrated,
  });

  const bookings = bookingsQuery.data?.items ?? [];
  const pendingCount = bookings.filter((b) => b.status === 'REQUESTED').length;
  const upcomingCount = bookings.filter((b) => UPCOMING_STATUSES.has(b.status)).length;
  const totalEarnings = bookings
    .filter((b) => EARNING_STATUSES.has(b.status))
    .reduce((sum, b) => sum + Number(b.price), 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending requests" value={bookingsQuery.isPending ? undefined : pendingCount} />
        <StatCard label="Upcoming jobs" value={bookingsQuery.isPending ? undefined : upcomingCount} />
        <StatCard
          label="Total earnings"
          value={bookingsQuery.isPending ? undefined : `$${totalEarnings.toFixed(2)}`}
        />
      </div>

      <TechnicianProfileForm />
      <TechnicianServicesManager />
      <TechnicianAvailabilityManager />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {value === undefined ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-semibold">{value}</p>}
      </CardContent>
    </Card>
  );
}
