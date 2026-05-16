'use client';
'use no memo';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DEFAULT_PHOTO } from '@/config';
import { Head } from '@inertiajs/react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import dayjs from 'dayjs';
import { PlusIcon, UserCircle, UserIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import DeleteTeamButton from './components/delete-team-button';
import EditTeamAccountButton from './components/edit-team-account-button';
import InviteTeamButton from './components/invite-team-button';
import TeamRoleSelect from './components/team-role-select';
import TeamStatusSelect from './components/team-status-select';

export type TeamsPageProps = {
  members: any[];
  roles: any[];
  canManageMembers: boolean;
};

function EmptyTeamMembers() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UserCircle className="h-6 w-6" />
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">
          No team members found
        </div>
        <div className="text-sm text-muted-foreground">
          Add a new team member to start managing access for your company.
        </div>
      </div>
    </div>
  );
}

export default function Teams({
  members,
  roles,
  canManageMembers,
}: TeamsPageProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'invited_at', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'user',
        accessorFn: (row) => row.user?.name || row.invite_email || '',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="User" />
        ),
        cell: ({ row }) => {
          const team = row.original;
          const hasUser = Boolean(team.user);

          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 rounded-full border border-slate-200">
                <AvatarImage
                  src={team.user?.photo_url || DEFAULT_PHOTO}
                  alt={team.user?.name || team.invite_email}
                  className="object-cover"
                />
                <AvatarFallback className="bg-slate-100">
                  <UserIcon className="h-4 w-4 text-slate-400" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate font-bold text-primary"
                    title={team.user?.name || team.invite_email}
                  >
                    {team.user?.name || 'Legacy Record'}
                  </span>
                  {team.is_owner && <Badge>Owner</Badge>}
                </div>
                <div
                  className="truncate text-xs text-muted-foreground"
                  title={team.user?.email || team.invite_email || '-'}
                >
                  {hasUser ? team.user?.email : team.invite_email || '-'}
                </div>
              </div>
            </div>
          );
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
          <div
            className="max-w-[140px] truncate text-sm font-medium text-slate-600"
            title={row.original.user?.username || '-'}
          >
            {row.original.user?.username
              ? `@${row.original.user.username}`
              : '-'}
          </div>
        ),
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
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Status" />
        ),
        cell: ({ row }) => (
          <TeamStatusSelect
            team={row.original}
            canManageMembers={canManageMembers}
          />
        ),
      },
      {
        id: 'invited_at',
        accessorKey: 'invited_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Added Date" />
        ),
        cell: ({ cell }) => (
          <div className="whitespace-nowrap text-xs text-slate-500">
            {cell.getValue<string>()
              ? dayjs(cell.getValue<string>()).format('D MMM YYYY, HH:mm')
              : '-'}
          </div>
        ),
      },
      {
        id: 'actions',
        enableSorting: false,
        enableHiding: false,
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const team = row.original;

          return (
            <div className="flex items-center justify-end gap-2">
              {team.user && (
                <EditTeamAccountButton
                  team={team}
                  canManageMembers={canManageMembers}
                />
              )}
              <DeleteTeamButton team={team} disabled={!canManageMembers} />
            </div>
          );
        },
      },
    ],
    [canManageMembers, roles],
  );

  const table = useReactTable({
    data: members,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
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
              Add Team Member
            </Button>
          </InviteTeamButton>
        ) : undefined
      }
    >
      <Head title="User Management" />

      <div className="w-full space-y-6 p-4 pb-20 md:p-6">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <DataTable table={table} renderEmptyState={<EmptyTeamMembers />} />
        </div>
      </div>
    </CompanyDashboardLayout>
  );
}
