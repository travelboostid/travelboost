// import { update } from '@/actions/App/Http/Controllers/Companies/Dashboard/TourController';
// import type { MediaResource } from '@/api/model';
// import InputError from '@/components/input-error';
// import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
// import { MediaPicker } from '@/components/media-picker';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import {
//     Select,
//     SelectContent,
//     SelectGroup,
//     SelectItem,
//     SelectLabel,
//     SelectTrigger,
//     SelectValue,
// } from '@/components/ui/select';
// import { Spinner } from '@/components/ui/spinner';
// import { Textarea } from '@/components/ui/textarea';
// import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
// import { extractImageSrc } from '@/lib/utils';
// import { router, useForm, usePage } from '@inertiajs/react';
// import { useMemo, useState } from 'react';
// import { toast } from 'sonner';
// import SelectCategory from './components/select-category';
// import SelectContinent from './components/select-continent';
// import SelectCountry from './components/select-country';
// import SelectCurrency from './components/select-currency';
// import SelectRegion from './components/select-region';

// import { useEffect } from 'react';

// import { Fragment } from 'react';

// import { TourDocumentPicker } from '@/components/media/tour-document-picker';
// import MoneyInput from '@/components/ui/money-input';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Copy, Save, Trash2 } from 'lucide-react';

// import { Calendar } from '@/components/ui/calendar';
// import {
//     Dialog,
//     DialogContent,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle,
// } from '@/components/ui/dialog';
// import { format } from 'date-fns';

// ///////////tab 2
// type RoomPrice = {
//     room_type_id: number | null;
//     price: string;
//     promotion: Adjustment;
//     commission: Adjustment;
// };

// type Adjustment = {
//     type: 'percent' | 'value';
//     value: string;
// };

// type Schedule = {
//     id?: number;
//     departure_date: string;
//     return_date: string;
//     prices: RoomPrice[];
//     //promotion: Adjustment
//     //commission: Adjustment
// };

// type PriceCategory = {
//     id: number;
//     name: string;
// };

// type Props = {
//     tour: any;
// };

// type AddOn = {
//     id?: number | null;
//     description: string;
//     price: number | '';
//     edit_status: boolean;
// };

// type AddOnsState = {
//     [scheduleId: number]: AddOn[];
// };

// export default function Page({ tour }: Props) {
//     const { props } = usePage() as any; // ✅ di sini

//     const [activeTab, setActiveTab] = useState<'tour' | 'schedule'>('tour');

//     useEffect(() => {
//         if (props.flash?.tab) {
//             setActiveTab(props.flash.tab);
//         }
//     }, [props.flash?.tab]);

//     const [continentId, setContinentId] = useState<number | null>(
//         tour.continent_id ?? null,
//     );
//     const [regionId, setRegionId] = useState<number | null>(
//         tour.region_id ?? null,
//     );
//     const [countryId, setCountryId] = useState<number | null>(
//         tour.country_id ?? null,
//     );
//     const [categoryId, setCategoryId] = useState<number | null>(
//         tour.category_id ?? null,
//     );
//     const { company } = usePageSharedDataProps();
//     const handleSuccess = () => {
//         toast.success('Success', {
//             position: 'top-center',
//             description: 'Tour data updated successfully',
//         });
//     };

//     const [displayPrice, setDisplayPrice] = useState('');
//     const [rawPrice, setRawPrice] = useState('');

//     const handlePriceChange = (value: string) => {
//         const numeric = value.replace(/\D/g, '');
//         setRawPrice(numeric);
//         setData('showprice', numeric);

//         const formatted = new Intl.NumberFormat('id-ID').format(
//             Number(numeric),
//         );
//         setDisplayPrice(formatted);
//     };

//     useEffect(() => {
//         const numeric = tour.showprice != null ? String(tour.showprice) : '0';

//         setRawPrice(numeric);

//         const formatted = new Intl.NumberFormat('id-ID').format(
//             Number(numeric),
//         );
//         setDisplayPrice(formatted);

//         // 🔥 WAJIB
//         setData('showprice', numeric);
//     }, [tour.showprice]);
//     //

//     const [displayPrice1, setDisplayPrice1] = useState('0');
//     const [rawPrice1, setRawPrice1] = useState('0');

//     const handlePriceChange1 = (value: string) => {
//         let numeric1 = value.replace(/\D/g, '');

//         if (numeric1 === '') numeric1 = '0'; // 🔥 default 0

//         setRawPrice1(numeric1);
//         setData('promote_price', numeric1);

//         const formatted1 = new Intl.NumberFormat('id-ID').format(
//             Number(numeric1),
//         );
//         setDisplayPrice1(formatted1);
//     };

//     useEffect(() => {
//         const numeric =
//             tour.promote_price != null ? String(tour.promote_price) : '0';

//         setRawPrice1(numeric);

//         const formatted = new Intl.NumberFormat('id-ID').format(
//             Number(numeric),
//         );
//         setDisplayPrice1(formatted);

//         // 🔥 WAJIB
//         setData('promote_price', numeric);
//     }, [tour.promote_price]);
//     //

//     const { data, setData, put, processing, errors } = useForm({
//         name: tour.name || '',
//         description: tour.description || '',
//         code: tour.code || '',
//         destination: tour.destination || '',
//         duration_days: tour.duration_days || '',

//         showprice: rawPrice,
//         promote_price: rawPrice1,
//         promote_title: tour.promote_title || '',
//         promote_note: tour.promote_note || '',

//         continent_id: tour.continent_id || '',
//         region_id: tour.region_id || '',
//         country_id: tour.country_id || '',
//         category_id: tour.category_id || '',
//         status: tour.status || 'inactive',

//         image_id: tour.image?.id || '',
//         document_id: tour.document?.id || '',

//         currency: tour.currency || 'IDR',

//         schedules: [], // nanti inject
//     });

//     const { priceCategories } = usePage<{
//         priceCategories: PriceCategory[];
//     }>().props;

//     const isDuplicateDeparture = (date: string, currentIndex: number) => {
//         return schedules.some((s, i) => {
//             if (i === currentIndex) return false;
//             return s.departure_date === date;
//         });
//     };

//     const [schedules, setSchedules] = useState<Schedule[]>(
//         (tour.schedules || []).map((s: any) => ({
//             id: s.id,
//             departure_date: s.departure_date ?? '',
//             return_date: s.return_date ?? '',
//             availability: s.availability || null,
//             /*prices: (s.prices || []).map((p: any) => ({
//         room_type_id: p.room_type_id,
//         price: String(p.price ?? ''),
//         promotion: {
//           type: p.promotion_type ?? 'percent',
//           value: String(p.promotion_value ?? ''),
//         },
//         commission: {
//           type: p.commission_type ?? 'percent',
//           value: String(p.commission_value ?? ''),
//         },
//       })),*/
//             prices: (s.prices || []).map((p: any) => ({
//                 id: p.id,
//                 room_type_id: p.price_category_id,

//                 price: String(p.price ?? ''),

//                 promotion: {
//                     /*type: p.promotion_rate > 0 ? 'percent' : 'value',
//           value: String(
//             p.promotion_rate > 0
//               ? p.promotion_rate
//               : p.promotion ?? ''
//           ),*/
//                     type:
//                         p.promotion_rate > 0
//                             ? 'percent'
//                             : p.promotion > 0
//                               ? 'value'
//                               : 'percent', // default

//                     value: String(
//                         p.promotion_rate > 0
//                             ? p.promotion_rate
//                             : p.promotion > 0
//                               ? p.promotion
//                               : '',
//                     ),
//                 },

//                 commission: {
//                     /*type: p.commission_rate > 0 ? 'percent' : 'value',
//           value: String(
//             p.commission_rate > 0
//               ? p.commission_rate
//               : p.commission ?? ''
//           ),*/
//                     type:
//                         p.commission_rate > 0
//                             ? 'percent'
//                             : p.commission > 0
//                               ? 'value'
//                               : 'percent', // default

//                     value: String(
//                         p.commission_rate > 0
//                             ? p.commission_rate
//                             : p.commission > 0
//                               ? p.commission
//                               : '',
//                     ),
//                 },
//             })),
//         })),
//     );

//     // 🔥 TAMBAHKAN DI SINI 17042026
//     /*useEffect(() => {
//   console.log('FROM SERVER:', tour.schedules)
// }, [])*/

//     useEffect(() => {
//         setData('schedules', schedules);
//     }, [schedules]);

//     const addDays = (date: string, days: number) => {
//         if (!date || !days) return '';

//         const d = new Date(date);
//         d.setDate(d.getDate() + Number(days) - 1);
//         return d.toISOString().split('T')[0];
//     };

//     const addSchedule = () => {
//         setSchedules([
//             ...schedules,
//             {
//                 id: null,
//                 departure_date: '',
//                 return_date: '',
//                 prices: [
//                     {
//                         room_type_id: null,
//                         price: '',
//                         promotion: { type: 'percent', value: '' },
//                         commission: { type: 'percent', value: '' },
//                     },
//                 ],
//                 //promotion: { type: 'percent', value: '' },
//                 //commission: { type: 'percent', value: '' },
//             },
//         ]);
//     };

//     const updateSchedule = (
//         index: number,
//         field: keyof Schedule,
//         value: string,
//     ) => {
//         // 🔥 VALIDASI DUPLIKAT DEPARTURE DATE
//         if (field === 'departure_date') {
//             if (isDuplicateDeparture(value, index)) {
//                 toast.error('Departure date has been used');
//                 return;
//             }
//         }

//         setSchedules((prev) => {
//             const updated = [...prev];
//             const row = { ...updated[index], [field]: value };

//             // 🔥 AUTO SET return_date
//             if (field === 'departure_date' && data.duration_days) {
//                 row.return_date = addDays(value, Number(data.duration_days));
//             }

//             // 🔥 VALIDASI: return tidak boleh sebelum departure
//             if (
//                 row.return_date &&
//                 row.departure_date &&
//                 row.return_date < row.departure_date
//             ) {
//                 row.return_date = '';
//             }

//             updated[index] = row;
//             return updated;
//         });
//     };

//     const removeSchedule = (index: number) => {
//         const item = schedules[index];

//         // kalau belum tersimpan di DB
//         if (!item.id) {
//             setSchedules(schedules.filter((_, i) => i !== index));
//             return;
//         }

//         if (!confirm('Delete this schedule?')) return;

//         router.delete(
//             `/companies/${company.username}/dashboard/tours/${tour.id}/schedules/${item.id}`,
//             {
//                 preserveScroll: true,
//                 onSuccess: () => {
//                     setSchedules(schedules.filter((_, i) => i !== index));
//                 },
//             },
//         );
//     };

//     const addRoom = (index: number) => {
//         setSchedules((prev) =>
//             prev.map((schedule, i) => {
//                 if (i !== index) return schedule;

//                 return {
//                     ...schedule,
//                     prices: [
//                         ...schedule.prices,
//                         {
//                             room_type_id: null,
//                             price: '',
//                             promotion: {
//                                 type: 'percent',
//                                 value: '',
//                             },
//                             commission: {
//                                 type: 'percent',
//                                 value: '',
//                             },
//                         },
//                     ],
//                 };
//             }),
//         );
//     };

