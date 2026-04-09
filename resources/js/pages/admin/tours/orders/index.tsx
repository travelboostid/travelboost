import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDataTable } from '@/hooks/use-data-table';
import type { Column, ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { MoreHorizontal, Text } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyOrders } from './components/empty-orders';
dayjs.extend(relativeTime);

type OrderResource = {
  id: number;
  invoice_number: string;
  customer_name: string;
  vendor_name: string;
  tour_name: string;
  total_amount: number;
  status: string;
  created_at: string;
};

type PageProps = {
  data: {
    data: OrderResource[];
    total: number;
  };
};

export default function Page({ data }: PageProps) {
  const columns = useMemo<ColumnDef<OrderResource>[]>(
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
        id: 'invoice_number',
        accessorKey: 'invoice_number',
        header: ({ column }: { column: Column<OrderResource, unknown> }) => (
          <DataTableColumnHeader column={column} label="Invoice" />
        ),
        cell: ({ cell }) => (
          <div className="font-mono text-xs">{cell.getValue<string>()}</div>
        ),
        meta: {
          label: 'Invoice',
          placeholder: 'Search invoice...',
          variant: 'text',
          icon: Text,
        },
        enableColumnFilter: true,
      },
      {
        id: 'customer_name',
        accessorKey: 'customer_name',
        header: ({ column }: { column: Column<OrderResource, unknown> }) => (
          <DataTableColumnHeader column={column} label="Customer" />
        ),
        cell: ({ cell }) => <div>{cell.getValue<string>()}</div>,
        meta: {
          label: 'Customer',
          placeholder: 'Search customer...',
          variant: 'text',
          icon: Text,
        },
        enableColumnFilter: true,
      },
      {
        id: 'vendor_name',
        accessorKey: 'vendor_name',
        header: ({ column }: { column: Column<OrderResource, unknown> }) => (
          <DataTableColumnHeader column={column} label="Vendor" />
        ),
        cell: ({ cell }) => <div>{cell.getValue<string>()}</div>,
      },
      {
        id: 'tour_name',
        accessorKey: 'tour_name',
        header: ({ column }: { column: Column<OrderResource, unknown> }) => (
          <DataTableColumnHeader column={column} label="Tour" />
        ),
        cell: ({ cell }) => (
          <div className="max-w-48 truncate font-medium">
            {cell.getValue<string>()}
          </div>
        ),
      },
      {
        id: 'total_amount',
        accessorKey: 'total_amount',
        header: ({ column }: { column: Column<OrderResource, unknown> }) => (
          <DataTableColumnHeader column={column} label="Amount" />
        ),
        cell: ({ cell }) => (
          <div className="font-medium tabular-nums">
            Rp {cell.getValue<number>()?.toLocaleString('id-ID')}
          </div>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: ({ column }: { column: Column<OrderResource, unknown> }) => (
          <DataTableColumnHeader column={column} label="Status" />
        ),
        cell: ({ cell }) => (
          <Badge variant="secondary">{cell.getValue<string>()}</Badge>
        ),
      },
      {
        id: 'created_at',
        accessorKey: 'created_at',
        header: ({ column }: { column: Column<OrderResource, unknown> }) => (
          <DataTableColumnHeader column={column} label="Order Date" />
        ),
        cell: ({ cell }) => (
          <div className="text-muted-foreground">
            {dayjs(cell.getValue<string>()).fromNow()}
          </div>
        ),
      },
      {
        id: 'actions',
        cell: function Cell() {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Detail</DropdownMenuItem>
                <DropdownMenuItem>Approve</DropdownMenuItem>
                <DropdownMenuItem variant="destructive">
                  Reject
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
    data: data?.data ?? [],
    columns,
    pageCount: 1,
    rowCount: data?.total ?? 0,
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
      breadcrumb={[{ title: 'Tours' }, { title: 'Orders' }]}
    >
      <DataTable table={table} renderEmptyState={<EmptyOrders />}>
        <DataTableToolbar table={table} />
      </DataTable>
    </AdminDashboardLayout>
  );
}
