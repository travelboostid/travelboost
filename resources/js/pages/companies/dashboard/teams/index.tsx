import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DEFAULT_PHOTO } from '@/config';
import { useDataTable } from '@/hooks/use-data-table';
import { cn } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import {
    CalendarIcon,
    CircleDashedIcon,
    PlusIcon,
    TextIcon,
    UserCircleIcon,
    UserIcon,
    UsersIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import DeleteTeamButton from './components/delete-team-button';
import EditTeamAccountButton from './components/edit-team-account-button';
import InviteTeamButton from './components/invite-team-button';
import TeamRoleSelect from './components/team-role-select';
import TeamStatusSelect from './components/team-status-select';
import TeamsTableActionBar from './components/teams-table-action-bar';

export type TeamMemberRow = {
    id: number;
    invite_email: string | null;
    invite_role: string | null;
    invited_at: string | null;
    is_owner: boolean;
    status: string;
    user?: {
        id: number;
        name: string;
        email: string;
        username: string;
        photo_url?: string | null;
    } | null;
    roles?: Array<{ name: string; display_name?: string }>;
};

export type TeamsPageProps = {
    data: {
        data: TeamMemberRow[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
    roles: Array<{ name: string; display_name?: string }>;
    canManageMembers: boolean;
};

const STATUS_OPTIONS = [
    { label: 'Active', value: 'active' },
    { label: 'Pending', value: 'pending' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Rejected', value: 'rejected' },
];

function statusBadgeClass(status?: string | null): string {
    switch (status) {
        case 'active':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300';
        case 'pending':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300';
        case 'suspended':
        case 'rejected':
            return 'border-destructive/30 bg-destructive/10 text-destructive';
        default:
            return 'border-border bg-muted text-muted-foreground';
    }
}

function EmptyTeamMembers() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UserCircleIcon className="size-6" />
            </div>
            <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                    <FormattedMessage defaultMessage="No team members found" />
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                    <FormattedMessage defaultMessage="Try adjusting your filters or add a new team member to manage company access." />
                </p>
            </div>
        </div>
    );
}

export default function Teams({
    data,
    roles,
    canManageMembers,
}: TeamsPageProps) {
    const roleOptions = useMemo(
        () =>
            roles.map((role) => ({
                label: role.display_name || role.name,
                value: role.name,
            })),
        [roles],
    );

    const columns = useMemo<ColumnDef<TeamMemberRow>[]>(
        () => [
            ...(canManageMembers
                ? [
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
                                  disabled={
                                      row.original.is_owner ||
                                      !row.original.user
                                  }
                                  onCheckedChange={(value) =>
                                      row.toggleSelected(!!value)
                                  }
                                  aria-label="Select row"
                              />
                          ),
                          size: 32,
                          enableSorting: false,
                          enableHiding: false,
                      } satisfies ColumnDef<TeamMemberRow>,
                  ]
                : []),
            {
                id: 'user',
                accessorFn: (row) => row.user?.name || row.invite_email || '',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Member" />
                ),
                cell: ({ row }) => {
                    const team = row.original;
                    const hasUser = Boolean(team.user);

                    return (
                        <div className="flex min-w-[220px] items-center gap-3">
                            <Avatar className="size-10 border">
                                <AvatarImage
                                    src={team.user?.photo_url || DEFAULT_PHOTO}
                                    alt={
                                        team.user?.name ||
                                        team.invite_email ||
                                        ''
                                    }
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-muted">
                                    <UserIcon className="size-4 text-muted-foreground" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className="truncate font-semibold text-foreground"
                                        title={
                                            team.user?.name ||
                                            team.invite_email ||
                                            undefined
                                        }
                                    >
                                        {team.user?.name || 'Legacy record'}
                                    </span>
                                    {team.is_owner ? (
                                        <Badge variant="secondary">Owner</Badge>
                                    ) : null}
                                </div>
                                <p
                                    className="truncate text-xs text-muted-foreground"
                                    title={
                                        team.user?.email ||
                                        team.invite_email ||
                                        undefined
                                    }
                                >
                                    {hasUser
                                        ? team.user?.email
                                        : team.invite_email || '-'}
                                </p>
                            </div>
                        </div>
                    );
                },
                meta: {
                    label: 'Member',
                    placeholder: 'Search name or email...',
                    variant: 'text',
                    icon: TextIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'username',
                accessorFn: (row) => row.user?.username || '',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Username" />
                ),
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {row.original.user?.username
                            ? `@${row.original.user.username}`
                            : '-'}
                    </span>
                ),
                meta: {
                    label: 'Username',
                    placeholder: 'Search username...',
                    variant: 'text',
                    icon: TextIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'role',
                accessorFn: (row) =>
                    row.roles?.[0]?.display_name ||
                    row.roles?.[0]?.name ||
                    row.invite_role ||
                    '',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Role" />
                ),
                cell: ({ row }) => (
                    <TeamRoleSelect
                        team={row.original}
                        roles={roles}
                        canManageMembers={canManageMembers}
                    />
                ),
                meta: {
                    label: 'Role',
                    variant: 'multiSelect',
                    options: roleOptions,
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
                cell: ({ row }) =>
                    canManageMembers && row.original.user ? (
                        <TeamStatusSelect
                            team={row.original}
                            canManageMembers={canManageMembers}
                        />
                    ) : (
                        <Badge
                            variant="outline"
                            className={cn(
                                'capitalize',
                                statusBadgeClass(row.original.status),
                            )}
                        >
                            {row.original.status}
                        </Badge>
                    ),
                meta: {
                    label: 'Status',
                    variant: 'multiSelect',
                    options: STATUS_OPTIONS,
                    icon: CircleDashedIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'invited_at',
                accessorKey: 'invited_at',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Added" />
                ),
                cell: ({ cell }) => {
                    const value = cell.getValue<string | null>();

                    return (
                        <span className="whitespace-nowrap text-sm text-muted-foreground">
                            {value
                                ? dayjs(value).format('D MMM YYYY, HH:mm')
                                : '-'}
                        </span>
                    );
                },
                meta: {
                    label: 'Added date',
                    variant: 'dateRange',
                    icon: CalendarIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'actions',
                enableSorting: false,
                enableHiding: false,
                header: () => (
                    <div className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Actions
                    </div>
                ),
                cell: ({ row }) => {
                    const team = row.original;

                    return (
                        <div className="flex items-center justify-end gap-2">
                            {team.user ? (
                                <EditTeamAccountButton
                                    team={team}
                                    canManageMembers={canManageMembers}
                                />
                            ) : null}
                            <DeleteTeamButton
                                team={team}
                                disabled={!canManageMembers}
                            />
                        </div>
                    );
                },
            },
        ],
        [canManageMembers, roleOptions, roles],
    );

    const { table } = useDataTable({
        queryKeys: { perPage: 'per_page', page: 'page' },
        data: data.data,
        columns,
        pageCount: data.last_page,
        rowCount: data.total,
        shallow: false,
        enableRowSelection: (row) =>
            canManageMembers &&
            !row.original.is_owner &&
            Boolean(row.original.user),
        initialState: {
            sorting: [{ id: 'invited_at', desc: true }],
            columnPinning: { right: ['actions'] },
        },
        getRowId: (row) => row.id.toString(),
    });

    return (
        <CompanyDashboardLayout
            containerClassName="w-full flex-1 flex flex-col"
            breadcrumb={[{ title: 'Settings' }, { title: 'User Management' }]}
            openMenuIds={['settings']}
            activeMenuIds={['settings.teams']}
            applet={
                canManageMembers ? (
                    <InviteTeamButton roles={roles}>
                        <Button className="shadow-sm">
                            <PlusIcon />
                            <FormattedMessage defaultMessage="Add member" />
                        </Button>
                    </InviteTeamButton>
                ) : undefined
            }
        >
            <Head title="User Management" />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-20 sm:p-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <UsersIcon className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                    <FormattedMessage defaultMessage="Team members" />
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    <FormattedMessage
                                        defaultMessage="{count} members · manage roles, access, and account status."
                                        values={{ count: data.total }}
                                    />
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <DataTable
                        table={table}
                        className="gap-0"
                        tableContainerClassName="rounded-none border-0"
                        paginationClassName="border-t px-4 py-3"
                        renderEmptyState={<EmptyTeamMembers />}
                        actionBar={
                            <TeamsTableActionBar
                                table={table}
                                canManageMembers={canManageMembers}
                            />
                        }
                    >
                        <DataTableToolbar
                            table={table}
                            className="border-b px-4 py-3"
                        />
                    </DataTable>
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