//     const updateRoom = (
//         scheduleIndex: number,
//         roomIndex: number,
//         field: string,
//         value: any,
//     ) => {
//         setSchedules((prev) =>
//             prev.map((schedule, i) => {
//                 if (i !== scheduleIndex) return schedule;

//                 return {
//                     ...schedule,
//                     prices: schedule.prices.map((room, r) => {
//                         if (r !== roomIndex) return room;

//                         return {
//                             ...room,
//                             [field]: value,
//                         };
//                     }),
//                 };
//             }),
//         );
//     };

//     const removeRoom = (scheduleIndex: number, roomIndex: number) => {
//         const room = schedules[scheduleIndex].prices[roomIndex];

//         // kalau belum ada id = belum tersimpan
//         if (!room.id) {
//             const updated = [...schedules];
//             updated[scheduleIndex].prices = updated[
//                 scheduleIndex
//             ].prices.filter((_, i) => i !== roomIndex);

//             setSchedules(updated);
//             return;
//         }

//         if (!confirm('Delete this category?')) return;

//         router.delete(
//             `/companies/${company.username}/dashboard/tours/${tour.id}/prices/${room.id}`,
//             {
//                 preserveScroll: true,
//                 onSuccess: () => {
//                     const updated = [...schedules];
//                     updated[scheduleIndex].prices = updated[
//                         scheduleIndex
//                     ].prices.filter((_, i) => i !== roomIndex);

//                     setSchedules(updated);
//                 },
//             },
//         );
//     };

//     const updateAdjustment = (
//         index: number,
//         field: 'promotion' | 'commission',
//         key: 'type' | 'value',
//         value: string,
//     ) => {
//         const updated = [...schedules];
//         updated[index][field][key] = value as any;
//         setSchedules(updated);
//     };

//     const updateRoomAdjustment = (
//         scheduleIndex: number,
//         roomIndex: number,
//         field: 'promotion' | 'commission',
//         key: 'type' | 'value',
//         value: string,
//     ) => {
//         const updated = [...schedules];
//         updated[scheduleIndex].prices[roomIndex][field][key] = value as any;
//         setSchedules(updated);
//     };

//     //availability
//     const formatDate = (date: string) => {
//         if (!date) return '-';
//         return new Date(date).toLocaleDateString('id-ID', {
//             day: '2-digit',
//             month: 'short',
//             year: 'numeric',
//         });
//     };

//     const availabilityData = useMemo(() => {
//         return schedules.map((s) => {
//             const a = s.availability || {};

//             const max_pax = Number(a.max_pax ?? 0);

//             return {
//                 id: s.id,
//                 schedule: `${formatDate(s.departure_date)} → ${formatDate(s.return_date)}`,

//                 max_pax,

//                 WP: Number(a.WP || 0),
//                 DP: Number(a.DP || 0),
//                 FP: Number(a.FP || 0),
//                 RS: Number(a.RS || 0),
//                 BRS: Number(a.BRS || 0),
//                 CA: Number(a.CA || 0),
//                 RF: Number(a.RF || 0),
//                 EX: Number(a.EX || 0),
//                 WL: Number(a.WL || 0),
//                 available: Number(a.available || 0),
//             };
//         });
//     }, [schedules]);

//     const [availability, setAvailability] = useState([]);

//     useEffect(() => {
//         setAvailability(availabilityData);
//     }, [availabilityData]);

//     const [savingAvailability, setSavingAvailability] = useState(false);

//     /*useEffect(() => {
//     setAvailability(availabilityData)
//   }, [schedules])*/

//     const updateAvailability = (
//         index: number,
//         field: string,
//         value: number,
//     ) => {
//         const updated = [...availability];

//         updated[index] = {
//             ...updated[index],
//             [field]: value,
//         };

//         const row = updated[index];

//         // 🔥 hitung ulang dari row (bukan dari luar scope)
//         row.available =
//             row.max_pax - row.DP - row.FP - row.RS - row.BRS + row.CA + row.RF;

//         setAvailability(updated);
//     };

//     const buildAvailabilityPayload = () => {
//         return availability.map((row, i) => ({
//             company_id: company.id,
//             tour_id: tour.id, // ⚠️ di DB namanya tour_code tapi isinya id
//             schedule_id: schedules[i]?.id ?? null, // pastikan schedule punya id dari DB
//             max_pax: row.max_pax,
//             WP: row.WP,
//             DP: row.DP,
//             FP: row.FP,
//             RS: row.RS,
//             BRS: row.BRS,
//             CA: row.CA,
//             RF: row.RF,
//             EX: row.EX,
//             WL: row.WL,
//             available: row.available,
//         }));
//     };

//     //20042026
//     useEffect(() => {
//         if (tour?.schedules) {
//             setSchedules(
//                 tour.schedules.map((s: any) => ({
//                     id: s.id,
//                     departure_date: s.departure_date ?? '',
//                     return_date: s.return_date ?? '',
//                     availability: s.availability || null,
//                     prices: (s.prices || []).map((p: any) => ({
//                         id: p.id,
//                         room_type_id: p.price_category_id,
//                         price: String(p.price ?? ''),
//                         promotion: {
//                             /*type: p.promotion_rate > 0 ? 'percent' : 'value',
//               value: String(p.promotion_rate || p.promotion || ''),*/
//                             type:
//                                 p.promotion_rate > 0
//                                     ? 'percent'
//                                     : p.promotion > 0
//                                       ? 'value'
//                                       : 'percent', // default

//                             value: String(
//                                 p.promotion_rate > 0
//                                     ? p.promotion_rate
//                                     : p.promotion > 0
//                                       ? p.promotion
//                                       : '',
//                             ),
//                         },
//                         commission: {
//                             /*type: p.commission_rate > 0 ? 'percent' : 'value',
//               value: String(p.commission_rate || p.commission || ''),*/
//                             type:
//                                 p.commission_rate > 0
//                                     ? 'percent'
//                                     : p.commission > 0
//                                       ? 'value'
//                                       : 'percent', // default

//                             value: String(
//                                 p.commission_rate > 0
//                                     ? p.commission_rate
//                                     : p.commission > 0
//                                       ? p.commission
//                                       : '',
//                             ),
//                         },
//                     })),
//                 })),
//             );
//         }
//     }, [tour]);

//     //Add Ons
//     const { addOnsFromDb } = props;

//     const [addOns, setAddOns] = useState<AddOnsState>({});

//     useEffect(() => {
//         const initial: AddOnsState = {};

//         schedules.forEach((s) => {
//             initial[s.id] = (addOnsFromDb?.[s.id] || []).map((item) => ({
//                 id: item.id,
//                 description: item.description,
//                 price: item.price,
//                 edit_status: item.edit_status,
//             }));
//         });

//         setAddOns(initial);
//     }, [schedules, addOnsFromDb]);

//     const addRow = (scheduleId: number) => {
//         setAddOns((prev) => ({
//             ...prev,
//             [scheduleId]: [
//                 ...(prev[scheduleId] || []),
//                 { id: null, description: '', price: '', edit_status: false },
//             ],
//         }));
//     };

//     const updateRow = (
//         scheduleId: number,
//         index: number,
//         field: keyof AddOn,
//         value: any,
//     ) => {
//         setAddOns((prev) => {
//             const rows = [...(prev[scheduleId] || [])];

//             if (field === 'description') {
//                 const isDuplicate = rows.some(
//                     (row, i) =>
//                         i !== index &&
//                         row.description?.toLowerCase().trim() ===
//                             value.toLowerCase().trim(),
//                 );

//                 if (isDuplicate) {
//                     toast.error('Description tidak boleh sama');
//                     return prev;
//                 }
//             }

//             rows[index] = { ...rows[index], [field]: value };

//             return {
//                 ...prev,
//                 [scheduleId]: rows,
//             };
//         });
//     };

//     const deleteRow = (scheduleId: number, index: number) => {
//         setAddOns((prev) => {
//             const rows = [...(prev[scheduleId] || [])];
//             rows.splice(index, 1);

//             return {
//                 ...prev,
//                 [scheduleId]: rows,
//             };
//         });
//     };

//     const [savingAddOns, setSavingAddOns] = useState(false);

//     const buildAddOnsPayload = (source = addOns) => {
//         const result: any[] = [];

//         Object.entries(source).forEach(([scheduleId, rows]) => {
//             rows.forEach((row) => {
//                 if (!row.description) return;

//                 result.push({
//                     id: row.id || null,
//                     company_id: company.id,
//                     tour_id: tour.id,
//                     schedule_id: Number(scheduleId),
//                     description: row.description,
//                     price: row.price || 0,
//                     edit_status: row.edit_status,
//                 });
//             });
//         });

//         return result;
//     };

//     const syncAddOns = async (data) => {
//         setSavingAddOns(true);

//         try {
//             const payload = buildAddOnsPayload(data);

//             if (payload.length === 0) {
//                 toast.error('Add Ons masih kosong');
//                 return;
//             }

//             console.log('SYNC PAYLOAD:', payload);

//             router.post(
//                 `/companies/${company.username}/dashboard/tour-add-ons`,
//                 { add_ons: payload },
//                 {
//                     preserveState: true,
//                     onSuccess: () => {
//                         toast.success('Success delete Add Ons');
//                     },
//                     onError: (err) => {
//                         console.error(err);
//                         toast.error('Failed to delete Add Ons');
//                     },
//                     onFinish: () => {
//                         setSavingAddOns(false);
//                     },
//                 },
//             );
//         } catch (err) {
//             setSavingAddOns(false);
//         }
//     };

//     const handleDelete = (scheduleId: number, index: number) => {
//         if (!confirm('Delete this add on?')) return;

//         setAddOns((prev) => {
//             const rows = [...(prev[scheduleId] || [])];

//             const deletedItem = rows[index];

//             rows.splice(index, 1);

//             const updated = {
//                 ...prev,
//                 [scheduleId]: rows,
//             };

//             syncAddOns(updated);

//             return updated;
//         });
//     };

//     //copy
//     const copySchedule = (item) => {
//         const addons = item.add_ons?.length
//             ? item.add_ons
//             : addOnsFromDb[item.id] || [];

//         const cloned = {
//             ...item,
//             id: null,

//             prices: (item.prices || []).map((p) => ({
//                 ...p,
//                 id: null,
//             })),

//             add_ons: addons.map((a) => ({
//                 ...a,
//                 id: null,
//             })),

//             availability: item.availability
//                 ? {
//                       ...item.availability,
//                       id: null,
//                       schedule_id: null,
//                   }
//                 : null,
//         };

//         setSchedules([...schedules, cloned]);
//     };

//     const [copyOpen, setCopyOpen] = useState(false);
//     const [selectedDates, setSelectedDates] = useState<Date[]>([]);
//     const [copySourceIndex, setCopySourceIndex] = useState<number | null>(null);
//     const [copyDates, setCopyDates] = useState<string[]>(['']);

