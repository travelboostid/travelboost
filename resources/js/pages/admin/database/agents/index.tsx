import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDataTable } from '@/hooks/use-data-table';
import { edit } from '@/routes/admin/database/agents';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { Ban, CalendarIcon, CircleDashedIcon, Text } from 'lucide-react';
import { useMemo } from 'react';
import { CompaniesTableActionBar } from '../shared/companies-table-action-bar';
import {
    CompanyRowActions,
    SubscriptionStatusBadge,
} from '../shared/company-row-actions';
import type {
    AdminCompanyRow,
    NetworkPerson,
    PaginatedCompanies,
} from '../shared/company-types';
import { EmptyAgents } from './components/empty-agents';

const SUBSCRIPTION_STATUS_OPTIONS = [
    { label: 'Active', value: 'active' },
    { label: 'Expired', value: 'expired' },
    { label: 'Inactive', value: 'inactive' },
];

function InactiveIcon({ person }: { person?: NetworkPerson | null }) {
    if (!person?.is_inactive) {
        return null;
    }

    return <Ban className="size-3.5 text-rose-500" aria-hidden="true" />;
}

function PersonName({ person }: { person?: NetworkPerson | null }) {
    if (!person) {
        return <span className="text-sm text-muted-foreground">—</span>;
    }

    return (
        <div className="flex min-w-[120px] items-center gap-2">
            <span className="truncate text-sm font-medium">
                {person.name || '—'}
            </span>
            <InactiveIcon person={person} />
        </div>
    );
}

function AffiliatorCell({ person }: { person?: NetworkPerson | null }) {
    if (!person) {
        return (
            <span className="text-sm text-muted-foreground">No referral</span>
        );
    }

    return (
        <div className="min-w-[170px] space-y-1">
            <div className="flex items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="max-w-[140px] truncate text-sm font-medium underline-offset-2 hover:underline">
                            {person.name || '—'}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        {person.email || 'No email available'}
                    </TooltipContent>
                </Tooltip>
                <InactiveIcon person={person} />
            </div>
            {person.referral_code ? (
                <Badge variant="outline" className="font-mono text-[11px]">
                    {person.referral_code}
                </Badge>
            ) : null}
        </div>
    );
}

export default function AgentsPage({ data }: { data: PaginatedCompanies }) {
    const columns = useMemo<ColumnDef<AdminCompanyRow>[]>(
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
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Name" />
                ),
                cell: ({ row }) => (
                    <div className="min-w-[160px]">
                        <div className="font-medium">{row.original.name}</div>
                        <div className="text-xs text-muted-foreground">
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
                id: 'username',
                accessorKey: 'username',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Username" />
                ),
                cell: ({ cell }) => (
                    <div className="text-sm">@{cell.getValue<string>()}</div>
                ),
                meta: {
                    label: 'Username',
                    placeholder: 'Search usernames...',
                    variant: 'text',
                    icon: Text,
                },
                enableColumnFilter: true,
            },
            {
                id: 'email',
                accessorKey: 'email',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Email" />
                ),
                cell: ({ cell }) => (
                    <div className="min-w-[180px] text-sm">
                        {cell.getValue<string>()}
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
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Phone" />
                ),
                cell: ({ cell }) => (
                    <div className="text-sm">
                        {cell.getValue<string>() || '—'}
                    </div>
                ),
                meta: {
                    label: 'Phone',
                    placeholder: 'Search phone...',
                    variant: 'text',
                    icon: Text,
                },
                enableColumnFilter: true,
            },
            {
                id: 'address',
                accessorKey: 'address',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Address" />
                ),
                cell: ({ cell }) => (
                    <div className="max-w-[200px] truncate text-sm">
                        {cell.getValue<string>() || '—'}
                    </div>
                ),
                meta: {
                    label: 'Address',
                    placeholder: 'Search address...',
                    variant: 'text',
                    icon: Text,
                },
                enableColumnFilter: true,
            },
            {
                id: 'subscription_status',
                accessorKey: 'subscription_status',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Subscription"
                    />
                ),
                cell: ({ row }) => (
                    <SubscriptionStatusBadge
                        status={row.original.subscription_status}
                    />
                ),
                meta: {
                    label: 'Subscription',
                    variant: 'multiSelect',
                    options: SUBSCRIPTION_STATUS_OPTIONS,
                    icon: CircleDashedIcon,
                },
                enableColumnFilter: true,
                enableSorting: false,
            },
            {
                id: 'affiliator',
                accessorFn: (row) =>
                    row.affiliation?.affiliator?.name ||
                    row.affiliation?.affiliator?.referral_code ||
                    '',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Affiliator" />
                ),
                cell: ({ row }) => (
                    <AffiliatorCell
                        person={row.original.affiliation?.affiliator}
                    />
                ),
                enableSorting: false,
            },
            {
                id: 'master_affiliate',
                accessorFn: (row) =>
                    row.affiliation?.master_affiliate?.name || '',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="MA" />
                ),
                cell: ({ row }) => (
                    <PersonName
                        person={row.original.affiliation?.master_affiliate}
                    />
                ),
                enableSorting: false,
            },
            {
                id: 'partner',
                accessorFn: (row) => row.affiliation?.partner?.name || '',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Partner" />
                ),
                cell: ({ row }) => (
                    <PersonName person={row.original.affiliation?.partner} />
                ),
                enableSorting: false,
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Join Date" />
                ),
                cell: ({ cell }) => {
                    const createdAt = cell.getValue<string | null>();

                    return (
                        <div className="text-sm">
                            {createdAt
                                ? dayjs(createdAt).format('DD MMM YYYY')
                                : '—'}
                        </div>
                    );
                },
                meta: {
                    label: 'Join Date',
                    placeholder: 'Search join date...',
                    variant: 'dateRange',
                    icon: CalendarIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'actions',
                cell: ({ row }) => (
                    <CompanyRowActions
                        company={row.original}
                        entityLabel="Agent"
                        editHref={edit({ agent: row.original.id }).url}
                        showAffiliation
                    />
                ),
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
            sorting: [{ id: 'created_at', desc: true }],
            columnPinning: { right: ['actions'] },
            columnVisibility: {
                username: false,
                address: false,
            },
        },
        getRowId: (row) => row.id.toString(),
    });

    return (
        <AdminDashboardLayout
            containerClassName="p-4"
            activeMenuIds={['database', 'database.agents']}
            openMenuIds={['database']}
            breadcrumb={[{ title: 'Database' }, { title: 'Agent' }]}
        >
            <DataTable
                table={table}
                renderEmptyState={<EmptyAgents />}
                actionBar={
                    <CompaniesTableActionBar table={table} entity="agent" />
                }
            >
                <DataTableToolbar table={table} />
            </DataTable>
        </AdminDashboardLayout>
    );
}
