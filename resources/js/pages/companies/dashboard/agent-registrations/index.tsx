import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DEFAULT_PHOTO } from '@/config';
import { useDataTable } from '@/hooks/use-data-table';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { TextIcon, UserIcon } from 'lucide-react';
import { useMemo } from 'react';
import ApproveRegistrationButton from './components/approve-registration-button';
import { EmptyRegistrations } from './components/empty-registrations';
import RejectRegistrationButton from './components/reject-registration-button';
dayjs.extend(relativeTime);

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
            <div className="flex gap-2 items-center">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={agent.photo_url || DEFAULT_PHOTO}
                  alt={agent.name}
                />
                <AvatarFallback>
                  <UserIcon />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{agent.name}</div>
                <div className="text-sm text-muted-foreground">
                  {agent.username}
                </div>
              </div>
            </div>
          );
        },
        meta: {
          label: 'Name',
          placeholder: 'Search names...',
          variant: 'text',
          icon: TextIcon,
        },
        enableColumnFilter: true,
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Status" />
        ),
        cell: ({ cell }) => (
          <div className="font-medium">{cell.getValue<string>()}</div>
        ),

        enableColumnFilter: true,
      },
      {
        id: 'applied_at',
        accessorKey: 'applied_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Applied At" />
        ),
        cell: ({ cell }) => {
          const appliedAt = cell.getValue<string>();
          return (
            <div className="text-sm text-muted-foreground">
              {dayjs(appliedAt).fromNow()}
            </div>
          );
        },
      },
      {
        id: 'accepted_at',
        accessorKey: 'accepted_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Accepted At" />
        ),
        cell: ({ cell }) => {
          const acceptedAt = cell.getValue<string>();
          return (
            <div className="text-sm text-muted-foreground">
              {dayjs(acceptedAt).fromNow()}
            </div>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          return (
            <div className="flex gap-2">
              <ApproveRegistrationButton registration={row.original} />
              <RejectRegistrationButton registration={row.original} />
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
      breadcrumb={[{ title: 'Settings' }, { title: 'Agents' }]}
    >
      <DataTable table={table} renderEmptyState={<EmptyRegistrations />}>
        <DataTableToolbar table={table} />
      </DataTable>
    </CompanyDashboardLayout>
  );
}
