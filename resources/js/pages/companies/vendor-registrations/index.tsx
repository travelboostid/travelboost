import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { DEFAULT_PHOTO } from '@/config';
import { useDataTable } from '@/hooks/use-data-table';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
    Building2,
    CalendarIcon,
    CircleDashedIcon,
    EyeIcon,
    TextIcon,
    Trash2Icon,
    UserIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { toast } from 'sonner';
import DeleteRegistrationDialog from './components/delete-registration-dialog';
import { EmptyRegistrations } from './components/empty-registrations';
import RegistrationsSummary from './components/registrations-summary';
import StatusBadge from './components/status-badge';

dayjs.extend(relativeTime);

const STATUS_OPTIONS = [
    { label: 'Pending', value: 'pending' },
    { label: 'Active', value: 'active' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Suspended', value: 'suspended' },
];

const PAYMENT_MODE_OPTIONS = [
    { label: 'Vendor collects', value: 'vendor' },
    { label: 'Agent collects', value: 'agent' },
];

const SHOW_VENDOR_NAME_OPTIONS = [
    { label: 'Shown in catalog', value: '1' },
    { label: 'Hidden in catalog', value: '0' },
];

type VendorRegistration = {
    id: number;
    status: string;
    applied_at: string | null;
    accepted_at: string | null;
    show_vendor_name: boolean;
    payment_mode: string | null;
    vendor: {
        name: string;
        username: string;
        photo_url?: string | null;
    };
};

type PageProps = {
    data: {
        data: VendorRegistration[];
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
    stats: {
        total: number;
        pending: number;
        active: number;
        rejected: number;
        suspended: number;
    };
};

function ShowVendorToggle({
    registration,
}: {
    registration: VendorRegistration;
}) {
    const { company } = usePageSharedDataProps();

    const handleToggle = (checked: boolean) => {
        router.put(
            `/companies/${company.username}/dashboard/vendor-registrations/${registration.id}`,
            { show_vendor_name: checked },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success('Preference updated');
                },
            },
        );
    };

    return (
        <div className="flex items-center gap-2">
            <Switch
                id={`show-vendor-${registration.id}`}
                checked={registration.show_vendor_name}
                onCheckedChange={handleToggle}
            />
            <span className="hidden text-xs text-muted-foreground sm:inline">
                {registration.show_vendor_name ? (
                    <FormattedMessage defaultMessage="Shown" />
                ) : (
                    <FormattedMessage defaultMessage="Hidden" />
                )}
            </span>
        </div>
    );
}

