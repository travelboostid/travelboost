import type { UserResource } from '@/api/model';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn } from '@/lib/utils';
import { Head, router, useForm } from '@inertiajs/react';
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
    BellIcon,
    ChevronDown,
    EyeIcon,
    HistoryIcon,
    MoreHorizontal,
    Search,
    UserCircle,
    XIcon,
} from 'lucide-react';
import * as React from 'react';
import { EmptyCustomers } from './components/empty-customers';

type CustomerRow = UserResource & {
    gender?: string | null;
    status?: string | null;
    company?: {
        id: number;
        name: string;
    } | null;
};

type CustomersPageProps = {
    data: {
        data: CustomerRow[];
        total: number;
        current_page: number;
        last_page: number;
        per_page: number;
        from: number | null;
        to: number | null;
        links: { url: string | null; label: string; active: boolean }[];
    };
};

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-3 items-center gap-4 border-b border-slate-100 py-2.5 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {label}
            </span>
            <span className="col-span-2 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
                {value || '-'}
            </span>
        </div>
    );
}

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
        <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className={cn(
                '-ml-4 flex h-8 items-center font-bold text-primary',
                className,
            )}
        >
            <span>{title}</span>
            {column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
            )}
        </button>
    );
}

function CustomerActions({ customer }: { customer: CustomerRow }) {
    const { company } = usePageSharedDataProps();
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
    const notificationForm = useForm({
        title: '',
        message: '',
        channel: 'dashboard',
    });

    const historyUrl = `/companies/${company.username}/dashboard/bookings?contact_name=${encodeURIComponent(customer.name)}`;

    const sendNotification = () => {
        notificationForm.post(
            `/companies/${company.username}/dashboard/customers/${customer.id}/send-notification`,
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsNotificationOpen(false);
                    notificationForm.reset('title', 'message');
                    notificationForm.setData('channel', 'dashboard');
                },
            },
        );
    };

    return (
        <>
            <div className="flex justify-center px-1">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        className="w-52 rounded-xl"
                    >
                        <DropdownMenuItem
                            onSelect={(event) => {
                                event.preventDefault();
                                setIsProfileOpen(true);
                            }}
                            className="cursor-pointer"
                        >
                            <EyeIcon className="mr-2 h-4 w-4" />
                            View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={(event) => {
                                event.preventDefault();
                                router.get(historyUrl, {}, {
                                    preserveState: false,
                                    preserveScroll: false,
                                });
                            }}
                            className="cursor-pointer"
                        >
                            <HistoryIcon className="mr-2 h-4 w-4" />
                            History Booking
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={(event) => {
                                event.preventDefault();
                                setIsNotificationOpen(true);
                            }}
                            className="cursor-pointer"
                        >
                            <BellIcon className="mr-2 h-4 w-4" />
                            Send Notification
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle className="border-b pb-4 text-xl font-bold text-primary">
                            Customer Profile
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <DetailRow label="Full Name" value={customer.name} />
                        <DetailRow
                            label="Username"
                            value={customer.username ? `@${customer.username}` : '-'}
                        />
                        <DetailRow label="Email" value={customer.email} />
                        <DetailRow label="Phone Number" value={customer.phone} />
                        <DetailRow
                            label="Gender"
                            value={
                                <span className="capitalize">
                                    {customer.gender || '-'}
                                </span>
                            }
                        />
                        <DetailRow label="Address" value={customer.address} />
                        <DetailRow
                            label="Status"
                            value={
                                <span
                                    className={cn(
                                        'inline-flex rounded px-2 py-0.5 text-[10px] font-bold uppercase',
                                        customer.status === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-slate-100 text-slate-600',
                                    )}
                                >
                                    {customer.status || '-'}
                                </span>
                            }
                        />
                        <DetailRow
                            label="Agent"
                            value={customer.company?.name ?? 'Direct Registration'}
                        />
                        <DetailRow
                            label="Join Date"
                            value={dayjs(customer.created_at).format(
                                'D MMMM YYYY, HH:mm',
                            )}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isNotificationOpen}
                onOpenChange={setIsNotificationOpen}
            >
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>Send Notification</DialogTitle>
                        <DialogDescription>
                            Send a custom notification to {customer.name} via
                            dashboard, email, or both.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                Title
                            </label>
                            <Input
                                value={notificationForm.data.title}
                                onChange={(event) =>
                                    notificationForm.setData(
                                        'title',
                                        event.target.value,
                                    )
                                }
                                placeholder="Enter notification title"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                Delivery Channel
                            </label>
                            <Select
                                value={notificationForm.data.channel}
                                onValueChange={(value) =>
                                    notificationForm.setData('channel', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dashboard">
                                        Dashboard Only
                                    </SelectItem>
                                    <SelectItem value="email">
                                        Email Only
                                    </SelectItem>
                                    <SelectItem value="both">Both</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                Message
                            </label>
                            <Textarea
                                rows={5}
                                value={notificationForm.data.message}
                                onChange={(event) =>
                                    notificationForm.setData(
                                        'message',
                                        event.target.value,
                                    )
                                }
                                placeholder="Write your message for the customer"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() => setIsNotificationOpen(false)}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={sendNotification}
                            disabled={notificationForm.processing}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Send Notification
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function CustomersPage({ data }: CustomersPageProps) {
    const [sorting, setSorting] = React.useState<SortingState>([
        { id: 'created_at', desc: true },
    ]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [globalFilter, setGlobalFilter] = React.useState('');

    const globalFilterFn = React.useCallback(
        (row: any, _columnId: string, filterValue: string) => {
            const search = filterValue.toLowerCase();
            const customer = row.original as CustomerRow;

            return [
                customer.name,
                customer.username || '',
                customer.email || '',
                customer.phone || '',
                customer.company?.name || '',
                customer.address || '',
            ].some((value) => value.toLowerCase().includes(search));
        },
        [],
    );

    const columns = React.useMemo<ColumnDef<CustomerRow>[]>(
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
                cell: ({ row }) => <CustomerActions customer={row.original} />,
            },
            {
                id: 'name',
                accessorKey: 'name',
                header: ({ column }) => (
                    <SortableHeader
                        column={column}
                        title="Customer"
                        className="pl-3"
                    />
                ),
                cell: ({ row }) => (
                    <div className="flex min-w-[240px] items-center gap-3 pl-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <UserCircle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p
                                className="truncate font-semibold text-slate-900 dark:text-slate-100"
                                title={row.original.name}
                            >
                                {row.original.name}
                            </p>
                            <p
                                className="truncate text-xs text-slate-500 dark:text-slate-400"
                                title={row.original.username || ''}
                            >
                                @{row.original.username || '-'}
                            </p>
                        </div>
                    </div>
                ),
            },
            {
                id: 'email',
                accessorKey: 'email',
                header: ({ column }) => (
                    <SortableHeader column={column} title="Email" />
                ),
                cell: ({ row }) => (
                    <div
                        className="max-w-[220px] truncate text-sm font-medium text-slate-600 dark:text-slate-300"
                        title={row.original.email || ''}
                    >
                        {row.original.email}
                    </div>
                ),
            },
            {
                id: 'phone',
                accessorKey: 'phone',
                header: ({ column }) => (
                    <SortableHeader column={column} title="Phone" />
                ),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                        {row.original.phone || '-'}
                    </span>
                ),
            },
            {
                id: 'agent',
                accessorFn: (row) => row.company?.name || 'Direct',
                header: ({ column }) => (
                    <SortableHeader column={column} title="Agent" />
                ),
                cell: ({ row }) => (
                    <span className="inline-flex whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
                        {row.original.company?.name ?? 'Direct'}
                    </span>
                ),
            },
            {
                id: 'address',
                accessorKey: 'address',
                header: ({ column }) => (
                    <SortableHeader column={column} title="Address" />
                ),
                cell: ({ row }) => (
                    <div
                        className="max-w-[220px] truncate text-sm text-slate-500 dark:text-slate-400"
                        title={row.original.address || '-'}
                    >
                        {row.original.address || '-'}
                    </div>
                ),
            },
            {
                id: 'created_at',
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <SortableHeader column={column} title="Join Date" />
                ),
                cell: ({ row }) => (
                    <span className="whitespace-nowrap text-sm font-medium text-slate-500 dark:text-slate-300">
                        {dayjs(row.original.created_at).format('DD MMM YYYY')}
                    </span>
                ),
            },
        ],
        [],
    );

    const table = useReactTable({
        data: data.data,
        columns,
        getRowId: (row) => row.id.toString(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
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
        },
    });

    const tableRows = table.getRowModel().rows;

    return (
        <CompanyDashboardLayout
            containerClassName="w-full flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950"
            breadcrumb={[{ title: 'Customers' }]}
            activeMenuIds={['customers']}
        >
            <Head title="Customers" />

            <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 p-4 pb-20 md:p-6">
                <div className="order-first flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-card/95 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 sm:flex-row sm:items-center sm:justify-between">
                    <div className="w-full min-w-0 sm:max-w-md">
                        <div className="relative">
                            <span className="pointer-events-none absolute left-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 dark:bg-primary/15">
                                <Search className="size-3.5" />
                            </span>
                            <Input
                                placeholder="Search customer, username, email, phone, agent, or address"
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

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="ml-auto h-9 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900 sm:w-auto"
                            >
                                View Columns
                                <ChevronDown className="ml-2 inline h-4 w-4 opacity-50" />
                            </button>
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
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id.replace(/_/g, ' ')}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                                                className={cn(
                                                    'h-12 whitespace-nowrap bg-slate-50 px-3 font-bold text-primary dark:bg-slate-900/90',
                                                    header.column.id ===
                                                        'actions' &&
                                                        'sticky left-0 z-50 w-[3.75rem] min-w-[3.75rem] max-w-[3.75rem] border-r border-border/70 bg-white/95 px-0 text-center shadow-[10px_0_14px_-16px_rgba(15,23,42,0.55)] backdrop-blur dark:bg-slate-950/95',
                                                )}
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
                                                        className={cn(
                                                            'border-b border-border px-3 py-3',
                                                            cell.column.id ===
                                                                'actions' &&
                                                                'sticky left-0 z-20 w-[3.75rem] min-w-[3.75rem] max-w-[3.75rem] border-r border-border/70 bg-card px-0 text-center shadow-[10px_0_14px_-16px_rgba(15,23,42,0.55)] transition-colors group-hover:bg-slate-50 dark:bg-slate-950/95 dark:group-hover:bg-slate-900/50',
                                                            cell.column.id ===
                                                                'actions' &&
                                                                rowIndex ===
                                                                    tableRows.length -
                                                                        1 &&
                                                                'rounded-bl-xl',
                                                        )}
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
                                            <EmptyCustomers />
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
                            {data.from ?? 0}
                        </span>{' '}
                        -{' '}
                        <span className="font-semibold text-foreground dark:text-slate-100">
                            {data.to ?? 0}
                        </span>{' '}
                        of{' '}
                        <span className="font-semibold text-foreground dark:text-slate-100">
                            {data.total}
                        </span>{' '}
                        customer(s)
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {data.links.map((link, index) => (
                            <button
                                key={`${link.label}-${index}`}
                                type="button"
                                onClick={() => {
                                    if (link.url) {
                                        router.visit(link.url, {
                                            preserveScroll: true,
                                            preserveState: true,
                                        });
                                    }
                                }}
                                disabled={!link.url}
                                className={cn(
                                    'min-w-9 rounded-lg border px-3 py-2 text-sm transition-colors',
                                    link.active
                                        ? 'border-primary bg-primary text-white'
                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900',
                                    !link.url &&
                                        'cursor-not-allowed opacity-50 hover:bg-inherit',
                                )}
                            >
                                {link.label
                                    .replace('&laquo; Previous', 'Previous')
                                    .replace('Next &raquo;', 'Next')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
