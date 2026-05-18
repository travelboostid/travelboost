import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';
import { extractImageSrc } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { EmptyProducts } from './components/empty-products';

type TourProductsPageProps = {
  data: {
    data: any[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
};

export default function TourProductsPage({ data }: TourProductsPageProps) {
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
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => (
          <div className="font-mono text-xs">{row.getValue('code')}</div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="max-w-48 truncate font-medium">
            {row.getValue('name')}
          </div>
        ),
      },
      {
        accessorFn: (row) => row.company?.name ?? '-',
        id: 'vendor',
        header: 'Vendor',
        cell: ({ row }) => <div>{row.original.company?.name ?? '-'}</div>,
      },
      {
        accessorFn: (row) => row.category?.name ?? '-',
        id: 'category',
        header: 'Category',
        cell: ({ row }) => <div>{row.original.category?.name ?? '-'}</div>,
      },
      {
        accessorFn: (row) => row.destination,
        id: 'destination',
        header: 'Destination',
        cell: ({ row }) => (
          <div className="max-w-32 truncate">{row.original.destination}</div>
        ),
      },
      {
        header: 'Image',
        cell: ({ row }) => {
          const { src } = extractImageSrc(row.original.image as any);
          return (
            <div>
              <img
                src={src}
                className="aspect-video w-16 rounded object-cover"
                alt={row.original.name}
              />
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue<string>('status');
          return (
            <Badge variant={status === 'active' ? 'default' : 'secondary'}>
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ row }) => (
          <div className="text-muted-foreground">
            {dayjs(row.getValue('created_at')).fromNow()}
          </div>
        ),
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => <div>act</div>,
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
      <DataTable table={table} renderEmptyState={<EmptyProducts />}>
        <DataTableToolbar table={table} />
      </DataTable>
    </AdminDashboardLayout>
  );
}
