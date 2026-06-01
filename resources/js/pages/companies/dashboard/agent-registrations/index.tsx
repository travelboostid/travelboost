import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DEFAULT_PHOTO } from '@/config';
import { useDataTable } from '@/hooks/use-data-table';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { update } from '@/routes/companies/dashboard/agent-registrations';
import { router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { UserIcon } from 'lucide-react';
import { useMemo } from 'react';
import AgentProfileModal from './components/AgentProfileModal';
import ApproveRegistrationButton from './components/approve-registration-button';
import EditNoteButton from './components/edit-note-button';
import { EmptyRegistrations } from './components/empty-registrations';
import RejectRegistrationButton from './components/reject-registration-button';
import SuspendButton from './components/suspend-button';
import UnsuspendButton from './components/unsuspend-button';

type PageProps = {
    data: {
        data: any[];
    };
    agentTiers: {
        id: number;
        name: string;
    }[];
};

export default function Page({ data, agentTiers }: PageProps) {
    const { company } = usePageSharedDataProps();
    const columns = useMemo<ColumnDef<any>[]>(
        () => [
            {
                id: 'agent.name',
                accessorKey: 'agent.name',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Agent" />
                ),
                cell: ({ row }) => {
                    const agent = row.original.agent;
                    return (
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 rounded-full border border-slate-200">
                                <AvatarImage
                                    src={agent.photo_url || DEFAULT_PHOTO}
                                    alt={agent.name}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-slate-100">
                                    <UserIcon className="h-4 w-4 text-slate-400" />
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-slate-900">
                                {agent.name}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'status',
                accessorKey: 'status',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Status" />
                ),
                cell: ({ row }) => {
                    const status = row.original.status;
                    return (
                        <div className="flex w-[100px] items-center capitalize">
                            <span
                                className={`mr-2 h-2 w-2 rounded-full ${
                                    status === 'active'
                                        ? 'bg-emerald-500'
                                        : status === 'suspended' ||
                                            status === 'rejected'
                                          ? 'bg-red-500'
                                          : 'bg-yellow-500'
                                }`}
                            />
                            {status}
                        </div>
                    );
                },
            },
            {
                id: 'note',
                accessorKey: 'note',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Note" />
                ),
                cell: ({ row }) => (
                    <div className="max-w-[200px] truncate text-slate-500">
                        {row.original.note || '-'}
                    </div>
                ),
            },
            {
                id: 'agent_tier_id',
                accessorKey: 'agent_tier_id',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Agent Tier" />
                ),
                cell: ({ row }) => {
                    const registration = row.original;

                    const handleUpdate = (val: string) => {
                        router.put(
                            update({
                                company: company.username,
                                agent_registration: registration.id,
                            }).url,
                            {
                                agent_tier_id:
                                    val === 'none' ? null : Number(val),
                            },
                            { preserveScroll: true },
                        );
                    };

                    return (
                        <Select
                            defaultValue={
                                registration.agent_tier_id
                                    ? String(registration.agent_tier_id)
                                    : 'none'
                            }
                            onValueChange={handleUpdate}
                        >
                            <SelectTrigger className="h-8 w-[150px] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Tier</SelectItem>
                                {agentTiers.map((tier) => (
                                    <SelectItem
                                        key={tier.id}
                                        value={String(tier.id)}
                                    >
                                        {tier.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    );
                },
            },
            {
                id: 'applied_at',
                accessorKey: 'applied_at',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Applied At" />
                ),
                cell: ({ row }) =>
                    dayjs(row.original.applied_at).format('DD MMM YYYY'),
            },
            {
                id: 'accepted_at',
                accessorKey: 'accepted_at',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Accepted At"
                    />
                ),
                cell: ({ row }) =>
                    row.original.accepted_at
                        ? dayjs(row.original.accepted_at).format('DD MMM YYYY')
                        : '-',
            },
            {
                id: 'payment_mode',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Payment Mode"
                    />
                ),
                cell: ({ row }) => {
                    const registration = row.original;

                    const handleUpdate = (val: string) => {
                        router.put(
                            update({
                                company: company.username,
                                agent_registration: registration.id,
                            }).url,
                            { payment_mode: val },
                            {
                                preserveScroll: true,
                                preserveState: true,
                            },
                        );
                    };

                    return (
                        <Select
                            defaultValue={registration.payment_mode || 'vendor'}
                            onValueChange={handleUpdate}
                        >
                            <SelectTrigger className="h-8 w-[110px] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="vendor">Vendor</SelectItem>
                                <SelectItem value="agent">Agent</SelectItem>
                            </SelectContent>
                        </Select>
                    );
                },
            },
            {
                id: 'manual_payment_enabled',
                accessorKey: 'manual_payment_enabled',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Manual Payment"
                    />
                ),
                cell: ({ row }) => {
                    const registration = row.original;

                    const handleUpdate = (checked: boolean) => {
                        router.put(
                            update({
                                company: company.username,
                                agent_registration: registration.id,
                            }).url,
                            { manual_payment_enabled: checked },
                            { preserveScroll: true },
                        );
                    };

                    return (
                        <Switch
                            checked={
                                registration.manual_payment_enabled ?? true
                            }
                            onCheckedChange={handleUpdate}
                        />
                    );
                },
            },
            {
                id: 'online_payment_enabled',
                accessorKey: 'online_payment_enabled',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Online Payment"
                    />
                ),
                cell: ({ row }) => {
                    const registration = row.original;

                    const handleUpdate = (checked: boolean) => {
                        router.put(
                            update({
                                company: company.username,
                                agent_registration: registration.id,
                            }).url,
                            { online_payment_enabled: checked },
                            { preserveScroll: true },
                        );
                    };

                    return (
                        <Switch
                            checked={registration.online_payment_enabled ?? true}
                            onCheckedChange={handleUpdate}
                        />
                    );
                },
            },
            {
                id: 'actions',
                cell: ({ row }) => {
                    return (
                        <div className="flex items-center gap-2">
                            <AgentProfileModal agent={row.original.agent} />

                            {row.original.status === 'pending' && (
                                <>
                                    <ApproveRegistrationButton
                                        registration={row.original}
                                    />
                                    <RejectRegistrationButton
                                        registration={row.original}
                                    />
                                </>
                            )}
                            {row.original.status === 'active' && (
                                <SuspendButton registration={row.original} />
                            )}
                            {row.original.status === 'suspended' && (
                                <UnsuspendButton registration={row.original} />
                            )}
                            {row.original.status === 'rejected' && (
                                <ApproveRegistrationButton
                                    registration={row.original}
                                />
                            )}
                            {['suspended', 'rejected'].includes(
                                row.original.status,
                            ) && <EditNoteButton registration={row.original} />}
                        </div>
                    );
                },
                size: 32,
            },
        ],
        [agentTiers, company.username],
    );

    const { table } = useDataTable({
        queryKeys: {
            perPage: 'per_page',
            page: 'page',
        },
        data: data.data,
        columns,
        pageCount: 1,
        shallow: false,
        initialState: {
            sorting: [{ id: 'id', desc: true }],
            columnPinning: { right: ['actions'] },
        },
        getRowId: (row: any) => row.id.toString(),
    });

    return (
        <CompanyDashboardLayout
            containerClassName="p-4"
            breadcrumb={[
                { title: 'Settings' },
                { title: 'Agent Registrations' },
            ]}
            openMenuIds={[]}
            activeMenuIds={['agent-registrations']}
        >
            <DataTable table={table} renderEmptyState={<EmptyRegistrations />}>
                <DataTableToolbar table={table} />
            </DataTable>
        </CompanyDashboardLayout>
    );
}