//     const openCopyModal = (index: number) => {
//         setCopySourceIndex(index);
//         setCopyDates(['']);
//         setCopyOpen(true);
//     };

//     const addCopyDate = () => {
//         setCopyDates((prev) => [...prev, '']);
//     };

//     const updateCopyDate = (idx: number, value: string) => {
//         setCopyDates((prev) => prev.map((d, i) => (i === idx ? value : d)));
//     };

//     const removeCopyDate = (idx: number) => {
//         setCopyDates((prev) => prev.filter((_, i) => i !== idx));
//     };

//     const submitCopySchedules = () => {
//         if (copySourceIndex === null) return;

//         const source = schedules[copySourceIndex];

//         const validDates = selectedDates
//             .map((d) => format(d, 'yyyy-MM-dd'))
//             .filter(Boolean);

//         if (validDates.length === 0) {
//             toast.error('Please select at least one departure date');
//             return;
//         }

//         const existingDates = schedules.map((s) => s.departure_date);

//         const filteredDates = validDates.filter(
//             (date) => !existingDates.includes(date),
//         );

//         if (filteredDates.length === 0) {
//             toast.error('Selected dates already exist');
//             return;
//         }

//         const sourceAddons =
//             source.add_ons?.length > 0
//                 ? source.add_ons
//                 : addOnsFromDb?.[source.id] || [];

//         const newRows = filteredDates.map((date) => ({
//             id: null,
//             departure_date: date,
//             return_date: addDays(date, Number(data.duration_days)),

//             // prices
//             prices: source.prices.map((room) => ({
//                 ...room,
//                 id: null,
//                 schedule_id: null,
//             })),

//             // availability => copy hanya max_pax
//             availability: (() => {
//                 const avail = Array.isArray(source.availability)
//                     ? source.availability[0]
//                     : source.availability;

//                 return avail
//                     ? {
//                           id: null,
//                           schedule_id: null,
//                           max_pax: avail.max_pax,
//                           available: avail.available,
//                       }
//                     : null;
//             })(),

//             // add ons
//             add_ons: sourceAddons.map((item) => ({
//                 ...item,
//                 id: null,
//                 schedule_id: null,
//             })),
//         }));

//         const newSchedules = [...schedules, ...newRows];

//         setSchedules(newSchedules);

//         router.put(
//             `/companies/${company.username}/dashboard/tours/${tour.id}`,
//             {
//                 ...data,
//                 schedules: newSchedules,
//             },
//             {
//                 preserveScroll: true,
//                 preserveState: true,

//                 onSuccess: () => {
//                     setCopyOpen(false);
//                     setSelectedDates([]);
//                     toast.success('Schedule copied successfully');
//                 },

//                 onError: () => {
//                     if (Object.keys(errors).length === 0) {
//                         toast.error('Server response error (check redirect)');
//                     } else {
//                         toast.error('Failed copy schedule');
//                     }
//                 },
//             },
//         );
//     };

//     return (
//         <CompanyDashboardLayout
//             openMenuIds={['tours']}
//             activeMenuIds={['tours.index']}
//             breadcrumb={[
//                 { title: 'Tours', url: '/dashboard/tours' },
//                 { title: 'Edit' },
//             ]}
//         >
//             {/* <Form
//         {...update.form({ company: company.username, tour: tour.id })}
//         className="space-y-4"
//         onSuccess={handleSuccess}
//       > */}
//             <form
//                 /*onSubmit={(e) => {
//           e.preventDefault()

//           console.log('SEND DATA:', {
//             ...data,
//             schedules
//           })

//           // 🔥 update state dulu
//           setData((prev) => ({
//             ...prev,
//             showprice: Number(rawPrice),
//             promote_price: Number(rawPrice1),
//             schedules: schedules, // ✅ langsung object (JANGAN stringify)
//           }))

//           // 🔥 kirim TANPA data:
//           put(update.url({
//             company: company.username,
//             tour: tour.id
//           }), {
//             onSuccess: () => {
//               handleSuccess()
//               setActiveTab('schedule')
//             },
//           })*/

//                 onSubmit={(e) => {
//                     e.preventDefault();

//                     const payload = {
//                         ...data,
//                         showprice: Number(rawPrice),
//                         promote_price: Number(rawPrice1),
//                         schedules: schedules, // ✅ ini yang benar
//                     };

//                     //console.log('SEND DATA:', payload)

//                     put(
//                         update.url({
//                             company: company.username,
//                             tour: tour.id,
//                         }),
//                         {
//                             data: payload, // 🔥 WAJIB
//                             forceFormData: false,
//                             onSuccess: () => {
//                                 handleSuccess();
//                                 setActiveTab('schedule');
//                             },
//                         },
//                     );

//                     /*put(update.url({
//             company: company.username,
//             tour: tour.id
//           }), {
//             data: {
//               ...data,
//               showprice: Number(rawPrice),
//               promote_price: Number(rawPrice1),
//               schedules: schedules, // 🔥 langsung kirim
//             },
//             forceFormData: false,
//             onSuccess: () => {
//               handleSuccess()
//               setActiveTab('schedule')
//             },
//           })*/
//                 }}
//             >
//                 <div className="container mx-auto space-y-4 p-4">
//                     {/*<Tabs defaultValue="tour" className="w-full" key="tour-form">*/}
//                     <Tabs
//                         value={activeTab}
//                         onValueChange={(val) => setActiveTab(val as any)}
//                     >
//                         <TabsList className="mb-4">
//                             <TabsTrigger value="tour">Master</TabsTrigger>
//                             <TabsTrigger value="schedule">
//                                 Schedule and Price
//                             </TabsTrigger>
//                             <TabsTrigger value="availability">
//                                 Availability
//                             </TabsTrigger>
//                             <TabsTrigger value="addons">Adds On</TabsTrigger>
//                         </TabsList>

//                         {/* ================= TAB 1 — TOUR ================= */}
//                         <TabsContent value="tour">
//                             {/* <div className="grid gap-6"> changed for show in 2 column */}
//                             <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                                 {/* Image */}
//                                 {/* <div className="grid gap-2"> */}
//                                 <div className="grid gap-2 md:col-span-2">
//                                     <Label htmlFor="name">Image</Label>
//                                     <MediaPicker
//                                         type="image"
//                                         defaultValue={tour.image}
//                                         params={{
//                                             owner_type: 'company',
//                                             owner_id: company.id,
//                                         }}
//                                         uploadParams={{
//                                             owner_type: 'company',
//                                             owner_id: company.id,
//                                         }}
//                                     >
//                                         {(media, change) => {
//                                             const mediaId = (
//                                                 media as MediaResource
//                                             )?.id;

//                                             // 🔥 sync ke inertia
//                                             if (
//                                                 mediaId &&
//                                                 data.image_id !== mediaId
//                                             ) {
//                                                 setData('image_id', mediaId);
//                                             }

//                                             return (
//                                                 <div className="flex flex-col items-center gap-2">
//                                                     <img
//                                                         className="aspect-video max-w-[360px] rounded object-cover shadow"
//                                                         src={
//                                                             typeof media ===
//                                                             'string'
//                                                                 ? media
//                                                                 : extractImageSrc(
//                                                                       media as any,
//                                                                   ).src
//                                                         }
//                                                     />

//                                                     <Button
//                                                         type="button"
//                                                         onClick={change}
//                                                     >
//                                                         Change
//                                                     </Button>
//                                                 </div>
//                                             );
//                                         }}
//                                     </MediaPicker>
//                                     <InputError message={errors.media_id} />
//                                 </div>

//                                 {/* Code */}
//                                 <div className="grid gap-2">
//                                     <Label htmlFor="code">Code</Label>
//                                     <Input
//                                         id="code"
//                                         type="text"
//                                         name="code"
//                                         required
//                                         placeholder="Tour Code"
//                                         //defaultValue={tour.code}
//                                         value={data.code}
//                                         onChange={(e) =>
//                                             setData('code', e.target.value)
//                                         }
//                                     />
//                                     <InputError message={errors.code} />
//                                 </div>
//                                 {/* Name */}
//                                 <div className="grid gap-2">
//                                     <Label htmlFor="name">Name</Label>
//                                     <Input
//                                         id="name"
//                                         type="text"
//                                         name="name"
//                                         required
//                                         placeholder="Tour Name"
//                                         //defaultValue={tour.name}
//                                         value={data.name}
//                                         onChange={(e) =>
//                                             setData('name', e.target.value)
//                                         }
//                                     />
//                                     <InputError message={errors.name} />
//                                 </div>

//                                 {/* Description */}
//                                 <div className="grid gap-2">
//                                     <Label htmlFor="description">
//                                         Description
//                                     </Label>
//                                     <Textarea
//                                         id="description"
//                                         name="description"
//                                         placeholder="Tour description"
//                                         //defaultValue={tour.description}
//                                         className="min-h-[65px] resize-none"
//                                         onInput={(e) => {
//                                             const el = e.currentTarget;
//                                             el.style.height = 'auto';
//                                             el.style.height =
//                                                 el.scrollHeight + 'px';
//                                         }}
//                                         value={data.description}
//                                         onChange={(e) =>
//                                             setData(
//                                                 'description',
//                                                 e.target.value,
//                                             )
//                                         }
//                                     />
//                                     <InputError message={errors.description} />
//                                 </div>

//                                 {/* Duration */}
//                                 <div className="grid gap-2">
//                                     <Label htmlFor="duration_days">
//                                         Duration in Days
//                                     </Label>
//                                     <Input
//                                         id="duration_days"
//                                         type="number"
//                                         name="duration_days"
//                                         required
//                                         placeholder="Duration"
//                                         //defaultValue={tour.duration_days}
//                                         value={data.duration_days}
//                                         onChange={(e) =>
//                                             setData(
//                                                 'duration_days',
//                                                 e.target.value,
//                                             )
//                                         }
//                                     />
//                                     <InputError
//                                         message={errors.duration_days}
//                                     />
//                                 </div>

//                                 <div className="grid gap-2">
//                                     <Label htmlFor="continent_id">
//                                         Continent
//                                     </Label>
//                                     <SelectContinent
//                                         name="continent_id"
//                                         value={continentId ?? undefined}
//                                         onChange={(val) => {
//                                             /*setContinentId(Number(val));
//                         setRegionId(null);
//                         setCountryId(null);*/
//                                             const id = Number(val);

//                                             setContinentId(id);
//                                             setRegionId(null);
//                                             setCountryId(null);

//                                             setData('continent_id', id); // ✅ WAJIB
//                                             setData('region_id', ''); // reset
//                                             setData('country_id', '');
//                                         }}
//                                     />

//                                     <InputError message={errors.continent_id} />
//                                 </div>

//                                 <div className="grid gap-2">
//                                     <Label htmlFor="region_id">Region</Label>
//                                     <SelectRegion
//                                         name="region_id"
//                                         continentId={continentId}
//                                         value={regionId ?? undefined}
//                                         onChange={(val) => {
//                                             /*setRegionId(Number(val));
//                         setCountryId(null);*/
//                                             const id = Number(val);

