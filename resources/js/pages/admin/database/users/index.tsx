import type { UserResource } from '@/api/model';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';
import { edit } from '@/routes/admin/database/users';
import { Link } from '@inertiajs/react';
import type { Column, ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { PencilIcon, Text } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyUsers } from './components/empty-users';
dayjs.extend(relativeTime);

type UsersPageProps = {
  data: {
    data: any[];
    total: number;
  };
};

export default function UsersPage({ data }: UsersPageProps) {
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        size: 32,
        enableSorting: true,
        enableHiding: false,
      },
      {
        id: 'name',
        accessorKey: 'name',
        header: ({ column }: { column: Column<UserResource, unknown> }) => (
          <DataTableColumnHeader column={column} label="Name" />
        ),
        cell: ({ cell }) => <div>{cell.getValue<UserResource['name']>()}</div>,
        meta: {
          label: 'Name',
          placeholder: 'Search names...',
          variant: 'text',
          icon: Text,
        },
        enableColumnFilter: true,
      },
      {
        id: 'email',
        accessorKey: 'email',
        header: ({ column }: { column: Column<UserResource, unknown> }) => (
          <DataTableColumnHeader column={column} label="Email" />
        ),
        cell: ({ cell }) => <div>{cell.getValue<UserResource['email']>()}</div>,
        meta: {
          label: 'Email',
          placeholder: 'Search email...',
          variant: 'text',
          icon: Text,
        },
        enableColumnFilter: true,
      },
      {
        id: 'roles',
        accessorKey: 'roles',
        header: ({ column }: { column: Column<UserResource, unknown> }) => (
          <DataTableColumnHeader column={column} label="Roles" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {(
              row.original.roles as Array<{
                display_name?: string;
                name?: string;
              }>
            )?.map((role, idx) => (
              <Badge key={idx} variant="secondary">
                {role.display_name ?? role.name}
              </Badge>
            )) ?? '-'}
          </div>
        ),
      },
      {
        id: 'company',
        accessorKey: 'company.name',
        header: ({ column }: { column: Column<UserResource, unknown> }) => (
          <DataTableColumnHeader column={column} label="Company" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.companies.map((company: any) => (
              <Badge key={company.id} variant="outline">
                {company.name}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: 'created_at',
        accessorKey: 'created_at',
        header: ({ column }: { column: Column<UserResource, unknown> }) => (
          <DataTableColumnHeader column={column} label="Join Date" />
        ),
        cell: ({ cell }) => {
          const createdAt = cell.getValue<UserResource['created_at']>();

          return (
            <div className="flex items-center gap-1">
              {dayjs(createdAt).fromNow()}
            </div>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          return (
            <Link href={edit({ user: row.original.id }).url}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <PencilIcon className="size-4" />
              </Button>
            </Link>
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
    rowCount: data.total,
    shallow: false,
    initialState: {
      sorting: [{ id: 'id', desc: true }],
      columnPinning: { right: ['actions'] },
    },
    getRowId: (row) => row.id.toString(),
  });

  return (
    <AdminDashboardLayout
      containerClassName="p-4"
      activeMenuIds={['database', 'database.users']}
      openMenuIds={['database']}
      breadcrumb={[{ title: 'Database' }, { title: 'User Management' }]}
    >
      <DataTable table={table} renderEmptyState={<EmptyUsers />}>
        <DataTableToolbar table={table} />
      </DataTable>
    </AdminDashboardLayout>
  );
}
