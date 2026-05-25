import { useGetTourCategories } from '@/api/tour-category/tour-category';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { extractImageSrc } from '@/lib/utils';
import { router, usePage } from '@inertiajs/react';
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
import relativeTime from 'dayjs/plugin/relativeTime';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronDown,
    EyeIcon,
    FileTextIcon,
    HistoryIcon,
    MapPinIcon,
    MoreVertical,
    Search,
    TrashIcon,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

dayjs.extend(relativeTime);

const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);

    return result;
};

const toDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const getBookingDeadlineDays = (tour: any): number =>
    Number(
        tour?.company?.company_setting?.booking_deadline ??
            tour?.company?.companySetting?.booking_deadline ??
            0,
    );

const isActiveAvailability = (
    availability: any,
    bookingDeadlineDays = 0,
): boolean => {
    const departureDate = availability?.schedule?.departure_date;
    if (!departureDate) return false;

    const cutoffDate = toDateString(addDays(new Date(), bookingDeadlineDays));

    return departureDate >= cutoffDate;
};

function RowActions({ row }: { row: any }) {
    const agentTour = row.original;
    const tour = agentTour.tour;
    const { company } = usePageSharedDataProps();
    const { errors } = usePage().props;
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

    const handleDelete = () => {
        router.delete(
            `/companies/${company.username}/dashboard/agent-tours/${agentTour.id}`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (!(errors as any).delete_error) {
                        toast.success('Tour removed from catalog successfully');
                        setIsDeleteDialogOpen(false);
                    }
                },
                onError: (err: any) => {
                    if (err.delete_error) {
                        toast.error(err.delete_error);
                    }
                },
            },
        );
    };

    const imageSrc = tour?.image
        ? extractImageSrc(tour.image as any).src
        : 'https://placehold.co/800x400/e2e8f0/94a3b8?text=No+Image';

    return (
        <div className="flex items-center justify-end">
            <Dialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-48 shadow-lg rounded-xl"
                    >
                        <DialogTrigger asChild>
                            <DropdownMenuItem className="cursor-pointer">
                                <EyeIcon className="mr-2 h-4 w-4" /> View
                                Details
                            </DropdownMenuItem>
                        </DialogTrigger>
                        <DropdownMenuItem className="cursor-pointer">
                            <HistoryIcon className="mr-2 h-4 w-4" /> Booking
                            History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => setIsDeleteDialogOpen(true)}
                        >
                            <TrashIcon className="mr-2 h-4 w-4" /> Remove Tour
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DialogContent className="max-w-3xl p-0 overflow-hidden border-none shadow-2xl bg-slate-50 rounded-2xl">
                    <div className="relative h-64 w-full">
                        <img
                            src={imageSrc}
                            alt={tour?.name || 'Tour Image'}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-primary hover:bg-primary text-white border-none">
                                    {agentTour.category?.name ||
                                        tour?.category?.name ||
                                        'Uncategorized'}
                                </Badge>
                                <Badge
                                    variant={
                                        tour?.status === 'active'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className={
                                        tour?.status === 'active'
                                            ? 'bg-green-500 hover:bg-green-600 border-none'
                                            : ''
                                    }
                                >
                                    {tour?.status?.toUpperCase()}
                                </Badge>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-1">
                                {tour?.name}
                            </h2>
                            <div className="flex items-center text-slate-300 text-sm">
                                <MapPinIcon className="h-4 w-4 mr-1" />
                                {tour?.destination || 'Multiple Destinations'}
                            </div>
                        </div>
                    </div>
                    <div className="p-6 md:p-8 space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">
                                Tour Description
                            </h3>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
                                {tour?.description ||
                                    'No description available for this tour.'}
                            </p>
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-500">
                                    Duration
                                </span>
                                <span className="text-lg font-semibold text-slate-900">
                                    {tour?.duration_days || '-'} Days
                                </span>
                            </div>
                            <Button
                                asChild
                                size="lg"
                                className="rounded-full px-8 shadow-md"
                            >
                                <a
                                    href={`/companies/${company.username}/dashboard/vendors/${tour?.company?.username}/tours/${tour?.id}/brochure`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <FileTextIcon className="mr-2 h-4 w-4" />{' '}
                                    View PDF Brochure
                                </a>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will remove the tour from your catalog.
                            It cannot be undone.
                            {(errors as any).delete_error && (
                                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                                    {(errors as any).delete_error}
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function CategoryCell({ row }: { row: any }) {
    const { company } = usePageSharedDataProps();
    const { data, isLoading } = useGetTourCategories({
        company_id: company.id,
    });
    const agentTour = row.original;

    const [value, setValue] = React.useState(
        agentTour.category_id?.toString() || 'none',
    );

    React.useEffect(() => {
        setValue(agentTour.category_id?.toString() || 'none');
    }, [agentTour.category_id]);

    const handleChange = (val: string) => {
        setValue(val);
        router.put(
            `/companies/${company.username}/dashboard/agent-tours/${agentTour.id}`,
            { category_id: val === 'none' ? null : Number(val) },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => toast.success('Category updated successfully'),
            },
        );
    };

    return (
        <div onClick={(e) => e.stopPropagation()}>
            <Select
                value={value}
                onValueChange={handleChange}
                disabled={isLoading}
            >
                <SelectTrigger className="w-[140px] h-9 text-xs border-slate-200 bg-white rounded-lg shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                    <SelectItem value="none">No Category</SelectItem>
                    {data?.data.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function StatusCell({ row }: { row: any }) {
    const { company } = usePageSharedDataProps();
    const agentTour = row.original;
    const vendorStatus = agentTour.tour?.status; // Mengambil status asli dari Vendor

    const [value, setValue] = React.useState(agentTour.status || 'inactive');

    React.useEffect(() => {
        setValue(agentTour.status || 'inactive');
    }, [agentTour.status]);

    const handleChange = (val: string) => {
        setValue(val);
        router.put(
            `/companies/${company.username}/dashboard/agent-tours/${agentTour.id}`,
            { status: val },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => toast.success('Status updated successfully'),
            },
        );
    };

    const isActive = value.toLowerCase() === 'active';

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col gap-1.5"
        >
            {/* 👇 TAMBAHKAN PROPERTI disabled DI SINI 👇 */}
            <Select
                value={value}
                onValueChange={handleChange}
                disabled={vendorStatus === 'inactive'}
            >
                <SelectTrigger
                    className={`w-[120px] h-9 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm ${
                        isActive
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                            : 'bg-slate-50 text-slate-500 border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    } ${vendorStatus === 'inactive' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                    <SelectItem value="active">ACTIVE</SelectItem>
                    <SelectItem value="inactive">INACTIVE</SelectItem>
                </SelectContent>
            </Select>

            {vendorStatus === 'inactive' && (
                <span className="text-[10px] font-semibold text-red-500 leading-tight">
                    Inactive by Vendor
                    <br />
                    (Locked)
                </span>
            )}
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
        <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className={`-ml-4 h-8 hover:bg-transparent text-primary font-bold data-[state=open]:bg-transparent ${className ?? ''}`}
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

const getStickyActionColumnClassName = (columnId: string) =>
    columnId === 'actions'
        ? 'sticky right-0 z-20 w-16 bg-white/95 shadow-[-12px_0_18px_-18px_rgba(15,23,42,0.7)] backdrop-blur dark:bg-slate-950/95 dark:shadow-[-12px_0_18px_-18px_rgba(0,0,0,0.9)]'
        : '';

export const columns: ColumnDef<any>[] = [
    // {
    //   id: 'select',
    //   header: ({ table }) => (
    //     <div className="px-2 flex items-center justify-center">
    //       <Checkbox
    //         checked={
    //           table.getIsAllPageRowsSelected() ||
    //           (table.getIsSomePageRowsSelected() && 'indeterminate')
    //         }
    //         onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    //         aria-label="Select all"
    //         className="border-slate-300 rounded data-[state=checked]:bg-primary"
    //       />
    //     </div>
    //   ),
    //   cell: ({ row }) => (
    //     <div className="px-2 flex items-center justify-center">
    //       <Checkbox
    //         checked={row.getIsSelected()}
    //         onCheckedChange={(value) => row.toggleSelected(!!value)}
    //         aria-label="Select row"
    //         className="border-slate-300 rounded data-[state=checked]:bg-primary"
    //       />
    //     </div>
    //   ),
    //   enableSorting: false,
    //   enableHiding: false,
    // },
    {
        id: 'tour_details',
        accessorFn: (row) => row.tour?.name,
        header: ({ column }) => (
            <SortableHeader column={column} title="Tour Details" />
        ),
        cell: ({ row }) => (
            <div className="flex flex-col gap-1.5 max-w-[250px] xl:max-w-[350px]">
                <span
                    className="font-semibold text-slate-900 truncate dark:text-slate-100"
                    title={row.original.tour?.name}
                >
                    {row.original.tour?.name || '-'}
                </span>
                <span className="uppercase font-mono text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md w-fit border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {row.original.tour?.code || '-'}
                </span>
            </div>
        ),
    },
    {
        id: 'vendor',
        accessorFn: (row) => row.tour?.company?.name,
        header: ({ column }) => (
            <SortableHeader column={column} title="Vendor" />
        ),
        cell: ({ getValue }) => (
            <div
                className="font-medium text-slate-700 truncate max-w-[150px] dark:text-slate-200"
                title={getValue<string>()}
            >
                {getValue<string>() || '-'}
            </div>
        ),
    },
    {
        id: 'destination',
        accessorFn: (row) => row.tour?.destination,
        header: ({ column }) => (
            <SortableHeader column={column} title="Destination" />
        ),
        cell: ({ getValue }) => (
            <div
                className="max-w-[150px] xl:max-w-[200px] truncate text-slate-600 font-medium dark:text-slate-300"
                title={getValue<string>()}
            >
                {getValue<string>() || '-'}
            </div>
        ),
    },
    {
        id: 'image',
        header: 'Cover Image',
        cell: ({ row }) => {
            const image = row.original.tour?.image;
            const src = image
                ? extractImageSrc(image as any).src
                : 'https://placehold.co/400x300/f8fafc/94a3b8?text=No+Image';

            return (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm w-20 h-12 flex items-center justify-center shrink-0">
                    <img
                        src={src}
                        alt="Tour"
                        className="w-full h-full object-cover"
                    />
                </div>
            );
        },
        enableSorting: false,
    },
    {
        id: 'category',
        accessorFn: (row) => row.category?.name || row.tour?.category?.name,
        header: ({ column }) => (
            <SortableHeader column={column} title="Category" />
        ),
        cell: ({ row }) => <CategoryCell row={row} />,
    },
    {
        id: 'seats',
        accessorFn: (row: any) =>
            row.tour?.availabilities
                ?.filter((item: any) =>
                    isActiveAvailability(
                        item,
                        getBookingDeadlineDays(row.tour),
                    ),
                )
                .reduce(
                    (sum: number, item: any) =>
                        sum + (Number(item.available) || 0),
                    0,
                ) || 0,
        header: ({ column }) => (
            <SortableHeader
                column={column}
                title={
                    <span className="inline-block text-left leading-tight">
                        Total
                        <br />
                        Seats
                    </span>
                }
                className="w-[92px] justify-start"
            />
        ),
        cell: ({ getValue }) => {
            const seats = getValue<number>();
            return (
                <div className="flex min-w-[72px] items-center gap-1.5">
                    <span
                        className={`h-2 w-2 rounded-full ${seats > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}
                    />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {seats}
                    </span>
                </div>
            );
        },
    },
    {
        id: 'status',
        accessorFn: (row) => row.status,
        header: ({ column }) => (
            <SortableHeader column={column} title="Status" />
        ),
        cell: ({ row }) => <StatusCell row={row} />,
    },
    {
        id: 'added_at',
        accessorFn: (row) => row.created_at,
        header: ({ column }) => (
            <SortableHeader column={column} title="Added At" />
        ),
        cell: ({ getValue }) => (
            <div className="text-sm font-medium text-slate-500 dark:text-slate-300">
                {dayjs(getValue<string>()).format('DD MMM YYYY')}
            </div>
        ),
    },
    {
        id: 'actions',
        header: '',
        cell: ({ row }) => <RowActions row={row} />,
        enableHiding: false,
        enableSorting: false,
    },
];

type PageProps = {
    data: any;
};

export default function Page({ data }: PageProps) {
    const [sorting, setSorting] = React.useState<SortingState>([
        { id: 'added_at', desc: true },
    ]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({ image: false });
    const [rowSelection, setRowSelection] = React.useState({});
    const [activeTab, setActiveTab] = React.useState('active');
    const [globalFilter, setGlobalFilter] = React.useState('');

    const filteredData = React.useMemo(() => {
        let result = data;
        if (activeTab !== 'all') {
            result = result.filter(
                (agentTour: any) =>
                    (agentTour.status || 'inactive').toLowerCase() ===
                    activeTab,
            );
        }
        return result;
    }, [data, activeTab]);

    const globalFilterFn = (
        row: any,
        columnId: string,
        filterValue: string,
    ) => {
        const search = filterValue.toLowerCase();
        const tourName = (row.original.tour?.name || '').toLowerCase();
        const vendorName = (
            row.original.tour?.company?.name || ''
        ).toLowerCase();
        const agentCategory = (row.original.category?.name || '').toLowerCase();
        const vendorCategory = (
            row.original.tour?.category?.name || ''
        ).toLowerCase();

        return (
            tourName.includes(search) ||
            vendorName.includes(search) ||
            agentCategory.includes(search) ||
            vendorCategory.includes(search)
        );
    };

    const table = useReactTable({
        data: filteredData,
        columns,
        getRowId: (row) => row.id.toString(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
    });

    return (
        <CompanyDashboardLayout
            openMenuIds={['tours']}
            activeMenuIds={['agent-tours.index']}
            breadcrumb={[{ title: 'Products' }]}
            containerClassName="w-full flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950"
        >
            <div className="w-full space-y-6 p-4 md:p-8 max-w-[1600px] mx-auto pb-20">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                    <div className="relative w-full sm:w-[700px] border border-slate-200 rounded-xl shadow-sm dark:border-slate-800">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search tour, vendor, or category..."
                            value={globalFilter ?? ''}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="pl-11 h-11 w-full bg-slate-50 border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl transition-all shadow-inner dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:bg-slate-900"
                        />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full lg:w-auto"
                    >
                        <TabsList className="grid grid-cols-3 w-full lg:w-[350px] bg-slate-100/80 p-1 rounded-xl dark:bg-slate-950/70">
                            <TabsTrigger
                                value="all"
                                className="rounded-lg data-[state=active]:shadow-sm"
                            >
                                All Catalog
                            </TabsTrigger>
                            <TabsTrigger
                                value="active"
                                className="rounded-lg data-[state=active]:shadow-sm data-[state=active]:text-emerald-600"
                            >
                                Active
                            </TabsTrigger>
                            <TabsTrigger
                                value="inactive"
                                className="rounded-lg data-[state=active]:shadow-sm data-[state=active]:text-slate-600"
                            >
                                Inactive
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-11 px-6 rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm w-full sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                                >
                                    Columns{' '}
                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-[200px] rounded-xl shadow-xl"
                            >
                                <DropdownMenuGroup>
                                    {table
                                        .getAllColumns()
                                        .filter((column) => column.getCanHide())
                                        .map((column) => (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize cursor-pointer py-2"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(
                                                        !!value,
                                                    )
                                                }
                                            >
                                                {column.id.replace('_', ' ')}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm w-full overflow-hidden dark:border-slate-800 dark:bg-slate-950">
                    <div className="w-full overflow-x-auto">
                        <Table className="w-full text-sm">
                            <TableHeader className="bg-slate-50/80 border-b border-slate-200 dark:border-slate-800 dark:bg-slate-900/80">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow
                                        key={headerGroup.id}
                                        className="border-none hover:bg-transparent"
                                    >
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                className={`text-slate-600 font-bold h-14 px-2 sm:px-4 dark:text-slate-300 ${getStickyActionColumnClassName(header.column.id)}`}
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
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={
                                                row.getIsSelected() &&
                                                'selected'
                                            }
                                            className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-none dark:border-slate-800 dark:hover:bg-slate-900/70"
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        className={`py-4 px-4 ${getStickyActionColumnClassName(cell.column.id)}`}
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
                                            className="h-[400px] text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                                                <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 dark:bg-slate-900">
                                                    <Search className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                                                </div>
                                                <p className="text-lg font-medium text-slate-900 mb-1 dark:text-slate-100">
                                                    No tours found
                                                </p>
                                                <p className="text-sm">
                                                    Try adjusting your search or
                                                    filter to find what you're
                                                    looking for.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 px-2">
                    <p className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                        <span className="text-slate-900 dark:text-slate-100">
                            {table.getFilteredSelectedRowModel().rows.length}
                        </span>{' '}
                        of{' '}
                        <span className="text-slate-900 dark:text-slate-100">
                            {table.getFilteredRowModel().rows.length}
                        </span>{' '}
                        row(s) selected.
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm px-6 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm px-6 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