//                                             setRegionId(id);
//                                             setCountryId(null);

//                                             setData('region_id', id); // ✅
//                                             setData('country_id', ''); // reset
//                                         }}
//                                     />
//                                     <InputError message={errors.region_id} />
//                                 </div>

//                                 <div className="grid gap-2">
//                                     <Label htmlFor="country_id">Country</Label>
//                                     <SelectCountry
//                                         name="country_id"
//                                         continentId={continentId}
//                                         regionId={regionId}
//                                         value={countryId ?? undefined}
//                                         onChange={(val) => {
//                                             //setCountryId(Number(val));
//                                             const id = Number(val);

//                                             setCountryId(id);
//                                             setData('country_id', id); // ✅
//                                         }}
//                                     />

//                                     <InputError message={errors.country_id} />
//                                 </div>

//                                 {/* Destination */}
//                                 <div className="grid gap-2">
//                                     <Label htmlFor="destination">
//                                         Destination
//                                     </Label>
//                                     <Input
//                                         id="destination"
//                                         type="text"
//                                         name="destination"
//                                         placeholder="Destination"
//                                         //defaultValue={tour.destination}
//                                         value={data.destination}
//                                         onChange={(e) =>
//                                             setData(
//                                                 'destination',
//                                                 e.target.value,
//                                             )
//                                         }
//                                     />
//                                     <InputError message={errors.destination} />
//                                 </div>

//                                 {/* Category */}
//                                 <div className="grid gap-2">
//                                     <Label htmlFor="category_id">
//                                         Category
//                                     </Label>
//                                     <SelectCategory
//                                         name="category_id"
//                                         //value={categoryId ?? undefined}
//                                         /*onChange={(val) => {
//                         setCategoryId(Number(val));
//                       }}*/
//                                         value={data.category_id || undefined}
//                                         onChange={(val) =>
//                                             setData('category_id', Number(val))
//                                         }
//                                     />

//                                     <InputError message={errors.category_id} />
//                                 </div>

//                                 {/* Document */}
//                                 <div className="grid gap-2">
//                                     {/* <div className="grid gap-2 md:col-span-2"> */}
//                                     <Label htmlFor="name">
//                                         Document Itinerary
//                                     </Label>
//                                     <TourDocumentPicker
//                                         owner={{
//                                             type: 'company',
//                                             id: company.id,
//                                         }}
//                                         value={tour.document}
//                                         onChange={(doc: any) =>
//                                             setData('document_id', doc?.id)
//                                         }
//                                     />
//                                     <InputError message={errors.document_id} />
//                                 </div>

//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                     {/* Status */}
//                                     <div className="grid gap-2">
//                                         <Label htmlFor="status">Status</Label>
//                                         <Select
//                                             name="status"
//                                             //</div>defaultValue={tour.status}
//                                             value={data.status}
//                                             onValueChange={(val) =>
//                                                 setData('status', val)
//                                             }
//                                         >
//                                             <SelectTrigger className="w-full max-w-48">
//                                                 <SelectValue placeholder="Select status" />
//                                             </SelectTrigger>
//                                             <SelectContent>
//                                                 <SelectGroup>
//                                                     <SelectLabel>
//                                                         Select status
//                                                     </SelectLabel>
//                                                     <SelectItem value="active">
//                                                         Active
//                                                     </SelectItem>
//                                                     <SelectItem value="inactive">
//                                                         Inactive
//                                                     </SelectItem>
//                                                 </SelectGroup>
//                                             </SelectContent>
//                                         </Select>
//                                         <InputError message={errors.status} />
//                                     </div>

//                                     {/* CURRENCY */}
//                                     <div className="grid gap-2">
//                                         <Label>Currency</Label>

//                                         <SelectCurrency
//                                             value={data.currency}
//                                             onChange={(val) =>
//                                                 setData('currency', val)
//                                             }
//                                         />
//                                     </div>
//                                 </div>

//                                 {/* Normal Price show on catalog */}
//                                 <div className="grid gap-2">
//                                     <Label htmlFor="showprice">
//                                         Normal Price show on catalog
//                                     </Label>
//                                     <Input
//                                         id="showprice_display"
//                                         type="text"
//                                         placeholder="Normal Price"
//                                         value={displayPrice}
//                                         onChange={(e) =>
//                                             handlePriceChange(e.target.value)
//                                         }
//                                     />
//                                     <input
//                                         type="hidden"
//                                         name="showprice"
//                                         value={rawPrice}
//                                     />
//                                     <InputError message={errors.showprice} />
//                                 </div>

//                                 <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
//                                     <div className="text-sm font-semibold text-muted-foreground">
//                                         Promotion Settings
//                                     </div>

//                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                         {/* promote title */}
//                                         <div className="grid gap-2">
//                                             <Label htmlFor="promote_title">
//                                                 Title Promotion on Catalog
//                                             </Label>
//                                             <Input
//                                                 id="promote_title"
//                                                 type="text"
//                                                 name="promote_title"
//                                                 placeholder="Title Promotion"
//                                                 //defaultValue={tour.promote_title}
//                                                 value={data.promote_title}
//                                                 onChange={(e) =>
//                                                     setData(
//                                                         'promote_title',
//                                                         e.target.value,
//                                                     )
//                                                 }
//                                             />
//                                             <InputError
//                                                 message={errors.promote_title}
//                                             />
//                                         </div>

//                                         {/* Promote Price */}
//                                         <div className="grid gap-2">
//                                             <Label htmlFor="promote_price">
//                                                 Promotion Price show on catalog
//                                             </Label>
//                                             <Input
//                                                 id="promote_price"
//                                                 type="text"
//                                                 placeholder="Promotion Price"
//                                                 value={displayPrice1}
//                                                 onChange={(e) =>
//                                                     handlePriceChange1(
//                                                         e.target.value,
//                                                     )
//                                                 }
//                                             />
//                                             <input
//                                                 type="hidden"
//                                                 name="promote_price"
//                                                 value={rawPrice1}
//                                             />
//                                             <InputError
//                                                 message={errors.promote_price}
//                                             />
//                                         </div>

//                                         {/* promote note — full width */}
//                                         <div className="grid gap-2 md:col-span-2">
//                                             <Label htmlFor="promote_note">
//                                                 Promotion Note on Catalog
//                                             </Label>
//                                             <Input
//                                                 id="promote_note"
//                                                 type="text"
//                                                 name="promote_note"
//                                                 placeholder="Promotion Note"
//                                                 //defaultValue={tour.promote_note}
//                                                 value={data.promote_note}
//                                                 onChange={(e) =>
//                                                     setData(
//                                                         'promote_note',
//                                                         e.target.value,
//                                                     )
//                                                 }
//                                             />
//                                             <InputError
//                                                 message={errors.promote_note}
//                                             />
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                             <div className="flex justify-start pt-6 border-t">
//                                 <Button type="submit" disabled={processing}>
//                                     {processing && <Spinner />}
//                                     Save & Continue
//                                 </Button>
//                             </div>
//                         </TabsContent>

//                         {/* ================= TAB 2 — JADWAL ================= */}

//                         <TabsContent value="schedule">
//                             <div className="space-y-4">
//                                 {/* HEADER */}
//                                 <div className="flex justify-between items-center px-4 py-2">
//                                     <h3 className="text-lg font-semibold">
//                                         <span className="font-semibold">
//                                             Tour Schedule and Price —{' '}
//                                             {tour.name}
//                                         </span>
//                                     </h3>
//                                     <span className="text-sm text-muted-foreground"></span>
//                                 </div>

//                                 <div className="flex items-center justify-between px-4 py-2">
//                                     <h3 className="text-lg font-semibold">
//                                         <span className="text-foreground font-semibold">
//                                             Currency: {tour.currency}
//                                         </span>
//                                     </h3>

//                                     <Button type="button" onClick={addSchedule}>
//                                         + Add New Schedule
//                                     </Button>
//                                 </div>

//                                 {/* DESKTOP TABLE */}
//                                 <div className="rounded-lg border overflow-hidden hidden md:block">
//                                     <table className="w-full text-sm">
//                                         {/* ================= HEADER ================= */}
//                                         <thead className="bg-muted">
//                                             <tr>
//                                                 <th
//                                                     className="p-3 text-left"
//                                                     rowSpan={2}
//                                                 >
//                                                     Departure
//                                                 </th>
//                                                 <th
//                                                     className="p-3 text-left"
//                                                     rowSpan={2}
//                                                 >
//                                                     Return
//                                                 </th>

//                                                 <th
//                                                     className="p-3 text-center"
//                                                     colSpan={4}
//                                                 >
//                                                     Prices
//                                                 </th>

//                                                 <th
//                                                     className="p-3 text-left"
//                                                     rowSpan={2}
//                                                 >
//                                                     Action
//                                                 </th>
//                                             </tr>

//                                             <tr className="text-xs text-muted-foreground">
//                                                 <th className="p-2">
//                                                     Category
//                                                 </th>
//                                                 <th className="p-2">Price</th>
//                                                 <th className="p-2">
//                                                     Promotion
//                                                 </th>
//                                                 <th className="p-2">
//                                                     Commission
//                                                 </th>
//                                             </tr>
//                                         </thead>

//                                         {/* ================= BODY ================= */}
//                                         <tbody>
//                                             {schedules.map((item, index) => (
//                                                 <tr
//                                                     key={index}
//                                                     className="align-top border-t"
//                                                 >
//                                                     {/* DATE */}
//                                                     <td className="p-2">
//                                                         <Input
//                                                             type="date"
//                                                             value={
//                                                                 item.departure_date
//                                                             }
//                                                             min={
//                                                                 new Date()
//                                                                     .toISOString()
//                                                                     .split(
//                                                                         'T',
//                                                                     )[0]
//                                                             }
//                                                             onChange={(e) =>
//                                                                 updateSchedule(
//                                                                     index,
//                                                                     'departure_date',
//                                                                     e.target
//                                                                         .value,
//                                                                 )
//                                                             }
//                                                         />
//                                                     </td>

//                                                     <td className="p-2">
//                                                         <Input
//                                                             type="date"
//                                                             value={
//                                                                 item.return_date
//                                                             }
//                                                             min={
//                                                                 item.departure_date
//                                                             }
//                                                             readOnly
//                                                             className="bg-muted cursor-not-allowed"
//                                                             onChange={(e) =>
//                                                                 updateSchedule(
//                                                                     index,
//                                                                     'return_date',
//                                                                     e.target
//                                                                         .value,
//                                                                 )
//                                                             }
//                                                         />
//                                                     </td>

