import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_PHOTO } from '@/config';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { update } from '@/routes/companies/dashboard/agent-registrations';
import { router, useForm } from '@inertiajs/react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table';
import dayjs from 'dayjs';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronDown,
    EyeIcon,
    MoreHorizontal,
    NotebookPenIcon,
    Search,
    ShieldBanIcon,
    UserCheckIcon,
    UserIcon,
    UserX2Icon,
    XIcon,
} from 'lucide-react';
import * as React from 'react';
import AgentProfileModal from './components/AgentProfileModal';
import { EmptyRegistrations } from './components/empty-registrations';

type RegistrationRow = {
    id: number;
    status: 'pending' | 'active' | 'suspended' | 'rejected' | string;
    note: string | null;
    agent_tier_id: number | null;
    payment_mode: 'vendor' | 'agent' | null;
    manual_payment_enabled?: boolean | null;
    online_payment_enabled?: boolean | null;
    applied_at: string | null;
    accepted_at: string | null;
    agent: {
        id: number;
        name: string;
        email?: string | null;
        photo_url?: string | null;
    };
};

type PageProps = {
    data: {
        data: RegistrationRow[];
    };
    agentTiers: {
        id: number;
        name: string;
    }[];
};

const STATUS_TABS = [
    { value: 'all', label: 'All Registrations' },
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'rejected', label: 'Rejected' },
] as const;

const statusStyles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    rejected:
        'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    pending:
        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

function SortableHeader({
    column,
    title,
    className,
}: {
    column: any;
    title: React.ReactNode;
    className?: string;
}) {
    return (
        <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className={`-ml-4 h-8 font-bold text-primary hover:bg-transparent data-[state=open]:bg-transparent ${className ?? ''}`}
        >
            <span>{title}</span>
            {column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
            )}
        </Button>
    );
}

function statusBadgeClass(status: string): string {
    return (
        statusStyles[status.toLowerCase()] ??
        'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300'
    );
}

