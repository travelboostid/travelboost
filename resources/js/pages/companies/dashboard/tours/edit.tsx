import { update } from '@/actions/App/Http/Controllers/Companies/Dashboard/TourController';
import type { MediaResource } from '@/api/model';
import InputError from '@/components/input-error';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { MediaPicker } from '@/components/media-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { extractImageSrc } from '@/lib/utils';
import { router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import SelectCategory from './components/select-category';
import SelectContinent from './components/select-continent';
import SelectCountry from './components/select-country';
import SelectCurrency from './components/select-currency';
import SelectRegion from './components/select-region';

import { useEffect } from 'react';

import { TourDocumentPicker } from '@/components/media/tour-document-picker';
import MoneyInput from '@/components/ui/money-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, InfoIcon, MoreVertical, Save, Trash2 } from 'lucide-react';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import axios from 'axios';
import { format } from 'date-fns';

///////////tab 2
type RoomPrice = {
    id?: number | null;
    schedule_id?: number | null;
    room_type_id: number | null;
    price: string;
    promotion: Adjustment;
    commission: Adjustment;
};

type Adjustment = {
    type: 'percent' | 'value';
    value: string;
};

type Schedule = {
    id?: number | null;
    departure_date: string;
    return_date: string;
    prices: RoomPrice[];
    availability?: Partial<
        Record<AvailabilityField, number | string | null>
    > | null;
    add_ons?: any;
    promotion?: Adjustment;
    commission?: Adjustment;
    //promotion: Adjustment
    //commission: Adjustment
};

type PriceCategory = {
    id: number;
    name: string;
};

type Props = {
    tour: any;
};

type AddOn = {
    id?: number | null;
    description: string;
    price: number | '';
    edit_status: boolean;
};

type AddOnsState = {
    [scheduleId: number]: AddOn[];
};

type AvailabilityField =
    | 'max_pax'
    | 'WP'
    | 'WA'
    | 'WPA'
    | 'DP'
    | 'FP'
    | 'RS'
    | 'BRS'
    | 'CA'
    | 'RF'
    | 'EX'
    | 'WL'
    | 'available';

type AvailabilityRow = Record<AvailabilityField, number> & {
    id?: number | null;

    departure_date: string;
    return_date: string;

    schedule: string;
};

const EDITABLE_AVAILABILITY_FIELDS: AvailabilityField[] = ['max_pax', 'RS'];

const AVAILABILITY_MOBILE_FIELDS: { key: AvailabilityField; label: string }[] =
    [
        { key: 'max_pax', label: 'Max' },
        { key: 'RS', label: 'RS' },
        { key: 'WP', label: 'WP' },
        { key: 'WPA', label: 'WPA' },
        { key: 'DP', label: 'DP' },
        { key: 'FP', label: 'FP' },
        { key: 'BRS', label: 'BRS' },
        { key: 'CA', label: 'CA' },
        { key: 'RF', label: 'RF' },
        { key: 'EX', label: 'EX' },
        { key: 'WL', label: 'WL' },
    ];

export default function Page({ tour }: Props) {
    const { props } = usePage() as any; // ✅ di sini

    const [activeTab, setActiveTab] = useState<'tour' | 'schedule'>('tour');

    useEffect(() => {
        if (props.flash?.tab) {
            setActiveTab(props.flash.tab);
        }
    }, [props.flash?.tab]);

    // STATE
    const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(
        null,
    );

    const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);

    const [continentId, setContinentId] = useState<number | null>(
        tour.continent_id ?? null,
    );
    const [regionId, setRegionId] = useState<number | null>(
        tour.region_id ?? null,
    );
    const [countryId, setCountryId] = useState<number | null>(
        tour.country_id ?? null,
    );

    const [selectedDocument, setSelectedDocument] = useState<any>(
        tour.document || null,
    );

    const { company } = usePageSharedDataProps();
    const handleSuccess = () => {
        toast.success('Success', {
            position: 'top-center',
            description: 'Tour data updated successfully',
        });
    };

    const [displayPrice, setDisplayPrice] = useState('');
    const [rawPrice, setRawPrice] = useState('');

    const [displayPrice1, setDisplayPrice1] = useState('0');
    const [rawPrice1, setRawPrice1] = useState('0');

    const { data, setData, put, processing, errors } = useForm({
        name: tour.name || '',
        description: tour.description || '',
        code: tour.code || '',
        destination: tour.destination || '',
        duration_days: tour.duration_days || '',

        showprice: rawPrice,
        promote_price: rawPrice1,
        promote_title: tour.promote_title || '',
        promote_note: tour.promote_note || '',

        continent_id: tour.continent_id || '',
        region_id: tour.region_id || '',
        country_id: tour.country_id || '',
        category_id: tour.category_id || '',
        status: tour.status || 'inactive',

        image_id: tour.image?.id || '',
        document_id: tour.document?.id || '',

        currency: tour.currency || 'IDR',

        schedules: [], // nanti inject
    });

    const { priceCategories } = usePage<{
        priceCategories: PriceCategory[];
    }>().props;

    const isDuplicateDeparture = (date: string, currentIndex: number) => {
        return schedules.some((s, i) => {
            if (i === currentIndex) return false;
            return s.departure_date === date;
        });
    };

    const [schedules, setSchedules] = useState<Schedule[]>(
        (tour.schedules || []).map((s: any) => ({
            id: s.id,
            departure_date: s.departure_date ?? '',
            return_date: s.return_date ?? '',
            availability: s.availability || null,
            /*prices: (s.prices || []).map((p: any) => ({
        room_type_id: p.room_type_id,
        price: String(p.price ?? ''),
        promotion: {
          type: p.promotion_type ?? 'percent',
          value: String(p.promotion_value ?? ''),
        },
        commission: {
          type: p.commission_type ?? 'percent',
          value: String(p.commission_value ?? ''),
        },
      })),*/
            prices: (s.prices || []).map((p: any) => ({
                id: p.id,
                room_type_id: p.price_category_id,

                price: String(p.price ?? ''),

                promotion: {
                    /*type: p.promotion_rate > 0 ? 'percent' : 'value',
          value: String(
            p.promotion_rate > 0
              ? p.promotion_rate
              : p.promotion ?? ''
          ),*/
                    type:
                        p.promotion_rate > 0
                            ? 'percent'
                            : p.promotion > 0
                              ? 'value'
                              : 'percent', // default

                    value: String(
                        p.promotion_rate > 0
                            ? p.promotion_rate
                            : p.promotion > 0
                              ? p.promotion
                              : '',
                    ),
                },

                commission: {
                    /*type: p.commission_rate > 0 ? 'percent' : 'value',
          value: String(
            p.commission_rate > 0
              ? p.commission_rate
              : p.commission ?? ''
          ),*/
                    type:
                        p.commission_rate > 0
                            ? 'percent'
                            : p.commission > 0
                              ? 'value'
                              : 'percent', // default

                    value: String(
                        p.commission_rate > 0
                            ? p.commission_rate
                            : p.commission > 0
                              ? p.commission
                              : '',
                    ),
                },
            })),
        })),
    );

    const handlePriceChange = (value: string) => {
        const numeric = value.replace(/\D/g, '');
        setRawPrice(numeric);
        setData('showprice', numeric);

        const formatted = new Intl.NumberFormat('id-ID').format(
            Number(numeric),
        );
        setDisplayPrice(formatted);
    };

    useEffect(() => {
        const numeric = tour.showprice != null ? String(tour.showprice) : '0';

        setRawPrice(numeric);

        const formatted = new Intl.NumberFormat('id-ID').format(
            Number(numeric),
        );
        setDisplayPrice(formatted);

        // 🔥 WAJIB
        setData('showprice', numeric);
    }, [tour.showprice, setData]);
    //

    const handlePriceChange1 = (value: string) => {
        let numeric1 = value.replace(/\D/g, '');

        if (numeric1 === '') numeric1 = '0'; // 🔥 default 0

        setRawPrice1(numeric1);
        setData('promote_price', numeric1);

        const formatted1 = new Intl.NumberFormat('id-ID').format(
            Number(numeric1),
        );
        setDisplayPrice1(formatted1);
    };

    useEffect(() => {
        const numeric =
            tour.promote_price != null ? String(tour.promote_price) : '0';

        setRawPrice1(numeric);

        const formatted = new Intl.NumberFormat('id-ID').format(
            Number(numeric),
        );
        setDisplayPrice1(formatted);

        // 🔥 WAJIB
        setData('promote_price', numeric);
    }, [tour.promote_price, setData]);
    //

    // 🔥 TAMBAHKAN DI SINI 17042026
    /*useEffect(() => {
  console.log('FROM SERVER:', tour.schedules)
}, [])*/

    const submitSchedule = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await axios.post(
                `/companies/${company.username}/dashboard/tours/${tour.id}/schedules`,
                {
                    schedules,
                },
            );

            // update schedules dengan id asli database
            if (res.data?.schedules) {
                setSchedules((prev) =>
                    prev.map((localSchedule) => {
                        // cari schedule hasil save berdasarkan departure_date
                        const savedSchedule = res.data.schedules.find(
                            (dbSchedule: any) =>
                                dbSchedule.departure_date ===
                                localSchedule.departure_date,
                        );

                        // kalau tidak ada, pakai data lama
                        if (!savedSchedule) {
                            return localSchedule;
                        }

                        // replace hanya field dari database
                        return {
                            ...localSchedule,
                            id: savedSchedule.id,
                        };
                    }),
                );
            }

            toast.success('Schedule saved');

            // CLOSE DROPDOWN
            setOpenDropdownIndex(null);
        } catch (err) {
            toast.error('Failed save schedule');
        }
    };
    const addDays = (date: string, days: number) => {
        if (!date || !days) return '';

        const d = new Date(date);
        d.setDate(d.getDate() + Number(days) - 1);
        return d.toISOString().split('T')[0];
    };

    const addSchedule = () => {
        setSchedules([
            ...schedules,
            {
                id: null,
                departure_date: '',
                return_date: '',
                availability: null,
                prices: [
                    {
                        room_type_id: null,
                        price: '',
                        promotion: { type: 'percent', value: '' },
                        commission: { type: 'percent', value: '' },
                    },
                ],
                //promotion: { type: 'percent', value: '' },
                //commission: { type: 'percent', value: '' },
            },
        ]);
    };

    const updateSchedule = (
        index: number,
        field: keyof Schedule,
        value: string,
    ) => {
        // 🔥 VALIDASI DUPLIKAT DEPARTURE DATE
        if (field === 'departure_date') {
            if (isDuplicateDeparture(value, index)) {
                toast.error('Departure date has been used');
                return;
            }
        }

        setSchedules((prev) => {
            const updated = [...prev];
            const row = { ...updated[index], [field]: value };

            // 🔥 AUTO SET return_date
            if (field === 'departure_date' && data.duration_days) {
                row.return_date = addDays(value, Number(data.duration_days));
            }

            // 🔥 VALIDASI: return tidak boleh sebelum departure
            if (
                row.return_date &&
                row.departure_date &&
                row.return_date < row.departure_date
            ) {
                row.return_date = '';
            }

            updated[index] = row;
            return updated;
        });
    };

    const removeSchedule = (index: number) => {
        const item = schedules[index];

        // kalau belum tersimpan di DB
        if (!item.id) {
            setSchedules(schedules.filter((_, i) => i !== index));
            return;
        }

        if (!confirm('Delete this schedule?')) return;

        router.delete(
            `/companies/${company.username}/dashboard/tours/${tour.id}/schedules/${item.id}`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSchedules(schedules.filter((_, i) => i !== index));
                },
            },
        );
    };

    const addRoom = (index: number) => {
        setSchedules((prev) =>
            prev.map((schedule, i) => {
                if (i !== index) return schedule;

                return {
                    ...schedule,
                    prices: [
                        ...schedule.prices,
                        {
                            room_type_id: null,
                            price: '',
                            promotion: {
                                type: 'percent',
                                value: '',
                            },
                            commission: {
                                type: 'percent',
                                value: '',
                            },
                        },
                    ],
                };
            }),
        );
    };

    const updateRoom = (
        scheduleIndex: number,
        roomIndex: number,
        field: string,
        value: any,
    ) => {
        setSchedules((prev) =>
            prev.map((schedule, i) => {
                if (i !== scheduleIndex) return schedule;

                return {
                    ...schedule,
                    prices: schedule.prices.map((room, r) => {
                        if (r !== roomIndex) return room;

                        return {
                            ...room,
                            [field]: value,
                        };
                    }),
                };
            }),
        );
    };

    const removeRoom = (scheduleIndex: number, roomIndex: number) => {
        const room = schedules[scheduleIndex].prices[roomIndex];

        // kalau belum ada id = belum tersimpan
        if (!room.id) {
            const updated = [...schedules];
            updated[scheduleIndex].prices = updated[
                scheduleIndex
            ].prices.filter((_, i) => i !== roomIndex);

            setSchedules(updated);
            return;
        }

        if (!confirm('Delete this category?')) return;

        router.delete(
            `/companies/${company.username}/dashboard/tours/${tour.id}/prices/${room.id}`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    const updated = [...schedules];
                    updated[scheduleIndex].prices = updated[
                        scheduleIndex
                    ].prices.filter((_, i) => i !== roomIndex);

                    setSchedules(updated);
                },
            },
        );
    };

    const updateAdjustment = (
        index: number,
        field: 'promotion' | 'commission',
        key: 'type' | 'value',
        value: string,
    ) => {
        const updated = [...schedules];
        updated[index][field][key] = value as any;
        setSchedules(updated);
    };

    const updateRoomAdjustment = (
        scheduleIndex: number,
        roomIndex: number,
        field: 'promotion' | 'commission',
        key: 'type' | 'value',
        value: string,
    ) => {
        const updated = [...schedules];
        updated[scheduleIndex].prices[roomIndex][field][key] = value as any;
        setSchedules(updated);
    };

    //availability
    const formatDate = (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const availabilityData = useMemo<AvailabilityRow[]>(() => {
        return schedules.map((s) => {
            const a = s.availability || {};

            const max_pax = Number(a.max_pax ?? 0);

            return {
                schedule_id: s.id,

                departure_date: s.departure_date,
                return_date: s.return_date,

                schedule: `${formatDate(s.departure_date)} → ${formatDate(s.return_date)}`,

                max_pax,

                WP: Number(a.WP || 0),
                WPA: Number(a.WPA || 0),
                DP: Number(a.DP || 0),
                FP: Number(a.FP || 0),
                RS: Number(a.RS || 0),
                BRS: Number(a.BRS || 0),
                WA: Number(a.WA || 0),
                CA: Number(a.CA || 0),
                RF: Number(a.RF || 0),
                EX: Number(a.EX || 0),
                WL: Number(a.WL || 0),
                available: Number(a.available || 0),
            };
        });
    }, [schedules]);

    const [availability, setAvailability] = useState<AvailabilityRow[]>([]);

    useEffect(() => {
        setAvailability(availabilityData);
    }, [availabilityData]);

    const [savingAvailability, setSavingAvailability] = useState(false);

    /*useEffect(() => {
    setAvailability(availabilityData)
  }, [schedules])*/

    const updateAvailability = (
        index: number,
        field: AvailabilityField,
        value: number,
    ) => {
        const updated = [...availability];

        updated[index] = {
            ...updated[index],
            [field]: value,
        };

        const row = updated[index];

        // 🔥 hitung ulang dari row (bukan dari luar scope) AV = Max PAX - DP -FP - RS - BR + CA + RF - WA
        row.available =
            row.max_pax -
            row.DP -
            row.FP -
            row.RS -
            row.BRS +
            row.CA +
            row.RF +
            row.WPA +
            row.WA +
            row.WPA;

        setAvailability(updated);
    };

    const buildAvailabilityPayload = () => {
        return availability.map((row, i) => ({
            company_id: company.id,
            tour_id: tour.id, // ⚠️ di DB namanya tour_code tapi isinya id
            schedule_id: schedules[i]?.id ?? null, // pastikan schedule punya id dari DB
            max_pax: row.max_pax,
            WP: row.WP,
            WPA: row.WPA,
            DP: row.DP,
            FP: row.FP,
            RS: row.RS,
            BRS: row.BRS,
            CA: row.CA,
            RF: row.RF,
            EX: row.EX,
            WL: row.WL,
            available: row.available,
        }));
    };

    //20042026
    useEffect(() => {
        if (tour?.schedules) {
            setSchedules(
                tour.schedules.map((s: any) => ({
                    id: s.id,
                    departure_date: s.departure_date ?? '',
                    return_date: s.return_date ?? '',
                    availability: s.availability || null,
                    prices: (s.prices || []).map((p: any) => ({
                        id: p.id,
                        room_type_id: p.price_category_id,
                        price: String(p.price ?? ''),
                        promotion: {
                            /*type: p.promotion_rate > 0 ? 'percent' : 'value',
              value: String(p.promotion_rate || p.promotion || ''),*/
                            type:
                                p.promotion_rate > 0
                                    ? 'percent'
                                    : p.promotion > 0
                                      ? 'value'
                                      : 'percent', // default

                            value: String(
                                p.promotion_rate > 0
                                    ? p.promotion_rate
                                    : p.promotion > 0
                                      ? p.promotion
                                      : '',
                            ),
                        },
                        commission: {
                            /*type: p.commission_rate > 0 ? 'percent' : 'value',
              value: String(p.commission_rate || p.commission || ''),*/
                            type:
                                p.commission_rate > 0
                                    ? 'percent'
                                    : p.commission > 0
                                      ? 'value'
                                      : 'percent', // default

                            value: String(
                                p.commission_rate > 0
                                    ? p.commission_rate
                                    : p.commission > 0
                                      ? p.commission
                                      : '',
                            ),
                        },
                    })),
                })),
            );
        }
    }, [tour]);

    //Add Ons
    const { addOnsFromDb } = props;

    const [addOns, setAddOns] = useState<AddOnsState>({});

    useEffect(() => {
        const initial: AddOnsState = {};

        schedules.forEach((s) => {
            initial[s.id] = (addOnsFromDb?.[s.id] || []).map((item) => ({
                id: item.id,
                description: item.description,
                price: item.price,
                edit_status: item.edit_status,
            }));
        });

        setAddOns(initial);
    }, [schedules, addOnsFromDb]);

    const addRow = (scheduleId: number) => {
        const newRow = {
            description: '',
            price: 0,
            edit_status: false,
        };

        setAddOns((prev) => ({
            ...prev,
            [scheduleId]: [...(prev[scheduleId] || []), newRow],
        }));
    };

    const updateRow = (
        scheduleId: number,
        index: number,
        field: keyof AddOn,
        value: any,
    ) => {
        setAddOns((prev) => {
            const rows = [...(prev[scheduleId] || [])];

            if (field === 'description') {
                const isDuplicate = rows.some(
                    (row, i) =>
                        i !== index &&
                        row.description?.toLowerCase().trim() ===
                            value.toLowerCase().trim(),
                );

                if (isDuplicate) {
                    toast.error('Description tidak boleh sama');
                    return prev;
                }
            }

            rows[index] = { ...rows[index], [field]: value };

            return {
                ...prev,
                [scheduleId]: rows,
            };
        });
    };

    const deleteRow = (scheduleId: number, index: number) => {
        setAddOns((prev) => {
            const rows = [...(prev[scheduleId] || [])];
            rows.splice(index, 1);

            return {
                ...prev,
                [scheduleId]: rows,
            };
        });
    };

    const [savingAddOns, setSavingAddOns] = useState(false);

    const buildAddOnsPayload = (source = addOns) => {
        const result: any[] = [];

        Object.entries(source).forEach(([scheduleId, rows]) => {
            rows.forEach((row) => {
                if (!row.description) return;

                result.push({
                    id: row.id || null,
                    company_id: company.id,
                    tour_id: tour.id,
                    schedule_id: Number(scheduleId),
                    description: row.description,
                    price: row.price || 0,
                    edit_status: row.edit_status,
                });
            });
        });

        return result;
    };

    const syncAddOns = async (data) => {
        setSavingAddOns(true);

        try {
            const payload = buildAddOnsPayload(data);

            if (payload.length === 0) {
                toast.error('Add Ons masih kosong');
                return;
            }

            console.log('SYNC PAYLOAD:', payload);

            router.post(
                `/companies/${company.username}/dashboard/tour-add-ons`,
                { add_ons: payload, schedule_ids: Object.keys(addOns) },
                {
                    preserveState: true,
                    onSuccess: () => {
                        toast.success('Success Process Add Ons');
                    },
                    onError: (err) => {
                        console.error(err);
                        toast.error('Failed to Process Add Ons');
                    },
                    onFinish: () => {
                        setSavingAddOns(false);
                    },
                },
            );
        } catch (err) {
            setSavingAddOns(false);
        }
    };

    const handleDelete = (scheduleId: number, index: number) => {
        if (!confirm('Delete this add on?')) return;

        setAddOns((prev) => {
            const rows = [...(prev[scheduleId] || [])];

            const deletedItem = rows[index];

            rows.splice(index, 1);

            const updated = {
                ...prev,
                [scheduleId]: rows,
            };

            syncAddOns(updated);

            return updated;
        });
    };

    //copy
    const copySchedule = (item) => {
        const addons = item.add_ons?.length
            ? item.add_ons
            : addOnsFromDb[item.id] || [];

        const cloned = {
            ...item,
            id: null,

            prices: (item.prices || []).map((p) => ({
                ...p,
                id: null,
            })),

            add_ons: addons.map((a) => ({
                ...a,
                id: null,
            })),

            availability: item.availability
                ? {
                      ...item.availability,
                      id: null,
                      schedule_id: null,
                  }
                : null,
        };

        setSchedules([...schedules, cloned]);
    };

    const [copyOpen, setCopyOpen] = useState(false);
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [copySourceIndex, setCopySourceIndex] = useState<number | null>(null);
    const [copyDates, setCopyDates] = useState<string[]>(['']);

    const openCopyModal = (index: number) => {
        setCopySourceIndex(index);
        setCopyDates(['']);
        setSelectedSchedule(schedules[index]);
        setCopyOpen(true);
    };

    const addCopyDate = () => {
        setCopyDates((prev) => [...prev, '']);
    };

    const updateCopyDate = (idx: number, value: string) => {
        setCopyDates((prev) => prev.map((d, i) => (i === idx ? value : d)));
    };

    const removeCopyDate = (idx: number) => {
        setCopyDates((prev) => prev.filter((_, i) => i !== idx));
    };

    const submitCopySchedules = async () => {
        if (copySourceIndex === null) return;

        const source = schedules[copySourceIndex];

        // VALIDASI SUDAH DISAVE
        if (!source.id) {
            toast.error('Please save this schedule before copying');
            return;
        }

        // VALIDASI AVAILABILITY
        const sourceAvailability = Array.isArray(source.availability)
            ? source.availability[0]
            : source.availability;

        if (!sourceAvailability) {
            toast.error(
                'Cannot copy schedule because availability data has not been set',
            );
            return;
        }

        // VALIDASI ADD ONS
        const sourceAddonsValid =
            source.add_ons?.length > 0
                ? source.add_ons
                : addOnsFromDb?.[source.id] || [];

        if (!sourceAddonsValid || sourceAddonsValid.length === 0) {
            toast.error(
                'Cannot copy schedule because add-ons data has not been set',
            );
            return;
        }

        const validDates = selectedDates
            .map((d) => format(d, 'yyyy-MM-dd'))
            .filter(Boolean);

        if (validDates.length === 0) {
            toast.error('Please select at least one departure date');
            return;
        }

        const existingDates = schedules.map((s) => s.departure_date);

        const filteredDates = validDates.filter(
            (date) => !existingDates.includes(date),
        );

        if (filteredDates.length === 0) {
            toast.error('Selected dates already exist');
            return;
        }

        const sourceAddons =
            source.add_ons?.length > 0
                ? source.add_ons
                : addOnsFromDb?.[source.id] || [];

        const newRows = filteredDates.map((date) => ({
            id: null,
            departure_date: date,
            return_date: addDays(date, Number(data.duration_days)),

            // prices
            prices: source.prices.map((room) => ({
                ...room,
                id: null,
                schedule_id: null,
            })),

            // availability => copy hanya max_pax
            availability: (() => {
                const avail = Array.isArray(source.availability)
                    ? source.availability[0]
                    : source.availability;

                return avail
                    ? {
                          id: null,
                          schedule_id: null,
                          max_pax: avail.max_pax,
                          available: avail.available,
                      }
                    : null;
            })(),

            // add ons
            add_ons: sourceAddons.map((item) => ({
                ...item,
                id: null,
                schedule_id: null,
            })),
        }));

        const newSchedules = [...schedules, ...newRows];

        setSchedules(newSchedules);

        try {
            // SAVE SCHEDULES
            const scheduleRes = await axios.post(
                `/companies/${company.username}/dashboard/tours/${tour.id}/schedules`,
                {
                    schedules: newRows.map((s) => ({
                        //id: s.id,
                        id: null,
                        departure_date: s.departure_date,
                        return_date: s.return_date,

                        prices: (s.prices || []).map((p) => ({
                            //id: p.id,
                            id: null,
                            room_type_id: p.room_type_id,
                            price: p.price,
                            promotion: p.promotion,
                            commission: p.commission,
                        })),
                    })),
                },
            );

            const createdSchedules = scheduleRes.data.schedules.map(
                (dbSchedule, index) => ({
                    ...dbSchedule,

                    // KEEP prices
                    prices: newRows[index]?.prices || [],

                    // KEEP availability
                    availability: newRows[index]?.availability || null,

                    // KEEP add ons
                    add_ons: newRows[index]?.add_ons || [],
                }),
            );

            const updatedSchedules = [
                ...schedules.filter((s) => s.id !== null),
                ...createdSchedules,
            ];

            setSchedules(updatedSchedules);

            // AVAILABILITY
            await axios.post(
                `/companies/${company.username}/dashboard/tour-availabilities`,
                {
                    availabilities: createdSchedules.map((s) => ({
                        schedule_id: s.id,
                        tour_id: tour.id,
                        max_pax: source.availability?.max_pax || 0,
                        available: source.availability?.available || 0,
                    })),
                },
            );

            // ADD ONS
            await axios.post(
                `/companies/${company.username}/dashboard/tour-add-ons`,
                {
                    add_ons: createdSchedules.flatMap((s) =>
                        sourceAddons.map((a) => ({
                            schedule_id: s.id,
                            tour_id: tour.id,
                            description: a.description,
                            price: a.price ?? 0,
                            edit_status: a.edit_status ?? false,
                        })),
                    ),
                },
            );

            // UPDATE LOCAL STATE
            const copiedAddOns = {};

            createdSchedules.forEach((s) => {
                copiedAddOns[s.id] = sourceAddons.map((a) => ({
                    id: null,
                    schedule_id: s.id,
                    description: a.description,
                    price: a.price ?? 0,
                    edit_status: a.edit_status ?? false,
                }));
            });

            setAddOns((prev) => ({
                ...prev,
                ...copiedAddOns,
            }));

            setCopyOpen(false);
            setSelectedDates([]);
            toast.success('Schedule copied successfully');
        } catch (err) {
            toast.error('Failed copy schedule');
        }
    };

    // ================= search availability =================
    const [searchDepartureFrom, setSearchDepartureFrom] = useState('');
    const [searchDepartureTo, setSearchDepartureTo] = useState('');

    // ================= filter availability =================
    const filteredData = useMemo(() => {
        return availability.filter((row) => {
            const departure = row.departure_date;

            // FROM
            const matchFrom = searchDepartureFrom
                ? departure >= searchDepartureFrom
                : true;

            // TO
            const matchTo = searchDepartureTo
                ? departure <= searchDepartureTo
                : true;

            return matchFrom && matchTo;
        });
    }, [availability, searchDepartureFrom, searchDepartureTo]);

    // ================= pagination availability =================
    const [currentPage, setCurrentPage] = useState(1);

    const pageSize = 10;

    const totalPages = Math.ceil(filteredData.length / pageSize);

    const paginatedAvailability = filteredData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    );

    //search add ons
    const [addOnsSearchDepartureFrom, setAddOnsSearchDepartureFrom] =
        useState('');

    const [addOnsSearchDepartureTo, setAddOnsSearchDepartureTo] = useState('');

    // paging add ons
    const addOnsPerPage = 10;

    const [currentAddOnsPage, setCurrentAddOnsPage] = useState(1);

    // filter add ons
    const filteredAddOnsSchedules = [...schedules]
        .sort(
            (a, b) =>
                new Date(a.departure_date).getTime() -
                new Date(b.departure_date).getTime(),
        )
        .filter((schedule) => {
            const departure = schedule.departure_date;

            const matchFrom = addOnsSearchDepartureFrom
                ? departure >= addOnsSearchDepartureFrom
                : true;

            const matchTo = addOnsSearchDepartureTo
                ? departure <= addOnsSearchDepartureTo
                : true;

            return matchFrom && matchTo;
        });

    // total pages add ons
    const totalAddOnsPages = Math.ceil(
        filteredAddOnsSchedules.length / addOnsPerPage,
    );

    // paginated result add ons
    const paginatedAddOnsSchedules = filteredAddOnsSchedules.slice(
        (currentAddOnsPage - 1) * addOnsPerPage,
        currentAddOnsPage * addOnsPerPage,
    );

    // ================= search schedule =================
    const [searchDepartureFromTab2, setSearchDepartureFromTab2] = useState('');

    const [searchDepartureToTab2, setSearchDepartureToTab2] = useState('');

    // ================= pagination schedule =================
    const schedulePerPage = 10;

    const [currentSchedulePage, setCurrentSchedulePage] = useState(1);

    // ================= filter schedule =================
    const filteredSchedules = schedules
        .map((item, index) => ({
            ...item,
            originalIndex: index,
        }))
        .filter((item) => {
            const departure = item.departure_date;

            const matchFrom = searchDepartureFromTab2
                ? departure >= searchDepartureFromTab2
                : true;

            const matchTo = searchDepartureToTab2
                ? departure <= searchDepartureToTab2
                : true;

            return matchFrom && matchTo;
        });

    // ================= total page schedule =================
    const totalSchedulePages = Math.ceil(
        filteredSchedules.length / schedulePerPage,
    );

    // ================= paginated schedule =================
    const paginatedSchedulesTab = filteredSchedules.slice(
        (currentSchedulePage - 1) * schedulePerPage,
        currentSchedulePage * schedulePerPage,
    );

    // ================= auto reset page schedule =================
    useEffect(() => {
        if (
            totalSchedulePages > 0 &&
            currentSchedulePage > totalSchedulePages
        ) {
            setCurrentSchedulePage(1);
        }
    }, [currentSchedulePage, totalSchedulePages]);

    return (
        <CompanyDashboardLayout
            openMenuIds={['tours']}
            activeMenuIds={['tours.index']}
            breadcrumb={[
                { title: 'Tours', url: '/dashboard/tours' },
                { title: 'Edit' },
            ]}
        >
            {/* <Form
        {...update.form({ company: company.username, tour: tour.id })}
        className="space-y-4"
        onSuccess={handleSuccess}
      > */}
            <form
                /*onSubmit={(e) => {
          e.preventDefault()

          console.log('SEND DATA:', {
            ...data,
            schedules
          })

          // 🔥 update state dulu
          setData((prev) => ({
            ...prev,
            showprice: Number(rawPrice),
            promote_price: Number(rawPrice1),
            schedules: schedules, // ✅ langsung object (JANGAN stringify)
          }))

          // 🔥 kirim TANPA data:
          put(update.url({
            company: company.username,
            tour: tour.id
          }), {
            onSuccess: () => {
              handleSuccess()
              setActiveTab('schedule')
            },
          })*/

                onSubmit={(e) => {
                    e.preventDefault();

                    const payload = {
                        ...data,
                        showprice: Number(rawPrice),
                        promote_price: Number(rawPrice1),
                    };

                    //console.log('SEND DATA:', payload)

                    put(
                        update.url({
                            company: company.username,
                            tour: tour.id,
                        }),
                        {
                            data: payload, // 🔥 WAJIB
                            forceFormData: false,
                            onSuccess: () => {
                                handleSuccess();
                                setActiveTab('schedule');
                            },
                        },
                    );

                    /*put(update.url({
            company: company.username,
            tour: tour.id
          }), {
            data: {
              ...data,
              showprice: Number(rawPrice),
              promote_price: Number(rawPrice1),
              schedules: schedules, // 🔥 langsung kirim
            },
            forceFormData: false, 
            onSuccess: () => {
              handleSuccess()
              setActiveTab('schedule')
            },
          })*/
                }}
            >
                <div className="container mx-auto space-y-4 p-4">
                    {/*<Tabs defaultValue="tour" className="w-full" key="tour-form">*/}
                    <Tabs
                        value={activeTab}
                        onValueChange={(val) => setActiveTab(val as any)}
                    >
                        <TabsList className="mb-4 flex h-auto gap-3 bg-transparent p-0">
                            <TabsTrigger
                                value="tour"
                                className="
                  rounded-full px-8 py-3 text-sm font-medium
                  bg-slate-100 text-slate-900
                  data-[state=active]:bg-primary
                  data-[state=active]:text-white
                  shadow-none
                "
                            >
                                Master
                            </TabsTrigger>

                            <TabsTrigger
                                value="schedule"
                                className="
                  rounded-full px-8 py-3 text-sm font-medium
                  bg-slate-100 text-slate-900
                  data-[state=active]:bg-primary
                  data-[state=active]:text-white
                  shadow-none
                "
                            >
                                Schedule and Price
                            </TabsTrigger>

                            <TabsTrigger
                                value="availability"
                                className="
                  rounded-full px-8 py-3 text-sm font-medium
                  bg-slate-100 text-slate-900
                  data-[state=active]:bg-primary
                  data-[state=active]:text-white
                  shadow-none
                "
                            >
                                Availability
                            </TabsTrigger>

                            <TabsTrigger
                                value="addons"
                                className="
                  rounded-full px-8 py-3 text-sm font-medium
                  bg-slate-100 text-slate-900
                  data-[state=active]:bg-primary
                  data-[state=active]:text-white
                  shadow-none
                "
                            >
                                Adds On
                            </TabsTrigger>
                        </TabsList>

                        {/* ================= TAB 1 — TOUR ================= */}
                        <TabsContent value="tour" className="space-y-6">
                            {/* <div className="grid gap-6"> changed for show in 2 column */}
                            <div className="mx-auto max-w-7xl space-y-6">
                                {/* Image */}
                                {/* <div className="grid gap-2"> */}
                                <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
                                    <div className="border-b bg-muted/40 px-6 py-4">
                                        <h2 className="text-lg font-semibold">
                                            Tour Cover
                                        </h2>

                                        <p className="text-sm text-muted-foreground">
                                            Upload attractive image for your
                                            catalog
                                        </p>
                                    </div>

                                    <div className="p-6">
                                        <MediaPicker
                                            type="image"
                                            defaultValue={tour.image}
                                            params={{
                                                owner_type: 'company',
                                                owner_id: company.id,
                                            }}
                                            uploadParams={{
                                                owner_type: 'company',
                                                owner_id: company.id,
                                            }}
                                        >
                                            {(media, change) => {
                                                const mediaId = (
                                                    media as MediaResource
                                                )?.id;

                                                if (
                                                    mediaId &&
                                                    data.image_id !== mediaId
                                                ) {
                                                    setData(
                                                        'image_id',
                                                        mediaId,
                                                    );
                                                }

                                                return (
                                                    <div className="flex flex-col items-center gap-5">
                                                        <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border bg-muted shadow-sm">
                                                            <img
                                                                className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                                                                src={
                                                                    typeof media ===
                                                                    'string'
                                                                        ? media
                                                                        : extractImageSrc(
                                                                              media as any,
                                                                          ).src
                                                                }
                                                            />
                                                        </div>

                                                        <Button
                                                            type="button"
                                                            onClick={change}
                                                        >
                                                            Change Image
                                                        </Button>
                                                    </div>
                                                );
                                            }}
                                        </MediaPicker>
                                    </div>
                                </div>

                                {/* Code */}
                                <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
                                    {/* HEADER */}
                                    <div className="border-b bg-muted/40 px-6 py-4">
                                        <h2 className="text-lg font-semibold">
                                            Basic Information
                                        </h2>

                                        <p className="text-sm text-muted-foreground">
                                            Main information about your tour
                                        </p>
                                    </div>
                                    {/* BODY */}
                                    <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="code">Code</Label>
                                            <Input
                                                id="code"
                                                type="text"
                                                name="code"
                                                required
                                                placeholder="Tour Code"
                                                //defaultValue={tour.code}
                                                value={data.code}
                                                onChange={(e) =>
                                                    setData(
                                                        'code',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError message={errors.code} />
                                        </div>
                                        {/* Name */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                name="name"
                                                required
                                                placeholder="Tour Name"
                                                //defaultValue={tour.name}
                                                value={data.name}
                                                onChange={(e) =>
                                                    setData(
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError message={errors.name} />
                                        </div>

                                        {/* Description */}
                                        <div className="grid gap-2 md:col-span-2">
                                            <Label htmlFor="description">
                                                Description
                                            </Label>
                                            <Textarea
                                                id="description"
                                                name="description"
                                                placeholder="Tour description"
                                                //defaultValue={tour.description}
                                                className="min-h-[65px] resize-none"
                                                onInput={(e) => {
                                                    const el = e.currentTarget;
                                                    el.style.height = 'auto';
                                                    el.style.height =
                                                        el.scrollHeight + 'px';
                                                }}
                                                value={data.description}
                                                onChange={(e) =>
                                                    setData(
                                                        'description',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.description}
                                            />
                                        </div>

                                        {/* Duration */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="duration_days">
                                                Duration in Days
                                            </Label>
                                            <Input
                                                id="duration_days"
                                                type="number"
                                                name="duration_days"
                                                required
                                                placeholder="Duration"
                                                //defaultValue={tour.duration_days}
                                                value={data.duration_days}
                                                onChange={(e) =>
                                                    setData(
                                                        'duration_days',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.duration_days}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="continent_id">
                                                Continent
                                            </Label>
                                            <SelectContinent
                                                name="continent_id"
                                                value={continentId ?? undefined}
                                                onChange={(val) => {
                                                    /*setContinentId(Number(val));
                        setRegionId(null);
                        setCountryId(null);*/
                                                    const id = Number(val);

                                                    setContinentId(id);
                                                    setRegionId(null);
                                                    setCountryId(null);

                                                    setData('continent_id', id); // ✅ WAJIB
                                                    setData('region_id', ''); // reset
                                                    setData('country_id', '');
                                                }}
                                            />

                                            <InputError
                                                message={errors.continent_id}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="region_id">
                                                Region
                                            </Label>
                                            <SelectRegion
                                                name="region_id"
                                                continentId={continentId}
                                                value={regionId ?? undefined}
                                                onChange={(val) => {
                                                    /*setRegionId(Number(val));
                        setCountryId(null);*/
                                                    const id = Number(val);

                                                    setRegionId(id);
                                                    setCountryId(null);

                                                    setData('region_id', id); // ✅
                                                    setData('country_id', ''); // reset
                                                }}
                                            />
                                            <InputError
                                                message={errors.region_id}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="country_id">
                                                Country
                                            </Label>
                                            <SelectCountry
                                                name="country_id"
                                                continentId={continentId}
                                                regionId={regionId}
                                                value={countryId ?? undefined}
                                                onChange={(val) => {
                                                    //setCountryId(Number(val));
                                                    const id = Number(val);

                                                    setCountryId(id);
                                                    setData('country_id', id); // ✅
                                                }}
                                            />

                                            <InputError
                                                message={errors.country_id}
                                            />
                                        </div>

                                        {/* Destination */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="destination">
                                                Destination
                                            </Label>
                                            <Input
                                                id="destination"
                                                type="text"
                                                name="destination"
                                                placeholder="Destination"
                                                //defaultValue={tour.destination}
                                                value={data.destination}
                                                onChange={(e) =>
                                                    setData(
                                                        'destination',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.destination}
                                            />
                                        </div>

                                        {/* Category */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="category_id">
                                                Category
                                            </Label>
                                            <SelectCategory
                                                name="category_id"
                                                //value={categoryId ?? undefined}
                                                /*onChange={(val) => {
                        setCategoryId(Number(val));
                      }}*/
                                                value={
                                                    data.category_id ||
                                                    undefined
                                                }
                                                onChange={(val) =>
                                                    setData(
                                                        'category_id',
                                                        Number(val),
                                                    )
                                                }
                                            />

                                            <InputError
                                                message={errors.category_id}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Document */}
                                <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
                                    {/* HEADER */}
                                    <div className="border-b bg-muted/40 px-6 py-4">
                                        <h2 className="text-lg font-semibold">
                                            Publishing & Documents
                                        </h2>

                                        <p className="text-sm text-muted-foreground">
                                            Configure itinerary document, status
                                            and currency
                                        </p>
                                    </div>
                                    {/* BODY */}
                                    <div className="space-y-6 p-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">
                                                Document Itinerary
                                            </Label>

                                            <TourDocumentPicker
                                                owner={{
                                                    type: 'company',
                                                    id: company.id,
                                                }}
                                                value={selectedDocument}
                                                onChange={(doc: any) => {
                                                    setSelectedDocument(doc);
                                                    setData(
                                                        'document_id',
                                                        doc?.id,
                                                    );
                                                }}
                                            />

                                            <InputError
                                                message={errors.document_id}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Status */}
                                            <div className="grid gap-2">
                                                <Label htmlFor="status">
                                                    Status
                                                </Label>
                                                <Select
                                                    name="status"
                                                    //</div>defaultValue={tour.status}
                                                    value={data.status}
                                                    onValueChange={(val) =>
                                                        setData('status', val)
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>
                                                                Select status
                                                            </SelectLabel>
                                                            <SelectItem value="active">
                                                                Active
                                                            </SelectItem>
                                                            <SelectItem value="inactive">
                                                                Inactive
                                                            </SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                                <InputError
                                                    message={errors.status}
                                                />
                                            </div>

                                            {/* CURRENCY */}
                                            <div className="grid gap-2">
                                                <Label>Currency</Label>

                                                <SelectCurrency
                                                    value={data.currency}
                                                    onChange={(val) =>
                                                        setData('currency', val)
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Normal Price show on catalog */}
                                <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
                                    <div className="border-b bg-muted/40 px-6 py-4">
                                        <h2 className="text-lg font-semibold">
                                            Pricing
                                        </h2>

                                        <p className="text-sm text-muted-foreground">
                                            Configure normal and promotional
                                            prices
                                        </p>
                                    </div>
                                    <div className="space-y-6 p-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="showprice">
                                                Normal Price show on catalog
                                            </Label>
                                            <Input
                                                id="showprice_display"
                                                type="text"
                                                placeholder="Normal Price"
                                                value={displayPrice}
                                                onChange={(e) =>
                                                    handlePriceChange(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <input
                                                type="hidden"
                                                name="showprice"
                                                value={rawPrice}
                                            />
                                            <InputError
                                                message={errors.showprice}
                                            />
                                        </div>

                                        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 p-5 shadow-sm">
                                            <div className="mb-5">
                                                <h3 className="font-semibold text-pink-700">
                                                    Promotion Campaign
                                                </h3>

                                                <p className="text-sm text-muted-foreground">
                                                    Highlight special offer on
                                                    catalog
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                                {/* promote title */}
                                                <div className="grid gap-2">
                                                    <Label htmlFor="promote_title">
                                                        Title Promotion on
                                                        Catalog
                                                    </Label>
                                                    <Input
                                                        id="promote_title"
                                                        type="text"
                                                        name="promote_title"
                                                        placeholder="Title Promotion"
                                                        //defaultValue={tour.promote_title}
                                                        value={
                                                            data.promote_title
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'promote_title',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.promote_title
                                                        }
                                                    />
                                                </div>

                                                {/* Promote Price */}
                                                <div className="grid gap-2">
                                                    <Label htmlFor="promote_price">
                                                        Promotion Price show on
                                                        catalog
                                                    </Label>
                                                    <Input
                                                        id="promote_price"
                                                        type="text"
                                                        placeholder="Promotion Price"
                                                        value={displayPrice1}
                                                        onChange={(e) =>
                                                            handlePriceChange1(
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                    <input
                                                        type="hidden"
                                                        name="promote_price"
                                                        value={rawPrice1}
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.promote_price
                                                        }
                                                    />
                                                </div>

                                                {/* promote note — full width */}
                                                <div className="grid gap-2 md:col-span-2">
                                                    <Label htmlFor="promote_note">
                                                        Promotion Note on
                                                        Catalog
                                                    </Label>
                                                    <Input
                                                        id="promote_note"
                                                        type="text"
                                                        name="promote_note"
                                                        placeholder="Promotion Note"
                                                        //defaultValue={tour.promote_note}
                                                        value={
                                                            data.promote_note
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'promote_note',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.promote_note
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-start pt-6 border-t">
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Save & Continue
                                </Button>
                            </div>
                        </TabsContent>

                        {/* ================= TAB 2 — JADWAL ================= */}

                        <TabsContent value="schedule">
                            <div className="space-y-4">
                                <div className="flex flex-col gap-3 px-4 py-2 md:flex-row md:items-center md:justify-end">
                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="button"
                                            onClick={addSchedule}
                                        >
                                            + Add New Schedule
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
                                    {/* LEFT */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-sm text-muted-foreground">
                                            Departure Date
                                        </span>

                                        {/* FROM */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                From
                                            </span>

                                            <input
                                                type="date"
                                                value={searchDepartureFromTab2}
                                                onChange={(e) => {
                                                    setSearchDepartureFromTab2(
                                                        e.target.value,
                                                    );
                                                    setCurrentSchedulePage(1);
                                                }}
                                                className="rounded-lg border px-3 py-2 text-sm"
                                            />
                                        </div>

                                        {/* TO */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                To
                                            </span>

                                            <input
                                                type="date"
                                                value={searchDepartureToTab2}
                                                onChange={(e) => {
                                                    setSearchDepartureToTab2(
                                                        e.target.value,
                                                    );
                                                    setCurrentSchedulePage(1);
                                                }}
                                                className="rounded-lg border px-3 py-2 text-sm"
                                            />
                                        </div>

                                        {/* RESET */}
                                        {(searchDepartureFromTab2 ||
                                            searchDepartureToTab2) && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSearchDepartureFromTab2(
                                                        '',
                                                    );
                                                    setSearchDepartureToTab2(
                                                        '',
                                                    );
                                                    setCurrentSchedulePage(1);
                                                }}
                                            >
                                                Reset
                                            </Button>
                                        )}
                                    </div>

                                    {/* RIGHT */}
                                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium">
                                        Currency: {tour.currency}
                                    </div>
                                </div>

                                {/* DESKTOP TABLE */}
                                <div className="rounded-lg border overflow-hidden hidden md:block">
                                    <table className="w-full text-sm">
                                        {/* ================= HEADER ================= */}
                                        <thead className="bg-muted">
                                            <tr>
                                                <th
                                                    className="p-3 text-left"
                                                    rowSpan={2}
                                                >
                                                    Departure
                                                </th>
                                                <th
                                                    className="p-3 text-left"
                                                    rowSpan={2}
                                                >
                                                    Return
                                                </th>

                                                <th
                                                    className="p-3 text-center"
                                                    colSpan={4}
                                                >
                                                    Prices
                                                </th>

                                                <th
                                                    className="p-3 text-left"
                                                    rowSpan={2}
                                                ></th>
                                            </tr>

                                            <tr className="text-xs text-muted-foreground">
                                                <th className="p-2">
                                                    Category
                                                </th>
                                                <th className="p-2">Price</th>
                                                <th className="p-2">
                                                    Promotion
                                                </th>
                                                <th className="p-2">
                                                    Commission
                                                </th>
                                            </tr>
                                        </thead>

                                        {/* ================= BODY ================= */}
                                        <tbody>
                                            {paginatedSchedulesTab.map(
                                                (item) => {
                                                    const index =
                                                        item.originalIndex;

                                                    return (
                                                        <tr
                                                            key={index}
                                                            className="align-top border-t"
                                                        >
                                                            {/* DATE */}
                                                            <td className="p-2">
                                                                <Input
                                                                    type="date"
                                                                    value={
                                                                        item.departure_date
                                                                    }
                                                                    min={
                                                                        new Date()
                                                                            .toISOString()
                                                                            .split(
                                                                                'T',
                                                                            )[0]
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateSchedule(
                                                                            index,
                                                                            'departure_date',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            </td>

                                                            <td className="p-2">
                                                                <Input
                                                                    type="date"
                                                                    value={
                                                                        item.return_date
                                                                    }
                                                                    min={
                                                                        item.departure_date
                                                                    }
                                                                    readOnly
                                                                    className="bg-muted cursor-not-allowed"
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateSchedule(
                                                                            index,
                                                                            'return_date',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            </td>

                                                            {/* PRICES */}
                                                            <td
                                                                colSpan={4}
                                                                className="p-2"
                                                            >
                                                                <div className="space-y-3">
                                                                    {(
                                                                        item.prices ||
                                                                        []
                                                                    ).map(
                                                                        (
                                                                            room,
                                                                            rIndex,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    rIndex
                                                                                }
                                                                                className="grid grid-cols-4 gap-2 items-start p-2 border rounded-md"
                                                                            >
                                                                                {/* ROOM */}
                                                                                <select
                                                                                    className="border rounded px-2 h-9 text-sm w-full"
                                                                                    value={
                                                                                        room.room_type_id ??
                                                                                        ''
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        updateRoom(
                                                                                            index,
                                                                                            rIndex,
                                                                                            'room_type_id',
                                                                                            Number(
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            ),
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <option value="">
                                                                                        Select
                                                                                        Category
                                                                                    </option>

                                                                                    {(
                                                                                        priceCategories ||
                                                                                        []
                                                                                    )
                                                                                        .sort(
                                                                                            (
                                                                                                a,
                                                                                                b,
                                                                                            ) =>
                                                                                                a.id -
                                                                                                b.id,
                                                                                        )
                                                                                        .filter(
                                                                                            (
                                                                                                cat,
                                                                                            ) => {
                                                                                                const selectedIds =
                                                                                                    (
                                                                                                        item.prices ||
                                                                                                        []
                                                                                                    )
                                                                                                        .map(
                                                                                                            (
                                                                                                                p,
                                                                                                                i,
                                                                                                            ) =>
                                                                                                                i !==
                                                                                                                rIndex
                                                                                                                    ? p.room_type_id
                                                                                                                    : null,
                                                                                                        )
                                                                                                        .filter(
                                                                                                            Boolean,
                                                                                                        );

                                                                                                return !selectedIds.includes(
                                                                                                    cat.id,
                                                                                                );
                                                                                            },
                                                                                        )
                                                                                        .map(
                                                                                            (
                                                                                                cat,
                                                                                            ) => (
                                                                                                <option
                                                                                                    key={
                                                                                                        cat.id
                                                                                                    }
                                                                                                    value={
                                                                                                        cat.id
                                                                                                    }
                                                                                                >
                                                                                                    {
                                                                                                        cat.name
                                                                                                    }
                                                                                                </option>
                                                                                            ),
                                                                                        )}
                                                                                </select>

                                                                                {/* PRICE */}
                                                                                <MoneyInput
                                                                                    value={
                                                                                        room.price
                                                                                    }
                                                                                    placeholder="Price"
                                                                                    onChange={(
                                                                                        val,
                                                                                    ) =>
                                                                                        updateRoom(
                                                                                            index,
                                                                                            rIndex,
                                                                                            'price',
                                                                                            val,
                                                                                        )
                                                                                    }
                                                                                />

                                                                                {/* PROMOTION */}
                                                                                <div className="space-y-1">
                                                                                    {/* PERCENT */}
                                                                                    <div className="relative">
                                                                                        <input
                                                                                            type="text"
                                                                                            inputMode="decimal"
                                                                                            className="w-full pr-8 border rounded px-2 h-9 text-sm"
                                                                                            value={
                                                                                                room
                                                                                                    .promotion
                                                                                                    .type ===
                                                                                                'percent'
                                                                                                    ? room
                                                                                                          .promotion
                                                                                                          .value
                                                                                                    : ''
                                                                                            }
                                                                                            placeholder="0"
                                                                                            onChange={(
                                                                                                e,
                                                                                            ) => {
                                                                                                let raw =
                                                                                                    e.target.value
                                                                                                        .replace(
                                                                                                            /[^0-9.,]/g,
                                                                                                            '',
                                                                                                        )
                                                                                                        .replace(
                                                                                                            ',',
                                                                                                            '.',
                                                                                                        );

                                                                                                if (
                                                                                                    Number(
                                                                                                        raw,
                                                                                                    ) >
                                                                                                    100
                                                                                                )
                                                                                                    raw =
                                                                                                        '100';

                                                                                                updateRoomAdjustment(
                                                                                                    index,
                                                                                                    rIndex,
                                                                                                    'promotion',
                                                                                                    'type',
                                                                                                    'percent',
                                                                                                );
                                                                                                updateRoomAdjustment(
                                                                                                    index,
                                                                                                    rIndex,
                                                                                                    'promotion',
                                                                                                    'value',
                                                                                                    raw,
                                                                                                );
                                                                                            }}
                                                                                        />
                                                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">
                                                                                            %
                                                                                        </span>
                                                                                    </div>

                                                                                    {/* VALUE */}
                                                                                    <MoneyInput
                                                                                        value={
                                                                                            room
                                                                                                .promotion
                                                                                                .type ===
                                                                                            'value'
                                                                                                ? room
                                                                                                      .promotion
                                                                                                      .value
                                                                                                : ''
                                                                                        }
                                                                                        placeholder="Value"
                                                                                        className="w-full"
                                                                                        onChange={(
                                                                                            val,
                                                                                        ) => {
                                                                                            updateRoomAdjustment(
                                                                                                index,
                                                                                                rIndex,
                                                                                                'promotion',
                                                                                                'type',
                                                                                                'value',
                                                                                            );
                                                                                            updateRoomAdjustment(
                                                                                                index,
                                                                                                rIndex,
                                                                                                'promotion',
                                                                                                'value',
                                                                                                val,
                                                                                            );
                                                                                        }}
                                                                                    />
                                                                                </div>

                                                                                {/* COMMISSION */}
                                                                                <div className="space-y-1">
                                                                                    {/* PERCENT */}
                                                                                    <div className="relative">
                                                                                        <input
                                                                                            type="text"
                                                                                            inputMode="decimal"
                                                                                            className="w-full pr-8 border rounded px-2 h-9 text-sm"
                                                                                            value={
                                                                                                room
                                                                                                    .commission
                                                                                                    .type ===
                                                                                                'percent'
                                                                                                    ? room
                                                                                                          .commission
                                                                                                          .value
                                                                                                    : ''
                                                                                            }
                                                                                            placeholder="0"
                                                                                            onChange={(
                                                                                                e,
                                                                                            ) => {
                                                                                                const raw =
                                                                                                    e.target.value
                                                                                                        .replace(
                                                                                                            /[^0-9.,]/g,
                                                                                                            '',
                                                                                                        )
                                                                                                        .replace(
                                                                                                            ',',
                                                                                                            '.',
                                                                                                        );

                                                                                                updateRoomAdjustment(
                                                                                                    index,
                                                                                                    rIndex,
                                                                                                    'commission',
                                                                                                    'type',
                                                                                                    'percent',
                                                                                                );
                                                                                                updateRoomAdjustment(
                                                                                                    index,
                                                                                                    rIndex,
                                                                                                    'commission',
                                                                                                    'value',
                                                                                                    raw,
                                                                                                );
                                                                                            }}
                                                                                        />
                                                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">
                                                                                            %
                                                                                        </span>
                                                                                    </div>

                                                                                    {/* VALUE */}
                                                                                    <MoneyInput
                                                                                        value={
                                                                                            room
                                                                                                .commission
                                                                                                .type ===
                                                                                            'value'
                                                                                                ? room
                                                                                                      .commission
                                                                                                      .value
                                                                                                : ''
                                                                                        }
                                                                                        placeholder="Value"
                                                                                        className="w-full"
                                                                                        onChange={(
                                                                                            val,
                                                                                        ) => {
                                                                                            updateRoomAdjustment(
                                                                                                index,
                                                                                                rIndex,
                                                                                                'commission',
                                                                                                'type',
                                                                                                'value',
                                                                                            );
                                                                                            updateRoomAdjustment(
                                                                                                index,
                                                                                                rIndex,
                                                                                                'commission',
                                                                                                'value',
                                                                                                val,
                                                                                            );
                                                                                        }}
                                                                                    />
                                                                                </div>

                                                                                {/* REMOVE ROOM */}
                                                                                <div className="col-span-4 flex justify-end">
                                                                                    <Button
                                                                                        type="button"
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        className="text-red-500"
                                                                                        onClick={() =>
                                                                                            removeRoom(
                                                                                                index,
                                                                                                rIndex,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        x
                                                                                        Delete
                                                                                        Category
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ),
                                                                    )}

                                                                    {/* ADD ROOM */}
                                                                    <div>
                                                                        <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() =>
                                                                                addRoom(
                                                                                    index,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                (
                                                                                    item.prices ||
                                                                                    []
                                                                                ).filter(
                                                                                    (
                                                                                        p,
                                                                                    ) =>
                                                                                        p.room_type_id,
                                                                                )
                                                                                    .length >=
                                                                                (
                                                                                    priceCategories ||
                                                                                    []
                                                                                )
                                                                                    .length
                                                                            }
                                                                        >
                                                                            +
                                                                            Add
                                                                            Category
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* ACTION */}
                                                            <td className="p-2">
                                                                <DropdownMenu
                                                                    open={
                                                                        openDropdownIndex ===
                                                                        index
                                                                    }
                                                                    onOpenChange={(
                                                                        open,
                                                                    ) => {
                                                                        setOpenDropdownIndex(
                                                                            open
                                                                                ? index
                                                                                : null,
                                                                        );
                                                                    }}
                                                                >
                                                                    <DropdownMenuTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                        >
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>

                                                                    <DropdownMenuContent
                                                                        align="end"
                                                                        className="w-48 rounded-xl shadow-lg"
                                                                    >
                                                                        {/* SAVE */}
                                                                        <DropdownMenuItem
                                                                            className="cursor-pointer"
                                                                            onClick={
                                                                                submitSchedule
                                                                            }
                                                                            disabled={
                                                                                schedules.length ===
                                                                                0
                                                                            }
                                                                        >
                                                                            <Save className="mr-2 h-4 w-4" />
                                                                            Save
                                                                            Schedule
                                                                        </DropdownMenuItem>

                                                                        {/* COPY */}
                                                                        <DropdownMenuItem
                                                                            className="cursor-pointer"
                                                                            onClick={() => {
                                                                                openCopyModal(
                                                                                    index,
                                                                                );

                                                                                setOpenDropdownIndex(
                                                                                    null,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Copy className="mr-2 h-4 w-4" />
                                                                            Copy
                                                                            Schedule
                                                                        </DropdownMenuItem>

                                                                        <DropdownMenuSeparator />

                                                                        {/* DELETE */}
                                                                        <DropdownMenuItem
                                                                            className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                                                                            onClick={() => {
                                                                                removeSchedule(
                                                                                    index,
                                                                                );

                                                                                setOpenDropdownIndex(
                                                                                    null,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            Delete
                                                                            Schedule
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </td>
                                                        </tr>
                                                    );
                                                },
                                            )}
                                        </tbody>
                                    </table>
                                    <div className="flex items-center justify-between border-t px-4 py-3">
                                        <div className="text-sm text-muted-foreground">
                                            Page{' '}
                                            {totalSchedulePages === 0
                                                ? 0
                                                : currentSchedulePage}{' '}
                                            of {totalSchedulePages}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    currentSchedulePage === 1
                                                }
                                                onClick={() =>
                                                    setCurrentSchedulePage(
                                                        (p) => p - 1,
                                                    )
                                                }
                                            >
                                                Previous
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    currentSchedulePage ===
                                                    totalSchedulePages
                                                }
                                                onClick={() =>
                                                    setCurrentSchedulePage(
                                                        (p) => p + 1,
                                                    )
                                                }
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* MOBILE VERSION */}
                                <div className="md:hidden space-y-4">
                                    {paginatedSchedulesTab.map((item) => {
                                        const index = item.originalIndex;

                                        return (
                                            <div
                                                key={index}
                                                className="border rounded-lg p-3 space-y-3"
                                            >
                                                {/* HEADER */}
                                                <div className="flex justify-between items-start">
                                                    <p className="font-medium text-sm">
                                                        Schedule #{index + 1}
                                                    </p>

                                                    <td className="p-2">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>

                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="w-48 rounded-xl shadow-lg"
                                                            >
                                                                {/* SAVE */}
                                                                <DropdownMenuItem
                                                                    className="cursor-pointer"
                                                                    onClick={
                                                                        submitSchedule
                                                                    }
                                                                    disabled={
                                                                        schedules.length ===
                                                                        0
                                                                    }
                                                                >
                                                                    <Save className="mr-2 h-4 w-4" />
                                                                    Save
                                                                    Schedule
                                                                </DropdownMenuItem>

                                                                {/* COPY */}
                                                                <DropdownMenuItem
                                                                    className="cursor-pointer"
                                                                    onClick={() =>
                                                                        openCopyModal(
                                                                            index,
                                                                        )
                                                                    }
                                                                >
                                                                    <Copy className="mr-2 h-4 w-4" />
                                                                    Copy
                                                                    Schedule
                                                                </DropdownMenuItem>

                                                                <DropdownMenuSeparator />

                                                                {/* DELETE */}
                                                                <DropdownMenuItem
                                                                    className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                                                                    onClick={() =>
                                                                        removeSchedule(
                                                                            index,
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                    Schedule
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </div>

                                                {/* DATES */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Departure
                                                        </p>
                                                        <Input
                                                            type="date"
                                                            value={
                                                                item.departure_date
                                                            }
                                                            onChange={(e) =>
                                                                updateSchedule(
                                                                    index,
                                                                    'departure_date',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Return
                                                        </p>
                                                        <Input
                                                            type="date"
                                                            value={
                                                                item.return_date
                                                            }
                                                            min={
                                                                item.departure_date
                                                            }
                                                            readOnly
                                                            className="bg-muted cursor-not-allowed"
                                                            onChange={(e) =>
                                                                updateSchedule(
                                                                    index,
                                                                    'return_date',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                {/* ROOMS */}
                                                <div className="space-y-3">
                                                    {(item.prices || []).map(
                                                        (room, rIndex) => (
                                                            <div
                                                                key={rIndex}
                                                                className="border rounded-md p-3 space-y-2"
                                                            >
                                                                {/* ROOM HEADER */}
                                                                <div className="flex justify-between items-center">
                                                                    <p className="text-xs font-medium text-muted-foreground">
                                                                        Room #
                                                                        {rIndex +
                                                                            1}
                                                                    </p>

                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="text-red-500"
                                                                        onClick={() =>
                                                                            removeRoom(
                                                                                index,
                                                                                rIndex,
                                                                            )
                                                                        }
                                                                    >
                                                                        x Delete
                                                                        Category
                                                                    </Button>
                                                                </div>

                                                                {/* ROOM TYPE */}
                                                                <div className="space-y-1">
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Category
                                                                    </p>

                                                                    <select
                                                                        className="w-full border rounded-md px-3 h-10 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                                                        value={
                                                                            room.room_type_id ??
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateRoom(
                                                                                index,
                                                                                rIndex,
                                                                                'room_type_id',
                                                                                Number(
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                ),
                                                                            )
                                                                        }
                                                                    >
                                                                        <option value="">
                                                                            Select
                                                                            Category
                                                                        </option>

                                                                        {(
                                                                            priceCategories ||
                                                                            []
                                                                        )
                                                                            .filter(
                                                                                (
                                                                                    cat,
                                                                                ) => {
                                                                                    const selectedIds =
                                                                                        (
                                                                                            item.prices ||
                                                                                            []
                                                                                        )
                                                                                            .map(
                                                                                                (
                                                                                                    p,
                                                                                                    i,
                                                                                                ) =>
                                                                                                    i !==
                                                                                                    rIndex
                                                                                                        ? p.room_type_id
                                                                                                        : null,
                                                                                            )
                                                                                            .filter(
                                                                                                Boolean,
                                                                                            );

                                                                                    return !selectedIds.includes(
                                                                                        cat.id,
                                                                                    );
                                                                                },
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    cat,
                                                                                ) => (
                                                                                    <option
                                                                                        key={
                                                                                            cat.id
                                                                                        }
                                                                                        value={
                                                                                            cat.id
                                                                                        }
                                                                                    >
                                                                                        {
                                                                                            cat.name
                                                                                        }
                                                                                    </option>
                                                                                ),
                                                                            )}
                                                                    </select>
                                                                </div>

                                                                {/* PRICE */}
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Price
                                                                    </p>
                                                                    <MoneyInput
                                                                        value={
                                                                            room.price
                                                                        }
                                                                        placeholder="Price"
                                                                        onChange={(
                                                                            val,
                                                                        ) =>
                                                                            updateRoom(
                                                                                index,
                                                                                rIndex,
                                                                                'price',
                                                                                val,
                                                                            )
                                                                        }
                                                                    />
                                                                </div>

                                                                {/* PROMOTION */}
                                                                <div className="space-y-1">
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Promotion
                                                                    </p>

                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {/* % */}
                                                                        <div className="relative">
                                                                            <MoneyInput
                                                                                value={
                                                                                    room
                                                                                        .promotion
                                                                                        .type ===
                                                                                    'percent'
                                                                                        ? room
                                                                                              .promotion
                                                                                              .value
                                                                                        : ''
                                                                                }
                                                                                placeholder="0"
                                                                                className="pr-8"
                                                                                onChange={(
                                                                                    val,
                                                                                ) => {
                                                                                    updateRoomAdjustment(
                                                                                        index,
                                                                                        rIndex,
                                                                                        'promotion',
                                                                                        'type',
                                                                                        'percent',
                                                                                    );
                                                                                    updateRoomAdjustment(
                                                                                        index,
                                                                                        rIndex,
                                                                                        'promotion',
                                                                                        'value',
                                                                                        val,
                                                                                    );
                                                                                }}
                                                                            />

                                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                                                %
                                                                            </span>
                                                                        </div>

                                                                        {/* VALUE */}
                                                                        <MoneyInput
                                                                            value={
                                                                                room
                                                                                    .promotion
                                                                                    .type ===
                                                                                'value'
                                                                                    ? room
                                                                                          .promotion
                                                                                          .value
                                                                                    : ''
                                                                            }
                                                                            placeholder="Value"
                                                                            onChange={(
                                                                                val,
                                                                            ) => {
                                                                                updateRoomAdjustment(
                                                                                    index,
                                                                                    rIndex,
                                                                                    'promotion',
                                                                                    'type',
                                                                                    'value',
                                                                                );
                                                                                updateRoomAdjustment(
                                                                                    index,
                                                                                    rIndex,
                                                                                    'promotion',
                                                                                    'value',
                                                                                    val,
                                                                                );
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* COMMISSION */}
                                                                <div className="space-y-1">
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Commission
                                                                    </p>

                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {/* % */}
                                                                        <div className="relative">
                                                                            <MoneyInput
                                                                                value={
                                                                                    room
                                                                                        .commission
                                                                                        .type ===
                                                                                    'percent'
                                                                                        ? room
                                                                                              .commission
                                                                                              .value
                                                                                        : ''
                                                                                }
                                                                                placeholder="0"
                                                                                className="pr-8"
                                                                                onChange={(
                                                                                    val,
                                                                                ) => {
                                                                                    updateRoomAdjustment(
                                                                                        index,
                                                                                        rIndex,
                                                                                        'commission',
                                                                                        'type',
                                                                                        'percent',
                                                                                    );
                                                                                    updateRoomAdjustment(
                                                                                        index,
                                                                                        rIndex,
                                                                                        'commission',
                                                                                        'value',
                                                                                        val,
                                                                                    );
                                                                                }}
                                                                            />

                                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                                                %
                                                                            </span>
                                                                        </div>

                                                                        {/* VALUE */}
                                                                        <MoneyInput
                                                                            value={
                                                                                room
                                                                                    .commission
                                                                                    .type ===
                                                                                'value'
                                                                                    ? room
                                                                                          .commission
                                                                                          .value
                                                                                    : ''
                                                                            }
                                                                            placeholder="Value"
                                                                            onChange={(
                                                                                val,
                                                                            ) => {
                                                                                updateRoomAdjustment(
                                                                                    index,
                                                                                    rIndex,
                                                                                    'commission',
                                                                                    'type',
                                                                                    'value',
                                                                                );
                                                                                updateRoomAdjustment(
                                                                                    index,
                                                                                    rIndex,
                                                                                    'commission',
                                                                                    'value',
                                                                                    val,
                                                                                );
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}

                                                    {/* ADD ROOM */}
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            addRoom(index)
                                                        }
                                                        disabled={
                                                            (
                                                                item.prices ||
                                                                []
                                                            ).filter(
                                                                (p) =>
                                                                    p.room_type_id,
                                                            ).length >=
                                                            (
                                                                priceCategories ||
                                                                []
                                                            ).length
                                                        }
                                                    >
                                                        + Add Category
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="mt-6 flex items-center justify-between border-t px-4 pt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Page {currentSchedulePage} of{' '}
                                            {totalSchedulePages}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    currentSchedulePage === 1
                                                }
                                                onClick={() =>
                                                    setCurrentSchedulePage(
                                                        (p) => p - 1,
                                                    )
                                                }
                                            >
                                                Previous
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    currentSchedulePage ===
                                                    totalSchedulePages
                                                }
                                                onClick={() =>
                                                    setCurrentSchedulePage(
                                                        (p) => p + 1,
                                                    )
                                                }
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ================= TAB 3 — AVAILABILITY ================= */}

                        <TabsContent value="availability">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
                                    {/* LEFT */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-sm text-muted-foreground">
                                            Departure Date
                                        </span>

                                        {/* FROM */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                From
                                            </span>

                                            <input
                                                type="date"
                                                value={searchDepartureFrom}
                                                onChange={(e) => {
                                                    setSearchDepartureFrom(
                                                        e.target.value,
                                                    );
                                                    setCurrentPage(1);
                                                }}
                                                className="rounded-lg border px-3 py-2 text-sm"
                                            />
                                        </div>

                                        {/* TO */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                To
                                            </span>

                                            <input
                                                type="date"
                                                value={searchDepartureTo}
                                                onChange={(e) => {
                                                    setSearchDepartureTo(
                                                        e.target.value,
                                                    );
                                                    setCurrentPage(1);
                                                }}
                                                className="rounded-lg border px-3 py-2 text-sm"
                                            />
                                        </div>

                                        {/* RESET */}
                                        {(searchDepartureFrom ||
                                            searchDepartureTo) && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSearchDepartureFrom('');
                                                    setSearchDepartureTo('');
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                Reset Date
                                            </Button>
                                        )}
                                    </div>

                                    {/* RIGHT */}
                                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium">
                                        Quantity: pax
                                    </div>
                                </div>

                                <div className="hidden md:block rounded-xl border bg-background overflow-auto">
                                    <table className="w-full text-xs border-separate border-spacing-0">
                                        <colgroup>
                                            <col className="w-[200px]" />{' '}
                                            {/* Departure */}
                                            <col className="w-[50px]" />{' '}
                                            {/* Max Pax */}
                                            <col className="w-[50px]" />
                                            <col className="w-[50px]" />
                                            <col className="w-[50px]" />
                                            <col className="w-[50px]" />
                                            <col className="w-[50px]" />
                                            <col className="w-[50px]" />
                                            <col className="w-[50px]" />
                                            <col className="w-[50px]" />
                                            <col className="w-[50px]" />
                                            <col className="w-[50px]" />
                                            <col className="w-[100px]" />
                                            <col className="w-[70px]" />{' '}
                                            {/* Action */}
                                        </colgroup>
                                        <thead className="sticky top-0 z-30 bg-muted">
                                            <tr>
                                                <th className="sticky left-0 z-40 bg-muted border-b p-3 text-left font-semibold">
                                                    Departure → Return
                                                </th>
                                                <th className="border-b p-2 text-right font-semibold">
                                                    Max Pax
                                                </th>
                                                <th className="border-b p-2 text-right font-semibold">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                                <span>RS</span>

                                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                                            </div>
                                                        </TooltipTrigger>

                                                        <TooltipContent>
                                                            Manual Reserved
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </th>
                                                <th className="border-b p-2 text-right font-semibold">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                                <span>WP</span>

                                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                                            </div>
                                                        </TooltipTrigger>

                                                        <TooltipContent>
                                                            Waiting Payment
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </th>
                                                <th className="border-b p-2 text-right font-semibold">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                                <span>WA</span>

                                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                                            </div>
                                                        </TooltipTrigger>

                                                        <TooltipContent>
                                                            Waiting Payment
                                                            Approval
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </th>
                                                <th className="border-b p-2 text-right font-semibold">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                                <span>DP</span>

                                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                                            </div>
                                                        </TooltipTrigger>

                                                        <TooltipContent>
                                                            Down Payment
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </th>
                                                <th className="border-b p-2 text-right font-semibold">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                                <span>FP</span>

                                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                                            </div>
                                                        </TooltipTrigger>

                                                        <TooltipContent>
                                                            Full Payment
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </th>
                                                <th className="border-b p-2 text-right font-semibold">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                                <span>BR</span>

                                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                                            </div>
                                                        </TooltipTrigger>

                                                        <TooltipContent>
                                                            Booking Reserved
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </th>
                                                <th className="border-b p-2 text-right font-semibold">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                                <span>CA</span>

                                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                                            </div>
                                                        </TooltipTrigger>

                                                        <TooltipContent>
                                                            Cancel
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </th>
                                                <th className="border-b p-2 text-right font-semibold">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                                <span>RF</span>

                                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                                            </div>
                                                        </TooltipTrigger>

                                                        <TooltipContent>
                                                            Refund
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </th>
                                                <th className="border-b p-2 text-right font-semibold">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                                <span>EX</span>

                                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                                            </div>
                                                        </TooltipTrigger>

                                                        <TooltipContent>
                                                            Expired
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </th>
                                                <th className="border-b p-2 text-right font-semibold">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="inline-flex items-center justify-end gap-1 cursor-help">
                                                                <span>WL</span>

                                                                <InfoIcon className="h-3 w-3 text-muted-foreground" />
                                                            </div>
                                                        </TooltipTrigger>

                                                        <TooltipContent>
                                                            Waiting List
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </th>
                                                <th className="border-b p-2 text-right font-semibold">
                                                    Available
                                                </th>
                                                <th className="sticky right-0 z-40 bg-muted border-b p-2 text-right font-semibold"></th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {paginatedAvailability.map(
                                                (row, i) => {
                                                    const realIndex =
                                                        (currentPage - 1) *
                                                            pageSize +
                                                        i;

                                                    return (
                                                        <tr
                                                            key={row.id}
                                                            className="
                              border-t
                              odd:bg-muted/20
                              hover:bg-muted/40
                              transition-colors
                            "
                                                        >
                                                            <td className="sticky left-0 z-20 bg-background border-b p-3 font-medium whitespace-nowrap">
                                                                <div className="flex flex-col">
                                                                    <span>
                                                                        {formatDate(
                                                                            row.departure_date,
                                                                        )}
                                                                    </span>

                                                                    <span>
                                                                        {formatDate(
                                                                            row.return_date,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            {/* max pax */}
                                                            <td className="border-b p-3">
                                                                <MoneyInput
                                                                    className="h-9 min-w-[45px] text-right text-xs"
                                                                    value={
                                                                        row.max_pax
                                                                    }
                                                                    onChange={(
                                                                        val,
                                                                    ) =>
                                                                        updateAvailability(
                                                                            realIndex,
                                                                            'max_pax',
                                                                            Number(
                                                                                val,
                                                                            ),
                                                                        )
                                                                    }
                                                                />
                                                            </td>

                                                            {/* RS */}
                                                            <td className="border-b p-3">
                                                                <MoneyInput
                                                                    className="h-9 min-w-[45px] text-right text-xs"
                                                                    value={
                                                                        row.RS
                                                                    }
                                                                    onChange={(
                                                                        val,
                                                                    ) =>
                                                                        updateAvailability(
                                                                            realIndex,
                                                                            'RS',
                                                                            Number(
                                                                                val,
                                                                            ),
                                                                        )
                                                                    }
                                                                />
                                                            </td>

                                                            {/* WP */}
                                                            <td className="border-b p-2 text-right">
                                                                <span
                                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                                >
                                                                    {row.WP}
                                                                </span>
                                                            </td>

                                                            {/* DP */}
                                                            <td className="border-b p-2 text-right">
                                                                <span
                                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                                >
                                                                    {row.DP}
                                                                </span>
                                                            </td>

                                                            {/* FP */}
                                                            <td className="border-b p-2 text-right">
                                                                <span
                                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                                >
                                                                    {row.FP}
                                                                </span>
                                                            </td>

                                                            {/* WA */}
                                                            <td className="border-b p-2 text-right">
                                                                <span
                                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                                >
                                                                    {row.WPA}
                                                                </span>
                                                            </td>

                                                            {/* BRS */}
                                                            <td className="border-b p-2 text-right">
                                                                <span
                                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                                >
                                                                    {row.BRS}
                                                                </span>
                                                            </td>

                                                            {/* CA */}
                                                            <td className="border-b p-2 text-right">
                                                                <span
                                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                                >
                                                                    {row.CA}
                                                                </span>
                                                            </td>

                                                            {/* RF */}
                                                            <td className="border-b p-2 text-right">
                                                                <span
                                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                                >
                                                                    {row.RF}
                                                                </span>
                                                            </td>

                                                            {/* EX */}
                                                            <td className="border-b p-2 text-right">
                                                                <span
                                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                                >
                                                                    {row.EX}
                                                                </span>
                                                            </td>

                                                            {/* WL */}
                                                            <td className="border-b p-2 text-right">
                                                                <span
                                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                                >
                                                                    {row.WL}
                                                                </span>
                                                            </td>

                                                            {/* available */}
                                                            <td className="border-b p-2 text-right">
                                                                <span
                                                                    className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold ${
                                                                        row.available <=
                                                                        0
                                                                            ? 'bg-red-100 text-red-600'
                                                                            : row.available <=
                                                                                5
                                                                              ? 'bg-yellow-100 text-yellow-700'
                                                                              : 'bg-green-100 text-green-700'
                                                                    }`}
                                                                >
                                                                    {
                                                                        row.available
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td className="sticky right-0 z-20 bg-background border-b p-2">
                                                                <div className="relative z-50 flex justify-end">
                                                                    <DropdownMenu
                                                                        modal={
                                                                            false
                                                                        }
                                                                    >
                                                                        <DropdownMenuTrigger
                                                                            asChild
                                                                        >
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8"
                                                                            >
                                                                                <MoreVertical className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>

                                                                        <DropdownMenuContent
                                                                            align="end"
                                                                            sideOffset={
                                                                                5
                                                                            }
                                                                            className="w-52 rounded-xl shadow-lg"
                                                                        >
                                                                            <DropdownMenuItem
                                                                                className="cursor-pointer"
                                                                                disabled={
                                                                                    savingAvailability
                                                                                }
                                                                                onClick={async () => {
                                                                                    setSavingAvailability(
                                                                                        true,
                                                                                    );

                                                                                    try {
                                                                                        const payload =
                                                                                            buildAvailabilityPayload();

                                                                                        router.post(
                                                                                            `/companies/${company.username}/dashboard/tour-availabilities`,
                                                                                            {
                                                                                                availabilities:
                                                                                                    payload,
                                                                                            },
                                                                                            {
                                                                                                onSuccess:
                                                                                                    () => {
                                                                                                        toast.success(
                                                                                                            'Availability saved',
                                                                                                        );
                                                                                                    },
                                                                                                onError:
                                                                                                    () => {
                                                                                                        toast.error(
                                                                                                            'Failed to save availability',
                                                                                                        );
                                                                                                    },
                                                                                                onFinish:
                                                                                                    () => {
                                                                                                        setSavingAvailability(
                                                                                                            false,
                                                                                                        );
                                                                                                    },
                                                                                            },
                                                                                        );
                                                                                    } catch (err) {
                                                                                        setSavingAvailability(
                                                                                            false,
                                                                                        );
                                                                                    }
                                                                                }}
                                                                            >
                                                                                {savingAvailability ? (
                                                                                    <Spinner className="mr-2 h-4 w-4" />
                                                                                ) : (
                                                                                    <Save className="mr-2 h-4 w-4" />
                                                                                )}
                                                                                Save
                                                                                Availability
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                },
                                            )}
                                        </tbody>
                                    </table>

                                    <div className="flex items-center justify-between border-t px-4 py-3">
                                        <div className="text-sm text-muted-foreground">
                                            Page {currentPage} of {totalPages}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={currentPage === 1}
                                                onClick={() =>
                                                    setCurrentPage((p) => p - 1)
                                                }
                                            >
                                                Previous
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    currentPage === totalPages
                                                }
                                                onClick={() =>
                                                    setCurrentPage((p) => p + 1)
                                                }
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                {/* MOBILE */}
                                <div className="md:hidden space-y-4">
                                    {paginatedAvailability.map((row, i) => {
                                        const actualIndex =
                                            (currentPage - 1) * pageSize + i;

                                        return (
                                            <div
                                                key={row.id}
                                                className="border rounded-xl p-4 space-y-3 shadow-sm"
                                            >
                                                {/* Header */}
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="font-semibold text-sm">
                                                            {row.schedule}
                                                        </div>

                                                        <div
                                                            className={`text-sm font-semibold ${
                                                                row.available <=
                                                                0
                                                                    ? 'text-red-500'
                                                                    : 'text-green-600'
                                                            }`}
                                                        >
                                                            {row.available} pax
                                                        </div>
                                                    </div>

                                                    {/* Action */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>

                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-52 rounded-xl shadow-lg"
                                                        >
                                                            <DropdownMenuItem
                                                                className="cursor-pointer"
                                                                disabled={
                                                                    savingAvailability
                                                                }
                                                                onClick={async () => {
                                                                    setSavingAvailability(
                                                                        true,
                                                                    );

                                                                    try {
                                                                        const payload =
                                                                            buildAvailabilityPayload();

                                                                        console.log(
                                                                            'SEND AVAILABILITY:',
                                                                            payload,
                                                                        );

                                                                        router.post(
                                                                            `/companies/${company.username}/dashboard/tour-availabilities`,
                                                                            {
                                                                                availabilities:
                                                                                    payload,
                                                                            },
                                                                            {
                                                                                onSuccess:
                                                                                    () => {
                                                                                        toast.success(
                                                                                            'Availability saved',
                                                                                        );
                                                                                    },
                                                                                onError:
                                                                                    () => {
                                                                                        toast.error(
                                                                                            'Failed to save availability',
                                                                                        );
                                                                                    },
                                                                                onFinish:
                                                                                    () => {
                                                                                        setSavingAvailability(
                                                                                            false,
                                                                                        );
                                                                                    },
                                                                            },
                                                                        );
                                                                    } catch (err) {
                                                                        setSavingAvailability(
                                                                            false,
                                                                        );
                                                                    }
                                                                }}
                                                            >
                                                                {savingAvailability ? (
                                                                    <Spinner className="mr-2 h-4 w-4" />
                                                                ) : (
                                                                    <Save className="mr-2 h-4 w-4" />
                                                                )}
                                                                Save
                                                                Availability
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {/* Input grid */}
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    {[
                                                        {
                                                            key: 'max_pax',
                                                            label: 'Max Pax',
                                                        },
                                                        {
                                                            key: 'RS',
                                                            label: 'Manual Reserved (RS)',
                                                        },
                                                        {
                                                            key: 'WP',
                                                            label: 'Waiting Payment (WP)',
                                                        },
                                                        {
                                                            key: 'WPA',
                                                            label: 'Waiting Payment Approval (WA)',
                                                        },
                                                        {
                                                            key: 'DP',
                                                            label: 'Down Payment (DP)',
                                                        },
                                                        {
                                                            key: 'FP',
                                                            label: 'Full Payment (FP)',
                                                        },
                                                        {
                                                            key: 'BRS',
                                                            label: 'Booking Reserved (BR)',
                                                        },
                                                        {
                                                            key: 'CA',
                                                            label: 'Cancel (CA)',
                                                        },
                                                        {
                                                            key: 'RF',
                                                            label: 'Refund (RF)',
                                                        },
                                                        {
                                                            key: 'EX',
                                                            label: 'Expired (EX)',
                                                        },
                                                        {
                                                            key: 'WL',
                                                            label: 'Waiting List (WL)',
                                                        },
                                                    ].map((field) => (
                                                        <>
                                                            <div className="text-muted-foreground">
                                                                {field.label}
                                                            </div>

                                                            <MoneyInput
                                                                className="text-right"
                                                                value={
                                                                    row[
                                                                        field
                                                                            .key
                                                                    ]
                                                                }
                                                                onChange={(
                                                                    val,
                                                                ) =>
                                                                    updateAvailability(
                                                                        actualIndex,
                                                                        field.key,
                                                                        Number(
                                                                            val,
                                                                        ),
                                                                    )
                                                                }
                                                            />
                                                        </>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="mt-6 flex items-center justify-between border-t px-2 pt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Page {currentPage} of {totalPages}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={currentPage === 1}
                                                onClick={() =>
                                                    setCurrentPage((p) => p - 1)
                                                }
                                            >
                                                Previous
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    currentPage === totalPages
                                                }
                                                onClick={() =>
                                                    setCurrentPage((p) => p + 1)
                                                }
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-start pt-6"></div>
                            <div className="mt-20 flex items-center justify-between px-4 py-3"></div>
                        </TabsContent>

                        {/* ================= TAB 4 — ADD ONS ================= */}
                        <TabsContent value="addons">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
                                    {/* LEFT */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                            Departure Date
                                        </span>

                                        {/* FROM */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                From
                                            </span>

                                            <input
                                                type="date"
                                                value={
                                                    addOnsSearchDepartureFrom
                                                }
                                                onChange={(e) => {
                                                    setAddOnsSearchDepartureFrom(
                                                        e.target.value,
                                                    );
                                                    setCurrentAddOnsPage(1);
                                                }}
                                                className="rounded-lg border px-3 py-2 text-sm"
                                            />
                                        </div>

                                        {/* TO */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                To
                                            </span>

                                            <input
                                                type="date"
                                                value={addOnsSearchDepartureTo}
                                                onChange={(e) => {
                                                    setAddOnsSearchDepartureTo(
                                                        e.target.value,
                                                    );
                                                    setCurrentAddOnsPage(1);
                                                }}
                                                className="rounded-lg border px-3 py-2 text-sm"
                                            />
                                        </div>

                                        {/* RESET */}
                                        {(addOnsSearchDepartureFrom ||
                                            addOnsSearchDepartureTo) && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setAddOnsSearchDepartureFrom(
                                                        '',
                                                    );
                                                    setAddOnsSearchDepartureTo(
                                                        '',
                                                    );
                                                    setCurrentAddOnsPage(1);
                                                }}
                                            >
                                                Reset Date
                                            </Button>
                                        )}
                                    </div>

                                    {/* RIGHT */}
                                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium">
                                        Currency: {tour.currency}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Accordion
                                        type="multiple"
                                        className="space-y-4"
                                    >
                                        {paginatedAddOnsSchedules.map(
                                            (schedule) => {
                                                const rows =
                                                    addOns[schedule.id] || [];

                                                return (
                                                    <AccordionItem
                                                        key={schedule.id}
                                                        value={`schedule-${schedule.id}`}
                                                        className="overflow-hidden rounded-2xl border bg-card shadow-sm"
                                                    >
                                                        {/* HEADER */}
                                                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                                            <div className="flex w-full items-center justify-between pr-4">
                                                                {/* LEFT */}
                                                                <div className="text-left">
                                                                    <div className="text-base font-semibold">
                                                                        {formatDate(
                                                                            schedule.departure_date,
                                                                        )}{' '}
                                                                        →{' '}
                                                                        {formatDate(
                                                                            schedule.return_date,
                                                                        )}
                                                                    </div>

                                                                    <div className="mt-1 text-sm text-muted-foreground">
                                                                        {
                                                                            rows.length
                                                                        }{' '}
                                                                        add ons
                                                                    </div>
                                                                </div>

                                                                {/* RIGHT */}
                                                                <div className="rounded-lg border bg-muted/40 px-3 py-1 text-xs font-medium">
                                                                    {
                                                                        tour.currency
                                                                    }
                                                                </div>
                                                            </div>
                                                        </AccordionTrigger>

                                                        {/* CONTENT */}
                                                        <AccordionContent className="border-t bg-muted/20 px-6 py-5">
                                                            <div className="space-y-4">
                                                                {rows.map(
                                                                    (
                                                                        row,
                                                                        index,
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                index
                                                                            }
                                                                            className="rounded-2xl border bg-background p-5 shadow-sm transition hover:shadow-md"
                                                                        >
                                                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                                                {/* LEFT CONTENT */}
                                                                                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
                                                                                    {/* DESCRIPTION */}
                                                                                    <div className="space-y-2">
                                                                                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                                                                            Add
                                                                                            Ons
                                                                                            Description
                                                                                        </Label>

                                                                                        <Input
                                                                                            type="text"
                                                                                            placeholder="Example: Extra baggage, Visa, Single supplement"
                                                                                            value={
                                                                                                row.description
                                                                                            }
                                                                                            onChange={(
                                                                                                e,
                                                                                            ) =>
                                                                                                updateRow(
                                                                                                    schedule.id,
                                                                                                    index,
                                                                                                    'description',
                                                                                                    e
                                                                                                        .target
                                                                                                        .value,
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    </div>

                                                                                    {/* PRICE */}
                                                                                    <div className="space-y-2">
                                                                                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                                                                            Price
                                                                                            Per
                                                                                            Pax
                                                                                        </Label>

                                                                                        <MoneyInput
                                                                                            className="text-right"
                                                                                            value={
                                                                                                row.price
                                                                                            }
                                                                                            onChange={(
                                                                                                val,
                                                                                            ) =>
                                                                                                updateRow(
                                                                                                    schedule.id,
                                                                                                    index,
                                                                                                    'price',
                                                                                                    Number(
                                                                                                        val,
                                                                                                    ),
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    </div>

                                                                                    {/* EDITABLE */}
                                                                                    <div className="space-y-2">
                                                                                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                                                                            Editable
                                                                                        </Label>

                                                                                        <div className="flex h-10 items-center rounded-xl border px-3">
                                                                                            <label className="flex items-center gap-2 text-sm">
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    checked={
                                                                                                        row.edit_status
                                                                                                    }
                                                                                                    onChange={(
                                                                                                        e,
                                                                                                    ) =>
                                                                                                        updateRow(
                                                                                                            schedule.id,
                                                                                                            index,
                                                                                                            'edit_status',
                                                                                                            e
                                                                                                                .target
                                                                                                                .checked,
                                                                                                        )
                                                                                                    }
                                                                                                />
                                                                                                Allow
                                                                                                Edit
                                                                                            </label>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                {/* RIGHT ACTION */}
                                                                                <div className="flex items-center justify-end lg:w-auto">
                                                                                    <DropdownMenu
                                                                                        modal={
                                                                                            false
                                                                                        }
                                                                                    >
                                                                                        <DropdownMenuTrigger
                                                                                            asChild
                                                                                        >
                                                                                            <Button
                                                                                                type="button"
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                className="h-9 w-9 rounded-xl"
                                                                                            >
                                                                                                <MoreVertical className="h-4 w-4" />
                                                                                            </Button>
                                                                                        </DropdownMenuTrigger>

                                                                                        <DropdownMenuContent
                                                                                            align="end"
                                                                                            sideOffset={
                                                                                                5
                                                                                            }
                                                                                            className="w-52 rounded-xl shadow-lg"
                                                                                        >
                                                                                            {/* SAVE */}
                                                                                            <DropdownMenuItem
                                                                                                className="cursor-pointer"
                                                                                                disabled={
                                                                                                    savingAddOns
                                                                                                }
                                                                                                onClick={() =>
                                                                                                    syncAddOns(
                                                                                                        addOns,
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                {savingAddOns ? (
                                                                                                    <Spinner className="mr-2 h-4 w-4" />
                                                                                                ) : (
                                                                                                    <Save className="mr-2 h-4 w-4" />
                                                                                                )}
                                                                                                Save
                                                                                                Add
                                                                                                Ons
                                                                                            </DropdownMenuItem>

                                                                                            <DropdownMenuSeparator />

                                                                                            {/* DELETE */}
                                                                                            <DropdownMenuItem
                                                                                                className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                                                                                                onClick={() =>
                                                                                                    handleDelete(
                                                                                                        schedule.id,
                                                                                                        index,
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                                                Delete
                                                                                                Add
                                                                                                Ons
                                                                                            </DropdownMenuItem>
                                                                                        </DropdownMenuContent>
                                                                                    </DropdownMenu>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ),
                                                                )}

                                                                {/* ADD BUTTON */}
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        addRow(
                                                                            schedule.id,
                                                                        )
                                                                    }
                                                                >
                                                                    + Add Add
                                                                    Ons
                                                                </Button>
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                );
                                            },
                                        )}
                                    </Accordion>
                                </div>
                                <div className="mt-6 flex items-center justify-between border-t px-4 py-3">
                                    <div className="text-sm text-muted-foreground">
                                        Page {currentAddOnsPage} of{' '}
                                        {totalAddOnsPages}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={currentAddOnsPage === 1}
                                            onClick={() =>
                                                setCurrentAddOnsPage(
                                                    (p) => p - 1,
                                                )
                                            }
                                        >
                                            Previous
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                                currentAddOnsPage ===
                                                totalAddOnsPages
                                            }
                                            onClick={() =>
                                                setCurrentAddOnsPage(
                                                    (p) => p + 1,
                                                )
                                            }
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-start pt-6 border-t"></div>
                        </TabsContent>
                    </Tabs>

                    <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                                <DialogTitle>
                                    <div className="space-y-2">
                                        <div className="text-lg font-semibold">
                                            Copy Schedule To New Departure Dates
                                        </div>

                                        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                                            <div className="font-medium">
                                                {tour.name}
                                            </div>

                                            {selectedSchedule && (
                                                <div className="mt-1 text-muted-foreground">
                                                    {formatDate(
                                                        selectedSchedule.departure_date,
                                                    )}{' '}
                                                    →{' '}
                                                    {formatDate(
                                                        selectedSchedule.return_date,
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </DialogTitle>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                                <div className="border rounded-lg flex justify-center w-fit mx-auto overflow-hidden p-1">
                                    <div className="scale-90 origin-top">
                                        <Calendar
                                            mode="multiple"
                                            selected={selectedDates}
                                            onSelect={(dates) =>
                                                setSelectedDates(dates || [])
                                            }
                                            disabled={(date) =>
                                                date <
                                                new Date(
                                                    new Date().setHours(
                                                        0,
                                                        0,
                                                        0,
                                                        0,
                                                    ),
                                                )
                                            }
                                            className="rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 max-h-40 overflow-auto">
                                    {selectedDates.length === 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            No date selected
                                        </p>
                                    )}

                                    {selectedDates.map((date, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between border rounded-md px-3 py-2"
                                        >
                                            <span>
                                                {format(date, 'dd MMM yyyy')}
                                            </span>

                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="destructive"
                                                onClick={() =>
                                                    setSelectedDates((prev) =>
                                                        prev.filter(
                                                            (d) =>
                                                                format(
                                                                    d,
                                                                    'yyyy-MM-dd',
                                                                ) !==
                                                                format(
                                                                    date,
                                                                    'yyyy-MM-dd',
                                                                ),
                                                        ),
                                                    )
                                                }
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCopyOpen(false)}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="button"
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                    onClick={submitCopySchedules}
                                >
                                    Generate
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </form>
        </CompanyDashboardLayout>
    );
}