//                                                     {/* PRICES */}
//                                                     <td
//                                                         colSpan={4}
//                                                         className="p-2"
//                                                     >
//                                                         <div className="space-y-3">
//                                                             {item.prices.map(
//                                                                 (
//                                                                     room,
//                                                                     rIndex,
//                                                                 ) => (
//                                                                     <div
//                                                                         key={
//                                                                             rIndex
//                                                                         }
//                                                                         className="grid grid-cols-4 gap-2 items-start p-2 border rounded-md"
//                                                                     >
//                                                                         {/* ROOM */}
//                                                                         <select
//                                                                             className="border rounded px-2 h-9 text-sm w-full"
//                                                                             value={
//                                                                                 room.room_type_id ??
//                                                                                 ''
//                                                                             }
//                                                                             onChange={(
//                                                                                 e,
//                                                                             ) =>
//                                                                                 updateRoom(
//                                                                                     index,
//                                                                                     rIndex,
//                                                                                     'room_type_id',
//                                                                                     Number(
//                                                                                         e
//                                                                                             .target
//                                                                                             .value,
//                                                                                     ),
//                                                                                 )
//                                                                             }
//                                                                         >
//                                                                             <option value="">
//                                                                                 Select
//                                                                                 Category
//                                                                             </option>

//                                                                             {priceCategories
//                                                                                 .filter(
//                                                                                     (
//                                                                                         cat,
//                                                                                     ) => {
//                                                                                         const selectedIds =
//                                                                                             item.prices
//                                                                                                 .map(
//                                                                                                     (
//                                                                                                         p,
//                                                                                                         i,
//                                                                                                     ) =>
//                                                                                                         i !==
//                                                                                                         rIndex
//                                                                                                             ? p.room_type_id
//                                                                                                             : null,
//                                                                                                 )
//                                                                                                 .filter(
//                                                                                                     Boolean,
//                                                                                                 );

//                                                                                         return !selectedIds.includes(
//                                                                                             cat.id,
//                                                                                         );
//                                                                                     },
//                                                                                 )
//                                                                                 .map(
//                                                                                     (
//                                                                                         cat,
//                                                                                     ) => (
//                                                                                         <option
//                                                                                             key={
//                                                                                                 cat.id
//                                                                                             }
//                                                                                             value={
//                                                                                                 cat.id
//                                                                                             }
//                                                                                         >
//                                                                                             {
//                                                                                                 cat.name
//                                                                                             }
//                                                                                         </option>
//                                                                                     ),
//                                                                                 )}
//                                                                         </select>

//                                                                         {/* PRICE */}
//                                                                         <MoneyInput
//                                                                             value={
//                                                                                 room.price
//                                                                             }
//                                                                             placeholder="Price"
//                                                                             onChange={(
//                                                                                 val,
//                                                                             ) =>
//                                                                                 updateRoom(
//                                                                                     index,
//                                                                                     rIndex,
//                                                                                     'price',
//                                                                                     val,
//                                                                                 )
//                                                                             }
//                                                                         />

//                                                                         {/* PROMOTION */}
//                                                                         <div className="space-y-1">
//                                                                             {/* PERCENT */}
//                                                                             <div className="relative">
//                                                                                 <input
//                                                                                     type="text"
//                                                                                     inputMode="decimal"
//                                                                                     className="w-full pr-8 border rounded px-2 h-9 text-sm"
//                                                                                     value={
//                                                                                         room
//                                                                                             .promotion
//                                                                                             .type ===
//                                                                                         'percent'
//                                                                                             ? room
//                                                                                                   .promotion
//                                                                                                   .value
//                                                                                             : ''
//                                                                                     }
//                                                                                     placeholder="0"
//                                                                                     onChange={(
//                                                                                         e,
//                                                                                     ) => {
//                                                                                         let raw =
//                                                                                             e.target.value
//                                                                                                 .replace(
//                                                                                                     /[^0-9.,]/g,
//                                                                                                     '',
//                                                                                                 )
//                                                                                                 .replace(
//                                                                                                     ',',
//                                                                                                     '.',
//                                                                                                 );

//                                                                                         if (
//                                                                                             Number(
//                                                                                                 raw,
//                                                                                             ) >
//                                                                                             100
//                                                                                         )
//                                                                                             raw =
//                                                                                                 '100';

//                                                                                         updateRoomAdjustment(
//                                                                                             index,
//                                                                                             rIndex,
//                                                                                             'promotion',
//                                                                                             'type',
//                                                                                             'percent',
//                                                                                         );
//                                                                                         updateRoomAdjustment(
//                                                                                             index,
//                                                                                             rIndex,
//                                                                                             'promotion',
//                                                                                             'value',
//                                                                                             raw,
//                                                                                         );
//                                                                                     }}
//                                                                                 />
//                                                                                 <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">
//                                                                                     %
//                                                                                 </span>
//                                                                             </div>

//                                                                             {/* VALUE */}
//                                                                             <MoneyInput
//                                                                                 value={
//                                                                                     room
//                                                                                         .promotion
//                                                                                         .type ===
//                                                                                     'value'
//                                                                                         ? room
//                                                                                               .promotion
//                                                                                               .value
//                                                                                         : ''
//                                                                                 }
//                                                                                 placeholder="Value"
//                                                                                 className="w-full"
//                                                                                 onChange={(
//                                                                                     val,
//                                                                                 ) => {
//                                                                                     updateRoomAdjustment(
//                                                                                         index,
//                                                                                         rIndex,
//                                                                                         'promotion',
//                                                                                         'type',
//                                                                                         'value',
//                                                                                     );
//                                                                                     updateRoomAdjustment(
//                                                                                         index,
//                                                                                         rIndex,
//                                                                                         'promotion',
//                                                                                         'value',
//                                                                                         val,
//                                                                                     );
//                                                                                 }}
//                                                                             />
//                                                                         </div>

//                                                                         {/* COMMISSION */}
//                                                                         <div className="space-y-1">
//                                                                             {/* PERCENT */}
//                                                                             <div className="relative">
//                                                                                 <input
//                                                                                     type="text"
//                                                                                     inputMode="decimal"
//                                                                                     className="w-full pr-8 border rounded px-2 h-9 text-sm"
//                                                                                     value={
//                                                                                         room
//                                                                                             .commission
//                                                                                             .type ===
//                                                                                         'percent'
//                                                                                             ? room
//                                                                                                   .commission
//                                                                                                   .value
//                                                                                             : ''
//                                                                                     }
//                                                                                     placeholder="0"
//                                                                                     onChange={(
//                                                                                         e,
//                                                                                     ) => {
//                                                                                         const raw =
//                                                                                             e.target.value
//                                                                                                 .replace(
//                                                                                                     /[^0-9.,]/g,
//                                                                                                     '',
//                                                                                                 )
//                                                                                                 .replace(
//                                                                                                     ',',
//                                                                                                     '.',
//                                                                                                 );

//                                                                                         updateRoomAdjustment(
//                                                                                             index,
//                                                                                             rIndex,
//                                                                                             'commission',
//                                                                                             'type',
//                                                                                             'percent',
//                                                                                         );
//                                                                                         updateRoomAdjustment(
//                                                                                             index,
//                                                                                             rIndex,
//                                                                                             'commission',
//                                                                                             'value',
//                                                                                             raw,
//                                                                                         );
//                                                                                     }}
//                                                                                 />
//                                                                                 <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">
//                                                                                     %
//                                                                                 </span>
//                                                                             </div>

//                                                                             {/* VALUE */}
//                                                                             <MoneyInput
//                                                                                 value={
//                                                                                     room
//                                                                                         .commission
//                                                                                         .type ===
//                                                                                     'value'
//                                                                                         ? room
//                                                                                               .commission
//                                                                                               .value
//                                                                                         : ''
//                                                                                 }
//                                                                                 placeholder="Value"
//                                                                                 className="w-full"
//                                                                                 onChange={(
//                                                                                     val,
//                                                                                 ) => {
//                                                                                     updateRoomAdjustment(
//                                                                                         index,
//                                                                                         rIndex,
//                                                                                         'commission',
//                                                                                         'type',
//                                                                                         'value',
//                                                                                     );
//                                                                                     updateRoomAdjustment(
//                                                                                         index,
//                                                                                         rIndex,
//                                                                                         'commission',
//                                                                                         'value',
//                                                                                         val,
//                                                                                     );
//                                                                                 }}
//                                                                             />
//                                                                         </div>

//                                                                         {/* REMOVE ROOM */}
//                                                                         <div className="col-span-4 flex justify-end">
//                                                                             <Button
//                                                                                 type="button"
//                                                                                 size="sm"
//                                                                                 variant="ghost"
//                                                                                 className="text-red-500"
//                                                                                 onClick={() =>
//                                                                                     removeRoom(
//                                                                                         index,
//                                                                                         rIndex,
//                                                                                     )
//                                                                                 }
//                                                                             >
//                                                                                 x
//                                                                                 Delete
//                                                                                 Category
//                                                                             </Button>
//                                                                         </div>
//                                                                     </div>
//                                                                 ),
//                                                             )}

//                                                             {/* ADD ROOM */}
//                                                             <div>
//                                                                 <Button
//                                                                     type="button"
//                                                                     size="sm"
//                                                                     variant="outline"
//                                                                     onClick={() =>
//                                                                         addRoom(
//                                                                             index,
//                                                                         )
//                                                                     }
//                                                                     disabled={
//                                                                         item
//                                                                             .prices
//                                                                             .length >=
//                                                                         priceCategories.length
//                                                                     }
//                                                                 >
//                                                                     + Add
//                                                                     Category
//                                                                 </Button>
//                                                             </div>
//                                                         </div>
//                                                     </td>

//                                                     {/* ACTION */}
//                                                     <td className="p-2 flex flex-col gap-2 items-start">
//                                                         <Button
//                                                             type="button"
//                                                             variant="destructive"
//                                                             size="icon"
//                                                             onClick={() =>
//                                                                 removeSchedule(
//                                                                     index,
//                                                                 )
//                                                             }
//                                                         >
//                                                             <Trash2 className="h-4 w-4" />
//                                                         </Button>

//                                                         <Button
//                                                             type="submit"
//                                                             size="icon"
//                                                             disabled={
//                                                                 processing ||
//                                                                 schedules.length ===
//                                                                     0
//                                                             }
//                                                         >
//                                                             <Save className="h-4 w-4" />
//                                                         </Button>

//                                                         <Button
//                                                             type="button"
//                                                             variant="outline"
//                                                             className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
//                                                             size="icon"
//                                                             onClick={() =>
//                                                                 openCopyModal(
//                                                                     index,
//                                                                 )
//                                                             }
//                                                         >
//                                                             <Copy className="h-4 w-4" />
//                                                         </Button>
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 </div>

//                                 {/* MOBILE VERSION */}
//                                 <div className="md:hidden space-y-4">
//                                     {schedules.map((item, index) => (
//                                         <div
//                                             key={index}
//                                             className="border rounded-lg p-3 space-y-3"
//                                         >
//                                             {/* HEADER */}
//                                             <div className="flex justify-between items-start">
//                                                 <p className="font-medium text-sm">
//                                                     Schedule #{index + 1}
//                                                 </p>

//                                                 <div className="flex flex-col items-end gap-2">
//                                                     <Button
//                                                         type="button"
//                                                         size="sm"
//                                                         variant="destructive"
//                                                         onClick={() =>
//                                                             removeSchedule(
//                                                                 index,
//                                                             )
//                                                         }
//                                                     >
//                                                         <Trash2 className="h-4 w-4" />
//                                                     </Button>

