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
import { DownloadIcon, FileIcon } from 'lucide-react';
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

  useEffect(() => {
    if (value) {
      const t = tours.find((x) => x.id.toString() === value.toString());
      if (t) setQuery(`${t.code} - ${t.name}`);
    } else {
      setQuery('');
    }
  }, [value, tours]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = tours.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.code.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="relative w-full" ref={ref}>
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (e.target.value === '') onChange('');
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search tour code or name..."
        className="w-full bg-white dark:bg-slate-900 dark:text-white dark:border-slate-700 h-10 rounded-lg"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filtered.map((t) => (
            <li
              key={t.id}
              className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm dark:text-slate-200"
              onClick={() => {
                setQuery(`${t.code} - ${t.name}`);
                onChange(t.id.toString());
                setOpen(false);
              }}
            >
              <span className="font-semibold">{t.code}</span> - {t.name}
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

  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    return dayjs().diff(dayjs(dob), 'year');
  };

  const calculateValidity = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    return dayjs(expiryDate).diff(
      dayjs(filters.departure_date || new Date()),
      'month',
    );
  };

  const selectedTour = useMemo(() => {
    return tours.find(
      (t: any) => t.id.toString() === filters.tour_id?.toString(),
    );
  }, [tours, filters.tour_id]);

  // Fungsi aman untuk Print Native menggunakan setTimeout agar tidak diblokir React Render
  const handlePrintNative = (e: React.MouseEvent) => {
    e.preventDefault();
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (filters.tour_id) params.append('tour_id', filters.tour_id);
    if (filters.departure_date)
      params.append('departure_date', filters.departure_date);
    window.location.href = `/companies/${company.username}/dashboard/reports/room-listings/export/excel?${params.toString()}`;
  };

  const handleExportPDF = () => {
    const params = new URLSearchParams();
    if (filters.tour_id) params.append('tour_id', filters.tour_id);
    if (filters.departure_date)
      params.append('departure_date', filters.departure_date);
    window.open(
      `/companies/${company.username}/dashboard/reports/room-listings/export/pdf?${params.toString()}`,
      '_blank',
    );
  };

  const groupedData = useMemo(() => {
    const groups: Record<string, Record<string, typeof roomData>> = {};
    if (!roomData) return groups;

    roomData.forEach((row: any) => {
      if (!groups[row.booking_number]) {
        groups[row.booking_number] = {};
      }
      const rt = row.room_type || 'TBA';
      if (!groups[row.booking_number][rt]) {
        groups[row.booking_number][rt] = [];
      }
      groups[row.booking_number][rt].push(row);
    });
    return groups;
  }, [roomData]);

  let globalIndex = 1;
  let bookingCounter = 0;

  return (
    <CompanyDashboardLayout
      openMenuIds={['reports']}
      activeMenuIds={['reports.room-listings']}
      breadcrumb={[{ title: 'Reports' }, { title: 'Room Listing' }]}
    >
      <Head title="Room Listing" />

      {/* ID print-area ini yang akan menjadi patokan utama CSS print */}
      <div
        id="print-area"
        className="mx-auto max-w-[1600px] p-4 md:p-6 lg:p-8 w-full print:p-0 print:m-0"
      >
        {/* HEADER KHUSUS PRINT */}
        <div className="hidden print:flex items-center justify-between border-b-2 border-black pb-4 mb-4">
          <div className="flex items-center gap-6">
            {company.photo_url && (
              <img
                src={company.photo_url}
                alt="Logo"
                className="h-12 w-auto object-contain"
              />
            )}
            <div>
              <h1 className="text-2xl font-black leading-none text-black uppercase tracking-tight">
                ROOM LISTING
              </h1>
              <p className="text-sm font-bold text-black mt-1 uppercase">
                {company.name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-black">
              {selectedTour
                ? `${selectedTour.code} - ${selectedTour.name}`
                : 'All Tours'}
            </div>
            <div className="text-xs font-semibold text-black mt-1">
              Departure:{' '}
              {filters.departure_date
                ? dayjs(filters.departure_date).format('DD MMMM YYYY')
                : 'All Dates'}
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Rooming List
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Professional participant management with status filter.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* <Button
              variant="outline"
              className="gap-2 bg-white dark:bg-slate-900 dark:text-white border-slate-200 dark:border-slate-700 h-10"
              onClick={handlePrintNative}
              disabled={!roomData?.length}
            >
              <PrinterIcon size={16} /> Print
            </Button> */}
            <Button
              variant="outline"
              className="gap-2 bg-red-50 text-red-600 hover:bg-red-100 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50 h-10"
              onClick={handleExportPDF}
              disabled={!roomData?.length}
            >
              <FileIcon size={16} /> Export PDF
            </Button>
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-10 shadow-sm"
              onClick={handleExportExcel}
              disabled={!roomData?.length}
            >
              <DownloadIcon size={16} /> Export Excel
            </Button>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 shadow-sm print:hidden">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                Tour Product
              </label>
              <TourAutocomplete
                tours={tours}
                value={filters.tour_id || ''}
                onChange={(val) =>
                  router.get(
                    window.location.pathname,
                    { ...filters, tour_id: val },
                    { preserveState: true },
                  )
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                Departure Date
              </label>
              <Select
                value={filters.departure_date || 'all'}
                onValueChange={(val) =>
                  router.get(
                    window.location.pathname,
                    { ...filters, departure_date: val === 'all' ? '' : val },
                    { preserveState: true },
                  )
                }
              >
                <SelectTrigger className="bg-white dark:bg-slate-900 dark:text-white dark:border-slate-700 h-10 rounded-lg">
                  <SelectValue placeholder="All Departure Dates" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 dark:border-slate-700">
                  <SelectItem value="all" className="dark:focus:bg-slate-800">
                    All Dates
                  </SelectItem>
                  {availableDates.map((date: string) => (
                    <SelectItem
                      key={date}
                      value={date}
                      className="dark:focus:bg-slate-800"
                    >
                      {dayjs(date).format('DD MMM YYYY')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {roomData && roomData.length > 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm print:border-none print:shadow-none print:bg-transparent">
            <div className="overflow-x-auto print:overflow-visible">
              <Table className="w-full border-collapse print:table-fixed">
                <TableHeader className="bg-slate-50 dark:bg-slate-900 print:bg-slate-100">
                  <TableRow className="border-b border-slate-200 dark:border-slate-800">
                    <TableHead className="border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-900 dark:text-slate-200 px-2 py-3 text-[11px] uppercase print:w-[3%]">
                      No
                    </TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-200 px-3 py-3 text-[11px] uppercase min-w-[180px] print:w-[15%]">
                      Passenger Name
                    </TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-900 dark:text-slate-200 px-2 py-3 text-[11px] uppercase print:w-[7%]">
                      Room Type
                    </TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-900 dark:text-slate-200 px-2 py-3 text-[11px] uppercase min-w-[50px] print:w-[4%]">
                      Room
                    </TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-900 dark:text-slate-200 px-2 py-3 text-[11px] uppercase min-w-[50px] print:w-[4%]">
                      Seat
                    </TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-900 dark:text-slate-200 px-2 py-3 text-[11px] uppercase print:w-[4%]">
                      Visa
                    </TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-200 px-3 py-3 text-[11px] uppercase min-w-[140px] print:w-[12%]">
                      Remarks
                    </TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-200 px-2 py-3 text-[11px] uppercase print:w-[9%]">
                      Passport Number
                    </TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-200 px-2 py-3 text-[11px] uppercase print:w-[8%]">
                      Place of Issue
                    </TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-900 dark:text-slate-200 px-2 py-3 text-[11px] uppercase print:w-[7%]">
                      Date of Issue
                    </TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-900 dark:text-slate-200 px-2 py-3 text-[11px] uppercase print:w-[7%]">
                      Date of Expired
                    </TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-200 px-2 py-3 text-[11px] uppercase print:w-[7%]">
                      Place of Birth
                    </TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-900 dark:text-slate-200 px-2 py-3 text-[11px] uppercase print:w-[7%]">
                      Date of Birth
                    </TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-900 dark:text-slate-200 px-2 py-3 text-[11px] uppercase print:w-[8%]">
                      Contact
                    </TableHead>
                    <TableHead className="border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-900 dark:text-slate-200 px-2 py-3 text-[11px] uppercase print:w-[3%]">
                      Age
                    </TableHead>
                    <TableHead className="text-center font-bold text-slate-900 dark:text-slate-200 px-2 py-3 text-[11px] uppercase print:w-[3%]">
                      Val
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedData).map(
                    ([bookingNum, roomGroups]) => {
                      bookingCounter++;
                      const rowBgClass =
                        bookingCounter % 2 === 0
                          ? 'bg-slate-50/50 dark:bg-slate-900/30'
                          : 'bg-white dark:bg-slate-950';
                      const totalPaxInBooking = Object.values(
                        roomGroups,
                      ).reduce((acc, curr) => acc + curr.length, 0);

                      return Object.entries(roomGroups).map(
                        ([roomType, paxList], roomIdx) => {
                          return paxList.map((row: any, paxIdx: number) => {
                            const isFirstInBooking =
                              roomIdx === 0 && paxIdx === 0;
                            const isFirstInRoom = paxIdx === 0;
                            const totalPaxInRoom = paxList.length;
                            const fullName =
                              `${row.title ? row.title + '. ' : ''}${row.first_name} ${row.last_name || ''}`.trim();
                            const isPassportWarning =
                              row.passport_expiry_date &&
                              dayjs(row.passport_expiry_date).diff(
                                dayjs(filters.departure_date || new Date()),
                                'month',
                              ) < 6;

                            return (
                              <TableRow
                                key={`${bookingNum}-${roomType}-${paxIdx}`}
                                className={`border-b border-slate-200 dark:border-slate-800 ${rowBgClass} ${isFirstInBooking ? 'border-t-2 border-t-slate-400 dark:border-t-slate-500 print-border-thick' : ''} print:break-inside-avoid hover:bg-slate-50 dark:hover:bg-slate-900/50`}
                              >
                                <TableCell className="border-r border-slate-200 dark:border-slate-800 text-center p-2 text-[12px] dark:text-slate-300 font-medium">
                                  {globalIndex++}
                                </TableCell>
                                <TableCell className="border-r border-slate-200 dark:border-slate-800 p-2 text-[12px] font-bold text-slate-900 dark:text-white">
                                  {fullName}
                                </TableCell>
                                {isFirstInRoom && (
                                  <>
                                    <TableCell
                                      rowSpan={totalPaxInRoom}
                                      className="border-r border-slate-200 dark:border-slate-800 text-center p-2 text-[11px] font-medium align-middle uppercase print:bg-transparent"
                                    >
                                      {roomType}
                                    </TableCell>
                                    <TableCell
                                      rowSpan={totalPaxInRoom}
                                      className="border-r border-slate-200 dark:border-slate-800 p-2"
                                    ></TableCell>
                                  </>
                                )}
                                <TableCell className="border-r border-slate-200 dark:border-slate-800 p-2"></TableCell>
                                <TableCell className="border-r border-slate-200 dark:border-slate-800 text-center p-2 text-[11px] dark:text-slate-300">
                                  {row.visa_number ? 'YES' : '-'}
                                </TableCell>
                                <TableCell className="border-r border-slate-200 dark:border-slate-800 p-2 text-[11px] text-slate-500 dark:text-slate-400 italic leading-tight">
                                  {row.contact_notes || '-'}
                                </TableCell>
                                <TableCell className="border-r border-slate-200 dark:border-slate-800 p-2 text-[12px] dark:text-slate-300 font-mono tracking-tighter">
                                  {row.passport_number || '-'}
                                </TableCell>
                                <TableCell className="border-r border-slate-200 dark:border-slate-800 p-2 text-[11px] dark:text-slate-300 uppercase">
                                  {row.passport_issue_place || '-'}
                                </TableCell>
                                <TableCell className="border-r border-slate-200 dark:border-slate-800 text-center p-2 text-[11px] dark:text-slate-300">
                                  {row.passport_issue_date
                                    ? dayjs(row.passport_issue_date).format(
                                        'DD/MM/YYYY',
                                      )
                                    : '-'}
                                </TableCell>
                                <TableCell className="border-r border-slate-200 dark:border-slate-800 text-center p-2 text-[11px] font-bold dark:text-slate-200">
                                  {row.passport_expiry_date
                                    ? dayjs(row.passport_expiry_date).format(
                                        'DD/MM/YYYY',
                                      )
                                    : '-'}
                                </TableCell>
                                <TableCell className="border-r border-slate-200 dark:border-slate-800 p-2 text-[11px] dark:text-slate-300 uppercase">
                                  {row.pob || '-'}
                                </TableCell>
                                <TableCell className="border-r border-slate-200 dark:border-slate-800 text-center p-2 text-[11px] dark:text-slate-300">
                                  {row.dob
                                    ? dayjs(row.dob).format('DD/MM/YYYY')
                                    : '-'}
                                </TableCell>

                                {isFirstInBooking && (
                                  <TableCell
                                    rowSpan={totalPaxInBooking}
                                    className="border-r border-slate-200 dark:border-slate-800 text-center p-2 text-[10px] dark:text-slate-400 align-middle"
                                  >
                                    {row.contact_phone || '-'}
                                  </TableCell>
                                )}

                                <TableCell className="border-r border-slate-200 dark:border-slate-800 text-center p-2 text-[12px] dark:text-slate-300">
                                  {calculateAge(row.dob) || '-'}
                                </TableCell>
                                <TableCell
                                  className={`text-center p-2 text-[12px] font-black ${isPassportWarning ? 'text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/20 print-bg-red' : 'dark:text-slate-300'}`}
                                >
                                  {calculateValidity(
                                    row.passport_expiry_date,
                                  ) || '-'}
                                </TableCell>
                              </TableRow>
                            );
                          });
                        },
                      );
                    },
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="p-16 text-center text-slate-400 dark:text-slate-600 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-900/50 print:hidden">
            <p className="text-lg font-medium">
              Select parameters to load the professional Rooming List.
            </p>
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: landscape A4; margin: 8mm; }
          html, body { 
            background: white !important; 
            -webkit-print-color-adjust: exact; 
            color-adjust: exact; 
            height: auto !important; 
            overflow: visible !important;
            min-height: auto !important;
          }
          
          header, nav, aside, footer, .print\\:hidden { display: none !important; }
          
          main, .overflow-y-auto { 
            height: auto !important; 
            overflow: visible !important; 
            position: static !important;
          }
          
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; color: black !important; }
          
          #print-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            margin: 0; 
            padding: 0; 
          }
          
          table { width: 100% !important; border: 1px solid black !important; }
          th, td { border: 0.5pt solid black !important; padding: 4px 3px !important; background-color: transparent !important; }
          th { background-color: #f1f5f9 !important; font-weight: bold !important; font-size: 7.5pt !important; }
          td { font-size: 7pt !important; word-wrap: break-word; }
          
          .print-border-thick { border-top: 1.5pt solid black !important; }
          
          .print-bg-red { background-color: #fee2e2 !important; color: #dc2626 !important; }
        }
      `,
        }}
      />
    </CompanyDashboardLayout>
  );
}
