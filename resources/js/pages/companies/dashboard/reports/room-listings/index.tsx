import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
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
    FileIcon,
    InfoIcon,
    PrinterIcon,
    RotateCcwIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const TourAutocomplete = ({
    tours,
    value,
    onChange,
}: {
    tours: any[];
    value: string;
    onChange: (val: string) => void;
}) => {
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
                placeholder="Search tour code or name..."
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
    const { tours, availableDates, roomData, filters } = usePage<any>().props;
    const { company } = usePageSharedDataProps();

    const hasTourSelected = Boolean(filters.tour_id);
    const hasDepartureSelected = Boolean(filters.departure_date);
    const hasCompleteFilters = hasTourSelected && hasDepartureSelected;

    const calculateAge = (dateOfBirth: string | null) => {
        if (!dateOfBirth) {
            return null;
        }

        return dayjs().diff(dayjs(dateOfBirth), 'year');
    };

    const calculateValidity = (expiryDate: string | null) => {
        if (!expiryDate || !filters.departure_date) {
            return null;
        }

        return Math.round(
            dayjs(expiryDate).diff(dayjs(filters.departure_date), 'month'),
        );
    };

    const selectedTour = useMemo(() => {
        return tours.find(
            (tour: any) => tour.id.toString() === filters.tour_id?.toString(),
        );
    }, [tours, filters.tour_id]);

    const groupedData = useMemo(() => {
        const groups: Record<string, Record<string, typeof roomData>> = {};

        if (!roomData) {
            return groups;
        }

        roomData.forEach((row: any) => {
            if (!groups[row.booking_number]) {
                groups[row.booking_number] = {};
            }

            const roomType = row.room_type || 'TBA';

            if (!groups[row.booking_number][roomType]) {
                groups[row.booking_number][roomType] = [];
            }

            groups[row.booking_number][roomType].push(row);
        });

        return groups;
    }, [roomData]);

    const handlePrintNative = (event: React.MouseEvent) => {
        event.preventDefault();
        setTimeout(() => {
            window.print();
        }, 150);
    };

    const buildExportQuery = () => {
        const params = new URLSearchParams();

        if (filters.tour_id) {
            params.append('tour_id', filters.tour_id);
        }

        if (filters.departure_date) {
            params.append('departure_date', filters.departure_date);
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

    let globalIndex = 1;
    let bookingCounter = 0;

    return (
        <CompanyDashboardLayout
            openMenuIds={['reports']}
            activeMenuIds={['reports.room-listings']}
            breadcrumb={[{ title: 'Reports' }, { title: 'Room Listing' }]}
            containerClassName="min-h-screen bg-slate-50/60 dark:bg-slate-950"
        >
            <Head title="Room Listing" />

            <div
                id="print-area"
                className="mx-auto w-full max-w-[1600px] p-4 print:m-0 print:max-w-none print:p-0 md:p-6 lg:p-8"
            >
                <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:hidden">
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
                        <div className="min-w-0">
                            <div>
                                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                    Tour Product
                                </label>
                                <TourAutocomplete
                                    tours={tours}
                                    value={filters.tour_id || ''}
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
                        </div>

                        <div className="min-w-0">
                            <div>
                                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                    Departure Date
                                </label>
                                <div className="flex gap-2">
                                    <Select
                                        value={
                                            filters.departure_date || undefined
                                        }
                                        onValueChange={(value) =>
                                            router.get(
                                                window.location.pathname,
                                                {
                                                    ...filters,
                                                    departure_date: value,
                                                },
                                                { preserveState: true },
                                            )
                                        }
                                        disabled={!hasTourSelected}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                                            <SelectValue
                                                placeholder={
                                                    hasTourSelected
                                                        ? 'Select departure date'
                                                        : 'Select a tour product first'
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent className="dark:border-slate-700 dark:bg-slate-900">
                                            {availableDates.map(
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
                                        size="icon"
                                        className="h-11 w-11 shrink-0 rounded-xl border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                        onClick={handleResetFilters}
                                        disabled={
                                            !hasTourSelected &&
                                            !hasDepartureSelected
                                        }
                                        title="Reset search"
                                    >
                                        <RotateCcwIcon size={16} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6 flex flex-col gap-3 print:hidden xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex max-w-2xl items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
                        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>
                            Only tour bookings with full payment status are
                            displayed in this room listing report.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                        <Button
                            variant="outline"
                            className="h-11 min-w-[148px] justify-center gap-2 rounded-xl border-slate-200 bg-white px-5 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                            onClick={handlePrintNative}
                            disabled={!hasCompleteFilters || !roomData?.length}
                        >
                            <PrinterIcon size={16} /> Print
                        </Button>
                        <Button
                            variant="outline"
                            className="h-11 min-w-[148px] justify-center gap-2 rounded-xl border-red-200 bg-red-50 px-5 text-red-600 shadow-sm transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                            onClick={handleExportPDF}
                            disabled={!hasCompleteFilters || !roomData?.length}
                        >
                            <FileIcon size={16} /> Export PDF
                        </Button>
                        <Button
                            className="h-11 min-w-[148px] justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-white shadow-sm transition hover:bg-emerald-700"
                            onClick={handleExportExcel}
                            disabled={!hasCompleteFilters || !roomData?.length}
                        >
                            <DownloadIcon size={16} /> Export Excel
                        </Button>
                    </div>
                </div>

                <div className="mb-5 hidden items-start justify-between border-b-2 border-black pb-4 print:flex">
                    <div className="flex items-center gap-5">
                        {company.photo_url && (
                            <img
                                src={company.photo_url}
                                alt="Company logo"
                                className="h-14 w-auto object-contain"
                            />
                        )}
                        <div>
                            <h1 className="text-[22px] font-black uppercase tracking-tight text-black">
                                Room Listing
                            </h1>
                            <p className="mt-1 text-[11px] font-bold uppercase text-black">
                                {company.name}
                            </p>
                        </div>
                    </div>

                    <div className="text-right text-black">
                        <div className="text-[11px] font-bold uppercase">
                            {selectedTour
                                ? `${selectedTour.code} - ${selectedTour.name}`
                                : 'No Tour Selected'}
                        </div>
                        <div className="mt-1 text-[10px] font-semibold">
                            Departure Date:{' '}
                            {filters.departure_date
                                ? dayjs(filters.departure_date).format(
                                      'DD MMMM YYYY',
                                  )
                                : 'Not selected'}
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
                                            No
                                        </TableHead>
                                        <TableHead className="min-w-[200px] border-r border-slate-200 px-3 py-3 text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[18%]">
                                            Passenger Name
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[8%]">
                                            Room Type
                                        </TableHead>
                                        <TableHead className="min-w-[56px] border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[4%]">
                                            Room
                                        </TableHead>
                                        <TableHead className="min-w-[56px] border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[4%]">
                                            Seat
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[4%]">
                                            Visa
                                        </TableHead>
                                        <TableHead className="min-w-[150px] border-r border-slate-200 px-3 py-3 text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[14%]">
                                            Remarks
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[10%]">
                                            Passport Number
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[8%]">
                                            Issue Date
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[8%]">
                                            Expiry Date
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[8%]">
                                            Place of Birth
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[8%]">
                                            Date of Birth
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[9%]">
                                            Contact
                                        </TableHead>
                                        <TableHead className="border-r border-slate-200 px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:border-slate-800 dark:text-slate-200 print:w-[4%]">
                                            Age
                                        </TableHead>
                                        <TableHead className="px-2 py-3 text-center text-[11px] font-bold uppercase text-slate-900 dark:text-slate-200 print:w-[4%]">
                                            Val
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(groupedData).map(
                                        ([bookingNumber, roomGroups]) => {
                                            bookingCounter++;

                                            const rowBgClass =
                                                bookingCounter % 2 === 0
                                                    ? 'bg-slate-50/50 dark:bg-slate-900/30'
                                                    : 'bg-white dark:bg-slate-950';

                                            const totalPaxInBooking =
                                                Object.values(
                                                    roomGroups,
                                                ).reduce(
                                                    (count, rows) =>
                                                        count + rows.length,
                                                    0,
                                                );

                                            return Object.entries(
                                                roomGroups,
                                            ).map(
                                                (
                                                    [roomType, passengerList],
                                                    roomIndex,
                                                ) => {
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
                                                                `${row.title ? row.title + '. ' : ''}${row.first_name} ${row.last_name || ''}`.trim();
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
                                                                    key={`${bookingNumber}-${roomType}-${passengerIndex}`}
                                                                    className={`border-b border-slate-200 dark:border-slate-800 ${rowBgClass} ${isFirstInBooking ? 'border-t-2 border-t-slate-400 dark:border-t-slate-500 print-border-thick' : ''} break-inside-avoid hover:bg-slate-50 dark:hover:bg-slate-900/50`}
                                                                >
                                                                    <TableCell className="border-r border-slate-200 p-2 text-center text-[12px] font-medium dark:border-slate-800 dark:text-slate-300">
                                                                        {
                                                                            globalIndex++
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell className="border-r border-slate-200 p-2 text-[12px] font-bold text-slate-900 dark:border-slate-800 dark:text-white">
                                                                        {
                                                                            fullName
                                                                        }
                                                                    </TableCell>
                                                                    {isFirstInRoom && (
                                                                        <>
                                                                            <TableCell
                                                                                rowSpan={
                                                                                    totalPaxInRoom
                                                                                }
                                                                                className="border-r border-slate-200 p-2 text-center align-middle text-[11px] font-medium uppercase dark:border-slate-800"
                                                                            >
                                                                                {
                                                                                    roomType
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
                                                                    <TableCell className="border-r border-slate-200 p-2 text-center text-[11px] dark:border-slate-800 dark:text-slate-300" />
                                                                    <TableCell className="border-r border-slate-200 p-2 text-[11px] italic leading-tight text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                                                        {row.note ||
                                                                            row.contact_notes ||
                                                                            '-'}
                                                                    </TableCell>
                                                                    <TableCell className="border-r border-slate-200 p-2 font-mono text-[12px] tracking-tighter dark:border-slate-800 dark:text-slate-300">
                                                                        {row.passport_number ||
                                                                            '-'}
                                                                    </TableCell>
                                                                    <TableCell className="border-r border-slate-200 p-2 text-center text-[11px] dark:border-slate-800 dark:text-slate-300">
                                                                        {row.passport_issue_date
                                                                            ? dayjs(
                                                                                  row.passport_issue_date,
                                                                              ).format(
                                                                                  'DD/MM/YYYY',
                                                                              )
                                                                            : '-'}
                                                                    </TableCell>
                                                                    <TableCell className="border-r border-slate-200 p-2 text-center text-[11px] font-bold dark:border-slate-800 dark:text-slate-200">
                                                                        {row.passport_expiry_date
                                                                            ? dayjs(
                                                                                  row.passport_expiry_date,
                                                                              ).format(
                                                                                  'DD/MM/YYYY',
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
                                                                                  'DD/MM/YYYY',
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
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-16 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-600 print:hidden">
                        <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
                            {hasTourSelected
                                ? 'Select a departure date to generate the room listing.'
                                : 'Select a tour product first, then choose a departure date.'}
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
          }

          th, td {
            border: 0.5pt solid black !important;
            padding: 4px 3px !important;
            background-color: transparent !important;
            word-break: break-word;
            white-space: normal !important;
          }

          th {
            background-color: #f1f5f9 !important;
            font-weight: bold !important;
            font-size: 7.4pt !important;
          }

          td {
            font-size: 7pt !important;
          }

          .print-border-thick {
            border-top: 1.5pt solid black !important;
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