//                                                     <Button
//                                                         type="submit"
//                                                         size="icon"
//                                                         disabled={
//                                                             processing ||
//                                                             schedules.length ===
//                                                                 0
//                                                         }
//                                                     >
//                                                         <Save className="h-4 w-4" />
//                                                     </Button>

//                                                     <Button
//                                                         type="button"
//                                                         size="sm"
//                                                         className="bg-blue-600 text-white hover:bg-blue-700"
//                                                         onClick={() =>
//                                                             openCopyModal(index)
//                                                         }
//                                                     >
//                                                         <Copy className="h-4 w-4" />
//                                                     </Button>
//                                                 </div>
//                                             </div>

//                                             {/* DATES */}
//                                             <div className="grid grid-cols-2 gap-2">
//                                                 <div>
//                                                     <p className="text-xs text-muted-foreground">
//                                                         Departure
//                                                     </p>
//                                                     <Input
//                                                         type="date"
//                                                         value={
//                                                             item.departure_date
//                                                         }
//                                                         onChange={(e) =>
//                                                             updateSchedule(
//                                                                 index,
//                                                                 'departure_date',
//                                                                 e.target.value,
//                                                             )
//                                                         }
//                                                     />
//                                                 </div>

//                                                 <div>
//                                                     <p className="text-xs text-muted-foreground">
//                                                         Return
//                                                     </p>
//                                                     <Input
//                                                         type="date"
//                                                         value={item.return_date}
//                                                         min={
//                                                             item.departure_date
//                                                         }
//                                                         readOnly
//                                                         className="bg-muted cursor-not-allowed"
//                                                         onChange={(e) =>
//                                                             updateSchedule(
//                                                                 index,
//                                                                 'return_date',
//                                                                 e.target.value,
//                                                             )
//                                                         }
//                                                     />
//                                                 </div>
//                                             </div>

//                                             {/* ROOMS */}
//                                             <div className="space-y-3">
//                                                 {item.prices.map(
//                                                     (room, rIndex) => (
//                                                         <div
//                                                             key={rIndex}
//                                                             className="border rounded-md p-3 space-y-2"
//                                                         >
//                                                             {/* ROOM HEADER */}
//                                                             <div className="flex justify-between items-center">
//                                                                 <p className="text-xs font-medium text-muted-foreground">
//                                                                     Room #
//                                                                     {rIndex + 1}
//                                                                 </p>

//                                                                 <Button
//                                                                     type="button"
//                                                                     size="sm"
//                                                                     variant="ghost"
//                                                                     className="text-red-500"
//                                                                     onClick={() =>
//                                                                         removeRoom(
//                                                                             index,
//                                                                             rIndex,
//                                                                         )
//                                                                     }
//                                                                 >
//                                                                     x Delete
//                                                                     Category
//                                                                 </Button>
//                                                             </div>

//                                                             {/* ROOM TYPE */}
//                                                             <div className="space-y-1">
//                                                                 <p className="text-xs text-muted-foreground">
//                                                                     Category
//                                                                 </p>

//                                                                 <select
//                                                                     className="w-full border rounded-md px-3 h-10 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
//                                                                     value={
//                                                                         room.room_type_id ??
//                                                                         ''
//                                                                     }
//                                                                     onChange={(
//                                                                         e,
//                                                                     ) =>
//                                                                         updateRoom(
//                                                                             index,
//                                                                             rIndex,
//                                                                             'room_type_id',
//                                                                             Number(
//                                                                                 e
//                                                                                     .target
//                                                                                     .value,
//                                                                             ),
//                                                                         )
//                                                                     }
//                                                                 >
//                                                                     <option value="">
//                                                                         Select
//                                                                         Category
//                                                                     </option>

//                                                                     {priceCategories
//                                                                         .filter(
//                                                                             (
//                                                                                 cat,
//                                                                             ) => {
//                                                                                 const selectedIds =
//                                                                                     item.prices
//                                                                                         .map(
//                                                                                             (
//                                                                                                 p,
//                                                                                                 i,
//                                                                                             ) =>
//                                                                                                 i !==
//                                                                                                 rIndex
//                                                                                                     ? p.room_type_id
//                                                                                                     : null,
//                                                                                         )
//                                                                                         .filter(
//                                                                                             Boolean,
//                                                                                         );

//                                                                                 return !selectedIds.includes(
//                                                                                     cat.id,
//                                                                                 );
//                                                                             },
//                                                                         )
//                                                                         .map(
//                                                                             (
//                                                                                 cat,
//                                                                             ) => (
//                                                                                 <option
//                                                                                     key={
//                                                                                         cat.id
//                                                                                     }
//                                                                                     value={
//                                                                                         cat.id
//                                                                                     }
//                                                                                 >
//                                                                                     {
//                                                                                         cat.name
//                                                                                     }
//                                                                                 </option>
//                                                                             ),
//                                                                         )}
//                                                                 </select>
//                                                             </div>

//                                                             {/* PRICE */}
//                                                             <div>
//                                                                 <p className="text-xs text-muted-foreground">
//                                                                     Price
//                                                                 </p>
//                                                                 <MoneyInput
//                                                                     value={
//                                                                         room.price
//                                                                     }
//                                                                     placeholder="Price"
//                                                                     onChange={(
//                                                                         val,
//                                                                     ) =>
//                                                                         updateRoom(
//                                                                             index,
//                                                                             rIndex,
//                                                                             'price',
//                                                                             val,
//                                                                         )
//                                                                     }
//                                                                 />
//                                                             </div>

//                                                             {/* PROMOTION */}
//                                                             <div className="space-y-1">
//                                                                 <p className="text-xs text-muted-foreground">
//                                                                     Promotion
//                                                                 </p>

//                                                                 <div className="grid grid-cols-2 gap-2">
//                                                                     {/* % */}
//                                                                     <div className="relative">
//                                                                         <MoneyInput
//                                                                             value={
//                                                                                 room
//                                                                                     .promotion
//                                                                                     .type ===
//                                                                                 'percent'
//                                                                                     ? room
//                                                                                           .promotion
//                                                                                           .value
//                                                                                     : ''
//                                                                             }
//                                                                             placeholder="0"
//                                                                             className="pr-8"
//                                                                             onChange={(
//                                                                                 val,
//                                                                             ) => {
//                                                                                 updateRoomAdjustment(
//                                                                                     index,
//                                                                                     rIndex,
//                                                                                     'promotion',
//                                                                                     'type',
//                                                                                     'percent',
//                                                                                 );
//                                                                                 updateRoomAdjustment(
//                                                                                     index,
//                                                                                     rIndex,
//                                                                                     'promotion',
//                                                                                     'value',
//                                                                                     val,
//                                                                                 );
//                                                                             }}
//                                                                         />

//                                                                         <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
//                                                                             %
//                                                                         </span>
//                                                                     </div>

//                                                                     {/* VALUE */}
//                                                                     <MoneyInput
//                                                                         value={
//                                                                             room
//                                                                                 .promotion
//                                                                                 .type ===
//                                                                             'value'
//                                                                                 ? room
//                                                                                       .promotion
//                                                                                       .value
//                                                                                 : ''
//                                                                         }
//                                                                         placeholder="Value"
//                                                                         onChange={(
//                                                                             val,
//                                                                         ) => {
//                                                                             updateRoomAdjustment(
//                                                                                 index,
//                                                                                 rIndex,
//                                                                                 'promotion',
//                                                                                 'type',
//                                                                                 'value',
//                                                                             );
//                                                                             updateRoomAdjustment(
//                                                                                 index,
//                                                                                 rIndex,
//                                                                                 'promotion',
//                                                                                 'value',
//                                                                                 val,
//                                                                             );
//                                                                         }}
//                                                                     />
//                                                                 </div>
//                                                             </div>

//                                                             {/* COMMISSION */}
//                                                             <div className="space-y-1">
//                                                                 <p className="text-xs text-muted-foreground">
//                                                                     Commission
//                                                                 </p>

//                                                                 <div className="grid grid-cols-2 gap-2">
//                                                                     {/* % */}
//                                                                     <div className="relative">
//                                                                         <MoneyInput
//                                                                             value={
//                                                                                 room
//                                                                                     .commission
//                                                                                     .type ===
//                                                                                 'percent'
//                                                                                     ? room
//                                                                                           .commission
//                                                                                           .value
//                                                                                     : ''
//                                                                             }
//                                                                             placeholder="0"
//                                                                             className="pr-8"
//                                                                             onChange={(
//                                                                                 val,
//                                                                             ) => {
//                                                                                 updateRoomAdjustment(
//                                                                                     index,
//                                                                                     rIndex,
//                                                                                     'commission',
//                                                                                     'type',
//                                                                                     'percent',
//                                                                                 );
//                                                                                 updateRoomAdjustment(
//                                                                                     index,
//                                                                                     rIndex,
//                                                                                     'commission',
//                                                                                     'value',
//                                                                                     val,
//                                                                                 );
//                                                                             }}
//                                                                         />

//                                                                         <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
//                                                                             %
//                                                                         </span>
//                                                                     </div>

//                                                                     {/* VALUE */}
//                                                                     <MoneyInput
//                                                                         value={
//                                                                             room
//                                                                                 .commission
//                                                                                 .type ===
//                                                                             'value'
//                                                                                 ? room
//                                                                                       .commission
//                                                                                       .value
//                                                                                 : ''
//                                                                         }
//                                                                         placeholder="Value"
//                                                                         onChange={(
//                                                                             val,
//                                                                         ) => {
//                                                                             updateRoomAdjustment(
//                                                                                 index,
//                                                                                 rIndex,
//                                                                                 'commission',
//                                                                                 'type',
//                                                                                 'value',
//                                                                             );
//                                                                             updateRoomAdjustment(
//                                                                                 index,
//                                                                                 rIndex,
//                                                                                 'commission',
//                                                                                 'value',
//                                                                                 val,
//                                                                             );
//                                                                         }}
//                                                                     />
//                                                                 </div>
//                                                             </div>
//                                                         </div>
//                                                     ),
//                                                 )}

//                                                 {/* ADD ROOM */}
//                                                 <Button
//                                                     type="button"
//                                                     size="sm"
//                                                     variant="outline"
//                                                     onClick={() =>
//                                                         addRoom(index)
//                                                     }
//                                                     disabled={
//                                                         item.prices.length >=
//                                                         priceCategories.length
//                                                     }
//                                                     className="w-full"
//                                                 >
//                                                     + Add Category
//                                                 </Button>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         </TabsContent>

//                         {/* ================= TAB 3 — AVAILABILITY ================= */}

//                         <TabsContent value="availability">
//                             <div className="space-y-4">
//                                 <div className="flex justify-between items-center px-4 py-2">
//                                     <h3 className="text-lg font-semibold">
//                                         <span className="font-semibold">
//                                             Availability — {tour.name}
//                                         </span>
//                                     </h3>
//                                     <span className="text-sm text-muted-foreground"></span>
//                                 </div>