export default function Page({ data, stats }: PageProps) {
    const columns = useMemo<ColumnDef<VendorRegistration>[]>(
        () => [
            {
                id: 'vendor_name',
                accessorFn: (row) => row.vendor.name,
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Vendor" />
                ),
                cell: ({ row }) => {
                    const vendor = row.original.vendor;

                    return (
                        <div className="flex items-center gap-3 py-1">
                            <Avatar className="size-10 rounded-xl border shadow-sm">
                                <AvatarImage
                                    src={vendor.photo_url || DEFAULT_PHOTO}
                                    alt={vendor.name}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-muted text-muted-foreground">
                                    <Building2 className="size-5" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 max-w-[150px] sm:max-w-[250px] md:max-w-[300px]">
                                <p
                                    className="truncate font-semibold text-foreground"
                                    title={vendor.name}
                                >
                                    {vendor.name}
                                </p>
                                <p className="truncate text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                    @{vendor.username}
                                </p>
                            </div>
                        </div>
                    );
                },
                meta: {
                    label: 'Vendor name',
                    placeholder: 'Search vendor name...',
                    variant: 'text',
                    icon: TextIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'vendor_username',
                accessorFn: (row) => row.vendor.username,
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Username" />
                ),
                cell: ({ row }) => (
                    <span className="font-mono text-sm text-muted-foreground">
                        @{row.original.vendor.username}
                    </span>
                ),
                meta: {
                    label: 'Username',
                    placeholder: 'Search username...',
                    variant: 'text',
                    icon: UserIcon,
                },
                enableColumnFilter: true,
                enableHiding: true,
            },
            {
                id: 'status',
                accessorKey: 'status',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Status" />
                ),
                cell: ({ row }) => <StatusBadge partnership={row.original} />,
                meta: {
                    label: 'Status',
                    variant: 'multiSelect',
                    options: STATUS_OPTIONS,
                    icon: CircleDashedIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'payment_mode',
                accessorKey: 'payment_mode',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Payment" />
                ),
                cell: ({ row }) => {
                    const mode = row.original.payment_mode;

                    if (!mode) {
                        return (
                            <span className="text-sm text-muted-foreground">
                                —
                            </span>
                        );
                    }

                    return (
                        <Badge variant="secondary" className="capitalize">
                            {mode === 'vendor' ? (
                                <FormattedMessage defaultMessage="Vendor" />
                            ) : (
                                <FormattedMessage defaultMessage="Agent" />
                            )}
                        </Badge>
                    );
                },
                meta: {
                    label: 'Payment mode',
                    variant: 'multiSelect',
                    options: PAYMENT_MODE_OPTIONS,
                    icon: CircleDashedIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'show_vendor_name',
                accessorKey: 'show_vendor_name',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Catalog visibility"
                    />
                ),
                cell: ({ row }) => (
                    <ShowVendorToggle registration={row.original} />
                ),
                meta: {
                    label: 'Catalog visibility',
                    variant: 'select',
                    options: SHOW_VENDOR_NAME_OPTIONS,
                    icon: EyeIcon,
                },
                enableColumnFilter: true,
                enableSorting: false,
            },
            {
                id: 'applied_at',
                accessorKey: 'applied_at',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Applied" />
                ),
                cell: ({ cell }) => {
                    const appliedAt = cell.getValue<string | null>();

                    if (!appliedAt) {
                        return (
                            <span className="text-sm text-muted-foreground">
                                —
                            </span>
                        );
                    }

                    return (
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-foreground">
                                <CalendarIcon className="size-3.5 text-muted-foreground" />
                                {dayjs(appliedAt).format('DD MMM YYYY')}
                            </div>
                            <span className="pl-5 text-[10px] text-muted-foreground">
                                {dayjs(appliedAt).fromNow()}
                            </span>
                        </div>
                    );
                },
                meta: {
                    label: 'Applied date',
                    variant: 'dateRange',
                    icon: CalendarIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'actions',
                cell: ({ row }) => {
                    const isActive = row.original.status === 'active';

                    return (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    {isActive ? (
                                        <div className="inline-block cursor-not-allowed">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled
                                                className="opacity-40"
                                            >
                                                <Trash2Icon className="size-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <DeleteRegistrationDialog
                                            registration={row.original}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2Icon className="size-4" />
                                            </Button>
                                        </DeleteRegistrationDialog>
                                    )}
                                </TooltipTrigger>
                                <TooltipContent>
                                    {isActive ? (
                                        <FormattedMessage defaultMessage="Managed by vendor" />
                                    ) : (
                                        <FormattedMessage defaultMessage="Cancel registration" />
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                },
                size: 48,
            },
        ],
        [],
    );

    const { table } = useDataTable({
        queryKeys: { perPage: 'per_page', page: 'page' },
        data: data.data,
        columns,
        pageCount: data.last_page,
        rowCount: data.total,
        shallow: false,
        initialState: {
            sorting: [{ id: 'applied_at', desc: true }],
            columnPinning: { right: ['actions'] },
            columnVisibility: {
                vendor_username: false,
            },
        },
        getRowId: (row) => row.id.toString(),
    });

    return (
        <CompanyDashboardLayout
            breadcrumb={[
                { title: 'Settings' },
                { title: 'Vendor registrations' },
            ]}
            openMenuIds={['settings']}
            activeMenuIds={['settings.vendor-registrations']}
        >
            <Head title="Vendor registrations" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                <header>
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Building2 className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                <FormattedMessage defaultMessage="Vendor registrations" />
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                <FormattedMessage defaultMessage="Track partnership requests and control whether vendor names appear in your catalog." />
                            </p>
                        </div>
                    </div>
                </header>

                <RegistrationsSummary {...stats} />

                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <DataTable
                        table={table}
                        className="gap-0"
                        tableContainerClassName="rounded-none border-0"
                        paginationClassName="border-t px-4 py-3"
                        renderEmptyState={<EmptyRegistrations />}
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
