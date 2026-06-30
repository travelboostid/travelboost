import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { MediaPicker } from '@/components/media-picker';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { extractDocumentUrl } from '@/lib/utils';
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
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronDown,
    DownloadIcon,
    EyeIcon,
    FileTextIcon,
    HistoryIcon,
    MapPinIcon,
    MoreVertical,
    Search,
    TrashIcon,
    UploadCloudIcon,
    XIcon,
} from 'lucide-react';
import * as React from 'react';
import { FormattedMessage, useIntl, type IntlShape } from 'react-intl';
import { toast } from 'sonner';
import type { AgentTour } from './type';

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

const getDocumentName = (media: any, intl: IntlShape): string =>
    media?.name ||
    media?.file_name ||
    media?.data?.name ||
    media?.data?.file_name ||
    media?.data?.filename ||
    intl.formatMessage({ defaultMessage: 'Itinerary PDF' });

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
    const intl = useIntl();
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
                        toast.success(
                            intl.formatMessage({
                                defaultMessage:
                                    'Tour removed from catalog successfully',
                            }),
                        );
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
                                <EyeIcon className="mr-2 h-4 w-4" />
                                <FormattedMessage defaultMessage="View Details" />
                            </DropdownMenuItem>
                        </DialogTrigger>
                        <DropdownMenuItem className="cursor-pointer">
                            <HistoryIcon className="mr-2 h-4 w-4" />
                            <FormattedMessage defaultMessage="Booking History" />
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => setIsDeleteDialogOpen(true)}
                        >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            <FormattedMessage defaultMessage="Remove Tour" />
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DialogContent className="max-w-3xl p-0 overflow-hidden border-none shadow-2xl bg-slate-50 rounded-2xl">
                    <div className="relative h-64 w-full">
                        <TourMediaImage
                            media={tour?.image as any}
                            fallbackSrc="https://placehold.co/800x400/e2e8f0/94a3b8?text=No+Image"
                            alt={
                                tour?.name ||
                                intl.formatMessage({
                                    defaultMessage: 'Tour Image',
                                })
                            }
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-primary hover:bg-primary text-white border-none">
                                    {agentTour.category?.name ||
                                    tour?.category?.name ? (
                                        agentTour.category?.name ||
                                        tour?.category?.name
                                    ) : (
                                        <FormattedMessage defaultMessage="Uncategorized" />
                                    )}
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
                                {tour?.destination || (
                                    <FormattedMessage defaultMessage="Multiple Destinations" />
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="p-6 md:p-8 space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">
                                <FormattedMessage defaultMessage="Tour Description" />
                            </h3>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
                                {tour?.description || (
                                    <FormattedMessage defaultMessage="No description available for this tour." />
                                )}
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
                                            days: tour?.duration_days || '-',
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
                                    href={`/companies/${company.username}/dashboard/vendors/${tour?.company?.username}/tours/${tour?.id}/brochure`}
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
                            <FormattedMessage defaultMessage="This action will remove the tour from your catalog. It cannot be undone." />
                            {(errors as any).delete_error && (
                                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
                                    {(errors as any).delete_error}
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
                            <FormattedMessage defaultMessage="Remove" />
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function CategoryCell({
    row,
    categories,
    isSaving,
    onChange,
}: {
    row: any;
    categories: AgentTourCategoryOption[];
    isSaving: boolean;
    onChange: (agentTour: AgentTour, value: string) => void;
}) {
    const intl = useIntl();
    const agentTour = row.original;

    const [value, setValue] = React.useState(
        agentTour.category_id?.toString() || 'none',
    );

    React.useEffect(() => {
        setValue(agentTour.category_id?.toString() || 'none');
    }, [agentTour.category_id]);

    const handleChange = (val: string) => {
        setValue(val);
        onChange(agentTour, val);
    };

    return (
        <div onClick={(e) => e.stopPropagation()}>
            <Select
                value={value}
                onValueChange={handleChange}
                disabled={isSaving}
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
                    {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function StatusCell({
    row,
    isSaving,
    onChange,
}: {
    row: any;
    isSaving: boolean;
    onChange: (agentTour: AgentTour, value: string) => void;
}) {
    const intl = useIntl();
    const agentTour = row.original;
    const vendorStatus = agentTour.tour?.status;

    const [value, setValue] = React.useState(agentTour.status || 'inactive');

    React.useEffect(() => {
        setValue(agentTour.status || 'inactive');
    }, [agentTour.status]);

    const handleChange = (val: string) => {
        setValue(val);
        onChange(agentTour, val);
    };

    const isActive = value.toLowerCase() === 'active';

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col gap-1.5"
        >
            <Select
                value={value}
                onValueChange={handleChange}
                disabled={vendorStatus === 'inactive' || isSaving}
            >
                <SelectTrigger
                    className={`w-[120px] h-9 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm ${
                        isActive
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                            : 'bg-slate-50 text-slate-500 border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    } ${vendorStatus === 'inactive' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <SelectValue
                        placeholder={intl.formatMessage({
                            defaultMessage: 'Select Status',
                        })}
                    />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                    <SelectItem value="active">
                        <FormattedMessage defaultMessage="Active" />
                    </SelectItem>
                    <SelectItem value="inactive">
                        <FormattedMessage defaultMessage="Inactive" />
                    </SelectItem>
                </SelectContent>
            </Select>

            {vendorStatus === 'inactive' && (
                <span className="text-[10px] font-semibold text-red-500 leading-tight">
                    <FormattedMessage defaultMessage="Inactive by Vendor" />
                    <br />
                    <FormattedMessage defaultMessage="(Locked)" />
                </span>
            )}
        </div>
    );
}

function VendorDocumentCell({ row }: { row: any }) {
    const intl = useIntl();
    const tour = row.original.tour;
    const hasDocument = Boolean(tour?.document);
    const documentUrl = hasDocument ? extractDocumentUrl(tour.document) : '';

    return (
        <Button
            asChild={Boolean(documentUrl)}
            variant="outline"
            size="sm"
            disabled={!documentUrl}
            className="h-9 rounded-xl border-slate-200 bg-white text-xs font-semibold shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
            {documentUrl ? (
                <a
                    href={documentUrl}
                    download={getDocumentName(tour.document, intl)}
                    title={getDocumentName(tour.document, intl)}
                >
                    <DownloadIcon className="mr-1.5 h-3.5 w-3.5" />
                    <FormattedMessage defaultMessage="Vendor PDF" />
                </a>
            ) : (
                <span>
                    <FormattedMessage defaultMessage="Not available" />
                </span>
            )}
        </Button>
    );
}

function AgentDocumentCell({ row }: { row: any }) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const agentTour = row.original;
    const vendorDocument = agentTour.tour?.document;
    const agentDocument = agentTour.agent_document;
    const documentUrl = agentDocument ? extractDocumentUrl(agentDocument) : '';
    const hasVendorDocument = Boolean(
        vendorDocument && extractDocumentUrl(vendorDocument),
    );
    const isAgentUploadEnabled =
        agentTour.agent_itinerary_upload_enabled ?? false;
    const uploadBlockedReason = !hasVendorDocument
        ? intl.formatMessage({
              defaultMessage:
                  'Vendor PDF must be uploaded first before you can upload your own itinerary PDF.',
          })
        : !isAgentUploadEnabled
          ? intl.formatMessage({
                defaultMessage:
                    'This vendor has not allowed your account to upload an itinerary PDF for this product.',
            })
          : null;
    const isUploadDisabled = uploadBlockedReason !== null;

    const updateDocument = (media: any) => {
        router.put(
            `/companies/${company.username}/dashboard/agent-tours/${agentTour.id}`,
            { agent_document_id: media?.id ?? null },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () =>
                    toast.success(
                        media
                            ? intl.formatMessage({
                                  defaultMessage:
                                      'Agent itinerary uploaded successfully',
                              })
                            : intl.formatMessage({
                                  defaultMessage:
                                      'Agent itinerary removed successfully',
                              }),
                    ),
            },
        );
    };

    return (
        <div className="flex min-w-[220px] items-center gap-2">
            {agentDocument ? (
                <>
                    <Button
                        asChild={Boolean(documentUrl)}
                        variant="outline"
                        size="sm"
                        className="h-9 min-w-0 flex-1 justify-start rounded-xl border-slate-200 bg-white text-xs font-semibold shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                        {documentUrl ? (
                            <a
                                href={documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                title={getDocumentName(agentDocument, intl)}
                            >
                                <FileTextIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">
                                    <FormattedMessage defaultMessage="Agent PDF" />
                                </span>
                            </a>
                        ) : (
                            <span>
                                <FormattedMessage defaultMessage="Agent PDF" />
                            </span>
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                        onClick={() => updateDocument(null)}
                    >
                        <XIcon className="h-4 w-4" />
                    </Button>
                </>
            ) : (
                <MediaPicker
                    type="document"
                    defaultValue={agentDocument}
                    onChange={updateDocument}
                    params={{
                        owner_type: 'company',
                        owner_id: company.id,
                    }}
                    uploadParams={{
                        owner_type: 'company',
                        owner_id: company.id,
                        subtype: 'agent-itinerary',
                    }}
                >
                    {(_, change) => (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-flex">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-9 rounded-xl border-slate-200 bg-white text-xs font-semibold shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                            onClick={change}
                                            disabled={isUploadDisabled}
                                        >
                                            <UploadCloudIcon className="mr-1.5 h-3.5 w-3.5" />
                                            {!hasVendorDocument ? (
                                                <FormattedMessage defaultMessage="Vendor PDF Required" />
                                            ) : isAgentUploadEnabled ? (
                                                <FormattedMessage defaultMessage="Upload Agent PDF" />
                                            ) : (
                                                <FormattedMessage defaultMessage="Upload Locked" />
                                            )}
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                {uploadBlockedReason ? (
                                    <TooltipContent side="top">
                                        {uploadBlockedReason}
                                    </TooltipContent>
                                ) : null}
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </MediaPicker>
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

type AgentTourCategoryOption = {
    id: number;
    name: string;
};

type AgentTourUpdateResponse = {
    message?: string;
    data?: {
        id: number;
        category_id: number | null;
        category: AgentTourCategoryOption | null;
        status: string;
        agent_document_id: number | null;
    };
};

type SavingState = Record<number, boolean>;

async function updateAgentTour(
    companyUsername: string,
    agentTourId: number,
    payload: {
        category_id?: number | null;
        status?: string;
        agent_document_id?: number | null;
    },
): Promise<AgentTourUpdateResponse> {
    const { data } = await axios.put<AgentTourUpdateResponse>(
        `/companies/${companyUsername}/dashboard/agent-tours/${agentTourId}`,
        payload,
        {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        },
    );

    return data;
}

function getColumns({
    intl,
    categories,
    savingState,
    onCategoryChange,
    onStatusChange,
}: {
    intl: IntlShape;
    categories: AgentTourCategoryOption[];
    savingState: SavingState;
    onCategoryChange: (agentTour: AgentTour, value: string) => void;
    onStatusChange: (agentTour: AgentTour, value: string) => void;
}): ColumnDef<any>[] {
    return [
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
                <SortableHeader
                    column={column}
                    title={<FormattedMessage defaultMessage="Tour Details" />}
                />
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
                <SortableHeader
                    column={column}
                    title={<FormattedMessage defaultMessage="Vendor" />}
                />
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
                        media={row.original.tour?.image as any}
                        fallbackSrc="https://placehold.co/400x300/f8fafc/94a3b8?text=No+Image"
                        alt={intl.formatMessage({ defaultMessage: 'Tour' })}
                        className="w-full h-full object-cover"
                    />
                </div>
            ),
            enableSorting: false,
        },
        {
            id: 'vendor_document',
            header: () => (
                <FormattedMessage defaultMessage="Vendor Itinerary" />
            ),
            cell: ({ row }) => <VendorDocumentCell row={row} />,
            enableSorting: false,
        },
        {
            id: 'agent_document',
            accessorFn: (row) => row.agent_document?.name,
            header: ({ column }) => (
                <SortableHeader
                    column={column}
                    title={
                        <FormattedMessage defaultMessage="Agent Itinerary" />
                    }
                />
            ),
            cell: ({ row }) => <AgentDocumentCell row={row} />,
        },
        {
            id: 'category',
            accessorFn: (row) => row.category?.name || row.tour?.category?.name,
            header: ({ column }) => (
                <SortableHeader
                    column={column}
                    title={<FormattedMessage defaultMessage="Category" />}
                />
            ),
            cell: ({ row }) => (
                <CategoryCell
                    row={row}
                    categories={categories}
                    isSaving={Boolean(savingState[row.original.id])}
                    onChange={onCategoryChange}
                />
            ),
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
                            <FormattedMessage
                                defaultMessage="Total{br}Seats"
                                values={{ br: <br /> }}
                            />
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
                <SortableHeader
                    column={column}
                    title={<FormattedMessage defaultMessage="Status" />}
                />
            ),
            cell: ({ row }) => (
                <StatusCell
                    row={row}
                    isSaving={Boolean(savingState[row.original.id])}
                    onChange={onStatusChange}
                />
            ),
        },
        {
            id: 'added_at',
            accessorFn: (row) => row.created_at,
            header: ({ column }) => (
                <SortableHeader
                    column={column}
                    title={<FormattedMessage defaultMessage="Added At" />}
                />
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
}

type PageProps = {
    data: AgentTour[];
    categories: AgentTourCategoryOption[];
};

export default function Page({ data, categories }: PageProps) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const [sorting, setSorting] = React.useState<SortingState>([
        { id: 'added_at', desc: true },
    ]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({ image: false });
    const [activeTab, setActiveTab] = React.useState('active');
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [tableData, setTableData] = React.useState<AgentTour[]>(data);
    const [savingState, setSavingState] = React.useState<SavingState>({});

    React.useEffect(() => {
        setTableData(data);
    }, [data]);

    const filteredData = React.useMemo(() => {
        let result = tableData;
        if (activeTab !== 'all') {
            result = result.filter(
                (agentTour: any) =>
                    (agentTour.status || 'inactive').toLowerCase() ===
                    activeTab,
            );
        }
        return result;
    }, [tableData, activeTab]);

    const setRowSaving = React.useCallback(
        (agentTourId: number, value: boolean) => {
            setSavingState((current) => ({
                ...current,
                [agentTourId]: value,
            }));
        },
        [],
    );

    const handleCategoryChange = React.useCallback(
        async (agentTour: AgentTour, value: string) => {
            const nextCategoryId = value === 'none' ? null : Number(value);
            const nextCategory =
                nextCategoryId === null
                    ? null
                    : (categories.find(
                          (category) => category.id === nextCategoryId,
                      ) ?? null);
            const previousCategoryId = agentTour.category_id ?? null;
            const previousCategory = agentTour.category ?? null;

            setTableData((current) =>
                current.map((item) =>
                    item.id === agentTour.id
                        ? {
                              ...item,
                              category_id: nextCategoryId,
                              category: nextCategory as AgentTour['category'],
                          }
                        : item,
                ),
            );
            setRowSaving(agentTour.id, true);

            try {
                const response = await updateAgentTour(
                    company.username,
                    agentTour.id,
                    {
                        category_id: nextCategoryId,
                    },
                );

                if (response.data) {
                    setTableData((current) =>
                        current.map((item) =>
                            item.id === agentTour.id
                                ? {
                                      ...item,
                                      category_id:
                                          response.data?.category_id ?? null,
                                      category: (response.data?.category ??
                                          null) as AgentTour['category'],
                                  }
                                : item,
                        ),
                    );
                }

                toast.success(
                    intl.formatMessage({
                        defaultMessage: 'Category updated successfully',
                    }),
                );
            } catch {
                setTableData((current) =>
                    current.map((item) =>
                        item.id === agentTour.id
                            ? {
                                  ...item,
                                  category_id: previousCategoryId,
                                  category:
                                      previousCategory as AgentTour['category'],
                              }
                            : item,
                    ),
                );
                toast.error(
                    intl.formatMessage({
                        defaultMessage: 'Failed to update category',
                    }),
                );
            } finally {
                setRowSaving(agentTour.id, false);
            }
        },
        [categories, company.username, intl, setRowSaving],
    );

    const handleStatusChange = React.useCallback(
        async (agentTour: AgentTour, value: string) => {
            const previousStatus = agentTour.status || 'inactive';

            setTableData((current) =>
                current.map((item) =>
                    item.id === agentTour.id
                        ? { ...item, status: value }
                        : item,
                ),
            );
            setRowSaving(agentTour.id, true);

            try {
                const response = await updateAgentTour(
                    company.username,
                    agentTour.id,
                    {
                        status: value,
                    },
                );

                if (response.data) {
                    setTableData((current) =>
                        current.map((item) =>
                            item.id === agentTour.id
                                ? {
                                      ...item,
                                      status: response.data?.status ?? value,
                                  }
                                : item,
                        ),
                    );
                }

                toast.success(
                    intl.formatMessage({
                        defaultMessage: 'Status updated successfully',
                    }),
                );
            } catch {
                setTableData((current) =>
                    current.map((item) =>
                        item.id === agentTour.id
                            ? { ...item, status: previousStatus }
                            : item,
                    ),
                );
                toast.error(
                    intl.formatMessage({
                        defaultMessage: 'Failed to update status',
                    }),
                );
            } finally {
                setRowSaving(agentTour.id, false);
            }
        },
        [company.username, intl, setRowSaving],
    );

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

    const columns = React.useMemo(
        () =>
            getColumns({
                intl,
                categories,
                savingState,
                onCategoryChange: handleCategoryChange,
                onStatusChange: handleStatusChange,
            }),
        [
            categories,
            handleCategoryChange,
            handleStatusChange,
            intl,
            savingState,
        ],
    );

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
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            globalFilter,
        },
    });

    return (
        <CompanyDashboardLayout
            openMenuIds={['tours']}
            activeMenuIds={['agent-tours.index']}
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Products',
                    }),
                },
            ]}
            containerClassName="w-full flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950"
        >
            <div className="w-full space-y-6 p-4 md:p-8 max-w-[1600px] mx-auto pb-20">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                    <div className="relative w-full sm:w-[700px] border border-slate-200 rounded-xl shadow-sm dark:border-slate-800">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder={intl.formatMessage({
                                defaultMessage:
                                    'Search tour, vendor, or category...',
                            })}
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
                                <FormattedMessage defaultMessage="All Catalog" />
                            </TabsTrigger>
                            <TabsTrigger
                                value="active"
                                className="rounded-lg data-[state=active]:shadow-sm data-[state=active]:text-emerald-600"
                            >
                                <FormattedMessage defaultMessage="Active" />
                            </TabsTrigger>
                            <TabsTrigger
                                value="inactive"
                                className="rounded-lg data-[state=active]:shadow-sm data-[state=active]:text-slate-600"
                            >
                                <FormattedMessage defaultMessage="Inactive" />
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
                                    <FormattedMessage defaultMessage="Columns" />
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
                                                    <FormattedMessage defaultMessage="No tours found" />
                                                </p>
                                                <p className="text-sm">
                                                    <FormattedMessage defaultMessage="Try adjusting your search or filter to find what you're looking for." />
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="flex justify-end pt-4 px-2">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm px-6 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                            <FormattedMessage defaultMessage="Previous" />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm px-6 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                            <FormattedMessage defaultMessage="Next" />
                        </Button>
                    </div>
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