//                                 <div className="flex items-center justify-between px-4 py-2">
//                                     <h3 className="text-lg font-semibold">
//                                         <span className="text-foreground font-semibold">
//                                             Quantity: pax
//                                         </span>
//                                     </h3>
//                                 </div>

//                                 <div className="hidden md:block rounded-lg border overflow-x-auto">
//                                     <table className="w-full table-fixed text-sm min-w-[1000px]">
//                                         <colgroup>
//                                             <col className="w-[120px]" />{' '}
//                                             {/* Departure */}
//                                             <col className="w-[50px]" />{' '}
//                                             {/* Max Pax */}
//                                             <col className="w-[50px]" />
//                                             <col className="w-[50px]" />
//                                             <col className="w-[50px]" />
//                                             <col className="w-[50px]" />
//                                             <col className="w-[50px]" />
//                                             <col className="w-[50px]" />
//                                             <col className="w-[50px]" />
//                                             <col className="w-[50px]" />
//                                             <col className="w-[50px]" />
//                                             <col className="w-[50px]" />
//                                             <col className="w-[50px]" />{' '}
//                                             {/* Action */}
//                                         </colgroup>
//                                         <thead className="bg-muted">
//                                             <tr>
//                                                 <th className="p-3 text-left">
//                                                     Departure → Return
//                                                 </th>
//                                                 <th className="p-3 text-right">
//                                                     Max Pax
//                                                 </th>
//                                                 <th className="p-3 text-right">
//                                                     Manual <br /> Reserved{' '}
//                                                     <br /> (RS)
//                                                 </th>
//                                                 <th className="p-3 text-right">
//                                                     Waiting Payment <br /> (WP)
//                                                 </th>
//                                                 <th className="p-3 text-right">
//                                                     Down Payment <br /> (DP)
//                                                 </th>
//                                                 <th className="p-3 text-right">
//                                                     Full Payment <br /> (FP)
//                                                 </th>
//                                                 <th className="p-3 text-right">
//                                                     Booking <br /> Reserved{' '}
//                                                     <br /> (BRS)
//                                                 </th>
//                                                 <th className="p-3 text-right">
//                                                     Cancel <br /> (CA)
//                                                 </th>
//                                                 <th className="p-3 text-right">
//                                                     Refund <br /> (RF)
//                                                 </th>
//                                                 <th className="p-3 text-right">
//                                                     Expired <br /> EX)
//                                                 </th>
//                                                 <th className="p-3 text-right">
//                                                     Waiting List <br /> (WL)
//                                                 </th>
//                                                 <th className="p-3 text-right">
//                                                     Available <br /> (WL)
//                                                 </th>
//                                                 <th className="p-3 text-right">
//                                                     Action
//                                                 </th>
//                                             </tr>
//                                         </thead>

//                                         <tbody>
//                                             {availability.map((row, i) => (
//                                                 <tr
//                                                     key={row.id}
//                                                     className="border-t"
//                                                 >
//                                                     <td className="p-3">
//                                                         {row.schedule}
//                                                     </td>

//                                                     {/* max pax */}
//                                                     <td className="p-3">
//                                                         <MoneyInput
//                                                             className="text-right"
//                                                             value={row.max_pax}
//                                                             onChange={(val) =>
//                                                                 updateAvailability(
//                                                                     i,
//                                                                     'max_pax',
//                                                                     Number(val),
//                                                                 )
//                                                             }
//                                                         />
//                                                     </td>

//                                                     {/* RS */}
//                                                     <td className="p-3">
//                                                         <MoneyInput
//                                                             className="text-right"
//                                                             value={row.RS}
//                                                             onChange={(val) =>
//                                                                 updateAvailability(
//                                                                     i,
//                                                                     'RS',
//                                                                     Number(val),
//                                                                 )
//                                                             }
//                                                         />
//                                                     </td>

//                                                     {/* WP */}
//                                                     <td className="p-3">
//                                                         <MoneyInput
//                                                             className="text-right"
//                                                             value={row.WP}
//                                                             onChange={(val) =>
//                                                                 updateAvailability(
//                                                                     i,
//                                                                     'WP',
//                                                                     Number(val),
//                                                                 )
//                                                             }
//                                                             disabled={true}
//                                                         />
//                                                     </td>

//                                                     {/* DP */}
//                                                     <td className="p-3">
//                                                         <MoneyInput
//                                                             className="text-right"
//                                                             value={row.DP}
//                                                             onChange={(val) =>
//                                                                 updateAvailability(
//                                                                     i,
//                                                                     'DP',
//                                                                     Number(val),
//                                                                 )
//                                                             }
//                                                             disabled={true}
//                                                         />
//                                                     </td>

//                                                     {/* FP */}
//                                                     <td className="p-3">
//                                                         <MoneyInput
//                                                             className="text-right"
//                                                             value={row.FP}
//                                                             onChange={(val) =>
//                                                                 updateAvailability(
//                                                                     i,
//                                                                     'FP',
//                                                                     Number(val),
//                                                                 )
//                                                             }
//                                                             disabled={true}
//                                                         />
//                                                     </td>

//                                                     {/* BRS */}
//                                                     <td className="p-3">
//                                                         <MoneyInput
//                                                             className="text-right"
//                                                             value={row.BRS}
//                                                             onChange={(val) =>
//                                                                 updateAvailability(
//                                                                     i,
//                                                                     'BRS',
//                                                                     Number(val),
//                                                                 )
//                                                             }
//                                                             disabled={true}
//                                                         />
//                                                     </td>

//                                                     {/* CA */}
//                                                     <td className="p-3">
//                                                         <MoneyInput
//                                                             className="text-right"
//                                                             value={row.CA}
//                                                             onChange={(val) =>
//                                                                 updateAvailability(
//                                                                     i,
//                                                                     'CA',
//                                                                     Number(val),
//                                                                 )
//                                                             }
//                                                             disabled={true}
//                                                         />
//                                                     </td>

//                                                     {/* RF */}
//                                                     <td className="p-3">
//                                                         <MoneyInput
//                                                             className="text-right"
//                                                             value={row.RF}
//                                                             onChange={(val) =>
//                                                                 updateAvailability(
//                                                                     i,
//                                                                     'RF',
//                                                                     Number(val),
//                                                                 )
//                                                             }
//                                                             disabled={true}
//                                                         />
//                                                     </td>

//                                                     {/* EX */}
//                                                     <td className="p-3">
//                                                         <MoneyInput
//                                                             className="text-right"
//                                                             value={row.EX}
//                                                             onChange={(val) =>
//                                                                 updateAvailability(
//                                                                     i,
//                                                                     'EX',
//                                                                     Number(val),
//                                                                 )
//                                                             }
//                                                             disabled={true}
//                                                         />
//                                                     </td>

//                                                     {/* WL */}
//                                                     <td className="p-3">
//                                                         <MoneyInput
//                                                             className="text-right"
//                                                             value={row.WL}
//                                                             onChange={(val) =>
//                                                                 updateAvailability(
//                                                                     i,
//                                                                     'WL',
//                                                                     Number(val),
//                                                                 )
//                                                             }
//                                                             disabled={true}
//                                                         />
//                                                     </td>

//                                                     {/* available */}
//                                                     <td
//                                                         className={`p-3 text-right font-semibold ${
//                                                             row.available <= 0
//                                                                 ? 'text-red-500'
//                                                                 : 'text-green-600'
//                                                         }`}
//                                                     >
//                                                         {row.available}
//                                                     </td>
//                                                     <td
//                                                         className={`p-3 text-right font-semibold`}
//                                                     >
//                                                         <Button
//                                                             type="button"
//                                                             disabled={
//                                                                 savingAvailability
//                                                             }
//                                                             onClick={async () => {
//                                                                 setSavingAvailability(
//                                                                     true,
//                                                                 );

//                                                                 try {
//                                                                     const payload =
//                                                                         buildAvailabilityPayload();

//                                                                     console.log(
//                                                                         'SEND AVAILABILITY:',
//                                                                         payload,
//                                                                     );

//                                                                     //`/companies/${company.username}/dashboard/tour-availabilities`

//                                                                     router.post(
//                                                                         `/companies/${company.username}/dashboard/tour-availabilities`,
//                                                                         {
//                                                                             availabilities:
//                                                                                 payload,
//                                                                         },
//                                                                         {
//                                                                             onSuccess:
//                                                                                 () => {
//                                                                                     toast.success(
//                                                                                         'Availability saved',
//                                                                                     );
//                                                                                 },
//                                                                             onError:
//                                                                                 () => {
//                                                                                     toast.error(
//                                                                                         'Failed to save availability',
//                                                                                     );
//                                                                                 },
//                                                                             onFinish:
//                                                                                 () => {
//                                                                                     setSavingAvailability(
//                                                                                         false,
//                                                                                     );
//                                                                                 },
//                                                                         },
//                                                                     );
//                                                                 } catch (err) {
//                                                                     setSavingAvailability(
//                                                                         false,
//                                                                     );
//                                                                 }
//                                                             }}
//                                                         >
//                                                             {savingAvailability && (
//                                                                 <Spinner />
//                                                             )}
//                                                             <Save className="h-4 w-4" />
//                                                         </Button>
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                                 {/* MOBILE */}
//                                 <div className="md:hidden space-y-4">
//                                     {availability.map((row, i) => (
//                                         <div
//                                             key={row.id}
//                                             className="border rounded-xl p-4 space-y-3 shadow-sm"
//                                         >
//                                             {/* Header */}
//                                             <div className="flex justify-between items-start">
//                                                 <div className="font-semibold text-sm">
//                                                     {row.schedule}
//                                                 </div>

//                                                 <div
//                                                     className={`text-sm font-semibold ${
//                                                         row.available <= 0
//                                                             ? 'text-red-500'
//                                                             : 'text-green-600'
//                                                     }`}
//                                                 >
//                                                     {row.available} pax
//                                                 </div>
//                                             </div>

//                                             {/* Input grid */}
//                                             <div className="grid grid-cols-2 gap-2 text-sm">
//                                                 {[
//                                                     {
//                                                         key: 'max_pax',
//                                                         label: 'Max',
//                                                     },
//                                                     { key: 'RS', label: 'RS' },
//                                                     { key: 'WP', label: 'WP' },
//                                                     { key: 'DP', label: 'DP' },
//                                                     { key: 'FP', label: 'FP' },
//                                                     {
//                                                         key: 'BRS',
//                                                         label: 'BRS',
//                                                     },
//                                                     { key: 'CA', label: 'CA' },
//                                                     { key: 'RF', label: 'RF' },
//                                                     { key: 'EX', label: 'EX' },
//                                                     { key: 'WL', label: 'WL' },
//                                                 ].map((field) => (
//                                                     <>
//                                                         <div className="text-muted-foreground">
//                                                             {field.label}
//                                                         </div>

//                                                         <MoneyInput
//                                                             className="text-right"
//                                                             value={
//                                                                 row[field.key]
//                                                             }
//                                                             onChange={(val) =>
//                                                                 updateAvailability(
//                                                                     i,
//                                                                     field.key,
//                                                                     Number(val),
//                                                                 )
//                                                             }
//                                                         />
//                                                     </>
//                                                 ))}
//                                             </div>

