'use client';

import { exportAsCsv } from '@/actions/App/Http/Controllers/Admin/UserController';
import {
  ActionBar,
  ActionBarClose,
  ActionBarGroup,
  ActionBarItem,
  ActionBarSelection,
  ActionBarSeparator,
} from '@/components/ui/action-bar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { bulkUpdate } from '@/routes/admin/database/users';
import { router } from '@inertiajs/react';
import type { Table } from '@tanstack/react-table';
import { CheckCircle2, Download, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

const USER_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
];

interface UsersTableActionBarProps {
  table: Table<any>;
}

export function UsersTableActionBar({ table }: UsersTableActionBarProps) {
  const [updating, setUpdating] = React.useState(false);
  const rows = table.getFilteredSelectedRowModel().rows;

  const onOpenChange = React.useCallback(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    (open: boolean) => {
      if (!open) {
        table.toggleAllRowsSelected(false);
      }
    },
    [table],
  );

  const handleBulkStatusUpdate = (status: string) => {
    const selectedIds = rows.map((row) => row.original.id);
    router.put(
      bulkUpdate.url(),
      {
        ids: selectedIds,
        status: status,
      },
      {
        preserveScroll: true,
        onBefore: () => setUpdating(true),
        onFinish: () => setUpdating(false),
        onSuccess: () => {
          toast.success(
            `Status updated to ${status} for ${selectedIds.length} user(s) successfully`,
          );
        },
        onError: () => {
          toast.error('Failed to update user status');
        },
      },
    );
  };

  return (
    <ActionBar open={rows.length > 0} onOpenChange={onOpenChange}>
      <ActionBarSelection>
        <span className="font-medium">{rows.length}</span>
        <span>selected</span>
        <ActionBarSeparator />
        <ActionBarClose>
          <X />
        </ActionBarClose>
      </ActionBarSelection>
      <ActionBarSeparator />
      <ActionBarGroup>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={updating}>
            <ActionBarItem>
              <CheckCircle2 />
              Status
            </ActionBarItem>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {USER_STATUS_OPTIONS.map((status) => (
              <DropdownMenuItem
                key={status.value}
                className="capitalize"
                onClick={() => handleBulkStatusUpdate(status.value)}
              >
                {status.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <ActionBarItem asChild>
          <a
            target="_blank"
            href={
              exportAsCsv({
                query: {
                  ids: rows.map((row) => row.original.id).join(','),
                },
              }).url
            }
          >
            <Download />
            Export
          </a>
        </ActionBarItem>
      </ActionBarGroup>
    </ActionBar>
  );
}
