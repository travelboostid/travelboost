import { adminSearchResourceOwners } from '@/api/misc/misc';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';
import { formatIDRFull } from '@/lib/utils';
import EmptyWalletTransactions from '@/pages/companies/dashboard/wallet-transactions/empty-wallet-transactions';
import { router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { CalendarIcon, CircleDashedIcon } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';
type WalletTransactionsPageProps = {
    data: {
        data: any[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
    pendingTopups?: any[];
};

export default function WalletTransactionsPage({
    data,
    pendingTopups: _pendingTopups = [],
}: WalletTransactionsPageProps) {
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
                id: 'wallet_holder',
                accessorKey: 'wallet.holder',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Wallet Owner"
                    />
                ),
                cell: ({ row: _row }) => (
                    <div>{_row.original.wallet?.holder?.name ?? '-'}</div>
                ),
                meta: {
                    label: 'Owner',
                    variant: 'select',
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
            },
            {
                id: 'wallet',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Wallet" />
                ),
                cell: ({ row: _row }) => (
                    <div>{_row.original.wallet?.name ?? '-'}</div>
                ),
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
                            {formatIDRFull(amount)}
                        </div>
                    );
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
        getRowId: (_row) => _row.id.toString(),
    });

    const _handleApprove = (paymentId: number) => {
        router.post(
            `/admin/funds/wallet-transactions/${paymentId}/approve`,
            {},
            {
                onSuccess: () => toast.success('Approved successfully'),
                preserveScroll: true,
            },
        );
    };

    const _handleReject = (paymentId: number) => {
        router.post(
            `/admin/funds/wallet-transactions/${paymentId}/reject`,
            {},
            {
                onSuccess: () => toast.success('Rejected successfully'),
                preserveScroll: true,
            },
        );
    };

    return (
        <AdminDashboardLayout
            containerClassName="p-4"
            activeMenuIds={['funds', 'funds.wallet-transactions']}
            openMenuIds={['funds']}
            breadcrumb={[{ title: 'Funds' }, { title: 'Wallet Transactions' }]}
        >
            <DataTable
                table={table}
                renderEmptyState={<EmptyWalletTransactions />}
            >
                <DataTableToolbar table={table} />
            </DataTable>
        </AdminDashboardLayout>
    );
}