//                                             {/* Action */}
//                                             <Button
//                                                 className="w-full"
//                                                 type="button"
//                                                 disabled={savingAvailability}
//                                                 onClick={async () => {
//                                                     setSavingAvailability(true);

//                                                     try {
//                                                         const payload =
//                                                             buildAvailabilityPayload();

//                                                         router.post(
//                                                             `/companies/${company.username}/dashboard/tour-availabilities`,
//                                                             {
//                                                                 availabilities:
//                                                                     payload,
//                                                             },
//                                                             {
//                                                                 onSuccess: () =>
//                                                                     toast.success(
//                                                                         'Availability saved',
//                                                                     ),
//                                                                 onError: () =>
//                                                                     toast.error(
//                                                                         'Failed to save availability',
//                                                                     ),
//                                                                 onFinish: () =>
//                                                                     setSavingAvailability(
//                                                                         false,
//                                                                     ),
//                                                             },
//                                                         );
//                                                     } catch {
//                                                         setSavingAvailability(
//                                                             false,
//                                                         );
//                                                     }
//                                                 }}
//                                             >
//                                                 {savingAvailability && (
//                                                     <Spinner />
//                                                 )}
//                                                 Save
//                                             </Button>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>

//                             <div className="flex justify-start pt-6 border-t"></div>
//                         </TabsContent>

//                         {/* ================= TAB 4 — ADD ONS ================= */}
//                         <TabsContent value="addons">
//                             <div className="space-y-4">
//                                 <div className="flex justify-between items-center px-4 py-2">
//                                     <h3 className="text-lg font-semibold">
//                                         <span className="font-semibold">
//                                             Add Ons Table — {tour.name}
//                                         </span>
//                                     </h3>
//                                     <span className="text-sm text-muted-foreground"></span>
//                                 </div>

//                                 <div className="flex items-center justify-between px-4 py-2">
//                                     <h3 className="text-lg font-semibold">
//                                         <span className="text-foreground font-semibold">
//                                             Currency: {tour.currency}
//                                         </span>
//                                     </h3>
//                                 </div>

//                                 <div className="rounded-lg border overflow-hidden">
//                                     <table className="w-full text-sm">
//                                         <thead className="bg-muted">
//                                             <tr>
//                                                 <th className="p-3 text-left">
//                                                     Departure → Return
//                                                 </th>
//                                                 <th className="p-3 text-left">
//                                                     Descriptions
//                                                 </th>
//                                                 <th className="p-3 text-left">
//                                                     Prices / Pax
//                                                 </th>
//                                                 <th className="p-3 text-left">
//                                                     Editable
//                                                 </th>
//                                                 <th className="p-3 text-left">
//                                                     Action
//                                                 </th>
//                                             </tr>
//                                         </thead>

//                                         <tbody>
//                                             {schedules.map((schedule) => {
//                                                 const rows =
//                                                     addOns[schedule.id] || [];
//                                                 const rowCount = rows.length;

//                                                 return (
//                                                     <Fragment key={schedule.id}>
//                                                         {/* KALAU ADA DATA */}
//                                                         {rows.length > 0 &&
//                                                             rows.map(
//                                                                 (
//                                                                     row,
//                                                                     index,
//                                                                 ) => (
//                                                                     <tr
//                                                                         key={
//                                                                             index
//                                                                         }
//                                                                         className="border-t"
//                                                                     >
//                                                                         {/* SCHEDULE */}
//                                                                         {index ===
//                                                                             0 && (
//                                                                             <td
//                                                                                 className="p-3 font-medium align-top"
//                                                                                 rowSpan={
//                                                                                     rowCount +
//                                                                                     1
//                                                                                 }
//                                                                             >
//                                                                                 {formatDate(
//                                                                                     schedule.departure_date,
//                                                                                 )}{' '}
//                                                                                 →{' '}
//                                                                                 {formatDate(
//                                                                                     schedule.return_date,
//                                                                                 )}
//                                                                             </td>
//                                                                         )}

//                                                                         {/* DESCRIPTION */}
//                                                                         <td className="p-3">
//                                                                             <input
//                                                                                 type="text"
//                                                                                 className="w-full border rounded px-2 py-1"
//                                                                                 value={
//                                                                                     row.description
//                                                                                 }
//                                                                                 onChange={(
//                                                                                     e,
//                                                                                 ) =>
//                                                                                     updateRow(
//                                                                                         schedule.id,
//                                                                                         index,
//                                                                                         'description',
//                                                                                         e
//                                                                                             .target
//                                                                                             .value,
//                                                                                     )
//                                                                                 }
//                                                                             />
//                                                                         </td>

//                                                                         {/* PRICE */}
//                                                                         <td className="p-3">
//                                                                             <MoneyInput
//                                                                                 className="text-right"
//                                                                                 value={
//                                                                                     row.price
//                                                                                 }
//                                                                                 onChange={(
//                                                                                     val,
//                                                                                 ) =>
//                                                                                     updateRow(
//                                                                                         schedule.id,
//                                                                                         index,
//                                                                                         'price',
//                                                                                         Number(
//                                                                                             val,
//                                                                                         ),
//                                                                                     )
//                                                                                 }
//                                                                             />
//                                                                         </td>

//                                                                         {/* CHECKBOX */}
//                                                                         <td className="p-3 text-center">
//                                                                             <input
//                                                                                 type="checkbox"
//                                                                                 checked={
//                                                                                     row.edit_status
//                                                                                 }
//                                                                                 onChange={(
//                                                                                     e,
//                                                                                 ) =>
//                                                                                     updateRow(
//                                                                                         schedule.id,
//                                                                                         index,
//                                                                                         'edit_status',
//                                                                                         e
//                                                                                             .target
//                                                                                             .checked,
//                                                                                     )
//                                                                                 }
//                                                                             />
//                                                                         </td>

//                                                                         {/* DELETE and SAVE */}
//                                                                         <td className="p-3 text-left">
//                                                                             <div className="flex items-center justify-center gap-2">
//                                                                                 <Button
//                                                                                     type="button"
//                                                                                     variant="destructive"
//                                                                                     size="icon"
//                                                                                     onClick={() =>
//                                                                                         handleDelete(
//                                                                                             schedule.id,
//                                                                                             index,
//                                                                                         )
//                                                                                     }
//                                                                                 >
//                                                                                     <Trash2 className="h-4 w-4" />
//                                                                                 </Button>

//                                                                                 <Button
//                                                                                     type="button"
//                                                                                     disabled={
//                                                                                         savingAddOns
//                                                                                     }
//                                                                                     onClick={() =>
//                                                                                         syncAddOns(
//                                                                                             addOns,
//                                                                                         )
//                                                                                     }
//                                                                                 >
//                                                                                     {savingAddOns && (
//                                                                                         <Spinner />
//                                                                                     )}
//                                                                                     <Save className="h-4 w-4" />
//                                                                                 </Button>
//                                                                             </div>
//                                                                         </td>
//                                                                     </tr>
//                                                                 ),
//                                                             )}

//                                                         {/* ADD ROW BUTTON */}
//                                                         <tr className="border-t">
//                                                             {/* kalau belum ada row → schedule tetap tampil */}
//                                                             {rows.length ===
//                                                                 0 && (
//                                                                 <td className="p-3 font-medium">
//                                                                     {
//                                                                         schedule.departure_date
//                                                                     }{' '}
//                                                                     →{' '}
//                                                                     {
//                                                                         schedule.return_date
//                                                                     }
//                                                                 </td>
//                                                             )}

//                                                             <td
//                                                                 colSpan={
//                                                                     rows.length ===
//                                                                     0
//                                                                         ? 4
//                                                                         : 4
//                                                                 }
//                                                                 className="p-3"
//                                                             >
//                                                                 <button
//                                                                     type="button"
//                                                                     onClick={() =>
//                                                                         addRow(
//                                                                             schedule.id,
//                                                                         )
//                                                                     }
//                                                                     className="text-blue-600 text-sm"
//                                                                 >
//                                                                     + Add Ons
//                                                                 </button>
//                                                             </td>
//                                                         </tr>
//                                                     </Fragment>
//                                                 );
//                                             })}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </div>

//                             <div className="flex justify-start pt-6 border-t"></div>
//                         </TabsContent>
//                     </Tabs>

//                     <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
//                         <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
//                             <DialogHeader>
//                                 <DialogTitle>
//                                     Copy Schedule To New Departure Dates{' '}
//                                     <br></br>
//                                     <br></br>
//                                     {tour.name}
//                                 </DialogTitle>
//                             </DialogHeader>

//                             <div className="flex-1 overflow-y-auto space-y-4 pr-1">
//                                 <div className="border rounded-lg flex justify-center w-fit mx-auto overflow-hidden p-1">
//                                     <div className="scale-90 origin-top">
//                                         <Calendar
//                                             mode="multiple"
//                                             selected={selectedDates}
//                                             onSelect={(dates) =>
//                                                 setSelectedDates(dates || [])
//                                             }
//                                             disabled={(date) =>
//                                                 date <
//                                                 new Date(
//                                                     new Date().setHours(
//                                                         0,
//                                                         0,
//                                                         0,
//                                                         0,
//                                                     ),
//                                                 )
//                                             }
//                                             className="rounded-md"
//                                         />
//                                     </div>
//                                 </div>

//                                 <div className="space-y-2 max-h-40 overflow-auto">
//                                     {selectedDates.length === 0 && (
//                                         <p className="text-sm text-muted-foreground">
//                                             No date selected
//                                         </p>
//                                     )}

//                                     {selectedDates.map((date, i) => (
//                                         <div
//                                             key={i}
//                                             className="flex items-center justify-between border rounded-md px-3 py-2"
//                                         >
//                                             <span>
//                                                 {format(date, 'dd MMM yyyy')}
//                                             </span>

//                                             <Button
//                                                 type="button"
//                                                 size="sm"
//                                                 variant="destructive"
//                                                 onClick={() =>
//                                                     setSelectedDates((prev) =>
//                                                         prev.filter(
//                                                             (d) =>
//                                                                 format(
//                                                                     d,
//                                                                     'yyyy-MM-dd',
//                                                                 ) !==
//                                                                 format(
//                                                                     date,
//                                                                     'yyyy-MM-dd',
//                                                                 ),
//                                                         ),
//                                                     )
//                                                 }
//                                             >
//                                                 Remove
//                                             </Button>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>

//                             <DialogFooter>
//                                 <Button
//                                     type="button"
//                                     variant="outline"
//                                     onClick={() => setCopyOpen(false)}
//                                 >
//                                     Cancel
//                                 </Button>

//                                 <Button
//                                     type="button"
//                                     className="bg-blue-600 text-white hover:bg-blue-700"
//                                     onClick={submitCopySchedules}
//                                 >
//                                     Generate
//                                 </Button>
//                             </DialogFooter>
//                         </DialogContent>
//                     </Dialog>
//                 </div>
//             </form>
//         </CompanyDashboardLayout>
//     );
// }
