import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Button } from '@/components/ui/button';
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
import { Head, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import { DownloadIcon, PrinterIcon } from 'lucide-react';

type RoomListingProps = {
  tours: { id: number; name: string; code: string }[];
  availableDates: string[];
  roomData: {
    booking_number: string;
    agent_name: string;
    contact_phone: string | null;
    contact_notes: string | null;
    title: string | null;
    first_name: string;
    last_name: string | null;
    gender: string | null;
    dob: string | null;
    pob: string | null;
    passport_number: string | null;
    passport_issue_date: string | null;
    passport_expiry_date: string | null;
    room_type: string | null;
    price_category: string | null;
    visa_number: string | null;
  }[];
  filters: {
    tour_id?: string;
    departure_date?: string;
  };
};

export default function RoomListingIndex({
  tours,
  availableDates,
  roomData,
  filters,
}: RoomListingProps) {
  const { company } = usePageSharedDataProps();

  const handleTourChange = (val: string) => {
    router.get(
      `/companies/${company.username}/dashboard/reports/room-listings`,
      { tour_id: val },
      { preserveState: true },
    );
  };

  const handleDateChange = (val: string) => {
    router.get(
      `/companies/${company.username}/dashboard/reports/room-listings`,
      { tour_id: filters.tour_id, departure_date: val },
      { preserveState: true },
    );
  };

  // Fungsi Kalkulasi Umur & Masa Berlaku Paspor
  const calculateAge = (dob: string | null) => {
    if (!dob || !filters.departure_date) return '';
    return dayjs(filters.departure_date).diff(dayjs(dob), 'year');
  };

  const calculateValidity = (expiry: string | null) => {
    if (!expiry || !filters.departure_date) return '';
    // Mengembalikan angka desimal untuk memantau jika paspor sisa < 6 bulan
    return dayjs(expiry)
      .diff(dayjs(filters.departure_date), 'month', true)
      .toFixed(1);
  };

  const exportToCSV = () => {
    const headers = [
      'No',
      'M/F',
      'Name',
      'Type Room',
      'Room',
      'SEAT',
      'VISA',
      'Remarks',
      'No Passport',
      'Place of Issue',
      'Date of Issue',
      'Date of Expired',
      'Place of Birth',
      'Date of Birth',
      'Code Booking',
      'Contact',
      'Umur',
      'Masa Berlaku (Bulan)',
    ];

    const rows = roomData.map((row, index) => {
      const name = [row.first_name, row.last_name].filter(Boolean).join(' ');
      const titleOrGender = row.title || row.gender || '';
      const remarks = [row.agent_name, row.contact_notes]
        .filter(Boolean)
        .join(' // ');

      return [
        index + 1,
        titleOrGender,
        name,
        row.room_type || row.price_category || '',
        '', // Room (Dikosongkan untuk diisi manual TL)
        '', // SEAT (Dikosongkan untuk diisi manual TL)
        row.visa_number || '',
        remarks,
        row.passport_number || '',
        '', // Place of Issue
        row.passport_issue_date || '',
        row.passport_expiry_date || '',
        row.pob || '',
        row.dob || '',
        row.booking_number,
        row.contact_phone || '',
        calculateAge(row.dob),
        calculateValidity(row.passport_expiry_date),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    // \uFEFF adalah penanda BOM agar Microsoft Excel mengenali CSV ini sebagai UTF-8 murni
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `ROOMING_LIST_${filters.departure_date || 'EXPORT'}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const selectedTour = tours.find(
    (t) => String(t.id) === String(filters.tour_id),
  );

  return (
    <CompanyDashboardLayout
      openMenuIds={['reports']}
      activeMenuIds={['reports.room-listings']}
      breadcrumb={[{ title: 'Reports' }, { title: 'Room Listings' }]}
    >
      <Head title="Room Listings" />

      <div className="w-full space-y-6 p-4 md:p-6 max-w-screen-2xl mx-auto pb-20">
        {/* -- Area Header & Filter (Disembunyikan saat di Print) -- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Room Listings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Filter by Tour and Departure Date to arrange rooms for Tour
              Leaders.
            </p>
          </div>

          {roomData.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={exportToCSV}
                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download Excel
              </Button>
              <Button onClick={handlePrintPDF} variant="secondary">
                <PrinterIcon className="mr-2 h-4 w-4" />
                Print PDF
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50 border rounded-lg print:hidden">
          <div className="flex flex-col gap-1.5 w-full sm:w-[350px]">
            <label className="text-xs font-semibold text-slate-600 uppercase">
              Select Tour
            </label>
            <Select
              value={filters.tour_id ? String(filters.tour_id) : undefined}
              onValueChange={handleTourChange}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Choose a tour..." />
              </SelectTrigger>
              <SelectContent>
                {tours.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 w-full sm:w-[250px]">
            <label className="text-xs font-semibold text-slate-600 uppercase">
              Departure Date
            </label>
            <Select
              value={filters.departure_date}
              onValueChange={handleDateChange}
              disabled={!filters.tour_id || availableDates.length === 0}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Choose date..." />
              </SelectTrigger>
              <SelectContent>
                {availableDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {dayjs(date).format('DD MMM YYYY')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* -- Area Cetak Judul (Hanya Muncul saat PDF/Print) -- */}
        <div className="hidden print:block mb-4 text-center">
          <h2 className="text-xl font-bold uppercase">ROOMING LIST</h2>
          <p className="text-sm font-semibold">
            {selectedTour?.name} - DEP:{' '}
            {filters.departure_date
              ? dayjs(filters.departure_date).format('DD MMM YYYY')
              : ''}
          </p>
        </div>

        {roomData.length > 0 ? (
          <div className="rounded-xl border border-border bg-card shadow-sm w-full overflow-hidden print:border-none print:shadow-none print:rounded-none">
            {/* Menggunakan overflow-x-auto agar tabel rapi seperti Excel */}
            <div className="w-full overflow-x-auto scrollbar-thin">
              <Table className="w-max min-w-full text-[11px] print:text-[9px]">
                <TableHeader className="bg-slate-200 print:bg-slate-100">
                  <TableRow className="border-b border-slate-300">
                    <TableHead className="font-bold border-r border-slate-300 text-center px-2">
                      No
                    </TableHead>
                    <TableHead className="font-bold border-r border-slate-300 px-2">
                      M/F
                    </TableHead>
                    <TableHead className="font-bold border-r border-slate-300 px-2 min-w-[150px]">
                      Name
                    </TableHead>
                    <TableHead className="font-bold border-r border-slate-300 px-2">
                      Type Room
                    </TableHead>
                    <TableHead className="font-bold border-r border-slate-300 px-2 min-w-[60px]">
                      Room
                    </TableHead>
                    <TableHead className="font-bold border-r border-slate-300 px-2 min-w-[60px]">
                      SEAT
                    </TableHead>
                    <TableHead className="font-bold border-r border-slate-300 px-2">
                      VISA
                    </TableHead>
                    <TableHead className="font-bold border-r border-slate-300 px-2 max-w-[150px]">
                      Remarks
                    </TableHead>
                    <TableHead className="font-bold border-r border-slate-300 px-2">
                      No Passport
                    </TableHead>
                    <TableHead className="font-bold border-r border-slate-300 px-2">
                      Place of Issue
                    </TableHead>
                    <TableHead className="font-bold border-r border-slate-300 px-2">
                      Date of Issue
                    </TableHead>
                    <TableHead className="font-bold border-r border-slate-300 px-2">
                      Date of Expired
                    </TableHead>
                    <TableHead className="font-bold border-r border-slate-300 px-2">
                      Place of Birth
                    </TableHead>
                    <TableHead className="font-bold border-r border-slate-300 px-2">
                      Date of Birth
                    </TableHead>
                    <TableHead className="font-bold border-r border-slate-300 px-2">
                      Code Booking
                    </TableHead>
                    <TableHead className="font-bold border-r border-slate-300 px-2">
                      Contact
                    </TableHead>
                    <TableHead className="font-bold border-r border-slate-300 text-center px-2">
                      Umur
                    </TableHead>
                    <TableHead className="font-bold text-center px-2">
                      Masa Berlaku
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomData.map((row, idx) => {
                    // Cek jika paspor akan mati dalam waktu dekat (< 6 bulan)
                    const validityNum = Number(
                      calculateValidity(row.passport_expiry_date),
                    );
                    const isPassportWarning =
                      validityNum > 0 && validityNum < 6;

                    return (
                      <TableRow
                        key={idx}
                        className="hover:bg-slate-50 border-b border-slate-200"
                      >
                        <TableCell className="border-r border-slate-200 text-center px-2 py-1.5">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="border-r border-slate-200 px-2 py-1.5">
                          {row.title || row.gender || '-'}
                        </TableCell>
                        <TableCell className="border-r border-slate-200 px-2 py-1.5 font-bold uppercase">
                          {row.first_name} {row.last_name}
                        </TableCell>
                        <TableCell className="border-r border-slate-200 px-2 py-1.5">
                          {row.room_type || row.price_category}
                        </TableCell>
                        <TableCell className="border-r border-slate-200 px-2 py-1.5"></TableCell>
                        <TableCell className="border-r border-slate-200 px-2 py-1.5"></TableCell>
                        <TableCell className="border-r border-slate-200 px-2 py-1.5">
                          {row.visa_number || '-'}
                        </TableCell>
                        <TableCell className="border-r border-slate-200 px-2 py-1.5 text-[9px] max-w-[150px] truncate">
                          {row.agent_name}{' '}
                          {row.contact_notes ? `// ${row.contact_notes}` : ''}
                        </TableCell>
                        <TableCell className="border-r border-slate-200 px-2 py-1.5 font-mono">
                          {row.passport_number || '-'}
                        </TableCell>
                        <TableCell className="border-r border-slate-200 px-2 py-1.5">
                          -
                        </TableCell>
                        <TableCell className="border-r border-slate-200 px-2 py-1.5">
                          {row.passport_issue_date || '-'}
                        </TableCell>
                        <TableCell className="border-r border-slate-200 px-2 py-1.5">
                          {row.passport_expiry_date || '-'}
                        </TableCell>
                        <TableCell className="border-r border-slate-200 px-2 py-1.5 uppercase">
                          {row.pob || '-'}
                        </TableCell>
                        <TableCell className="border-r border-slate-200 px-2 py-1.5">
                          {row.dob || '-'}
                        </TableCell>
                        <TableCell className="border-r border-slate-200 px-2 py-1.5 font-mono text-[9px]">
                          {row.booking_number}
                        </TableCell>
                        <TableCell className="border-r border-slate-200 px-2 py-1.5 whitespace-nowrap">
                          {row.contact_phone || '-'}
                        </TableCell>
                        <TableCell className="border-r border-slate-200 px-2 py-1.5 text-center">
                          {calculateAge(row.dob) || '-'}
                        </TableCell>
                        <TableCell
                          className={`px-2 py-1.5 text-center font-semibold ${isPassportWarning ? 'text-red-600 bg-red-50' : ''}`}
                        >
                          {calculateValidity(row.passport_expiry_date) || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 border rounded-lg border-dashed bg-slate-50 print:hidden">
            <p>
              Pilih Tour dan Tanggal Keberangkatan untuk memuat Rooming List.
            </p>
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: landscape; margin: 10mm; }
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; visibility: visible; }
          .max-w-screen-2xl, .max-w-screen-2xl * { visibility: visible; }
          .max-w-screen-2xl { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
        }
      `,
        }}
      />
    </CompanyDashboardLayout>
  );
}
