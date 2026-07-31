'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getOwnAvailability, setOwnAvailability, type AvailabilitySlot } from '@/lib/api/technicians';
import { availabilitySlotFormSchema } from '@/lib/validations/technician';
import { useAuthStore } from '@/lib/auth/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SlotRow {
  date: string;
  startTime: string;
  endTime: string;
}

const emptyRow = (): SlotRow => ({ date: '', startTime: '', endTime: '' });

const toRows = (slots: AvailabilitySlot[]): SlotRow[] => {
  const unbooked = slots.filter((slot) => !slot.isBooked);
  return unbooked.length > 0
    ? unbooked.map((slot) => ({ date: slot.date.slice(0, 10), startTime: slot.startTime, endTime: slot.endTime }))
    : [emptyRow()];
};

export function TechnicianAvailabilityManager() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const availabilityQuery = useQuery({
    queryKey: ['availability'],
    queryFn: getOwnAvailability,
    enabled: isHydrated,
  });

  if (availabilityQuery.isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }
  if (availabilityQuery.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Couldn&apos;t load your availability.</p>
        </CardContent>
      </Card>
    );
  }

  return <AvailabilityEditor slots={availabilityQuery.data} />;
}

function AvailabilityEditor({ slots }: { slots: AvailabilitySlot[] }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<SlotRow[]>(() => toRows(slots));
  const bookedSlots = slots.filter((slot) => slot.isBooked);

  const mutation = useMutation({
    mutationFn: setOwnAvailability,
    onSuccess: (updatedSlots) => {
      toast.success('Availability updated');
      queryClient.setQueryData(['availability'], updatedSlots);
      setRows(toRows(updatedSlots));
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not update availability'),
  });

  const updateRow = (index: number, patch: Partial<SlotRow>) => {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };
  const removeRow = (index: number) => {
    setRows((current) => current.filter((_, i) => i !== index));
  };
  const addRow = () => setRows((current) => [...current, emptyRow()]);

  const handleSave = () => {
    const filled = rows.filter((row) => row.date || row.startTime || row.endTime);
    if (filled.length === 0) {
      toast.error('Add at least one slot');
      return;
    }
    for (const row of filled) {
      const result = availabilitySlotFormSchema.safeParse(row);
      if (!result.success) {
        toast.error(result.error.issues[0]?.message ?? 'Invalid slot');
        return;
      }
    }
    mutation.mutate(filled);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {bookedSlots.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Booked (can&apos;t be changed here)</p>
            <div className="flex flex-col gap-1">
              {bookedSlots.map((slot) => (
                <p key={slot.id} className="text-sm text-muted-foreground">
                  {slot.date.slice(0, 10)} · {slot.startTime}–{slot.endTime}
                </p>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="mb-2 text-sm font-medium">Open slots</p>
          <div className="flex flex-col gap-2">
            {rows.map((row, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  className="w-40"
                  value={row.date}
                  onChange={(e) => updateRow(index, { date: e.target.value })}
                />
                <Input
                  type="time"
                  className="w-28"
                  value={row.startTime}
                  onChange={(e) => updateRow(index, { startTime: e.target.value })}
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="time"
                  className="w-28"
                  value={row.endTime}
                  onChange={(e) => updateRow(index, { endTime: e.target.value })}
                />
                <Button type="button" size="sm" variant="ghost" onClick={() => removeRow(index)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            Add slot
          </Button>
          <Button type="button" size="sm" disabled={mutation.isPending} onClick={handleSave}>
            {mutation.isPending ? 'Saving...' : 'Save availability'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
