import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Head, router, usePage } from '@inertiajs/react';
import dayjs from 'dayjs';
import {
    DownloadIcon,
    InfoIcon,
    PrinterIcon,
    RotateCcwIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

const cleanRoomType = (roomType: string | null | undefined) => {
    const normalized = String(roomType || '')
        .replace(/\s*\([^)]*\)/g, '')
        .trim();

    return normalized || 'TBA';
};

const TourAutocomplete = ({
    tours,
    value,
    onChange,
}: {
    tours: any[];
    value: string;
    onChange: (val: string) => void;
}) => {
    const intl = useIntl();
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selectedTourLabel = useMemo(() => {
        if (!value) {
            return '';
        }

        const tour = tours.find(
            (item) => item.id.toString() === value.toString(),
        );

        return tour ? `${tour.code} - ${tour.name}` : '';
    }, [tours, value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredTours = tours.filter(
        (tour) =>
            tour.name.toLowerCase().includes(query.toLowerCase()) ||
            tour.code.toLowerCase().includes(query.toLowerCase()),
    );

    return (
        <div className="relative w-full" ref={ref}>
            <Input
                value={open ? query : selectedTourLabel}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setOpen(true);
                    if (event.target.value === '') {
                        onChange('');
                    }
                }}
                onFocus={() => {
                    setQuery(selectedTourLabel);
                    setOpen(true);
                }}
                placeholder={intl.formatMessage({
                    defaultMessage: 'Search tour code or name...',
                })}
                className="h-11 rounded-xl bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            {open && filteredTours.length > 0 && (
                <ul className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    {filteredTours.map((tour) => (
                        <li
                            key={tour.id}
                            className="cursor-pointer px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                            onClick={() => {
                                setQuery(`${tour.code} - ${tour.name}`);
                                onChange(tour.id.toString());
                                setOpen(false);
                            }}
                        >
                            <span className="font-semibold">{tour.code}</span> -{' '}
                            {tour.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default function RoomListing() {
    const intl = useIntl();
    const { tours, availableDates, roomData, agentGroups, roomRecap, filters } =
        usePage<any>().props;
    const { company } = usePageSharedDataProps();
    const normalizedTours = useMemo(() => {
        return Array.isArray(tours) ? tours : [];
    }, [tours]);
    const normalizedFilters = useMemo(() => {
        return filters && typeof filters === 'object'
            ? filters
            : { tour_id: '', departure_date: '' };
    }, [filters]);
    const normalizedAvailableDates = useMemo(() => {
        if (Array.isArray(availableDates)) {
            return availableDates;
        }

        if (availableDates && typeof availableDates === 'object') {
            return Object.values(availableDates);
        }

        return [];
    }, [availableDates]);
    const normalizedRoomRecap = useMemo(() => {
        return Array.isArray(roomRecap) ? roomRecap : [];
    }, [roomRecap]);

    const hasTourSelected = Boolean(normalizedFilters.tour_id);
    const hasDepartureSelected = Boolean(normalizedFilters.departure_date);
    const hasCompleteFilters = hasTourSelected && hasDepartureSelected;

    const calculateAge = (dateOfBirth: string | null) => {
        if (!dateOfBirth) {
            return null;
        }

        return dayjs().diff(dayjs(dateOfBirth), 'year');
    };

    const calculateValidity = (expiryDate: string | null) => {
        if (!expiryDate || !normalizedFilters.departure_date) {
            return null;
        }

        return Math.round(
            dayjs(expiryDate).diff(
                dayjs(normalizedFilters.departure_date),
                'month',
            ),
        );
    };

    const selectedTour = useMemo(() => {
        return normalizedTours.find(
            (tour: any) =>
                tour.id.toString() === normalizedFilters.tour_id?.toString(),
        );
    }, [normalizedTours, normalizedFilters.tour_id]);

    const groupedData = useMemo(() => {
        return Array.isArray(agentGroups) ? agentGroups : [];
    }, [agentGroups]);

    const handlePrintNative = (event: React.MouseEvent) => {
        event.preventDefault();
        setTimeout(() => {
            window.print();
        }, 150);
    };

    const buildExportQuery = () => {
        const params = new URLSearchParams();

        if (normalizedFilters.tour_id) {
            params.append('tour_id', normalizedFilters.tour_id);
        }

        if (normalizedFilters.departure_date) {
            params.append('departure_date', normalizedFilters.departure_date);
        }

        return params.toString();
    };

    const handleResetFilters = () => {
        router.get(
            window.location.pathname,
            { tour_id: '', departure_date: '' },
            { preserveState: true },
        );
    };

    const handleExportExcel = () => {
        window.location.href = `/companies/${company.username}/dashboard/reports/room-listings/export/excel?${buildExportQuery()}`;
    };

    const handleExportPDF = () => {
        window.open(
            `/companies/${company.username}/dashboard/reports/room-listings/export/pdf?${buildExportQuery()}`,
            '_blank',
        );
    };

    const handleExportDocuments = () => {
        window.location.href = `/companies/${company.username}/dashboard/reports/room-listings/export/documents?${buildExportQuery()}`;
    };

    let globalIndex = 1;
    let roomCounter = 0;
    let bookingCounter = 0;

    return (
        <CompanyDashboardLayout
            openMenuIds={['reports']}
            activeMenuIds={['reports.room-listings']}
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Reports',
                    }),
                },
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Room Listing',
                    }),
                },
            ]}
            containerClassName="min-h-screen bg-slate-50/60 dark:bg-slate-950"
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Room Listing',
                })}
            />

            <div
                id="print-area"
                className="mx-auto w-full max-w-[1600px] p-4 print:m-0 print:max-w-none print:p-0 md:p-6 lg:p-8"
            >
                <div className="mb-6 rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 print:hidden md:p-5">
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.48fr)] xl:items-end">
                        <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                            <label className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#cc3f8e]" />
                                <FormattedMessage defaultMessage="Tour Product" />
                            </label>
                            <TourAutocomplete
                                tours={normalizedTours}
                                value={normalizedFilters.tour_id || ''}
                                onChange={(value) =>
                                    router.get(
                                        window.location.pathname,
                                        {
                                            tour_id: value,
                                            departure_date: '',
                                        },
                                        { preserveState: true },
                                    )
                                }
                            />
                        </div>

                        <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                            <label className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                                <FormattedMessage defaultMessage="Departure Date" />
                            </label>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Select
                                    value={String(
                                        normalizedFilters.departure_date ?? '',
                                    )}
                                    onValueChange={(value) =>
                                        router.get(
                                            window.location.pathname,
                                            {
                                                ...normalizedFilters,
                                                departure_date: value,
                                            },
                                            { preserveState: true },
                                        )
                                    }
                                    disabled={!hasTourSelected}
                                >
                                    <SelectTrigger className="h-11 min-w-0 flex-1 rounded-xl border-slate-200 bg-white px-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                                        <SelectValue
                                            placeholder={
                                                hasTourSelected
                                                    ? intl.formatMessage({
                                                          defaultMessage:
                                                              'Select departure date',
                                                      })
                                                    : intl.formatMessage({
                                                          defaultMessage:
                                                              'Select a tour product first',
                                                      })
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="dark:border-slate-700 dark:bg-slate-900">
                                        {normalizedAvailableDates.map(
                                            (date: string) => (
                                                <SelectItem
                                                    key={date}
                                                    value={date}
                                                    className="dark:focus:bg-slate-800"
                                                >
                                                    {dayjs(date).format(
                                                        'DD MMM YYYY',
                                                    )}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11 shrink-0 gap-2 rounded-xl border-slate-200 bg-white px-4 text-slate-700 shadow-sm hover:border-[#cc3f8e]/30 hover:bg-[#cc3f8e]/5 hover:text-[#cc3f8e] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:min-w-[112px]"
                                    onClick={handleResetFilters}
                                    disabled={
                                        !hasTourSelected &&
                                        !hasDepartureSelected
                                    }
                                    title={intl.formatMessage({
                                        defaultMessage: 'Reset search',
                                    })}
                                >
                                    <RotateCcwIcon size={16} />
                                    <span>
                                        <FormattedMessage defaultMessage="Reset" />
                                    </span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6 flex flex-col gap-3 print:hidden xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex max-w-2xl items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
                        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>
                            <FormattedMessage defaultMessage="Tour bookings with down payment or full payment status are displayed." />
                            {/* <FormattedMessage defaultMessage="Tour bookings with down payment or full payment status are displayed. Use the payment status column to identify settlement progress." /> */}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                        <Button
                            variant="outline"
                            className="h-8 px-3 text-xs justify-center gap-1.5 rounded-xl border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                            onClick={handlePrintNative}
                            disabled={!hasCompleteFilters || !roomData?.length}
                        >
                            <PrinterIcon size={14} />{' '}
                            <FormattedMessage defaultMessage="Print" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 px-3 text-xs justify-center gap-1.5 rounded-xl border-red-200 bg-red-50 text-red-600 shadow-sm transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                            onClick={handleExportPDF}
                            disabled={!hasCompleteFilters || !roomData?.length}
                        >
                            <DownloadIcon size={14} />{' '}
                            <FormattedMessage defaultMessage="PDF" />
                        </Button>
                        <Button
                            className="h-8 px-3 text-xs justify-center gap-1.5 rounded-xl bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700"
                            onClick={handleExportExcel}
                            disabled={!hasCompleteFilters || !roomData?.length}
                        >
                            <DownloadIcon size={14} />{' '}
                            <FormattedMessage defaultMessage="Excel" />
                        </Button>
                        <Button
                            className="h-8 px-3 text-xs justify-center gap-1.5 rounded-xl bg-yellow-600 text-white shadow-sm transition hover:bg-yellow-700"
                            onClick={handleExportDocuments}
                            disabled={!hasCompleteFilters || !roomData?.length}
                        >
                            <DownloadIcon size={14} />{' '}
                            <FormattedMessage defaultMessage="Documents (ZIP)" />
                        </Button>
                    </div>
                </div>

                <div className="mb-5 hidden items-start justify-between border-b-2 border-black pb-4 print:flex">
                    <div className="flex items-center gap-5">
                        {company.photo_url && (
                            <img
                                src={company.photo_url}
                                alt={intl.formatMessage({
                                    defaultMessage: 'Company logo',
                                })}
                                className="h-14 w-auto object-contain"
                            />
                        )}
                        <div>
                            <h1 className="text-[22px] font-black uppercase tracking-tight text-black">
                                <FormattedMessage defaultMessage="Room Listing" />
                            </h1>
                            <p className="mt-1 text-[11px] font-bold uppercase text-black">
                                {company.name}
                            </p>
                        </div>
                    </div>

                    <div className="text-right text-black">
                        <div className="text-[11px] font-bold uppercase">
                            {selectedTour ? (
                                `${selectedTour.code} - ${selectedTour.name}`
                            ) : (
                                <FormattedMessage defaultMessage="No Tour Selected" />
                            )}
                        </div>
                        <div className="mt-1 text-[10px] font-semibold">
                            {normalizedFilters.departure_date ? (
                                <FormattedMessage
                                    defaultMessage="Departure Date: {date}"
                                    values={{
                                        date: dayjs(
                                            normalizedFilters.departure_date,
                                        ).format('DD MMMM YYYY'),
                                    }}
                                />
                            ) : (
                                <FormattedMessage defaultMessage="Not selected" />
                            )}
                        </div>
                    </div>
                </div>

                {hasCompleteFilters && roomData && roomData.length > 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 print:border-none print:bg-transparent print:shadow-none">
                        <div className="overflow-x-auto print:overflow-visible">
                            <Table className="w-full border-collapse print:table-fixed">
                                <TableHeader className="bg-slate-50 dark:bg-slate-900 print:bg-slate-100">
                                    <TableRow className="border-b border-slate-200 dark:border-slate-800">
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[3%]">
                                            <FormattedMessage defaultMessage="No" />
                                        </TableHead>
                                        <TableHead className="min-w-[72px] border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[5%]">
                                            <FormattedMessage defaultMessage="Title" />
                                        </TableHead>
                                        <TableHead className="min-w-[220px] border-r border-slate-200 px-3 py-3 text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[12%]">
                                            <FormattedMessage defaultMessage="Passenger Name" />
                                        </TableHead>
                                        <TableHead className="min-w-[126px] border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[7%]">
                                            <FormattedMessage defaultMessage="Payment Status" />
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[8%]">
                                            <FormattedMessage defaultMessage="Room Type" />
                                        </TableHead>
                                        <TableHead className="min-w-[64px] border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[4%]">
                                            <FormattedMessage defaultMessage="Room No." />
                                        </TableHead>
                                        <TableHead className="min-w-[56px] border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[4%]">
                                            <FormattedMessage defaultMessage="Room" />
                                        </TableHead>
                                        <TableHead className="min-w-[56px] border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[4%]">
                                            <FormattedMessage defaultMessage="Seat" />
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[4%]">
                                            <FormattedMessage defaultMessage="Visa" />
                                        </TableHead>
                                        <TableHead className="min-w-[150px] border-r border-slate-200 px-3 py-3 text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[14%]">
                                            <FormattedMessage defaultMessage="Remarks" />
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[10%]">
                                            <FormattedMessage defaultMessage="Passport Number" />
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[8%]">
                                            <FormattedMessage defaultMessage="Place of Issue" />
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[8%]">
                                            <FormattedMessage defaultMessage="Issue Date" />
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[8%]">
                                            <FormattedMessage defaultMessage="Expiry Date" />
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[8%]">
                                            <FormattedMessage defaultMessage="Place of Birth" />
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[8%]">
                                            <FormattedMessage defaultMessage="Date of Birth" />
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[9%]">
                                            <FormattedMessage defaultMessage="Contact" />
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[4%]">
                                            <FormattedMessage defaultMessage="Age" />
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[9%]">
                                            <FormattedMessage defaultMessage="Agent" />
                                        </TableHead>
                                        <TableHead className="px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:text-slate-200 print:w-[4%]">
                                            <FormattedMessage defaultMessage="Val" />
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupedData.map((agentGroup: any) => {
                                        const bookings = Array.isArray(
                                            agentGroup.bookings,
                                        )
                                            ? agentGroup.bookings
                                            : [];

                                        return [
                                            ...bookings.flatMap(
                                                (bookingData: any) => {
                                                    bookingCounter++;
                                                    const rowBgClass =
                                                        bookingCounter % 2 === 0
                                                            ? 'bg-slate-50/50 dark:bg-slate-900/30'
                                                            : 'bg-white dark:bg-slate-950';

                                                    const roomGroups =
                                                        Array.isArray(
                                                            bookingData.rooms,
                                                        )
                                                            ? bookingData.rooms
                                                            : [];
                                                    const totalPaxInBooking =
                                                        Number(
                                                            bookingData.total_pax ||
                                                                0,
                                                        );

                                                    return roomGroups.flatMap(
                                                        (
                                                            roomGroup: any,
                                                            roomIndex: number,
                                                        ) => {
                                                            const passengerList =
                                                                Array.isArray(
                                                                    roomGroup.passengers,
                                                                )
                                                                    ? roomGroup.passengers
                                                                    : [];
                                                            const roomType =
                                                                cleanRoomType(
                                                                    roomGroup.room_type,
                                                                );
                                                            const roomTypeNote =
                                                                typeof roomGroup.room_type_note ===
                                                                'string'
                                                                    ? roomGroup.room_type_note
                                                                    : null;
                                                            const roomNumber =
                                                                roomGroup.room_number ||
                                                                ++roomCounter;

                                                            return passengerList.map(
                                                                (
                                                                    row: any,
                                                                    passengerIndex: number,
                                                                ) => {
                                                                    const isFirstInBooking =
                                                                        roomIndex ===
                                                                            0 &&
                                                                        passengerIndex ===
                                                                            0;
                                                                    const isFirstInRoom =
                                                                        passengerIndex ===
                                                                        0;
                                                                    const totalPaxInRoom =
                                                                        passengerList.length;
                                                                    const fullName =
                                                                        `${row.first_name} ${row.last_name || ''}`.trim();
                                                                    const validityMonths =
                                                                        calculateValidity(
                                                                            row.passport_expiry_date,
                                                                        );
                                                                    const isPassportWarning =
                                                                        typeof validityMonths ===
                                                                            'number' &&
                                                                        validityMonths <
                                                                            6;

                                                                    return (
                                                                        <TableRow
                                                                            key={`${agentGroup.agent_name}-${bookingData.booking_number}-${roomType}-${roomIndex}-${passengerIndex}`}
                                                                            className={`border-b border-slate-200 dark:border-slate-800 ${rowBgClass} ${isFirstInBooking ? 'border-t-2 border-t-slate-400 dark:border-t-slate-500 print-border-thick' : ''} break-inside-avoid hover:bg-slate-50 dark:hover:bg-slate-900/50`}
                                                                        >
                                                                            <TableCell className="border-r border-slate-200 p-2 text-center text-[12px] font-medium dark:border-slate-800 dark:text-slate-300">
                                                                                {
                                                                                    globalIndex++
                                                                                }
                                                                            </TableCell>
                                                                            <TableCell className="border-r border-slate-200 p-2 text-center text-[12px] font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                                                                                {row.title ||
                                                                                    '-'}
                                                                            </TableCell>
                                                                            <TableCell className="border-r border-slate-200 p-2 text-[12px] font-bold text-slate-900 dark:border-slate-800 dark:text-white">
                                                                                {fullName ||
                                                                                    '-'}
                                                                            </TableCell>
                                                                            {isFirstInBooking && (
                                                                                <TableCell
                                                                                    rowSpan={
                                                                                        totalPaxInBooking
                                                                                    }
                                                                                    className="border-r border-slate-200 p-2 text-center align-middle dark:border-slate-800"
                                                                                >
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className={
                                                                                            bookingData.payment_status ===
                                                                                            'full payment'
                                                                                                ? 'whitespace-nowrap border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                                                : 'whitespace-nowrap border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                                                                        }
                                                                                    >
                                                                                        {bookingData.payment_status ===
                                                                                        'full payment' ? (
                                                                                            <FormattedMessage defaultMessage="Full Payment" />
                                                                                        ) : (
                                                                                            <FormattedMessage defaultMessage="Down Payment" />
                                                                                        )}
                                                                                    </Badge>
                                                                                </TableCell>
                                                                            )}
                                                                            {isFirstInRoom && (
                                                                                <>
                                                                                    <TableCell
                                                                                        rowSpan={
                                                                                            totalPaxInRoom
                                                                                        }
                                                                                        className="border-r border-slate-200 p-2 text-center align-middle dark:border-slate-800"
                                                                                    >
                                                                                        <div className="text-[11px] font-medium uppercase">
                                                                                            {
                                                                                                roomType
                                                                                            }
                                                                                        </div>
                                                                                        {roomTypeNote && (
                                                                                            <div className="mt-1 text-[10px] font-normal normal-case leading-snug text-slate-500 dark:text-slate-400">
                                                                                                {
                                                                                                    roomTypeNote
                                                                                                }
                                                                                            </div>
                                                                                        )}
                                                                                    </TableCell>
                                                                                    <TableCell
                                                                                        rowSpan={
                                                                                            totalPaxInRoom
                                                                                        }
                                                                                        className="border-r border-slate-200 p-2 text-center align-middle text-[12px] font-bold dark:border-slate-800 dark:text-slate-200"
                                                                                    >
                                                                                        {
                                                                                            roomNumber
                                                                                        }
                                                                                    </TableCell>
                                                                                    <TableCell
                                                                                        rowSpan={
                                                                                            totalPaxInRoom
                                                                                        }
                                                                                        className="border-r border-slate-200 p-2 dark:border-slate-800"
                                                                                    />
                                                                                </>
                                                                            )}
                                                                            <TableCell className="border-r border-slate-200 p-2 dark:border-slate-800" />
                                                                            <TableCell className="border-r border-slate-200 p-2 text-center text-[11px] dark:border-slate-800 dark:text-slate-300">
                                                                                {row.visa_type_description ||
                                                                                    '-'}
                                                                            </TableCell>
                                                                            <TableCell className="border-r border-slate-200 p-2 text-[11px] italic leading-tight text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                                                                {row.note ||
                                                                                    '-'}
                                                                            </TableCell>
                                                                            <TableCell className="border-r border-slate-200 p-2 font-mono text-[12px] tracking-tighter dark:border-slate-800 dark:text-slate-300">
                                                                                {row.passport_number ||
                                                                                    '-'}
                                                                            </TableCell>
                                                                            <TableCell className="border-r border-slate-200 p-2 text-[11px] uppercase dark:border-slate-800 dark:text-slate-300 text-center">
                                                                                {row.passport_place_of_issue ||
                                                                                    '-'}
                                                                            </TableCell>
                                                                            <TableCell className="border-r border-slate-200 p-2 text-center text-[11px] dark:border-slate-800 dark:text-slate-300">
                                                                                {row.passport_issue_date
                                                                                    ? dayjs(
                                                                                          row.passport_issue_date,
                                                                                      ).format(
                                                                                          'DD MMMM YYYY',
                                                                                      )
                                                                                    : '-'}
                                                                            </TableCell>
                                                                            <TableCell className="border-r border-slate-200 p-2 text-center text-[11px] font-bold dark:border-slate-800 dark:text-slate-200">
                                                                                {row.passport_expiry_date
                                                                                    ? dayjs(
                                                                                          row.passport_expiry_date,
                                                                                      ).format(
                                                                                          'DD MMMM YYYY',
                                                                                      )
                                                                                    : '-'}
                                                                            </TableCell>
                                                                            <TableCell className="border-r border-slate-200 p-2 text-[11px] uppercase dark:border-slate-800 dark:text-slate-300">
                                                                                {row.pob ||
                                                                                    '-'}
                                                                            </TableCell>
                                                                            <TableCell className="border-r border-slate-200 p-2 text-center text-[11px] dark:border-slate-800 dark:text-slate-300">
                                                                                {row.dob
                                                                                    ? dayjs(
                                                                                          row.dob,
                                                                                      ).format(
                                                                                          'DD MMMM YYYY',
                                                                                      )
                                                                                    : '-'}
                                                                            </TableCell>
                                                                            {isFirstInBooking && (
                                                                                <TableCell
                                                                                    rowSpan={
                                                                                        totalPaxInBooking
                                                                                    }
                                                                                    className="border-r border-slate-200 p-2 text-center align-middle text-[10px] dark:border-slate-800 dark:text-slate-400"
                                                                                >
                                                                                    {row.contact_phone ||
                                                                                        '-'}
                                                                                </TableCell>
                                                                            )}
                                                                            <TableCell className="border-r border-slate-200 p-2 text-center text-[12px] dark:border-slate-800 dark:text-slate-300">
                                                                                {calculateAge(
                                                                                    row.dob,
                                                                                ) ||
                                                                                    '-'}
                                                                            </TableCell>
                                                                            {isFirstInBooking && (
                                                                                <TableCell
                                                                                    rowSpan={
                                                                                        totalPaxInBooking
                                                                                    }
                                                                                    className="border-r border-slate-200 p-2 text-center align-middle text-[11px] font-semibold dark:border-slate-800 dark:text-slate-200"
                                                                                >
                                                                                    {agentGroup.agent_name ||
                                                                                        '-'}
                                                                                </TableCell>
                                                                            )}
                                                                            <TableCell
                                                                                className={`p-2 text-center text-[12px] font-black ${
                                                                                    isPassportWarning
                                                                                        ? 'bg-red-50/50 text-red-600 dark:bg-red-900/20 dark:text-red-400 print-bg-red'
                                                                                        : 'dark:text-slate-300'
                                                                                }`}
                                                                            >
                                                                                {validityMonths ??
                                                                                    '-'}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    );
                                                                },
                                                            );
                                                        },
                                                    );
                                                },
                                            ),
                                        ];
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        {normalizedRoomRecap.length > 0 && (
                            <div className="border-t border-slate-200 p-4 dark:border-slate-800 print:border-t print:border-black print:p-3">
                                <h3 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300 print:text-black">
                                    <FormattedMessage defaultMessage="Room Recap" />
                                </h3>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3">
                                    {normalizedRoomRecap.map((item: any) => (
                                        <div
                                            key={item.roomType}
                                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 print:border-none print:bg-transparent print:px-0 print:py-1"
                                        >
                                            <span className="font-medium text-slate-700 dark:text-slate-200 print:text-black">
                                                {item.roomType}
                                            </span>
                                            <span className="font-bold text-slate-950 dark:text-white print:text-black">
                                                <FormattedMessage
                                                    defaultMessage="{count} {unit}"
                                                    values={{
                                                        count: item.count,
                                                        unit: item.unit,
                                                    }}
                                                />
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-16 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-600 print:hidden">
                        <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
                            {hasTourSelected ? (
                                <FormattedMessage defaultMessage="Select a departure date to generate the room listing." />
                            ) : (
                                <FormattedMessage defaultMessage="Select a tour product first, then choose a departure date." />
                            )}
                        </p>
                    </div>
                )}
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          html, body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            height: auto !important;
            overflow: visible !important;
            min-height: auto !important;
          }

          header, nav, aside, footer, .print\\:hidden {
            display: none !important;
          }

          main, .overflow-y-auto {
            height: auto !important;
            overflow: visible !important;
            position: static !important;
          }

          body * { visibility: hidden; }
          #print-area, #print-area * {
            visibility: visible;
            color: black !important;
          }

          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }

          table {
            width: 100% !important;
            border: 1px solid black !important;
            table-layout: fixed !important;
          }

          th, td {
            border: 0.5pt solid black !important;
            padding: 3px 2.5px !important;
            background-color: transparent !important;
            word-break: break-word;
            white-space: normal !important;
          }

          th {
            background-color: #f1f5f9 !important;
            font-weight: bold !important;
            font-size: 6.8pt !important;
          }

          td {
            font-size: 6.4pt !important;
          }

          .print-border-thick {
            border-top: 1.5pt solid black !important;
          }

          .print-agent-row td {
            background-color: #e2e8f0 !important;
            font-size: 7pt !important;
            font-weight: 700 !important;
          }

          .print-bg-red {
            background-color: #fee2e2 !important;
            color: #dc2626 !important;
          }
        }
      `,
                }}
            />
        </CompanyDashboardLayout>
    );
}
