import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<'ACTIVE' | 'BANNED', string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  BANNED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

const STATUS_LABELS: Record<'ACTIVE' | 'BANNED', string> = {
  ACTIVE: 'Active',
  BANNED: 'Banned',
};

export function UserStatusBadge({ status, className }: { status: 'ACTIVE' | 'BANNED'; className?: string }) {
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
