'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listUsers, updateUserStatus } from '@/lib/api/admin';
import { useAuthStore } from '@/lib/auth/store';
import { UserStatusBadge } from '@/components/user-status-badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ROLE_ITEMS = { ALL: 'All roles', CUSTOMER: 'Customer', TECHNICIAN: 'Technician', ADMIN: 'Admin' };
const STATUS_ITEMS = { ALL: 'All statuses', ACTIVE: 'Active', BANNED: 'Banned' };

export function AdminUsersManager() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const usersQuery = useQuery({
    queryKey: ['admin-users', roleFilter, statusFilter],
    queryFn: () =>
      listUsers({
        role: roleFilter === 'ALL' ? undefined : (roleFilter as 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN'),
        status: statusFilter === 'ALL' ? undefined : (statusFilter as 'ACTIVE' | 'BANNED'),
        limit: 100,
      }),
    enabled: isHydrated,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'BANNED' }) => updateUserStatus(id, status),
    onSuccess: (_, { status }) => {
      toast.success(status === 'BANNED' ? 'User banned' : 'User unbanned');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not update user'),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-3">
          <Select items={ROLE_ITEMS} value={roleFilter} onValueChange={(value) => setRoleFilter(value ?? 'ALL')}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select items={STATUS_ITEMS} value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? 'ALL')}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_ITEMS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {usersQuery.isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : usersQuery.isError ? (
          <p className="text-sm text-destructive">Couldn&apos;t load users.</p>
        ) : usersQuery.data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users match these filters.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {usersQuery.data.items.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="p-3">{user.name}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{user.role}</td>
                    <td className="p-3">
                      <UserStatusBadge status={user.status} />
                    </td>
                    <td className="p-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      {user.role === 'ADMIN' ? null : user.status === 'ACTIVE' ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={statusMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`Ban ${user.name}? They won't be able to log in.`)) {
                              statusMutation.mutate({ id: user.id, status: 'BANNED' });
                            }
                          }}
                        >
                          Ban
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={statusMutation.isPending}
                          onClick={() => statusMutation.mutate({ id: user.id, status: 'ACTIVE' })}
                        >
                          Unban
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
