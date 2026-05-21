import type { Company } from '@/api/model';
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
import { EmptyAgents } from './components/empty-agents';
dayjs.extend(relativeTime);

type PageProps = {
    data: {
        data: AgentCompany[];
        total: number;
    };
};

type AgentCompany = Company & {
    referrer?: {
        name?: string | null;
        email?: string | null;
        affiliate_profile?: {
            referral_code?: string | null;
            tier?: string | null;
        } | null;
    } | null;
};

export default function Page({ data }: PageProps) {
    const columns = useMemo<ColumnDef<AgentCompany>[]>(
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
                id: 'name',
                accessorKey: 'name',
                header: ({
                    column,
                }: {
                    column: Column<AgentCompany, unknown>;
                }) => <DataTableColumnHeader column={column} label="Name" />,
                cell: ({ row }) => (
                    <div className="min-w-[180px]">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                            {row.original.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            @{row.original.username}
                        </div>
                    </div>
                ),
                meta: {
                    label: 'Name',
                    placeholder: 'Search names...',
                    variant: 'text',
                    icon: Text,
                },
                enableColumnFilter: true,
            },
            {
                id: 'email',
                accessorKey: 'email',
                header: ({
                    column,
                }: {
                    column: Column<AgentCompany, unknown>;
                }) => <DataTableColumnHeader column={column} label="Email" />,
                cell: ({ cell }) => (
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                        {cell.getValue<AgentCompany['email']>() || '-'}
                    </div>
                ),
                meta: {
                    label: 'Email',
                    placeholder: 'Search email...',
                    variant: 'text',
                    icon: Text,
                },
                enableColumnFilter: true,
            },
            {
                id: 'phone',
                accessorKey: 'phone',
                header: ({
                    column,
                }: {
                    column: Column<AgentCompany, unknown>;
                }) => <DataTableColumnHeader column={column} label="Phone" />,
                cell: ({ cell }) => (
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                        {cell.getValue<string>() || '-'}
                    </div>
                ),
            },
            {
                id: 'affiliator',
                accessorKey: 'referrer.name',
                header: ({
                    column,
                }: {
                    column: Column<AgentCompany, unknown>;
                }) => (
                    <DataTableColumnHeader column={column} label="Affiliator" />
                ),
                cell: ({ row }) => {
                    const referrer = row.original.referrer;
                    const tier = referrer?.affiliate_profile?.tier;

                    if (!referrer) {
                        return (
                            <span className="text-sm text-slate-400">
                                No referral
                            </span>
                        );
                    }

                    return (
                        <div className="min-w-[180px]">
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                                {referrer.name || '-'}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                {referrer.email || '-'}
                            </div>
                            {tier && (
                                <Badge
                                    variant="outline"
                                    className="mt-1 capitalize border-primary/20 bg-primary/5 text-primary"
                                >
                                    {tier.replace(/_/g, ' ')}
                                </Badge>
                            )}
                        </div>
                    );
                },
            },
            {
                id: 'referral_code',
                accessorKey: 'referrer.affiliate_profile.referral_code',
                header: ({
                    column,
                }: {
                    column: Column<AgentCompany, unknown>;
                }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Referral Code"
                    />
                ),
                cell: ({ row }) => {
                    const referralCode =
                        row.original.referrer?.affiliate_profile?.referral_code;

                    return referralCode ? (
                        <Badge
                            variant="secondary"
                            className="font-mono tracking-wide text-slate-700 dark:text-slate-200"
                        >
                            {referralCode}
                        </Badge>
                    ) : (
                        <span className="text-sm text-slate-400">-</span>
                    );
                },
            },
            {
                id: 'status',
                accessorKey: 'status',
                header: ({
                    column,
                }: {
                    column: Column<AgentCompany, unknown>;
                }) => <DataTableColumnHeader column={column} label="Status" />,
                cell: ({ cell }) => (
                    <Badge variant="secondary">
                        {cell.getValue<string>() ?? 'active'}
                    </Badge>
                ),
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: ({
                    column,
                }: {
                    column: Column<AgentCompany, unknown>;
                }) => (
                    <DataTableColumnHeader column={column} label="Join Date" />
                ),
                cell: ({ cell }) => {
                    const createdAt = cell.getValue<Company['created_at']>();

                    return (
                        <div className="flex items-center gap-1">
                            {dayjs(createdAt).fromNow()}
                        </div>
                    );
                },
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
                                <DropdownMenuItem>Verify</DropdownMenuItem>
                                <DropdownMenuItem variant="destructive">
                                    Suspend
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
            breadcrumb={[{ title: 'Database' }, { title: 'Agent' }]}
        >
            <DataTable table={table} renderEmptyState={<EmptyAgents />}>
                <DataTableToolbar table={table} />
            </DataTable>
        </AdminDashboardLayout>
    );
}
