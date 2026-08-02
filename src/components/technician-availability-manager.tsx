'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { getOwnAvailability, setOwnAvailability, type AvailabilitySlot } from '@/lib/api/technicians';
import { availabilitySlotFormSchema } from '@/lib/validations/technician';
import { useAuthStore } from '@/lib/auth/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SlotRow {
  date: string;
  startTime: string;
  endTime: string;
}

const toRows = (slots: AvailabilitySlot[]): SlotRow[] =>
  slots
    .filter((slot) => !slot.isBooked)
    .map((slot) => ({ date: slot.date.slice(0, 10), startTime: slot.startTime, endTime: slot.endTime }));

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

const addMonths = (d: Date, delta: number) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, 1));

const getMonthGrid = (monthDate: Date) => {
  const year = monthDate.getUTCFullYear();
  const month = monthDate.getUTCMonth();
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: ({ iso: string; day: number } | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ iso: toISODate(new Date(Date.UTC(year, month, day))), day });
  }
  return cells;
};

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
          <Skeleton className="h-64 w-full" />
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
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(() => new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)));
  const [selectedDate, setSelectedDate] = useState(() => toISODate(today));

  const bookedByDate = useMemo(() => {
    const map = new Map<string, AvailabilitySlot[]>();
    for (const slot of slots) {
      if (!slot.isBooked) continue;
      const key = slot.date.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), slot]);
    }
    return map;
  }, [slots]);

  const mutation = useMutation({
    mutationFn: setOwnAvailability,
    onSuccess: (updatedSlots) => {
      toast.success('Availability updated');
      queryClient.setQueryData(['availability'], updatedSlots);
      setRows(toRows(updatedSlots));
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not update availability'),
  });

  const addRow = (startTime: string, endTime: string) =>
    setRows((current) => [...current, { date: selectedDate, startTime, endTime }]);
  const removeRow = (row: SlotRow) => setRows((current) => current.filter((r) => r !== row));

  const handleSave = () => {
    if (rows.length === 0) {
      toast.error('Add at least one open slot');
      return;
    }
    for (const row of rows) {
      const result = availabilitySlotFormSchema.safeParse(row);
      if (!result.success) {
        toast.error(result.error.issues[0]?.message ?? 'Invalid slot');
        return;
      }
    }
    mutation.mutate(rows);
  };

  const rowsForSelected = rows.filter((row) => row.date === selectedDate);
  const bookedForSelected = bookedByDate.get(selectedDate) ?? [];
  const cells = getMonthGrid(viewMonth);
  const todayIso = toISODate(today);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="shrink-0 sm:w-64">
            <div className="mb-2 flex items-center justify-between">
              <Button type="button" variant="ghost" size="icon" onClick={() => setViewMonth((m) => addMonths(m, -1))}>
                <ChevronLeftIcon className="size-4" />
              </Button>
              <p className="text-sm font-medium">
                {viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}
              </p>
              <Button type="button" variant="ghost" size="icon" onClick={() => setViewMonth((m) => addMonths(m, 1))}>
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
            <div className="mb-1 grid grid-cols-7 text-center text-xs text-muted-foreground">
              {WEEKDAY_LABELS.map((w, i) => (
                <span key={i}>{w}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, i) => {
                if (!cell) return <div key={i} />;
                const openCount = rows.filter((r) => r.date === cell.iso).length;
                const bookedCount = bookedByDate.get(cell.iso)?.length ?? 0;
                const isSelected = cell.iso === selectedDate;
                const isToday = cell.iso === todayIso;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedDate(cell.iso)}
                    className={cn(
                      'flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md text-sm',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : isToday
                          ? 'ring-1 ring-primary'
                          : 'hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <span>{cell.day}</span>
                    {(openCount > 0 || bookedCount > 0) && (
                      <span className="flex gap-0.5">
                        {openCount > 0 && <span className="size-1 rounded-full bg-current opacity-70" />}
                        {bookedCount > 0 && <span className="size-1 rounded-full bg-current" />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1">
            <p className="mb-3 text-sm font-medium">
              {new Date(selectedDate).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                timeZone: 'UTC',
              })}
            </p>
            {bookedForSelected.length > 0 && (
              <div className="mb-3 flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">Booked (can&apos;t be changed here)</p>
                {bookedForSelected.map((s) => (
                  <p key={s.id} className="text-sm text-muted-foreground">
                    {s.startTime}–{s.endTime}
                  </p>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2">
              {rowsForSelected.length === 0 && bookedForSelected.length === 0 && (
                <p className="text-sm text-muted-foreground">No slots yet.</p>
              )}
              {rowsForSelected.map((row, i) => (
                <div key={i} className="flex items-center gap-2 rounded-md border px-3 py-1.5">
                  <span className="text-sm">
                    {row.startTime}–{row.endTime}
                  </span>
                  <Button type="button" size="sm" variant="ghost" className="ml-auto" onClick={() => removeRow(row)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <AddSlotForm onAdd={addRow} />
          </div>
        </div>

        <Button type="button" className="mt-6" disabled={mutation.isPending} onClick={handleSave}>
          {mutation.isPending ? 'Saving...' : 'Save availability'}
        </Button>
      </CardContent>
    </Card>
  );
}

function AddSlotForm({ onAdd }: { onAdd: (startTime: string, endTime: string) => void }) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  return (
    <div className="mt-3 flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Start</label>
        <Input type="time" className="w-28" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">End</label>
        <Input type="time" className="w-28" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          if (!startTime || !endTime) {
            toast.error('Pick a start and end time first');
            return;
          }
          if (startTime >= endTime) {
            toast.error('Start time must be before end time');
            return;
          }
          onAdd(startTime, endTime);
          setStartTime('09:00');
          setEndTime('17:00');
        }}
      >
        Add slot
      </Button>
    </div>
  );
}
