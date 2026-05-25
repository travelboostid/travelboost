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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDataTable } from '@/hooks/use-data-table';
import type { Column, ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { Ban, MoreHorizontal, Text } from 'lucide-react';
import { useMemo } from 'react';
import { EmptyAgents } from './components/empty-agents';


type NetworkPerson = {
    id: number;
    name?: string | null;
    email?: string | null;
    referral_code?: string | null;
    status?: string | null;
    user_status?: string | null;
    is_inactive?: boolean;
};

type AgentCompany = {
    id: number;
    name?: string | null;
    username?: string | null;
    email?: string | null;
    phone?: string | null;
    status?: string | null;
    created_at?: string | null;
    affiliation?: {
        affiliator?: NetworkPerson | null;
        master_affiliate?: NetworkPerson | null;
        partner?: NetworkPerson | null;
    } | null;
};

type PageProps = {
    data: {
        data: AgentCompany[];
        total: number;
    };
};

function InactiveIcon({ person }: { person?: NetworkPerson | null }) {
    if (!person?.is_inactive) {
        return null;
    }

    return <Ban className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />;
}

function PersonName({ person }: { person?: NetworkPerson | null }) {
    if (!person) {
        return <span className="text-sm text-slate-400">-</span>;
    }

    return (
        <div className="flex min-w-[140px] items-center gap-2">
            <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {person.name || '-'}
            </span>
            <InactiveIcon person={person} />
        </div>
    );
}

function AffiliatorCell({ person }: { person?: NetworkPerson | null }) {
    if (!person) {
        return <span className="text-sm text-slate-400">No referral</span>;
    }

    return (
        <div className="min-w-[190px] space-y-1">
            <div className="flex items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="max-w-[150px] truncate text-sm font-medium text-slate-900 underline-offset-2 hover:underline dark:text-slate-100">
                            {person.name || '-'}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        {person.email || 'No email available'}
                    </TooltipContent>
                </Tooltip>
                <InactiveIcon person={person} />
            </div>
            {person.referral_code ? (
                <Badge
                    variant="secondary"
                    className="font-mono text-[11px] tracking-wide"
                >
                    {person.referral_code}
                </Badge>
            ) : (
                <span className="text-xs text-slate-400">No code</span>
            )}
        </div>
    );
}

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
                            {row.original.name || '-'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            @{row.original.username || '-'}
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
                    <div className="min-w-[180px] text-sm text-slate-700 dark:text-slate-300">
                        {cell.getValue<string>() || '-'}
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
                    <div className="min-w-[130px] text-sm text-slate-700 dark:text-slate-300">
                        {cell.getValue<string>() || '-'}
                    </div>
                ),
            },
            {
                id: 'affiliator',
                accessorFn: (row) =>
                    row.affiliation?.affiliator?.name ||
                    row.affiliation?.affiliator?.referral_code ||
                    '',
                header: ({
                    column,
                }: {
                    column: Column<AgentCompany, unknown>;
                }) => (
                    <DataTableColumnHeader column={column} label="Affiliator" />
                ),
                cell: ({ row }) => (
                    <AffiliatorCell
                        person={row.original.affiliation?.affiliator}
                    />
                ),
            },
            {
                id: 'master_affiliate',
                accessorFn: (row) =>
                    row.affiliation?.master_affiliate?.name || '',
                header: ({
                    column,
                }: {
                    column: Column<AgentCompany, unknown>;
                }) => <DataTableColumnHeader column={column} label="MA" />,
                cell: ({ row }) => (
                    <PersonName
                        person={row.original.affiliation?.master_affiliate}
                    />
                ),
            },
            {
                id: 'partner',
                accessorFn: (row) => row.affiliation?.partner?.name || '',
                header: ({
                    column,
                }: {
                    column: Column<AgentCompany, unknown>;
                }) => <DataTableColumnHeader column={column} label="Partner" />,
                cell: ({ row }) => (
                    <PersonName person={row.original.affiliation?.partner} />
                ),
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
                    <Badge variant="secondary" className="capitalize">
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
                    const createdAt = cell.getValue<string | null>();

                    return (
                        <div className="min-w-[110px] text-sm text-slate-700 dark:text-slate-300">
                            {createdAt ? dayjs(createdAt).format('DD MMM YYYY') : '-'}
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
        enableClientFiltering: true,
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
            sorting: [{ id: 'created_at', desc: true }],
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
                <DataTableToolbar table={table} searchMode="global" />
            </DataTable>
        </AdminDashboardLayout>
    );
}
