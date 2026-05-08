import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DEFAULT_PHOTO } from '@/config';
import { useDataTable } from '@/hooks/use-data-table';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { UserIcon } from 'lucide-react';
import { useMemo } from 'react';
import AgentProfileModal from './components/AgentProfileModal';
import ApproveRegistrationButton from './components/approve-registration-button';
import EditNoteButton from './components/edit-note-button';
import { EmptyRegistrations } from './components/empty-registrations';
import RejectRegistrationButton from './components/reject-registration-button';
import SuspendButton from './components/suspend-button';
import UnsuspendButton from './components/unsuspend-button';

type PageProps = {
  data: {
    data: any[];
  };
};

export default function Page({ data }: PageProps) {
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'agent.name',
        accessorKey: 'agent.name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Agent" />
        ),
        cell: ({ row }) => {
          const agent = row.original.agent;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border">
                <AvatarImage
                  src={agent?.photo_url || DEFAULT_PHOTO}
                  alt={agent?.name}
                />
                <AvatarFallback>
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">
                  {agent?.name || 'Unknown Agent'}
                </span>
                <span className="text-xs text-muted-foreground">
                  @{agent?.username}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Status" />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <div className="flex items-center">
              <div
                className={`h-2 w-2 rounded-full mr-2 ${
                  status === 'active'
                    ? 'bg-green-500'
                    : status === 'pending'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
              <span className="capitalize text-sm font-medium">{status}</span>
            </div>
          );
        },
      },
      {
        id: 'applied_at',
        accessorKey: 'applied_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Applied At" />
        ),
        cell: ({ row }) => {
          const date = row.original.applied_at;
          return (
            <span className="text-sm text-muted-foreground">
              {date ? dayjs(date).format('DD MMM YYYY, HH:mm') : '-'}
            </span>
          );
        },
      },
      {
        id: 'accepted_at',
        accessorKey: 'accepted_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Accepted At" />
        ),
        cell: ({ row }) => {
          const date = row.original.accepted_at;
          return (
            <span className="text-sm text-muted-foreground">
              {date ? dayjs(date).format('DD MMM YYYY, HH:mm') : '-'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          return (
            <div className="flex items-center justify-end gap-2">
              <AgentProfileModal agent={row.original.agent} />

              {row.original.status === 'pending' && (
                <>
                  <ApproveRegistrationButton registration={row.original} />
                  <RejectRegistrationButton registration={row.original} />
                </>
              )}
              {row.original.status === 'active' && (
                <SuspendButton registration={row.original} />
              )}
              {row.original.status === 'suspended' && (
                <UnsuspendButton registration={row.original} />
              )}
              {row.original.status === 'rejected' && (
                <ApproveRegistrationButton registration={row.original} />
              )}
              {['suspended', 'rejected'].includes(row.original.status) && (
                <EditNoteButton registration={row.original} />
              )}
            </div>
          );
        },
        size: 32,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    queryKeys: {
      perPage: 'per_page',
      page: 'page',
    },
    data: data.data,
    columns,
    pageCount: 1,
    shallow: false,
    initialState: {
      sorting: [{ id: 'id', desc: true }],
      columnPinning: { right: ['actions'] },
    },
    getRowId: (row) => row.id.toString(),
  });

  return (
    <CompanyDashboardLayout
      containerClassName="p-4"
      breadcrumb={[{ title: 'Settings' }, { title: 'Agent Registrations' }]}
      openMenuIds={['settings']}
      activeMenuIds={['settings.agent-registrations']}
    >
      <DataTable table={table} renderEmptyState={<EmptyRegistrations />}>
        <DataTableToolbar table={table} />
      </DataTable>
    </CompanyDashboardLayout>
  );
}
