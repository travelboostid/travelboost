import type { Company } from '@/api/model';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';
import type { Column, ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Text } from 'lucide-react';
import { useMemo } from 'react';
import CreateButton from './components/create-button';
import DeleteButton from './components/delete-button';
import EditButton from './components/edit-button';
import { EmptyPermissions } from './components/empty-permissions';
dayjs.extend(relativeTime);

type PageProps = {
  data: {
    data: Company[];
    total: number;
  };
};

export default function Page({ data }: PageProps) {
  const columns = useMemo<ColumnDef<Company>[]>(
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
        header: ({ column }: { column: Column<Company, unknown> }) => (
          <DataTableColumnHeader column={column} label="Name" />
        ),
        cell: ({ cell }) => <div>{cell.getValue<any>()}</div>,
        meta: {
          label: 'Name',
          placeholder: 'Search names...',
          variant: 'text',
          icon: Text,
        },
        enableColumnFilter: true,
      },
      {
        id: 'display_name',
        accessorKey: 'display_name',
        header: ({ column }: { column: Column<Company, unknown> }) => (
          <DataTableColumnHeader column={column} label="Display Name" />
        ),
        cell: ({ cell }) => <div>{cell.getValue<any>()}</div>,
      },
      {
        id: 'description',
        accessorKey: 'description',
        header: ({ column }: { column: Column<Company, unknown> }) => (
          <DataTableColumnHeader column={column} label="Description" />
        ),
        cell: ({ cell }) => <div>{cell.getValue<any>()}</div>,
      },
      {
        id: 'actions',
        cell: ({ cell }) => {
          return (
            <div className="flex gap-1">
              <EditButton permission={cell.row.original} />
              <DeleteButton permission={cell.row.original} />
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
      breadcrumb={[{ title: 'Database' }, { title: 'Permissions' }]}
      applet={<CreateButton />}
    >
      <DataTable table={table} renderEmptyState={<EmptyPermissions />}>
        <DataTableToolbar table={table} />
      </DataTable>
    </AdminDashboardLayout>
  );
}