function RegistrationActions({
    registration,
}: {
    registration: RegistrationRow;
}) {
    const { company } = usePageSharedDataProps();
    const [dialogType, setDialogType] = React.useState<
        'approve' | 'reject' | 'suspend' | 'unsuspend' | 'note' | null
    >(null);
    const form = useForm({
        status: registration.status,
        note: registration.note || '',
    });

    const closeDialog = () => {
        setDialogType(null);
        form.setData({
            status: registration.status,
            note: registration.note || '',
        });
    };

    const submitAction = (
        status: RegistrationRow['status'],
        note = form.data.note,
    ) => {
        form.transform(() => ({
            status,
            note,
        })).put(
            update({
                company: company.username,
                agent_registration: registration.id,
            }).url,
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    closeDialog();
                },
            },
        );
    };

    const dialogConfig = {
        approve: {
            title: 'Approve registration?',
            description:
                'This will approve the registration and allow the agent to access your tours.',
            actionLabel: 'Approve',
            action: () => submitAction('active', ''),
            showNote: false,
        },
        reject: {
            title: 'Reject registration?',
            description:
                'This action will reject the registration. The agent will be notified and can re-apply if needed.',
            actionLabel: 'Reject',
            action: () => submitAction('rejected'),
            showNote: true,
        },
        suspend: {
            title: 'Suspend registration?',
            description:
                'This will suspend the registration and prevent the agent from accessing your tours until it is reactivated.',
            actionLabel: 'Suspend',
            action: () => submitAction('suspended'),
            showNote: true,
        },
        unsuspend: {
            title: 'Unsuspend registration?',
            description:
                'This will reactivate the registration and allow the agent to access your tours again.',
            actionLabel: 'Unsuspend',
            action: () => submitAction('active', ''),
            showNote: false,
        },
        note: {
            title: 'Edit note',
            description:
                'Update the note related to this registration so your team has the latest context.',
            actionLabel: 'Update Note',
            action: () => submitAction(registration.status),
            showNote: true,
        },
    } as const;

    const currentDialog = dialogType ? dialogConfig[dialogType] : null;

    return (
        <>
            <div className="flex justify-center px-1">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        className="w-52 rounded-xl"
                    >
                        <AgentProfileModal
                            agent={registration.agent}
                            trigger={
                                <DropdownMenuItem
                                    onSelect={(event) => event.preventDefault()}
                                    className="cursor-pointer"
                                >
                                    <EyeIcon className="mr-2 h-4 w-4" />
                                    View Profile
                                </DropdownMenuItem>
                            }
                        />

                        {(registration.status === 'suspended' ||
                            registration.status === 'rejected') && (
                            <DropdownMenuItem
                                onSelect={(event) => {
                                    event.preventDefault();
                                    setDialogType(
                                        registration.status === 'suspended'
                                            ? 'unsuspend'
                                            : 'approve',
                                    );
                                }}
                                className="cursor-pointer"
                            >
                                <UserCheckIcon className="mr-2 h-4 w-4" />
                                {registration.status === 'suspended'
                                    ? 'Unsuspend'
                                    : 'Approve'}
                            </DropdownMenuItem>
                        )}

                        {registration.status === 'pending' && (
                            <>
                                <DropdownMenuItem
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        setDialogType('approve');
                                    }}
                                    className="cursor-pointer"
                                >
                                    <UserCheckIcon className="mr-2 h-4 w-4" />
                                    Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        setDialogType('reject');
                                    }}
                                    className="cursor-pointer text-rose-600 focus:text-rose-600"
                                >
                                    <UserX2Icon className="mr-2 h-4 w-4" />
                                    Reject
                                </DropdownMenuItem>
                            </>
                        )}

                        {registration.status === 'active' && (
                            <DropdownMenuItem
                                onSelect={(event) => {
                                    event.preventDefault();
                                    setDialogType('suspend');
                                }}
                                className="cursor-pointer text-rose-600 focus:text-rose-600"
                            >
                                <ShieldBanIcon className="mr-2 h-4 w-4" />
                                Suspend
                            </DropdownMenuItem>
                        )}

                        {['suspended', 'rejected'].includes(
                            registration.status,
                        ) && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        setDialogType('note');
                                    }}
                                    className="cursor-pointer"
                                >
                                    <NotebookPenIcon className="mr-2 h-4 w-4" />
                                    Edit Note
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <AlertDialog
                open={dialogType !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDialog();
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {currentDialog?.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {currentDialog?.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {currentDialog?.showNote && (
                        <Textarea
                            cols={5}
                            placeholder="Write a note for the agent"
                            value={form.data.note}
                            onChange={(event) =>
                                form.setData('note', event.target.value)
                            }
                            className="w-full"
                        />
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={closeDialog}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(event) => {
                                event.preventDefault();
                                currentDialog?.action();
                            }}
                        >
                            {currentDialog?.actionLabel}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export default function Page({ data, agentTiers }: PageProps) {
    const { company } = usePageSharedDataProps();
    const [sorting, setSorting] = React.useState<SortingState>([
        { id: 'applied_at', desc: true },
    ]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [activeStatus, setActiveStatus] =
        React.useState<(typeof STATUS_TABS)[number]['value']>('all');

    const filteredData = React.useMemo(() => {
        if (activeStatus === 'all') {
            return data.data;
        }

        return data.data.filter(
            (registration) => registration.status === activeStatus,
        );
    }, [activeStatus, data.data]);

    const globalFilterFn = React.useCallback(
        (row: any, _columnId: string, filterValue: string) => {
            const search = filterValue.toLowerCase();
            const registration = row.original as RegistrationRow;
            const tierName =
                agentTiers.find(
                    (tier) => tier.id === registration.agent_tier_id,
                )?.name ?? '';

            return [
                registration.agent.name,
                registration.agent.email ?? '',
                registration.status,
                registration.note ?? '',
                registration.payment_mode ?? '',
                tierName,
            ].some((value) => value.toLowerCase().includes(search));
        },
        [agentTiers],
    );

    const columns = React.useMemo<ColumnDef<RegistrationRow>[]>(
        () => [
            {
                id: 'actions',
                header: () => (
                    <div className="px-2 text-center text-[11px] font-bold tracking-wider text-primary">
                        Actions
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
                cell: ({ row }) => (
                    <RegistrationActions registration={row.original} />
                ),
            },
            {
                id: 'agent',
                accessorFn: (row) => row.agent.name,
                header: ({ column }) => (
                    <SortableHeader column={column} title="Agent" />
                ),
                cell: ({ row }) => {
                    const agent = row.original.agent;

                    return (
                        <div className="flex min-w-[240px] items-center gap-3">
                            <Avatar className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-700">
                                <AvatarImage
                                    src={agent.photo_url || DEFAULT_PHOTO}
                                    alt={agent.name}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-slate-100 dark:bg-slate-800">
                                    <UserIcon className="h-4 w-4 text-slate-400" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                                    {agent.name}
                                </p>
                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                    {agent.email || '-'}
                                </p>
                            </div>
                        </div>
                    );
                },
            },
            {
                id: 'status',
                accessorKey: 'status',
                header: ({ column }) => (
                    <SortableHeader column={column} title="Status" />
                ),
                cell: ({ row }) => (
                    <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${statusBadgeClass(row.original.status)}`}
                    >
                        {row.original.status}
                    </span>
                ),
            },
            {
                id: 'agent_tier_id',
                accessorFn: (row) =>
                    agentTiers.find((tier) => tier.id === row.agent_tier_id)
                        ?.name ?? 'No Tier',
                header: ({ column }) => (
                    <SortableHeader column={column} title="Agent Tier" />
                ),
                cell: ({ row }) => {
                    const registration = row.original;

                    const handleUpdate = (value: string) => {
                        router.put(
                            update({
                                company: company.username,
                                agent_registration: registration.id,
                            }).url,
                            {
                                agent_tier_id:
                                    value === 'none' ? null : Number(value),
                            },
                            { preserveScroll: true, preserveState: true },
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
                            <SelectTrigger className="h-9 w-[160px] rounded-lg border-slate-200 bg-white text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
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
                id: 'payment_mode',
                accessorFn: (row) => row.payment_mode || 'vendor',
                header: ({ column }) => (
                    <SortableHeader column={column} title="Payment Mode" />
                ),
                cell: ({ row }) => {
                    const registration = row.original;

                    const handleUpdate = (value: string) => {
                        router.put(
                            update({
                                company: company.username,
                                agent_registration: registration.id,
                            }).url,
                            { payment_mode: value },
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
                            <SelectTrigger className="h-9 w-[126px] rounded-lg border-slate-200 bg-white text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="vendor">Vendor</SelectItem>
                                <SelectItem value="agent">Agent</SelectItem>
                            </SelectContent>
                        </Select>
                    );
                },
            },
            {
                id: 'manual_payment_enabled',
                accessorFn: (row) => row.manual_payment_enabled ?? true,
                header: ({ column }) => (
                    <SortableHeader
                        column={column}
                        title="Manual Payment"
                        className="justify-start"
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
                            { preserveScroll: true, preserveState: true },
                        );
                    };

                    return (
                        <div className="flex min-w-[140px] items-center gap-3">
                            <Switch
                                checked={
                                    registration.manual_payment_enabled ?? true
                                }
                                onCheckedChange={handleUpdate}
                            />
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {(registration.manual_payment_enabled ?? true)
                                    ? 'Enabled'
                                    : 'Disabled'}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'online_payment_enabled',
                accessorFn: (row) => row.online_payment_enabled ?? true,
                header: ({ column }) => (
                    <SortableHeader
                        column={column}
                        title="Online Payment"
                        className="justify-start"
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
                            { preserveScroll: true, preserveState: true },
                        );
                    };

                    return (
                        <div className="flex min-w-[140px] items-center gap-3">
                            <Switch
                                checked={
                                    registration.online_payment_enabled ?? true
                                }
                                onCheckedChange={handleUpdate}
                            />
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {(registration.online_payment_enabled ?? true)
                                    ? 'Enabled'
                                    : 'Disabled'}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'note',
                accessorKey: 'note',
                header: ({ column }) => (
                    <SortableHeader column={column} title="Note" />
                ),
                cell: ({ row }) => (
                    <div
                        className="max-w-[220px] truncate text-sm text-slate-500 dark:text-slate-400"
                        title={row.original.note || '-'}
                    >
                        {row.original.note || '-'}
                    </div>
                ),
            },
            {
                id: 'applied_at',
                accessorKey: 'applied_at',
                header: ({ column }) => (
                    <SortableHeader column={column} title="Applied At" />
                ),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-sm font-medium text-slate-500 dark:text-slate-300">
                        {row.original.applied_at
                            ? dayjs(row.original.applied_at).format(
                                  'DD MMM YYYY',
                              )
                            : '-'}
                    </span>
                ),
            },
            {
                id: 'accepted_at',
                accessorKey: 'accepted_at',
                header: ({ column }) => (
                    <SortableHeader column={column} title="Accepted At" />
                ),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-sm font-medium text-slate-500 dark:text-slate-300">
                        {row.original.accepted_at
                            ? dayjs(row.original.accepted_at).format(
                                  'DD MMM YYYY',
                              )
                            : '-'}
                    </span>
                ),
            },
        ],
        [agentTiers, company.username],
    );

    const table = useReactTable({
        data: filteredData,
        columns,
        getRowId: (row) => row.id.toString(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        globalFilterFn,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
            rowSelection,
        },
    });

    const tableRows = table.getRowModel().rows;

    return (
        <CompanyDashboardLayout
            containerClassName="w-full flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950"
            breadcrumb={[
                { title: 'Settings' },
                { title: 'Agent Registrations' },
            ]}
            openMenuIds={[]}
            activeMenuIds={['agent-registrations']}
        >
            <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 p-4 pb-20 md:p-8">
                <div className="order-first flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-card/95 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 sm:flex-row sm:items-center sm:justify-between">
                    <div className="w-full min-w-0 sm:max-w-md">
                        <div className="relative">
                            <span className="pointer-events-none absolute left-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 dark:bg-primary/15">
                                <Search className="size-3.5" />
                            </span>
                            <Input
                                placeholder="Search agent, email, note, payment mode, or tier"
                                value={globalFilter}
                                onChange={(event) =>
                                    setGlobalFilter(event.target.value)
                                }
                                className="h-9 w-full rounded-lg border-slate-200 bg-background pl-9 pr-9 text-xs font-medium shadow-inner shadow-slate-100/70 transition-all placeholder:text-[13px] placeholder:font-normal placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:shadow-black/20 dark:placeholder:text-slate-500"
                            />
                            {globalFilter.trim() !== '' && (
                                <button
                                    type="button"
                                    aria-label="Clear search"
                                    onClick={() => setGlobalFilter('')}
                                    className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <XIcon className="size-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        <div className="flex flex-wrap gap-1.5">
                            {STATUS_TABS.map((tab) => {
                                const isActive = activeStatus === tab.value;

                                return (
                                    <button
                                        key={tab.value}
                                        type="button"
                                        onClick={() =>
                                            setActiveStatus(tab.value)
                                        }
                                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-all ${
                                            isActive
                                                ? 'border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20'
                                                : 'border-slate-200 bg-white text-muted-foreground hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="ml-auto h-9 w-full border-slate-200 bg-white text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900 sm:w-auto"
                                >
                                    View Columns{' '}
                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-[220px] rounded-xl"
                            >
                                <DropdownMenuGroup>
                                    {table
                                        .getAllColumns()
                                        .filter((column) => column.getCanHide())
                                        .map((column) => (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="cursor-pointer capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(
                                                        !!value,
                                                    )
                                                }
                                            >
                                                {column.id.replace(/_/g, ' ')}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-none">
                    <div className="relative max-h-[68vh] w-full overflow-auto [scrollbar-gutter:stable]">
                        <Table
                            unwrapped
                            className="w-full border-separate border-spacing-0 text-sm"
                        >
                            <TableHeader className="sticky top-0 z-40 bg-slate-50 shadow-[0_1px_0_0_theme(colors.border)] dark:bg-slate-900/90">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow
                                        key={headerGroup.id}
                                        className="border-none bg-slate-50 hover:bg-slate-50 dark:bg-slate-900/90 dark:hover:bg-slate-900/90"
                                    >
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                className={`h-12 whitespace-nowrap bg-slate-50 px-3 font-bold text-primary dark:bg-slate-900/90 ${
                                                    header.column.id ===
                                                    'actions'
                                                        ? 'sticky left-0 z-50 w-[3.75rem] min-w-[3.75rem] max-w-[3.75rem] border-r border-border/70 bg-white/95 px-0 text-center shadow-[10px_0_14px_-16px_rgba(15,23,42,0.55)] backdrop-blur dark:bg-slate-950/95'
                                                        : ''
                                                }`}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext(),
                                                      )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {tableRows.length ? (
                                    tableRows.map((row, rowIndex) => (
                                        <TableRow
                                            key={row.id}
                                            className="group border-none transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        className={`border-b border-border px-3 py-3 ${
                                                            cell.column.id ===
                                                            'actions'
                                                                ? 'sticky left-0 z-20 w-[3.75rem] min-w-[3.75rem] max-w-[3.75rem] border-r border-border/70 bg-card px-0 text-center shadow-[10px_0_14px_-16px_rgba(15,23,42,0.55)] transition-colors group-hover:bg-slate-50 dark:bg-slate-950/95 dark:group-hover:bg-slate-900/50'
                                                                : ''
                                                        } ${
                                                            cell.column.id ===
                                                                'actions' &&
                                                            rowIndex ===
                                                                tableRows.length -
                                                                    1
                                                                ? 'rounded-bl-xl'
                                                                : ''
                                                        }`}
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext(),
                                                        )}
                                                    </TableCell>
                                                ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-40"
                                        >
                                            <EmptyRegistrations />
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
                    <p className="rounded-md border border-slate-100 bg-slate-50 px-3 py-1.5 text-sm text-muted-foreground dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                        <span className="font-semibold text-foreground dark:text-slate-100">
                            {table.getFilteredRowModel().rows.length}
                        </span>{' '}
                        registration(s) shown
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="border-slate-200 px-6 dark:border-slate-700"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="border-slate-200 px-6 dark:border-slate-700"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
