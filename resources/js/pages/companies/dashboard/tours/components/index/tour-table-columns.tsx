import type { TourResource } from '@/api/model';
import { useGetTourCategories } from '@/api/tour-category/tour-category';
import { TourMediaImage } from '@/components/tours/tour-media-image';
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
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Link, router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    EditIcon,
    EyeIcon,
    FileTextIcon,
    HistoryIcon,
    MapPinIcon,
    MoreVertical,
    TrashIcon,
} from 'lucide-react';
import * as React from 'react';
import { FormattedMessage, useIntl, type IntlShape } from 'react-intl';
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

const isActiveAvailability = (
    availability: any,
    bookingDeadlineDays = 0,
): boolean => {
    const departureDate = availability?.schedule?.departure_date;
    if (!departureDate) return false;

    const cutoffDate = toDateString(addDays(new Date(), bookingDeadlineDays));

    return departureDate >= cutoffDate;
};

function RowActions({ tour }: { tour: TourResource }) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const { errors } = usePage().props;
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

    const handleDelete = () => {
        router.delete(
            `/companies/${company.username}/dashboard/tours/${tour.id}`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (!errors.delete_error) {
                        toast.success(
                            intl.formatMessage({
                                defaultMessage: 'Tour deleted successfully',
                            }),
                        );
                        setIsDeleteDialogOpen(false);
                    }
                },
                onError: (err) => {
                    if (err.delete_error) {
                        toast.error(err.delete_error);
                    }
                },
            },
        );
    };

    return (
        <div className="flex items-center justify-center">
            <Dialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-48 shadow-lg rounded-xl"
                    >
                        <DialogTrigger asChild>
                            <DropdownMenuItem className="cursor-pointer">
                                <EyeIcon className="mr-2 h-4 w-4" />
                                <FormattedMessage defaultMessage="View Details" />
                            </DropdownMenuItem>
                        </DialogTrigger>
                        <DropdownMenuItem className="cursor-pointer">
                            <HistoryIcon className="mr-2 h-4 w-4" />
                            <FormattedMessage defaultMessage="Booking History" />
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link
                                href={`/companies/${company.username}/dashboard/tours/${tour.id}/edit`}
                            >
                                <EditIcon className="mr-2 h-4 w-4" />
                                <FormattedMessage defaultMessage="Edit Tour" />
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => setIsDeleteDialogOpen(true)}
                        >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            <FormattedMessage defaultMessage="Delete" />
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DialogContent className="max-w-3xl p-0 overflow-hidden border-none shadow-2xl bg-slate-50 rounded-2xl">
                    <div className="relative h-64 w-full">
                        <TourMediaImage
                            media={tour.image as any}
                            fallbackSrc="https://placehold.co/800x400/e2e8f0/94a3b8?text=No+Image"
                            alt={tour.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-primary hover:bg-primary text-white border-none">
                                    {(tour as any).category?.name ||
                                        intl.formatMessage({
                                            defaultMessage: 'Uncategorized',
                                        })}
                                </Badge>
                                <Badge
                                    variant={
                                        tour.status === 'active'
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className={
                                        tour.status === 'active'
                                            ? 'bg-green-500 hover:bg-green-600 border-none'
                                            : ''
                                    }
                                >
                                    {tour.status?.toUpperCase()}
                                </Badge>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-1">
                                {tour.name}
                            </h2>
                            <div className="flex items-center text-slate-300 text-sm">
                                <MapPinIcon className="h-4 w-4 mr-1" />
                                {tour.destination ||
                                    intl.formatMessage({
                                        defaultMessage: 'Multiple Destinations',
                                    })}
                            </div>
                        </div>
                    </div>
                    <div className="p-6 md:p-8 space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">
                                <FormattedMessage defaultMessage="Tour Description" />
                            </h3>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
                                {tour.description ||
                                    intl.formatMessage({
                                        defaultMessage:
                                            'No description available for this tour.',
                                    })}
                            </p>
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-500">
                                    <FormattedMessage defaultMessage="Duration" />
                                </span>
                                <span className="text-lg font-semibold text-slate-900">
                                    <FormattedMessage
                                        defaultMessage="{days} Days"
                                        values={{
                                            days: tour.duration_days || '-',
                                        }}
                                    />
                                </span>
                            </div>
                            <Button
                                asChild
                                size="lg"
                                className="rounded-full px-8 shadow-md"
                            >
                                <a
                                    href={`/companies/${company.username}/dashboard/vendors/${company.username}/tours/${tour.id}/brochure`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <FileTextIcon className="mr-2 h-4 w-4" />
                                    <FormattedMessage defaultMessage="View PDF Brochure" />
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
                            <FormattedMessage defaultMessage="Are you absolutely sure?" />
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <FormattedMessage defaultMessage="This action cannot be undone. This will permanently delete the tour and all associated schedule data." />
                            {errors.delete_error && (
                                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                                    {errors.delete_error}
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            <FormattedMessage defaultMessage="Cancel" />
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            <FormattedMessage defaultMessage="Delete Tour" />
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function CategoryCell({ row }: { row: any }) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const { data, isLoading } = useGetTourCategories({
        company_id: company.id,
    });
    const tour = row.original;

    const [value, setValue] = React.useState(
        tour.category_id?.toString() || 'none',
    );

    React.useEffect(() => {
        setValue(tour.category_id?.toString() || 'none');
    }, [tour.category_id]);

    const handleChange = (val: string) => {
        setValue(val);
        router.put(
            `/companies/${company.username}/dashboard/tours/${tour.id}`,
            {
                quick_update: true,
                category_id: val === 'none' ? null : Number(val),
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () =>
                    toast.success(
                        intl.formatMessage({
                            defaultMessage: 'Category updated successfully',
                        }),
                    ),
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
                    <SelectValue
                        placeholder={intl.formatMessage({
                            defaultMessage: 'Select Category',
                        })}
                    />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                    <SelectItem value="none">
                        <FormattedMessage defaultMessage="No Category" />
                    </SelectItem>
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
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const tour = row.original;

    const [value, setValue] = React.useState(tour.status || 'inactive');

    React.useEffect(() => {
        setValue(tour.status || 'inactive');
    }, [tour.status]);

    const handleChange = (val: string) => {
        setValue(val);
        router.put(
            `/companies/${company.username}/dashboard/tours/${tour.id}`,
            { quick_update: true, status: val },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () =>
                    toast.success(
                        intl.formatMessage({
                            defaultMessage: 'Status updated successfully',
                        }),
                    ),
            },
        );
    };

    const isActive = value.toLowerCase() === 'active';

    return (
        <div onClick={(e) => e.stopPropagation()}>
            <Select value={value} onValueChange={handleChange}>
                <SelectTrigger
                    className={`w-[120px] h-9 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm ${
                        isActive
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                            : 'bg-slate-50 text-slate-500 border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                >
                    <SelectValue
                        placeholder={intl.formatMessage({
                            defaultMessage: 'Select Status',
                        })}
                    />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                    <SelectItem value="active">
                        {intl.formatMessage({ defaultMessage: 'ACTIVE' })}
                    </SelectItem>
                    <SelectItem value="inactive">
                        {intl.formatMessage({ defaultMessage: 'INACTIVE' })}
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}

function ProductCommissionCategoryCell({ row }: { row: any }) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const {
        props: { productCommissionCategories = [] },
    } = usePage<{
        productCommissionCategories?: {
            id: number;
            category_name: string;
        }[];
    }>();
    const tour = row.original;

    const [value, setValue] = React.useState(
        tour.product_commission_category_id?.toString() || 'none',
    );

    React.useEffect(() => {
        setValue(tour.product_commission_category_id?.toString() || 'none');
    }, [tour.product_commission_category_id]);

    const handleChange = (val: string) => {
        setValue(val);
        router.put(
            `/companies/${company.username}/dashboard/tours/${tour.id}`,
            {
                quick_update: true,
                product_commission_category_id:
                    val === 'none' ? null : Number(val),
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () =>
                    toast.success(
                        intl.formatMessage({
                            defaultMessage:
                                'Product commission category updated successfully',
                        }),
                    ),
            },
        );
    };

    return (
        <div onClick={(e) => e.stopPropagation()}>
            <Select value={value} onValueChange={handleChange}>
                <SelectTrigger className="w-[170px] h-9 text-xs border-slate-200 bg-white rounded-lg shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    <SelectValue
                        placeholder={intl.formatMessage({
                            defaultMessage: 'Select PCC',
                        })}
                    />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                    <SelectItem value="none">
                        <FormattedMessage defaultMessage="No PCC" />
                    </SelectItem>
                    {productCommissionCategories.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                            {item.category_name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
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

export const getStickyActionColumnClassName = (columnId: string) =>
    columnId === 'actions'
        ? 'sticky left-0 z-20 w-[3.25rem] min-w-[3.25rem] max-w-[3.25rem] border-r border-border/70 bg-white/95 px-0 text-center shadow-[10px_0_14px_-16px_rgba(15,23,42,0.55)] backdrop-blur dark:bg-slate-950/95'
        : '';

export function getColumns(intl: IntlShape): ColumnDef<TourResource>[] {
    return [
        {
            id: 'actions',
            header: () => (
                <div className="px-1 text-center text-[11px] font-bold tracking-wider text-primary">
                    <FormattedMessage defaultMessage="Actions" />
                </div>
            ),
            cell: ({ row }) => <RowActions tour={row.original} />,
            enableHiding: false,
            enableSorting: false,
        },
        {
            id: 'name',
            accessorFn: (row) => row.name,
            header: ({ column }) => (
                <SortableHeader
                    column={column}
                    title={<FormattedMessage defaultMessage="Tour Details" />}
                />
            ),
            cell: ({ row }) => (
                <div className="flex flex-col gap-1.5 max-w-[250px] xl:max-w-[350px]">
                    <span
                        className="font-semibold text-slate-900 truncate dark:text-slate-100"
                        title={row.original.name}
                    >
                        {row.original.name}
                    </span>
                    <span className="uppercase font-mono text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md w-fit border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {row.original.code || '-'}
                    </span>
                </div>
            ),
        },
        {
            id: 'destination',
            accessorFn: (row) => row.destination,
            header: ({ column }) => (
                <SortableHeader
                    column={column}
                    title={<FormattedMessage defaultMessage="Destination" />}
                />
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
            header: () => <FormattedMessage defaultMessage="Cover Image" />,
            cell: ({ row }) => (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm w-20 h-12 flex items-center justify-center shrink-0">
                    <TourMediaImage
                        media={row.original.image as any}
                        fallbackSrc="https://placehold.co/400x300/f8fafc/94a3b8?text=No+Image"
                        alt={intl.formatMessage({ defaultMessage: 'Tour' })}
                        className="w-full h-full object-cover"
                    />
                </div>
            ),
            enableSorting: false,
        },
        {
            id: 'seats',
            accessorFn: (row: any) =>
                row.availabilities
                    ?.filter((item: any) =>
                        isActiveAvailability(
                            item,
                            Number(row.booking_deadline_days || 0),
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
                            <FormattedMessage defaultMessage="Total" />
                            <br />
                            <FormattedMessage defaultMessage="Seats" />
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
            id: 'category',
            accessorFn: (row) => (row as any).category?.name,
            header: ({ column }) => (
                <SortableHeader
                    column={column}
                    title={<FormattedMessage defaultMessage="Category" />}
                />
            ),
            cell: ({ row }) => <CategoryCell row={row} />,
        },
        {
            id: 'product_commission_category',
            accessorFn: (row) =>
                (row as any).product_commission_category?.category_name ||
                (row as any).productCommissionCategory?.category_name,
            header: ({ column }) => (
                <SortableHeader
                    column={column}
                    title={
                        <span className="inline-block text-left leading-tight">
                            <FormattedMessage defaultMessage="Product Comm." />
                            <br />
                            <FormattedMessage defaultMessage="Category" />
                        </span>
                    }
                    className="justify-start"
                />
            ),
            cell: ({ row }) => <ProductCommissionCategoryCell row={row} />,
        },
        {
            id: 'status',
            accessorFn: (row) => row.status,
            header: ({ column }) => (
                <SortableHeader
                    column={column}
                    title={<FormattedMessage defaultMessage="Status" />}
                />
            ),
            cell: ({ row }) => <StatusCell row={row} />,
        },
        {
            id: 'created_at',
            accessorFn: (row) => row.created_at,
            header: ({ column }) => (
                <SortableHeader
                    column={column}
                    title={<FormattedMessage defaultMessage="Created At" />}
                />
            ),
            cell: ({ getValue }) => (
                <div className="text-sm font-medium text-slate-500 whitespace-nowrap dark:text-slate-300">
                    {dayjs(getValue<string>()).format('DD MMM YYYY')}
                </div>
            ),
        },
    ];
}
