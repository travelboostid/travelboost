import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';
import { formatIDR } from '@/lib/utils';
import EmptyWalletTransactions from '@/pages/companies/dashboard/wallet-transactions/empty-wallet-transactions';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { CalendarIcon } from 'lucide-react';
import { useMemo } from 'react';
dayjs.extend(relativeTime);

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Paid', value: 'paid' },
];

type WalletTransactionsPageProps = {
  data: {
    data: any[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
};

export default function WalletTransactionsPage({
  data,
}: WalletTransactionsPageProps) {
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
        id: 'wallet-owner',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Wallet Owner" />
        ),
        cell: ({ row }) => (
          <div>{row.original.wallet?.holder?.name ?? '-'}</div>
        ),
      },
      {
        id: 'wallet',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Wallet" />
        ),
        cell: ({ row }) => <div>{row.original.wallet?.name ?? '-'}</div>,
      },
      {
        id: 'amount',
        accessorKey: 'amount',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Amount" />
        ),
        cell: ({ cell, row }) => {
          const amount = cell.getValue<any>();
          return (
            <div>
              {row.original.type === 'debit' ? '-' : '+'}
              {formatIDR(amount)}
            </div>
          );
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
      activeMenuIds={['funds', 'funds.wallet-transactions']}
      openMenuIds={['funds']}
      breadcrumb={[{ title: 'Funds' }, { title: 'Wallet Transactions' }]}
    >
      <DataTable table={table} renderEmptyState={<EmptyWalletTransactions />}>
        <DataTableToolbar table={table} />
      </DataTable>
    </AdminDashboardLayout>
  );
}
