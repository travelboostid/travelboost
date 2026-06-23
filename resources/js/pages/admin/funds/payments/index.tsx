import { adminSearchResourceOwners } from '@/api/misc/misc';
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
import { formatIDR } from '@/lib/utils';
import { router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import {
    CalendarIcon,
    CircleDashedIcon,
    MoreHorizontalIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { EmptyPayments } from './components/empty-payments';

const STATUS_OPTIONS = [
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Pending', value: 'pending' },
    { label: 'Paid', value: 'paid' },
    { label: 'Failed', value: 'failed' },
    { label: 'Expired', value: 'expired' },
    { label: 'Refunded', value: 'refunded' },
    { label: 'Cancelled', value: 'cancelled' },
];

type PaymentsPageProps = {
    data: {
        data: any[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
};

export default function PaymentsPage({ data }: PaymentsPageProps) {
    const handleApprove = (paymentId: number) => {
        router.post(
            `/admin/funds/wallet-transactions/${paymentId}/approve`,
            {},
            {
                onSuccess: () => toast.success('Approved successfully'),
                preserveScroll: true,
            },
        );
    };

    const handleReject = (paymentId: number) => {
        router.post(
            `/admin/funds/wallet-transactions/${paymentId}/reject`,
            {},
            {
                onSuccess: () => toast.success('Rejected successfully'),
                preserveScroll: true,
            },
        );
    };

    const columns = useMemo<ColumnDef<any>[]>(
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
                cell: ({ row: _row }) => (
                    <Checkbox
                        checked={_row.getIsSelected()}
                        onCheckedChange={(value) =>
                            _row.toggleSelected(!!value)
                        }
                        aria-label="Select row"
                    />
                ),
                size: 32,
                enableSorting: true,
                enableHiding: false,
            },
            {
                id: 'owner',
                accessorKey: 'owner',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Owner" />
                ),
                cell: ({ row: _row }) => (
                    <div>{_row.original.owner?.name ?? '-'}</div>
                ),
                meta: {
                    label: 'Owner',
                    variant: 'multiSelect',
                    options: async (query, currentValues) => {
                        const response = await adminSearchResourceOwners({
                            types: 'company,user',
                            keyword: query,
                            include_ids: Array.from(currentValues).join(','),
                        } as any);

                        const companies = response.data.companies as any[];
                        const users = response.data.users as any[];
                        const companyOptions = companies.map((c) => ({
                            label: c.name,
                            value: `company:${c.id}`,
                        }));
                        const userOptions = users.map((c) => ({
                            label: c.name,
                            value: `user:${c.id}`,
                        }));
                        return [...companyOptions, ...userOptions];
                    },
                    icon: CircleDashedIcon,
                },
                enableColumnFilter: true,
                enableSorting: false,
            },
            {
                id: 'status',
                accessorKey: 'status',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Status" />
                ),
                cell: ({ cell }) => {
                    const status = cell.getValue<string>();
                    let variant:
                        | 'default'
                        | 'secondary'
                        | 'destructive'
                        | 'outline'
                        | null
                        | undefined = 'secondary';
                    if (status === 'paid' || status === 'success')
                        variant = 'default';
                    else if (status === 'pending') variant = 'outline';
                    else if (status === 'failed' || status === 'cancelled')
                        variant = 'destructive';

                    return (
                        <Badge variant={variant} className="capitalize">
                            {status}
                        </Badge>
                    );
                },
                meta: {
                    label: 'Status',
                    placeholder: 'Search status...',
                    variant: 'multiSelect',
                    options: STATUS_OPTIONS,
                    icon: CircleDashedIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'type',
                accessorKey: 'payable_type',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Type" />
                ),
                cell: ({ cell }) => {
                    const val = cell.getValue<any>();
                    if (val === 'wallet-topup-payment')
                        return <Badge variant="outline">Wallet Top-up</Badge>;
                    if (val === 'ai-credit-topup-payment')
                        return <Badge variant="outline">AI Top-up</Badge>;
                    return <div>{val}</div>;
                },
                enableColumnFilter: false,
            },
            {
                id: 'amount',
                accessorKey: 'amount',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Amount" />
                ),
                cell: ({ cell }) => {
                    const amount = cell.getValue<any>();
                    return <div>{formatIDR(amount)}</div>;
                },
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Created Date"
                    />
                ),
                cell: ({ cell }) => {
                    const createdAt = cell.getValue<any>();

                    return (
                        <div className="flex items-center gap-1">
                            {dayjs(createdAt).format('DD MMM YYYY')}
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
                cell: ({ row: _row }) => {
                    const payment = _row.original;
                    const isManualPendingTopup =
                        (payment.payable_type === 'wallet-topup-payment' ||
                            payment.payable_type ===
                                'ai-credit-topup-payment') &&
                        payment.provider === 'manual' &&
                        payment.status === 'pending';

                    if (!isManualPendingTopup) return null;

                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="size-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontalIcon className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {payment.payload?.proof_path && (
                                    <DropdownMenuItem asChild>
                                        <a
                                            href={`/storage/${payment.payload.proof_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            View Proof
                                        </a>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onClick={() => handleApprove(payment.id)}
                                >
                                    Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleReject(payment.id)}
                                    className="text-destructive focus:text-destructive"
                                >
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
        data: data.data,
        columns,
        pageCount: data.last_page,
        rowCount: data.total,
        shallow: false,
        initialState: {
            sorting: [{ id: 'id', desc: true }],
            columnPinning: { right: ['actions'] },
        },
        getRowId: (_row) => _row.id.toString(),
    });

    return (
        <AdminDashboardLayout
            containerClassName="p-4"
            activeMenuIds={['funds', 'funds.payments']}
            openMenuIds={['funds']}
            breadcrumb={[{ title: 'Funds' }, { title: 'Payments' }]}
        >
            <DataTable table={table} renderEmptyState={<EmptyPayments />}>
                <DataTableToolbar table={table} />
            </DataTable>
        </AdminDashboardLayout>
    );
}
