import { adminSearchResourceOwners } from '@/api/misc/misc';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';
import { formatIDR } from '@/lib/utils';
import type { Option } from '@/types/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { CalendarIcon, CircleDashedIcon, TextIcon } from 'lucide-react';
import { useMemo } from 'react';
import { BookingStatusBadge } from './components/booking-status-badge';
import { EmptyOrders } from './components/empty-orders';
import { TourOrderRowActions } from './components/tour-order-row-actions';
import type {
    AdminTourOrderRow,
    PaginatedTourOrders,
} from './components/tour-order-types';
import { TourOrdersTableActionBar } from './components/tour-orders-table-action-bar';

const STATUS_OPTIONS = [
    { label: 'Awaiting payment', value: 'awaiting payment' },
    { label: 'Booking reserved', value: 'booking reserved' },
    { label: 'Reserved', value: 'reserved' },
    { label: 'Manual reserved', value: 'manual reserved' },
    { label: 'Waiting payment approval', value: 'waiting payment approval' },
    { label: 'Down payment', value: 'down payment' },
    { label: 'Full payment', value: 'full payment' },
    { label: 'Waiting list', value: 'waiting list' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Refunded', value: 'refunded' },
    { label: 'Expired', value: 'expired' },
];

export default function TourOrdersPage({
    data,
}: {
    data: PaginatedTourOrders;
}) {
    const columns = useMemo<ColumnDef<AdminTourOrderRow>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() &&
                                'indeterminate')
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
                id: 'booking_number',
                accessorKey: 'booking_number',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Booking" />
                ),
                cell: ({ row }) => (
                    <div className="space-y-0.5">
                        <div className="font-mono text-xs">
                            {row.original.booking_number}
                        </div>
                        {row.original.invoice_number ? (
                            <div className="font-mono text-[10px] text-muted-foreground">
                                {row.original.invoice_number}
                            </div>
                        ) : null}
                    </div>
                ),
                meta: {
                    label: 'Booking',
                    placeholder: 'Search booking no...',
                    variant: 'text',
                    icon: TextIcon,
                },
                enableSorting: true,
                enableColumnFilter: true,
            },
            {
                id: 'contact_name',
                accessorKey: 'contact_name',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Customer" />
                ),
                cell: ({ row }) => (
                    <div className="max-w-40 truncate">
                        {row.original.contact_name || '—'}
                    </div>
                ),
                meta: {
                    label: 'Customer',
                    placeholder: 'Search customer...',
                    variant: 'text',
                    icon: TextIcon,
                },
                enableSorting: false,
                enableColumnFilter: true,
            },
            {
                id: 'vendor',
                accessorFn: (row) => row.vendor?.name ?? '—',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Vendor" />
                ),
                cell: ({ row }) => (
                    <div className="max-w-36 truncate">
                        {row.original.vendor?.name ?? '—'}
                    </div>
                ),
                meta: {
                    label: 'Vendor',
                    variant: 'multiSelect',
                    options: async (query, currentValues) => {
                        const response = await adminSearchResourceOwners({
                            types: 'company',
                            keyword: query,
                            include_ids: Array.from(currentValues)
                                .map((v) => `company:${v}`)
                                .join(','),
                        } as any);

                        const companies = response.data.companies as any[];

                        return companies.map(
                            (company) =>
                                ({
                                    label: company.name,
                                    value: company.id.toString(),
                                }) as Option,
                        );
                    },
                    icon: CircleDashedIcon,
                },
                enableSorting: false,
                enableColumnFilter: true,
            },
            {
                id: 'agent',
                accessorFn: (row) => row.agent?.name ?? '—',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Agent" />
                ),
                cell: ({ row }) => (
                    <div className="max-w-36 truncate">
                        {row.original.agent?.name ?? '—'}
                    </div>
                ),
                meta: {
                    label: 'Agent',
                    variant: 'multiSelect',
                    options: async (query, currentValues) => {
                        const response = await adminSearchResourceOwners({
                            types: 'company',
                            keyword: query,
                            include_ids: Array.from(currentValues)
                                .map((v) => `company:${v}`)
                                .join(','),
                        } as any);

                        const companies = response.data.companies as any[];

                        return companies.map(
                            (company) =>
                                ({
                                    label: company.name,
                                    value: company.id.toString(),
                                }) as Option,
                        );
                    },
                    icon: CircleDashedIcon,
                },
                enableSorting: false,
                enableColumnFilter: true,
            },
            {
                id: 'tour',
                accessorFn: (row) => row.tour?.name ?? '—',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Tour" />
                ),
                cell: ({ row }) => (
                    <div className="max-w-44 truncate font-medium">
                        {row.original.tour?.name ?? '—'}
                    </div>
                ),
                enableSorting: false,
            },
            {
                id: 'departure_date',
                accessorKey: 'departure_date',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Departure" />
                ),
                cell: ({ row }) => (
                    <div className="text-muted-foreground">
                        {row.original.departure_date
                            ? dayjs(row.original.departure_date).format(
                                  'DD MMM YYYY',
                              )
                            : '—'}
                    </div>
                ),
                meta: {
                    label: 'Departure',
                    variant: 'dateRange',
                    icon: CalendarIcon,
                },
                enableSorting: true,
                enableColumnFilter: true,
            },
            {
                id: 'grand_total',
                accessorKey: 'grand_total',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Total" />
                ),
                cell: ({ row }) => (
                    <div className="font-medium tabular-nums">
                        {formatIDR(row.original.grand_total)}
                    </div>
                ),
                enableSorting: true,
            },
            {
                id: 'paid_amount',
                accessorKey: 'paid_amount',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Paid" />
                ),
                cell: ({ row }) => (
                    <div className="tabular-nums text-muted-foreground">
                        {formatIDR(row.original.paid_amount)}
                    </div>
                ),
                enableSorting: false,
            },
            {
                id: 'status',
                accessorKey: 'status',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Status" />
                ),
                cell: ({ row }) => (
                    <BookingStatusBadge status={row.original.status} />
                ),
                meta: {
                    label: 'Status',
                    variant: 'multiSelect',
                    options: STATUS_OPTIONS,
                    icon: CircleDashedIcon,
                },
                enableSorting: true,
                enableColumnFilter: true,
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Ordered" />
                ),
                cell: ({ row }) => (
                    <div className="text-muted-foreground">
                        {dayjs(row.original.created_at).format('DD MMM YYYY')}
                    </div>
                ),
                meta: {
                    label: 'Order date',
                    variant: 'dateRange',
                    icon: CalendarIcon,
                },
                enableSorting: true,
                enableColumnFilter: true,
            },
            {
                id: 'actions',
                cell: ({ row }) => <TourOrderRowActions order={row.original} />,
                size: 40,
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
            activeMenuIds={['tours', 'tours.orders']}
            openMenuIds={['tours']}
            breadcrumb={[{ title: 'Tours' }, { title: 'Orders' }]}
        >
            <DataTable
                table={table}
                renderEmptyState={<EmptyOrders />}
                actionBar={<TourOrdersTableActionBar table={table} />}
            >
                <DataTableToolbar table={table} />
            </DataTable>
        </AdminDashboardLayout>
    );
}
