import { adminSearchResourceOwners } from '@/api/misc/misc';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataTable } from '@/hooks/use-data-table';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { CalendarIcon, CircleDashedIcon } from 'lucide-react';
import { useMemo } from 'react';
import ApproveButton from './components/approve-button';
import { EmptyBankAccounts } from './components/empty-bank-accounts';
import RejectButton from './components/reject-button';
dayjs.extend(relativeTime);

const STATUS_OPTIONS = [
    { label: 'Pending', value: 'pending' },
    { label: 'Verified', value: 'verified' },
    { label: 'Rejected', value: 'rejected' },
];

export type BankAccountsPageProps = {
    data: {
        data: any[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
    bankAccountProviders: { code: string; name: string }[];
};

export default function BankAccountsPage({
    data,
    bankAccountProviders,
}: BankAccountsPageProps) {
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
                id: 'owner',
                accessorKey: 'owner',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Owner" />
                ),
                cell: ({ row }) => <div>{row.original.owner?.name ?? '-'}</div>,
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
                id: 'provider',
                accessorKey: 'provider',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Provider" />
                ),
                cell: ({ row }) => <div>{row.original.provider ?? '-'}</div>,
                meta: {
                    label: 'Provider',
                    placeholder: 'Search provider...',
                    variant: 'multiSelect',
                    options: bankAccountProviders.map((provider) => ({
                        label: provider.name,
                        value: provider.code,
                    })),
                    icon: CircleDashedIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'branch',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Branch" />
                ),
                cell: ({ row }) => <div>{row.original.branch ?? '-'}</div>,
            },
            {
                id: 'account_name',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Account Holder Name"
                    />
                ),
                cell: ({ row }) => (
                    <div>{row.original.account_name ?? '-'}</div>
                ),
            },
            {
                id: 'account_number',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Account Number"
                    />
                ),
                cell: ({ row }) => (
                    <div>{row.original.account_number ?? '-'}</div>
                ),
            },
            {
                id: 'status',
                accessorKey: 'status',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Status" />
                ),
                cell: ({ cell }) => <div>{cell.getValue<any>()}</div>,
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
                    return (
                        <div className="flex gap-2">
                            <ApproveButton data={row.original} />
                            <RejectButton data={row.original} />
                        </div>
                    );
                },
                size: 32,
            },
        ],
        [bankAccountProviders],
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
            activeMenuIds={['funds', 'funds.bank-accounts']}
            openMenuIds={['funds']}
            breadcrumb={[{ title: 'Funds' }, { title: 'Bank Accounts' }]}
        >
            <DataTable table={table} renderEmptyState={<EmptyBankAccounts />}>
                <DataTableToolbar table={table} />
            </DataTable>
        </AdminDashboardLayout>
    );
}
