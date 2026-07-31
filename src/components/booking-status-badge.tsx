import { cn } from '@/lib/utils';
import type { BookingStatus } from '@/lib/api/bookings';

const STATUS_STYLES: Record<BookingStatus, string> = {
  REQUESTED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  ACCEPTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  DECLINED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  PAID: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  IN_PROGRESS: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  CANCELLED: 'bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-400',
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  REQUESTED: 'Requested',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  PAID: 'Paid',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function BookingStatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
