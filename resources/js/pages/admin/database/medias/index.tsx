import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';
import { edit } from '@/routes/admin/database/users';
import { Link } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { CalendarIcon, PencilIcon, TextIcon } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyMedias } from './components/empty-medias';

type MediasPageProps = {
  data: {
    data: any[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
};

export default function MediasPage({ data }: MediasPageProps) {
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
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Name" />
        ),
        cell: ({ cell }) => <div>{cell.getValue<any>()}</div>,
        meta: {
          label: 'Name',
          placeholder: 'Search names...',
          variant: 'text',
          icon: TextIcon,
        },
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
        id: 'created_at',
        accessorKey: 'created_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Created at" />
        ),
        cell: ({ cell }) => {
          const createdAt = cell.getValue<any>();

          return (
            <div className="flex items-center gap-1">
              {dayjs(createdAt).fromNow()}
            </div>
          );
        },
        meta: {
          label: 'Created Date',
          placeholder: 'Search created date...',
          variant: 'dateRange',
          icon: CalendarIcon,
        },
        enableColumnFilter: true,
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
    pageCount: data.last_page,
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
      activeMenuIds={['database', 'database.medias']}
      openMenuIds={['database']}
      breadcrumb={[{ title: 'Database' }, { title: 'Media' }]}
    >
      <DataTable table={table} renderEmptyState={<EmptyMedias />}>
        <DataTableToolbar table={table} />
      </DataTable>
    </AdminDashboardLayout>
  );
}
