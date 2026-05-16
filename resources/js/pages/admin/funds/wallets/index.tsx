import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';
import { formatIDR } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { CalendarIcon } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyWallets } from './components/empty-wallets';
dayjs.extend(relativeTime);

type WithdrawalsPageProps = {
  data: {
    data: any[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
};

export default function WithdrawalsPage({ data }: WithdrawalsPageProps) {
  console.log('Withdrawals data:', data); // Debugging log
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
        id: 'holder',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Owner" />
        ),
        cell: ({ row }) => <div>{row.original.holder?.name ?? '-'}</div>,
      },
      {
        id: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Name" />
        ),
        cell: ({ row }) => (
          <div>
            <div>
              {row.original.name ?? '-'} ({row.original.slug ?? '-'})
            </div>
            <div className="text-sm text-muted-foreground">
              {row.original.description ?? '-'}
            </div>
          </div>
        ),
      },
      {
        id: 'balance',
        accessorKey: 'balance',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Balance" />
        ),
        cell: ({ cell }) => {
          const balance = cell.getValue<any>();
          return <div>{formatIDR(balance)}</div>;
        },
      },
      {
        id: 'created_at',
        accessorKey: 'created_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Created Date" />
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
          label: 'Created date',
          placeholder: 'Search created date...',
          variant: 'dateRange',
          icon: CalendarIcon,
        },
        enableColumnFilter: true,
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          return <div className="flex gap-2">actions</div>;
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
      activeMenuIds={['funds', 'funds.wallets']}
      openMenuIds={['funds']}
      breadcrumb={[{ title: 'Funds' }, { title: 'Wallets' }]}
    >
      <DataTable table={table} renderEmptyState={<EmptyWallets />}>
        <DataTableToolbar table={table} />
      </DataTable>
    </AdminDashboardLayout>
  );
}
