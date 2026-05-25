import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Building2, CalendarIcon, TextIcon, Trash2Icon } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';
import DeleteRegistrationDialog from './components/delete-registration-dialog';
import { EmptyRegistrations } from './components/empty-registrations';
import StatusBadge from './components/status-badge';

dayjs.extend(relativeTime);

type PageProps = {
    data: {
        data: any[];
    };
};

function ShowVendorToggle({ registration }: { registration: any }) {
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
        <div className="flex items-center space-x-2">
            <Switch
                id={`show-vendor-${registration.id}`}
                checked={registration.show_vendor_name}
                onCheckedChange={handleToggle}
            />
        </div>
    );
}

export default function Page({ data }: PageProps) {
    const { company } = usePageSharedDataProps();

    const columns = useMemo<ColumnDef<any>[]>(
        () => [
            {
                id: 'vendor.name',
                accessorKey: 'vendor.name',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Vendor Partner"
                    />
                ),
                cell: ({ row }) => {
                    const vendor = row.original.vendor;
                    return (
                        <div className="flex gap-3 items-center py-1">
                            <Avatar className="h-10 w-10 rounded-xl shadow-sm border border-slate-100">
                                <AvatarImage
                                    src={vendor.photo_url || DEFAULT_PHOTO}
                                    alt={vendor.name}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-slate-50 text-slate-400">
                                    <Building2 size={20} />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col max-w-[150px] sm:max-w-[250px] md:max-w-[300px]">
                                <span
                                    className="font-bold text-slate-800 truncate"
                                    title={vendor.name}
                                >
                                    {vendor.name}
                                </span>
                                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider truncate">
                                    @{vendor.username}
                                </span>
                            </div>
                        </div>
                    );
                },
                meta: {
                    label: 'Name',
                    placeholder: 'Search names...',
                    variant: 'text',
                    icon: TextIcon,
                },
                enableColumnFilter: true,
            },
            {
                id: 'show_vendor_name',
                header: 'Show Vendor Name',
                cell: ({ row }) => (
                    <ShowVendorToggle registration={row.original} />
                ),
                enableSorting: false,
            },
            {
                id: 'status',
                accessorKey: 'status',
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} label="Status" />
                ),
                cell: ({ row }) => <StatusBadge partnership={row.original} />,
                enableColumnFilter: true,
            },
            {
                id: 'applied_at',
                accessorKey: 'applied_at',
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        label="Applied Date"
                    />
                ),
                cell: ({ cell }) => {
                    const appliedAt = cell.getValue<string>();
                    if (!appliedAt)
                        return <span className="text-slate-400">-</span>;
                    return (
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 whitespace-nowrap">
                                <CalendarIcon
                                    size={14}
                                    className="text-slate-400"
                                />
                                {dayjs(appliedAt).format('DD MMM YYYY')}
                            </div>
                            <span className="text-[10px] text-slate-500 ml-5">
                                {dayjs(appliedAt).fromNow()}
                            </span>
                        </div>
                    );
                },
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
                                                className="opacity-40 text-slate-400"
                                            >
                                                <Trash2Icon size={18} />
                                            </Button>
                                        </div>
                                    ) : (
                                        <DeleteRegistrationDialog
                                            registration={row.original}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2Icon size={18} />
                                            </Button>
                                        </DeleteRegistrationDialog>
                                    )}
                                </TooltipTrigger>
                                <TooltipContent>
                                    {isActive
                                        ? 'Managed by Vendor'
                                        : 'Cancel Registration'}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                },
                size: 48,
            },
        ],
        [company],
    );

    const { table } = useDataTable({
        queryKeys: { perPage: 'per_page', page: 'page' },
        data: data.data,
        columns,
        pageCount: 1,
        shallow: false,
        initialState: {
            sorting: [{ id: 'id', desc: true }],
            columnPinning: { right: ['actions'] },
        },
        getRowId: (row) => row.id.toString(),
    });

    return (
        <CompanyDashboardLayout
            containerClassName="w-full flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50/50 min-h-screen pb-20"
            breadcrumb={[
                { title: 'Settings' },
                { title: 'Registration to Vendor' },
            ]}
            openMenuIds={['settings']}
            activeMenuIds={['settings.vendor-registrations']}
        >
            <Head title="Registration to Vendor" />
            <div className="w-full max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        Vendor Registrations
                    </h1>
                    <p className="text-sm text-slate-500">
                        Decide whether to show vendor names in your catalog.
                    </p>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden w-full">
                    <div className="w-full overflow-x-auto">
                        <DataTable
                            table={table}
                            renderEmptyState={<EmptyRegistrations />}
                        >
                            <DataTableToolbar table={table} />
                        </DataTable>
                    </div>
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
