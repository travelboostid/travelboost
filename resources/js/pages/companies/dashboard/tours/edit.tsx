import { store as storeTourAvailability } from '@/actions/App/Http/Controllers/Companies/Dashboard/TourAvailabilityController';
import { update } from '@/actions/App/Http/Controllers/Companies/Dashboard/TourController';
import type { MediaResource } from '@/api/model';
import InputError from '@/components/input-error';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
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
import { router, useForm, usePage } from '@inertiajs/react';
import { Fragment, useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { toast } from 'sonner';
import SelectCategory from './components/select-category';
import SelectContinent from './components/select-continent';
import SelectCountry from './components/select-country';
import SelectCurrency from './components/select-currency';
import SelectProductCommissionCategory from './components/select-product-commission-category';
import SelectRegion from './components/select-region';
import SelectVisaCategory from './components/select-visa-category';
import VisaCategoryPreview from './components/visa-category-preview';

import { useEffect } from 'react';

import { TourDocumentPicker } from '@/components/media/tour-document-picker';
import MoneyInput from '@/components/ui/money-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Copy,
    InfoIcon,
    MoreVertical,
    RefreshCw,
    Save,
    Trash2,
} from 'lucide-react';

import { TourImagePicker } from '@/components/media/tour-image-picker';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
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
    manual_reserved_started_at?: string | null;
    manual_reserved_expires_at?: string | null;
    manual_reserved_pending_value?: number | null;
    manual_reserved_original_available?: number | null;
    manual_reserved_start_date?: string | null;
    manual_reserved_start_time?: string | null;
    //promotion: Adjustment
    //commission: Adjustment
};

type PriceCategory = {
    id: number;
    name: string;
};

type VisaCategory = {
    id: number;
    name: string;
    items: Array<{
        id: number;
        description: string;
        price: number | string;
        is_taxable: boolean;
    }>;
};

type Props = {
    tour: any;
};

type AddOn = {
    id?: number | null;
    description: string;
    price: number | '';
    edit_status: boolean;
    is_taxable: boolean;
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

type LocalDateTimeParts = {
    date: string;
    time: string;
};

type AvailabilityRow = Record<AvailabilityField, number> & {
    id?: number | null;
    schedule_id?: number | null;

    departure_date: string;
    return_date: string;
    manual_reserved_started_at?: string | null;
    manual_reserved_expires_at?: string | null;
    manual_reserved_pending_value?: number | null;
    manual_reserved_original_available?: number | null;
    manual_reserved_start_date?: string | null;
    manual_reserved_start_time?: string | null;

    schedule: string;
};

type ManualReservedSummary = {
    scheduleId: number | null;
    departureDate: string;
    startAt: string;
    expiresAt: string | null;
    originalAvailable: number;
    limitLabel: string | null;
};

function RequiredLabel({ children }: { children: React.ReactNode }) {
    return (
        <Label className="flex items-center gap-1.5">
            <span>{children}</span>
            <span className="text-rose-500">*</span>
        </Label>
    );
}

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
    const intl = useIntl();
    const { props } = usePage() as any;

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

    const [manualReservedEditorOpen, setManualReservedEditorOpen] =
        useState(false);
    const [manualReservedEditorRow, setManualReservedEditorRow] =
        useState<ManualReservedSummary | null>(null);
    const [manualReservedEditorStartDate, setManualReservedEditorStartDate] =
        useState('');
    const [manualReservedEditorStartTime, setManualReservedEditorStartTime] =
        useState('00:00');
    const [manualReservedSummaryOpen, setManualReservedSummaryOpen] =
        useState(false);
    const [manualReservedSummaryRows, setManualReservedSummaryRows] = useState<
        ManualReservedSummary[]
    >([]);

    const { company } = usePageSharedDataProps();
    const { productCommissionCategories, visaCategories } = usePage()
        .props as any;
    const handleSuccess = () => {
        toast.success(intl.formatMessage({ defaultMessage: 'Success' }), {
            position: 'top-center',
            description: intl.formatMessage({
                defaultMessage: 'Tour data updated successfully',
            }),
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
        product_commission_category_id:
            tour.product_commission_category_id || '',
        visa_category_id: tour.visa_category_id || '',
        status: tour.status || 'inactive',

        image_id: tour.image?.id || '',
        document_id: tour.document?.id || '',

        currency: tour.currency || 'IDR',

        schedules: [], // nanti inject
    });

    const { priceCategories } = usePage<{
        priceCategories: PriceCategory[];
    }>().props;

    const selectedVisaCategory = useMemo(() => {
        const selectedId = Number(data.visa_category_id || 0);

        if (!selectedId) {
            return null;
        }

        return (
            (visaCategories as VisaCategory[]).find(
                (category) => category.id === selectedId,
            ) ?? null
        );
    }, [data.visa_category_id, visaCategories]);

    const manualReservedLimitValue = tour.category?.manual_reserved_limit_value
        ? Number(tour.category.manual_reserved_limit_value)
        : null;
    const manualReservedLimitUnit = tour.category?.manual_reserved_limit_unit
        ? String(tour.category.manual_reserved_limit_unit)
        : null;
    const hasManualReservedLimit =
        Boolean(tour.category) &&
        manualReservedLimitValue !== null &&
        manualReservedLimitValue > 0 &&
        (manualReservedLimitUnit === 'minute' ||
            manualReservedLimitUnit === 'hour');
    const manualReservedLimitLabel = hasManualReservedLimit
        ? `${manualReservedLimitValue} ${manualReservedLimitUnit}${manualReservedLimitValue! > 1 ? 's' : ''}`
        : null;
    const manualReservedLimitDescription = hasManualReservedLimit
        ? `Time limit: ${manualReservedLimitLabel}`
        : 'No category limit set. Manual reserved will stay active until it is reset.';
    const browserTimeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';
    const [manualReservedNow, setManualReservedNow] = useState(() =>
        Date.now(),
    );

    useEffect(() => {
        const interval = window.setInterval(() => {
            setManualReservedNow(Date.now());
        }, 1000);

        return () => window.clearInterval(interval);
    }, []);

    const getCurrentLocalDateTime = (): LocalDateTimeParts => {
        const now = new Date();
        const pad = (value: number): string => String(value).padStart(2, '0');

        return {
            date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
            time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
        };
    };

    const parseServerUtcDateTime = useCallback(
        (value: string | null | undefined): Date | null => {
            if (!value) {
                return null;
            }

            const normalizedValue = value.includes('T')
                ? value
                : value.replace(' ', 'T');
            const hasExplicitTimeZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(
                normalizedValue,
            );
            const parsed = new Date(
                hasExplicitTimeZone ? normalizedValue : `${normalizedValue}Z`,
            );

            if (Number.isNaN(parsed.getTime())) {
                return null;
            }

            return parsed;
        },
        [],
    );

    const getLocalDateTimeParts = useCallback(
        (
            value: string | null | undefined,
            fallbackDate: string,
            fallbackTime = '00:00',
        ): LocalDateTimeParts => {
            if (!value) {
                return {
                    date: fallbackDate,
                    time: fallbackTime,
                };
            }

            const parsed = parseServerUtcDateTime(value);

            if (!parsed) {
                return {
                    date: fallbackDate,
                    time: fallbackTime,
                };
            }

            const formatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: browserTimeZone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });

            const parts = formatter.formatToParts(parsed);
            const getPart = (type: Intl.DateTimeFormatPartTypes): string =>
                parts.find((part) => part.type === type)?.value ?? '';

            return {
                date: `${getPart('year')}-${getPart('month')}-${getPart('day')}`,
                time: `${getPart('hour')}:${getPart('minute')}`,
            };
        },
        [browserTimeZone, parseServerUtcDateTime],
    );

    const formatManualReservedDateTime = (
        value: string | null | undefined,
    ): string => {
        if (!value) {
            return '-';
        }

        const parsed = new Date(value.replace(' ', 'T'));

        if (Number.isNaN(parsed.getTime())) {
            return value;
        }

        const formatter = new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        const parts = formatter.formatToParts(parsed);
        const getPart = (type: Intl.DateTimeFormatPartTypes): string =>
            parts.find((part) => part.type === type)?.value ?? '';

        return `${getPart('day')} ${getPart('month')} ${getPart('year')} ${getPart('hour')}.${getPart('minute')}`;
    };

    const getManualReservedExpiresAt = (
        startDate: string,
        startTime: string,
    ): string | null => {
        if (!startDate) {
            return null;
        }

        const startAt = new Date(`${startDate}T${startTime || '00:00'}:00`);

        if (Number.isNaN(startAt.getTime())) {
            return null;
        }

        if (!hasManualReservedLimit || !manualReservedLimitUnit) {
            return null;
        }

        const expiresAt = new Date(startAt);

        if (manualReservedLimitUnit === 'minute') {
            expiresAt.setMinutes(
                expiresAt.getMinutes() + (manualReservedLimitValue ?? 0),
            );
        } else {
            expiresAt.setHours(
                expiresAt.getHours() + (manualReservedLimitValue ?? 0),
            );
        }

        return format(expiresAt, "yyyy-MM-dd'T'HH:mm:ss");
    };

    const formatManualReservedLimit = () => {
        if (!hasManualReservedLimit || !manualReservedLimitUnit) {
            return null;
        }

        const unitLabel =
            manualReservedLimitUnit === 'minute' ? 'minutes' : 'hours';
        return `${manualReservedLimitValue} ${unitLabel}`;
    };

    const getAvailableBeforeManualReserved = (row: AvailabilityRow): number => {
        return Math.max(0, row.max_pax - row.DP - row.FP - row.BRS - row.WPA);
    };

    const formatManualReservedScheduleDate = (date: string): string => {
        if (!date) {
            return '-';
        }

        const parsed = new Date(`${date}T00:00:00`);

        if (Number.isNaN(parsed.getTime())) {
            return date;
        }

        return parsed.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const getConfiguredManualReservedValue = (row: AvailabilityRow): number => {
        const pendingValue = Number(row.manual_reserved_pending_value ?? 0);

        return pendingValue > 0 ? pendingValue : Number(row.RS ?? 0);
    };

    const getManualReservedStatus = (row: AvailabilityRow) => {
        const pendingValue = Number(row.manual_reserved_pending_value ?? 0);
        const configuredValue = getConfiguredManualReservedValue(row);
        const startAt = parseServerUtcDateTime(row.manual_reserved_started_at);
        const expiresAt = parseServerUtcDateTime(
            row.manual_reserved_expires_at,
        );
        const hasActiveValue =
            Number(row.RS ?? 0) > 0 && pendingValue <= 0 && startAt !== null;
        const now = manualReservedNow;

        if (pendingValue > 0 && startAt && startAt.getTime() > now) {
            return {
                kind: 'scheduled' as const,
                configuredValue,
                startAt,
                expiresAt,
                isDue: false,
            };
        }

        if (pendingValue > 0 && startAt) {
            return {
                kind: 'scheduled' as const,
                configuredValue,
                startAt,
                expiresAt,
                isDue: true,
            };
        }

        if (hasActiveValue && expiresAt && expiresAt.getTime() > now) {
            return {
                kind: 'active_timed' as const,
                configuredValue,
                startAt,
                expiresAt,
            };
        }

        if (hasActiveValue && !expiresAt) {
            return {
                kind: 'active_open' as const,
                configuredValue,
                startAt,
                expiresAt: null,
            };
        }

        return {
            kind: 'idle' as const,
            configuredValue: 0,
            startAt: null,
            expiresAt: null,
        };
    };

    const formatManualReservedCountdown = (target: Date): string => {
        const remainingMs = target.getTime() - manualReservedNow;

        if (remainingMs <= 0) {
            return '00:00:00';
        }

        const totalSeconds = Math.floor(remainingMs / 1000);
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
            2,
            '0',
        );
        const seconds = String(totalSeconds % 60).padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`;
    };

    const buildAvailabilityPayloadRow = (
        row: AvailabilityRow,
        startDate = row.manual_reserved_start_date ?? row.departure_date,
        startTime = row.manual_reserved_start_time ?? '00:00',
    ) => ({
        company_id: company.id,
        tour_id: tour.id,
        schedule_id: row.schedule_id ?? null,
        manual_reserved_timezone: browserTimeZone,
        max_pax: row.max_pax,
        WP: row.WP,
        WPA: row.WPA,
        DP: row.DP,
        FP: row.FP,
        RS: getConfiguredManualReservedValue(row),
        BRS: row.BRS,
        CA: row.CA,
        RF: row.RF,
        EX: row.EX,
        WL: row.WL,
        available: row.available,
        manual_reserved_started_at:
            getConfiguredManualReservedValue(row) > 0
                ? `${startDate}T${startTime}:00`
                : null,
        manual_reserved_expires_at:
            getConfiguredManualReservedValue(row) > 0
                ? getManualReservedExpiresAt(startDate, startTime)
                : null,
        manual_reserved_original_available:
            getConfiguredManualReservedValue(row) > 0
                ? getAvailableBeforeManualReserved(row)
                : null,
        manual_reserved_start_date: startDate,
        manual_reserved_start_time: startTime,
    });

    const formatManualReservedSummaryTime = (
        dateValue: string,
        timeValue: string,
    ): string => {
        if (!dateValue) {
            return '-';
        }

        const parsed = new Date(`${dateValue}T${timeValue || '00:00'}:00`);

        if (Number.isNaN(parsed.getTime())) {
            return '-';
        }

        return parsed.toLocaleString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const openManualReservedEditor = (row: AvailabilityRow): void => {
        const { date: startDate, time: startTime } = getCurrentLocalDateTime();

        setManualReservedEditorRow({
            scheduleId: row.schedule_id ?? null,
            departureDate: formatManualReservedScheduleDate(row.departure_date),
            startAt: `${startDate} ${startTime}`,
            expiresAt: getManualReservedExpiresAt(startDate, startTime),
            originalAvailable: getAvailableBeforeManualReserved(row),
            limitLabel: formatManualReservedLimit(),
        });
        setManualReservedEditorStartDate(startDate);
        setManualReservedEditorStartTime(startTime);
        setManualReservedEditorOpen(true);
    };

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

        // ðŸ”¥ WAJIB
        setData('showprice', numeric);
    }, [tour.showprice, setData]);
    //

    const handlePriceChange1 = (value: string) => {
        let numeric1 = value.replace(/\D/g, '');

        if (numeric1 === '') numeric1 = '0'; // ðŸ”¥ default 0

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

        // ðŸ”¥ WAJIB
        setData('promote_price', numeric);
    }, [tour.promote_price, setData]);
    //

    // ðŸ”¥ TAMBAHKAN DI SINI 17042026
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

            toast.success(
                intl.formatMessage({ defaultMessage: 'Schedule saved' }),
            );

            // CLOSE DROPDOWN
            setOpenDropdownIndex(null);
        } catch (err) {
            toast.error(
                intl.formatMessage({
                    defaultMessage: 'Failed to save schedule',
                }),
            );
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
            ...schedules,
        ]);
    };

    const updateSchedule = (
        index: number,
        field: keyof Schedule,
        value: string,
    ) => {
        // ðŸ”¥ VALIDASI DUPLIKAT DEPARTURE DATE
        if (field === 'departure_date') {
            if (isDuplicateDeparture(value, index)) {
                toast.error(
                    intl.formatMessage({
                        defaultMessage: 'Departure date has been used',
                    }),
                );
                return;
            }
        }

        setSchedules((prev) => {
            const updated = [...prev];
            const row = { ...updated[index], [field]: value };

            // ðŸ”¥ AUTO SET return_date
            if (field === 'departure_date' && data.duration_days) {
                row.return_date = addDays(value, Number(data.duration_days));
            }

            // ðŸ”¥ VALIDASI: return tidak boleh sebelum departure
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

        if (
            !confirm(
                intl.formatMessage({ defaultMessage: 'Delete this schedule?' }),
            )
        )
            return;

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

        if (
            !confirm(
                intl.formatMessage({ defaultMessage: 'Delete this category?' }),
            )
        )
            return;

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

                schedule: `${formatDate(s.departure_date)} -> ${formatDate(s.return_date)}`,

                max_pax,

                WP: Number(a.WP || 0),
                WPA: Number(a.WPA || 0),
                DP: Number(a.DP || 0),
                FP: Number(a.FP || 0),
                RS: Number(a.RS ?? 0),
                BRS: Number(a.BRS || 0),
                WA: Number(a.WA || 0),
                CA: Number(a.CA || 0),
                RF: Number(a.RF || 0),
                EX: Number(a.EX || 0),
                WL: Number(a.WL || 0),
                available: Number(a.available || 0),
                manual_reserved_started_at: a.manual_reserved_started_at
                    ? String(a.manual_reserved_started_at)
                    : null,
                manual_reserved_expires_at: a.manual_reserved_expires_at
                    ? String(a.manual_reserved_expires_at)
                    : null,
                manual_reserved_pending_value:
                    a.manual_reserved_pending_value != null
                        ? Number(a.manual_reserved_pending_value)
                        : null,
                manual_reserved_original_available:
                    a.manual_reserved_original_available != null
                        ? Number(a.manual_reserved_original_available)
                        : null,
                manual_reserved_start_date: getLocalDateTimeParts(
                    a.manual_reserved_started_at
                        ? String(a.manual_reserved_started_at)
                        : null,
                    s.departure_date,
                ).date,
                manual_reserved_start_time: getLocalDateTimeParts(
                    a.manual_reserved_started_at
                        ? String(a.manual_reserved_started_at)
                        : null,
                    s.departure_date,
                ).time,
            };
        });
    }, [getLocalDateTimeParts, schedules]);

    const [availability, setAvailability] = useState<AvailabilityRow[]>([]);

    useEffect(() => {
        setAvailability(availabilityData);
    }, [availabilityData]);

    const [savingAvailability, setSavingAvailability] = useState(false);

    const findOriginalAvailabilityRow = (
        row: AvailabilityRow,
    ): AvailabilityRow | undefined => {
        return availabilityData.find(
            (originalRow) => originalRow.schedule_id === row.schedule_id,
        );
    };

    const manualReservedValueChanged = (row: AvailabilityRow): boolean => {
        const originalRow = findOriginalAvailabilityRow(row);

        return (
            getConfiguredManualReservedValue(row) !==
            getConfiguredManualReservedValue(originalRow ?? row)
        );
    };

    const shouldPromptManualReserved = (row: AvailabilityRow): boolean => {
        return manualReservedValueChanged(row) && row.RS > 0;
    };

    const submitAvailabilityPayload = (
        payload: ReturnType<typeof buildAvailabilityPayloadRow>[],
        {
            onSuccess,
            onError,
            onFinish,
        }: {
            onSuccess?: () => void;
            onError?: () => void;
            onFinish?: () => void;
        } = {},
    ): void => {
        setSavingAvailability(true);

        router.post(
            storeTourAvailability({
                company: company.username,
            }).url,
            { availabilities: payload },
            {
                onSuccess: () => {
                    onSuccess?.();
                    toast.success('Availability saved');
                },
                onError: () => {
                    onError?.();
                    toast.error('Failed to save availability');
                },
                onFinish: () => {
                    onFinish?.();
                    setSavingAvailability(false);
                },
            },
        );
    };

    const handleAvailabilitySave = (row: AvailabilityRow): void => {
        if (shouldPromptManualReserved(row)) {
            openManualReservedEditor(row);

            return;
        }

        submitAvailabilityPayload([buildAvailabilityPayloadRow(row)]);
    };

    const handleManualReservedReset = (row: AvailabilityRow): void => {
        submitAvailabilityPayload([
            buildAvailabilityPayloadRow({
                ...row,
                RS: 0,
                manual_reserved_pending_value: null,
                manual_reserved_started_at: null,
                manual_reserved_expires_at: null,
                manual_reserved_original_available: null,
                manual_reserved_start_date: row.departure_date,
                manual_reserved_start_time: '00:00',
            }),
        ]);
    };

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
        const originalRow = findOriginalAvailabilityRow(row);
        const manualReservedStatus = getManualReservedStatus(row);
        const appliedManualReservedValue = manualReservedValueChanged(row)
            ? getConfiguredManualReservedValue(row)
            : manualReservedStatus.kind === 'active_timed' ||
                manualReservedStatus.kind === 'active_open'
              ? Number(originalRow?.RS ?? row.RS ?? 0)
              : 0;

        row.available = Math.max(
            0,
            getAvailableBeforeManualReserved(row) - appliedManualReservedValue,
        );

        setAvailability(updated);
    };

    const buildAvailabilityPayload = () => {
        return availability.map((row) => buildAvailabilityPayloadRow(row));
    };

    const buildAvailabilityPayloadLegacy = () => {
        return availability.map((row, i) => ({
            company_id: company.id,
            tour_id: tour.id,
            schedule_id: schedules[i]?.id ?? null,
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
            manual_reserved_started_at: row.manual_reserved_started_at ?? null,
            manual_reserved_expires_at: row.manual_reserved_expires_at ?? null,
            manual_reserved_pending_value:
                row.manual_reserved_pending_value ?? null,
            manual_reserved_original_available:
                row.manual_reserved_original_available ?? null,
            manual_reserved_start_date:
                row.manual_reserved_start_date ?? row.departure_date,
            manual_reserved_start_time:
                row.manual_reserved_start_time ?? '00:00',
        }));
    };
    void buildAvailabilityPayloadLegacy;

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
                is_taxable: item.is_taxable ?? false,
            }));
        });

        setAddOns(initial);
    }, [schedules, addOnsFromDb]);

    const addRow = (scheduleId: number) => {
        const newRow = {
            description: '',
            price: 0,
            edit_status: false,
            is_taxable: false,
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
                    toast.error(
                        intl.formatMessage({
                            defaultMessage: 'Description must be unique',
                        }),
                    );
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
                    is_taxable: row.is_taxable,
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
                toast.error(
                    intl.formatMessage({
                        defaultMessage: 'Add-ons cannot be empty',
                    }),
                );
                return;
            }

            console.log('SYNC PAYLOAD:', payload);

            router.post(
                `/companies/${company.username}/dashboard/tour-add-ons`,
                { add_ons: payload, schedule_ids: Object.keys(addOns) },
                {
                    preserveState: true,
                    onSuccess: () => {
                        toast.success(
                            intl.formatMessage({
                                defaultMessage:
                                    'Add-ons processed successfully',
                            }),
                        );
                    },
                    onError: (err) => {
                        console.error(err);
                        toast.error(
                            intl.formatMessage({
                                defaultMessage: 'Failed to process add-ons',
                            }),
                        );
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
        if (
            !confirm(
                intl.formatMessage({ defaultMessage: 'Delete this add-on?' }),
            )
        )
            return;

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
            toast.error(
                intl.formatMessage({
                    defaultMessage: 'Please save this schedule before copying',
                }),
            );
            return;
        }

        // VALIDASI AVAILABILITY
        const sourceAvailability = Array.isArray(source.availability)
            ? source.availability[0]
            : source.availability;

        if (!sourceAvailability) {
            toast.error(
                intl.formatMessage({
                    defaultMessage:
                        'Cannot copy schedule because availability data has not been set',
                }),
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
                intl.formatMessage({
                    defaultMessage:
                        'Cannot copy schedule because add-ons data has not been set',
                }),
            );
            return;
        }

        const validDates = selectedDates
            .map((d) => format(d, 'yyyy-MM-dd'))
            .filter(Boolean);

        if (validDates.length === 0) {
            toast.error(
                intl.formatMessage({
                    defaultMessage: 'Please select at least one departure date',
                }),
            );
            return;
        }

        const existingDates = schedules.map((s) => s.departure_date);

        const filteredDates = validDates.filter(
            (date) => !existingDates.includes(date),
        );

        if (filteredDates.length === 0) {
            toast.error(
                intl.formatMessage({
                    defaultMessage: 'Selected dates already exist',
                }),
            );
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

            const manualReservedSummary = createdSchedules.map((schedule) => {
                const startDate =
                    source.availability?.manual_reserved_start_date ??
                    schedule.departure_date;
                const startTime =
                    source.availability?.manual_reserved_start_time ?? '00:00';
                const startAt = `${startDate} ${startTime}`;
                const expiresAt = getManualReservedExpiresAt(
                    startDate,
                    startTime,
                );

                return {
                    scheduleId: schedule.id ?? null,
                    departureDate: schedule.departure_date,
                    startAt,
                    expiresAt,
                    originalAvailable: Number(
                        source.availability?.available ?? 0,
                    ),
                    limitLabel: manualReservedLimitLabel,
                };
            });

            // AVAILABILITY
            await axios.post(
                `/companies/${company.username}/dashboard/tour-availabilities`,
                {
                    availabilities: createdSchedules.map((s) => ({
                        schedule_id: s.id,
                        tour_id: tour.id,
                        manual_reserved_timezone: browserTimeZone,
                        max_pax: source.availability?.max_pax || 0,
                        available: source.availability?.available || 0,
                        manual_reserved_start_date: getLocalDateTimeParts(
                            source.availability?.manual_reserved_started_at
                                ? String(
                                      source.availability
                                          .manual_reserved_started_at,
                                  )
                                : null,
                            s.departure_date,
                        ).date,
                        manual_reserved_start_time: getLocalDateTimeParts(
                            source.availability?.manual_reserved_started_at
                                ? String(
                                      source.availability
                                          .manual_reserved_started_at,
                                  )
                                : null,
                            s.departure_date,
                        ).time,
                    })),
                },
            );

            setManualReservedSummaryRows(manualReservedSummary);
            setManualReservedSummaryOpen(true);

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
                            is_taxable: a.is_taxable ?? false,
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
                    is_taxable: a.is_taxable ?? false,
                }));
            });

            setAddOns((prev) => ({
                ...prev,
                ...copiedAddOns,
            }));

            setCopyOpen(false);
            setSelectedDates([]);
            toast.success(
                intl.formatMessage({
                    defaultMessage: 'Schedule copied successfully',
                }),
            );
        } catch (err) {
            toast.error(
                intl.formatMessage({
                    defaultMessage: 'Failed to copy schedule',
                }),
            );
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
                {
                    title: intl.formatMessage({ defaultMessage: 'Tours' }),
                    url: '/dashboard/tours',
                },
                {
                    title: intl.formatMessage({ defaultMessage: 'Edit' }),
                },
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

          // ðŸ”¥ update state dulu
          setData((prev) => ({
            ...prev,
            showprice: Number(rawPrice),
            promote_price: Number(rawPrice1),
            schedules: schedules, // âœ… langsung object (JANGAN stringify)
          }))

          // ðŸ”¥ kirim TANPA data:
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
                            data: payload, // ðŸ”¥ WAJIB
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
              schedules: schedules, // ðŸ”¥ langsung kirim
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
                        <TabsList className="mb-4 flex h-auto flex-wrap gap-2 bg-transparent p-0">
                            <TabsTrigger
                                value="tour"
                                className="
            rounded-full px-4 py-2 text-xs sm:px-6 sm:py-2 sm:text-sm
            bg-slate-100 text-slate-900
            data-[state=active]:bg-primary
            data-[state=active]:text-white
            shadow-none
        "
                            >
                                <FormattedMessage defaultMessage="Master" />
                            </TabsTrigger>

                            <TabsTrigger
                                value="schedule"
                                className="
            rounded-full px-4 py-2 text-xs sm:px-6 sm:py-2 sm:text-sm
            bg-slate-100 text-slate-900
            data-[state=active]:bg-primary
            data-[state=active]:text-white
            shadow-none
        "
                            >
                                <FormattedMessage defaultMessage="Schedule & Price" />
                            </TabsTrigger>

                            <TabsTrigger
                                value="availability"
                                className="
            rounded-full px-4 py-2 text-xs sm:px-6 sm:py-2 sm:text-sm
            bg-slate-100 text-slate-900
            data-[state=active]:bg-primary
            data-[state=active]:text-white
            shadow-none
        "
                            >
                                <FormattedMessage defaultMessage="Availability" />
                            </TabsTrigger>

                            <TabsTrigger
                                value="addons"
                                className="
            rounded-full px-4 py-2 text-xs sm:px-6 sm:py-2 sm:text-sm
            bg-slate-100 text-slate-900
            data-[state=active]:bg-primary
            data-[state=active]:text-white
            shadow-none
        "
                            >
                                <FormattedMessage defaultMessage="Add Ons" />
                            </TabsTrigger>
                        </TabsList>

                        {/* ================= TAB 1 â€” TOUR ================= */}
                        <TabsContent value="tour" className="space-y-6">
                            {/* <div className="grid gap-6"> changed for show in 2 column */}
                            <div className="mx-auto max-w-7xl space-y-6">
                                {/* Image */}
                                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-pink-50/40 to-white p-6 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
                                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                                        Product Setup
                                    </p>
                                    <h1 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-100">
                                        {data.name.trim() || 'Product Tour'}
                                    </h1>
                                    <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                                        Refine the master information, travel
                                        classification, publishing assets, and
                                        pricing details before managing
                                        schedules.
                                    </p>
                                </div>

                                {/* Code */}
                                <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
                                    {/* HEADER */}
                                    <div className="flex items-start justify-between border-b bg-muted/40 px-6 py-4">
                                        <div>
                                            <h2 className="text-lg font-semibold">
                                                <FormattedMessage defaultMessage="Basic Information" />
                                            </h2>

                                            <p className="text-sm text-muted-foreground">
                                                <FormattedMessage defaultMessage="Main information about your tour" />
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">
                                                <FormattedMessage
                                                    defaultMessage="Input By: {name}"
                                                    values={{
                                                        name:
                                                            tour.user?.name ||
                                                            '-',
                                                    }}
                                                />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-12">
                                        <div className="grid min-w-0 gap-2 lg:col-span-4 lg:order-1">
                                            <RequiredLabel>Code</RequiredLabel>
                                            <Input
                                                id="code"
                                                type="text"
                                                name="code"
                                                required
                                                placeholder={intl.formatMessage(
                                                    {
                                                        defaultMessage:
                                                            'Tour Code',
                                                    },
                                                )}
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
                                        <div className="grid min-w-0 gap-2 lg:col-span-6 lg:order-1">
                                            <RequiredLabel>
                                                <FormattedMessage defaultMessage="Name" />
                                            </RequiredLabel>
                                            <Input
                                                id="name"
                                                type="text"
                                                name="name"
                                                required
                                                placeholder={intl.formatMessage(
                                                    {
                                                        defaultMessage:
                                                            'Tour Name',
                                                    },
                                                )}
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

                                        <div className="grid min-w-0 gap-2 lg:col-span-2 lg:order-1">
                                            <RequiredLabel>
                                                Status
                                            </RequiredLabel>
                                            <Select
                                                value={data.status}
                                                onValueChange={(value) =>
                                                    setData('status', value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectLabel>
                                                            Status
                                                        </SelectLabel>
                                                        <SelectItem value="inactive">
                                                            Inactive
                                                        </SelectItem>
                                                        <SelectItem value="active">
                                                            Active
                                                        </SelectItem>
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={errors.status}
                                            />
                                        </div>

                                        <div className="grid gap-2 lg:col-span-4 lg:order-2">
                                            <RequiredLabel>
                                                Duration
                                            </RequiredLabel>
                                            <Input
                                                id="duration_days"
                                                type="number"
                                                name="duration_days"
                                                required
                                                placeholder="Duration in days"
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

                                        <div className="grid gap-2 lg:col-span-8 lg:order-2">
                                            <RequiredLabel>
                                                Destination
                                            </RequiredLabel>
                                            <Input
                                                id="destination"
                                                type="text"
                                                name="destination"
                                                placeholder="Destination"
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

                                        <div className="grid gap-2 md:col-span-2 lg:col-span-12 lg:order-3">
                                            <RequiredLabel>
                                                Description
                                            </RequiredLabel>
                                            <Textarea
                                                id="description"
                                                name="description"
                                                placeholder="Describe the tour highlights, experience, and important notes"
                                                className="min-h-[140px] resize-none"
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

                                        {/* Product Commission Category */}
                                        <div className="hidden">
                                            <Label htmlFor="product_commission_category_id">
                                                <FormattedMessage defaultMessage="Product Commission Category" />
                                            </Label>

                                            <SelectProductCommissionCategory
                                                value={
                                                    data.product_commission_category_id ||
                                                    undefined
                                                }
                                                categories={
                                                    productCommissionCategories
                                                }
                                                onChange={(val) =>
                                                    setData(
                                                        'product_commission_category_id',
                                                        Number(val),
                                                    )
                                                }
                                            />

                                            <InputError
                                                message={
                                                    errors.product_commission_category_id
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2 lg:col-span-4 lg:order-4">
                                            <RequiredLabel>
                                                <FormattedMessage defaultMessage="Continent" />
                                            </RequiredLabel>
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

                                                    setData('continent_id', id); // âœ… WAJIB
                                                    setData('region_id', ''); // reset
                                                    setData('country_id', '');
                                                }}
                                            />

                                            <InputError
                                                message={errors.continent_id}
                                            />
                                        </div>

                                        <div className="grid gap-2 lg:col-span-4 lg:order-4">
                                            <RequiredLabel>
                                                <FormattedMessage defaultMessage="Region" />
                                            </RequiredLabel>
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

                                                    setData('region_id', id); // âœ…
                                                    setData('country_id', ''); // reset
                                                }}
                                            />
                                            <InputError
                                                message={errors.region_id}
                                            />
                                        </div>

                                        <div className="grid gap-2 lg:col-span-4 lg:order-4">
                                            <RequiredLabel>
                                                <FormattedMessage defaultMessage="Country" />
                                            </RequiredLabel>
                                            <SelectCountry
                                                name="country_id"
                                                continentId={continentId}
                                                regionId={regionId}
                                                value={countryId ?? undefined}
                                                onChange={(val) => {
                                                    //setCountryId(Number(val));
                                                    const id = Number(val);

                                                    setCountryId(id);
                                                    setData('country_id', id); // âœ…
                                                }}
                                            />

                                            <InputError
                                                message={errors.country_id}
                                            />
                                        </div>

                                        {/* Category */}
                                        <div className="hidden">
                                            <Label htmlFor="category_id">
                                                <FormattedMessage defaultMessage="Product Catalog Category" />
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

                                <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
                                    <div className="border-b bg-muted/40 px-6 py-4">
                                        <h2 className="text-lg font-semibold">
                                            Catalog, Commission & Travel Access
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            Link this product to the right
                                            catalog grouping, commission
                                            structure, and visa setup.
                                        </p>
                                    </div>
                                    <div className="space-y-6 p-6">
                                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                                            <div className="grid min-w-0 gap-2">
                                                <Label
                                                    htmlFor="category_id"
                                                    className="truncate"
                                                >
                                                    Product Catalog Category
                                                </Label>
                                                <SelectCategory
                                                    name="category_id"
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

                                            <div className="grid min-w-0 gap-2">
                                                <Label
                                                    htmlFor="product_commission_category_id"
                                                    className="truncate"
                                                >
                                                    Product Commission Category
                                                </Label>

                                                <SelectProductCommissionCategory
                                                    value={
                                                        data.product_commission_category_id ||
                                                        undefined
                                                    }
                                                    categories={
                                                        productCommissionCategories
                                                    }
                                                    onChange={(val) =>
                                                        setData(
                                                            'product_commission_category_id',
                                                            Number(val),
                                                        )
                                                    }
                                                />

                                                <InputError
                                                    message={
                                                        errors.product_commission_category_id
                                                    }
                                                />
                                            </div>

                                            <div className="grid min-w-0 gap-2">
                                                <RequiredLabel>
                                                    Visa Category
                                                </RequiredLabel>

                                                <SelectVisaCategory
                                                    value={
                                                        data.visa_category_id ||
                                                        undefined
                                                    }
                                                    categories={visaCategories}
                                                    onChange={(val) =>
                                                        setData(
                                                            'visa_category_id',
                                                            val === '0'
                                                                ? ''
                                                                : Number(val),
                                                        )
                                                    }
                                                />

                                                <InputError
                                                    message={
                                                        errors.visa_category_id
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                                            <div className="hidden lg:block" />
                                            <div className="hidden lg:block" />
                                            <div className="min-w-0">
                                                <VisaCategoryPreview
                                                    category={
                                                        selectedVisaCategory
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
                                    {/* HEADER */}
                                    <div className="border-b bg-muted/40 px-6 py-4">
                                        <h2 className="text-lg font-semibold">
                                            <FormattedMessage defaultMessage="Publishing & Documents" />
                                        </h2>

                                        <p className="text-sm text-muted-foreground">
                                            <FormattedMessage defaultMessage="Upload the itinerary file and product visual in a compact, easy-to-review layout." />
                                        </p>
                                    </div>
                                    <div className="grid gap-6 p-6 xl:grid-cols-[minmax(220px,3fr)_minmax(320px,7fr)]">
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                                            <div className="mb-3">
                                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    Cover Image Preview
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    Keep the image clear and
                                                    representative for catalog
                                                    browsing.
                                                </p>
                                            </div>
                                            <div className="flex justify-center">
                                                <TourImagePicker
                                                    defaultValue={tour.image}
                                                    owner={{
                                                        type: 'company',
                                                        id: company.id,
                                                    }}
                                                    onChange={(media) => {
                                                        const mediaId = (
                                                            media as MediaResource
                                                        )?.id;

                                                        setData(
                                                            'image_id',
                                                            mediaId || '',
                                                        );
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="name">
                                                    PDF Itinerary
                                                </Label>

                                                <div className="max-w-none">
                                                    <TourDocumentPicker
                                                        owner={{
                                                            type: 'company',
                                                            id: company.id,
                                                        }}
                                                        value={selectedDocument}
                                                        onChange={(
                                                            doc: any,
                                                        ) => {
                                                            setSelectedDocument(
                                                                doc,
                                                            );
                                                            setData(
                                                                'document_id',
                                                                doc?.id,
                                                            );
                                                        }}
                                                    />
                                                </div>

                                                <InputError
                                                    message={errors.document_id}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Normal Price show on catalog */}
                                <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
                                    <div className="border-b bg-muted/40 px-6 py-4">
                                        <h2 className="text-lg font-semibold">
                                            <FormattedMessage defaultMessage="Pricing" />
                                        </h2>

                                        <p className="text-sm text-muted-foreground">
                                            <FormattedMessage defaultMessage="Configure normal and promotional prices" />
                                        </p>
                                    </div>
                                    <div className="space-y-6 p-6">
                                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <RequiredLabel>
                                                    <FormattedMessage defaultMessage="Normal Price show on catalog" />
                                                </RequiredLabel>
                                                <Input
                                                    id="showprice_display"
                                                    type="text"
                                                    placeholder={intl.formatMessage(
                                                        {
                                                            defaultMessage:
                                                                'Normal Price',
                                                        },
                                                    )}
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

                                            <div className="grid gap-2">
                                                <RequiredLabel>
                                                    <FormattedMessage defaultMessage="Currency" />
                                                </RequiredLabel>

                                                <SelectCurrency
                                                    value={data.currency}
                                                    onChange={(val) =>
                                                        setData('currency', val)
                                                    }
                                                />
                                                <InputError
                                                    message={errors.currency}
                                                />
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 p-5 shadow-sm">
                                            <div className="mb-5">
                                                <h3 className="font-semibold text-pink-700">
                                                    <FormattedMessage defaultMessage="Promotion Campaign" />
                                                </h3>

                                                <p className="text-sm text-muted-foreground">
                                                    <FormattedMessage defaultMessage="Highlight special offer on catalog" />
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                                {/* promote title */}
                                                <div className="grid gap-2">
                                                    <Label htmlFor="promote_title">
                                                        <FormattedMessage defaultMessage="Title Promotion on Catalog" />
                                                    </Label>
                                                    <Input
                                                        id="promote_title"
                                                        type="text"
                                                        name="promote_title"
                                                        placeholder={intl.formatMessage(
                                                            {
                                                                defaultMessage:
                                                                    'Title Promotion',
                                                            },
                                                        )}
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
                                                        <FormattedMessage defaultMessage="Promotion Price show on catalog" />
                                                    </Label>
                                                    <Input
                                                        id="promote_price"
                                                        type="text"
                                                        placeholder={intl.formatMessage(
                                                            {
                                                                defaultMessage:
                                                                    'Promotion Price',
                                                            },
                                                        )}
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

                                                {/* promote note â€” full width */}
                                                <div className="grid gap-2 md:col-span-2">
                                                    <Label htmlFor="promote_note">
                                                        <FormattedMessage defaultMessage="Promotion Note on Catalog" />
                                                    </Label>
                                                    <Input
                                                        id="promote_note"
                                                        type="text"
                                                        name="promote_note"
                                                        placeholder={intl.formatMessage(
                                                            {
                                                                defaultMessage:
                                                                    'Promotion Note',
                                                            },
                                                        )}
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
                                    <FormattedMessage defaultMessage="Save & Continue" />
                                </Button>
                            </div>
                        </TabsContent>

                        {/* ================= TAB 2 â€” JADWAL ================= */}

                        <TabsContent value="schedule">
                            <div className="space-y-4">
                                <div className="flex flex-col gap-3 px-4 py-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold">
                                            {data.code} {data.name}
                                        </h2>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            onClick={addSchedule}
                                        >
                                            <FormattedMessage defaultMessage="+ Add New Schedule" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
                                    {/* LEFT */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-sm text-muted-foreground">
                                            <FormattedMessage defaultMessage="Departure Date" />
                                        </span>

                                        {/* FROM */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                <FormattedMessage defaultMessage="From" />
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
                                                <FormattedMessage defaultMessage="To" />
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
                                                <FormattedMessage defaultMessage="Reset" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* RIGHT */}
                                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium">
                                        Currency: {tour.currency}
                                    </div>
                                </div>

                                {/* DESKTOP TABLE */}
                                <div className="hidden lg:block overflow-hidden rounded-lg border">
                                    <table className="w-full border-collapse text-sm">
                                        {/* ================= HEADER ================= */}
                                        <thead className="bg-muted">
                                            <tr>
                                                <th
                                                    className="p-3 text-left"
                                                    rowSpan={2}
                                                >
                                                    <FormattedMessage defaultMessage="Departure" />
                                                </th>
                                                <th
                                                    className="p-3 text-left"
                                                    rowSpan={2}
                                                >
                                                    <FormattedMessage defaultMessage="Return" />
                                                </th>

                                                <th
                                                    className="p-3 text-center"
                                                    colSpan={4}
                                                >
                                                    <FormattedMessage defaultMessage="Prices" />
                                                </th>

                                                <th
                                                    className="p-3 text-left"
                                                    rowSpan={2}
                                                ></th>
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
                                                            className="
                                                                border-t
                                                                align-top
                                                                hover:bg-muted/20
                                                                transition-colors
                                                            "
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
                                                                <Accordion
                                                                    type="single"
                                                                    collapsible
                                                                    className="w-full"
                                                                >
                                                                    <AccordionItem
                                                                        value={`prices-${index}`}
                                                                        className="
                                                                        rounded-xl
                                                                        border
                                                                        bg-background
                                                                        shadow-sm
                                                                        overflow-hidden
                                                                        "
                                                                    >
                                                                        <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                                                            <div className="flex w-full items-center justify-between pr-4">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-medium">
                                                                                        <FormattedMessage defaultMessage="Categories & Pricing" />
                                                                                    </span>

                                                                                    <Badge variant="secondary">
                                                                                        <FormattedMessage
                                                                                            defaultMessage="{count} item"
                                                                                            values={{
                                                                                                count:
                                                                                                    item
                                                                                                        .prices
                                                                                                        ?.length ??
                                                                                                    0,
                                                                                            }}
                                                                                        />
                                                                                    </Badge>
                                                                                </div>

                                                                                <span className="text-xs text-muted-foreground">
                                                                                    <FormattedMessage defaultMessage="Click to manage categories" />
                                                                                </span>
                                                                            </div>
                                                                        </AccordionTrigger>

                                                                        <AccordionContent className="border-t px-4 py-4">
                                                                            {/* HEADER */}
                                                                            <div
                                                                                className="
                                                                                    grid
                                                                                    gap-3
                                                                                    px-1
                                                                                    pb-2
                                                                                    text-xs
                                                                                    font-medium
                                                                                    text-muted-foreground
                                                                                "
                                                                                style={{
                                                                                    gridTemplateColumns:
                                                                                        '24% 22% 1fr 44px',
                                                                                }}
                                                                            >
                                                                                <div>
                                                                                    <FormattedMessage defaultMessage="Category" />
                                                                                </div>
                                                                                <div>
                                                                                    <FormattedMessage defaultMessage="Price" />
                                                                                </div>
                                                                                <div>
                                                                                    <FormattedMessage defaultMessage="Promotion" />
                                                                                </div>
                                                                                <div></div>
                                                                            </div>

                                                                            {/* CONTENT */}
                                                                            <div className="rounded-md border p-3 space-y-3">
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
                                                                                            className="rounded-lg border bg-muted/20 p-3"
                                                                                        >
                                                                                            <div className="grid grid-cols-4 gap-3 items-start">
                                                                                                {/* ROOM */}
                                                                                                <select
                                                                                                    className="border rounded px-2 h-9 text-sm w-full bg-background"
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
                                                                                                        {intl.formatMessage(
                                                                                                            {
                                                                                                                defaultMessage:
                                                                                                                    'Select Category',
                                                                                                            },
                                                                                                        )}
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
                                                                                                    placeholder={intl.formatMessage(
                                                                                                        {
                                                                                                            defaultMessage:
                                                                                                                'Price',
                                                                                                        },
                                                                                                    )}
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
                                                                                                <div
                                                                                                    className="grid gap-3 items-center"
                                                                                                    style={{
                                                                                                        gridTemplateColumns:
                                                                                                            '120px 180px',
                                                                                                    }}
                                                                                                >
                                                                                                    <div className="relative flex-[2]">
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
                                                                                                            placeholder={intl.formatMessage(
                                                                                                                {
                                                                                                                    defaultMessage:
                                                                                                                        'Promotion',
                                                                                                                },
                                                                                                            )}
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

                                                                                                    <div>
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
                                                                                                            placeholder={intl.formatMessage(
                                                                                                                {
                                                                                                                    defaultMessage:
                                                                                                                        'Promotion Value',
                                                                                                                },
                                                                                                            )}
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
                                                                                                    <FormattedMessage defaultMessage="Delete Category" />
                                                                                                </Button>
                                                                                            </div>
                                                                                        </div>
                                                                                    ),
                                                                                )}

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
                                                                                    <FormattedMessage defaultMessage="+ Add Category" />
                                                                                </Button>
                                                                            </div>
                                                                        </AccordionContent>
                                                                    </AccordionItem>
                                                                </Accordion>
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
                                                                            <FormattedMessage defaultMessage="Save Schedule" />
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
                                                                            <FormattedMessage defaultMessage="Copy Schedule" />
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
                                                                            <FormattedMessage defaultMessage="Delete Schedule" />
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
                                                <FormattedMessage defaultMessage="Previous" />
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
                                                <FormattedMessage defaultMessage="Next" />
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
                                                className="
        rounded-xl
        border
        bg-background
        p-4
        shadow-sm
        space-y-4
    "
                                            >
                                                {/* HEADER */}
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium">
                                                            {item.departure_date ||
                                                                intl.formatMessage(
                                                                    {
                                                                        defaultMessage:
                                                                            'New Schedule',
                                                                    },
                                                                )}
                                                        </p>

                                                        <p className="text-xs text-muted-foreground">
                                                            {item.return_date ||
                                                                '-'}
                                                        </p>
                                                    </div>

                                                    <div>
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
                                                                    <FormattedMessage defaultMessage="Save Schedule" />
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
                                                                    <FormattedMessage defaultMessage="Copy Schedule" />
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
                                                                    <FormattedMessage defaultMessage="Delete Schedule" />
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>

                                                {/* DATES */}
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            <FormattedMessage defaultMessage="Departure" />
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
                                                            <FormattedMessage defaultMessage="Return" />
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
                                                <Accordion
                                                    type="single"
                                                    collapsible
                                                >
                                                    <AccordionItem
                                                        value={`prices-${index}`}
                                                    >
                                                        <AccordionTrigger>
                                                            <div className="flex items-center gap-2">
                                                                <FormattedMessage defaultMessage="Categories" />
                                                                <Badge variant="secondary">
                                                                    {item.prices
                                                                        ?.length ??
                                                                        0}
                                                                </Badge>
                                                            </div>
                                                        </AccordionTrigger>

                                                        <AccordionContent>
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
                                                                            className="border rounded-md p-3 space-y-2"
                                                                        >
                                                                            {/* ROOM HEADER */}
                                                                            <div className="flex justify-between items-center">
                                                                                <p className="text-xs font-medium text-muted-foreground">
                                                                                    <FormattedMessage
                                                                                        defaultMessage="Room #{number}"
                                                                                        values={{
                                                                                            number:
                                                                                                rIndex +
                                                                                                1,
                                                                                        }}
                                                                                    />
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
                                                                                    <FormattedMessage defaultMessage="Delete Category" />
                                                                                </Button>
                                                                            </div>

                                                                            {/* ROOM TYPE */}
                                                                            <div className="space-y-1">
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    <FormattedMessage defaultMessage="Category" />
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
                                                                                        {intl.formatMessage(
                                                                                            {
                                                                                                defaultMessage:
                                                                                                    'Select Category',
                                                                                            },
                                                                                        )}
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
                                                                                    <FormattedMessage defaultMessage="Price" />
                                                                                </p>
                                                                                <MoneyInput
                                                                                    value={
                                                                                        room.price
                                                                                    }
                                                                                    placeholder={intl.formatMessage(
                                                                                        {
                                                                                            defaultMessage:
                                                                                                'Price',
                                                                                        },
                                                                                    )}
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
                                                                                    <FormattedMessage defaultMessage="Promotion" />
                                                                                </p>

                                                                                <div className="grid gap-2 sm:grid-cols-2">
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
                                                                                            placeholder={intl.formatMessage(
                                                                                                {
                                                                                                    defaultMessage:
                                                                                                        '0',
                                                                                                },
                                                                                            )}
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
                                                                                        placeholder={intl.formatMessage(
                                                                                            {
                                                                                                defaultMessage:
                                                                                                    'Value',
                                                                                            },
                                                                                        )}
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
                                                                            {/*<div className="space-y-1">
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    Commission
                                                                                </p>

                                                                                <div className="grid gap-2 sm:grid-cols-2">
                                                                                    
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
                                                                                            placeholder={intl.formatMessage({ defaultMessage: "0" })}
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
                                                                                        placeholder={intl.formatMessage({ defaultMessage: "Value" })}
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
                                                                            </div> */}
                                                                        </div>
                                                                    ),
                                                                )}

                                                                {/* ADD ROOM */}
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="w-full"
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
                                                                        ).length
                                                                    }
                                                                >
                                                                    <FormattedMessage defaultMessage="+ Add Category" />
                                                                </Button>
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                            </div>
                                        );
                                    })}
                                    <div
                                        className="
        mt-6
        flex flex-col gap-3
        border-t
        px-4 pt-4
        sm:flex-row
        sm:items-center
        sm:justify-between
    "
                                    >
                                        <div className="text-sm text-muted-foreground">
                                            <FormattedMessage
                                                defaultMessage="Page {current} of {total}"
                                                values={{
                                                    current:
                                                        currentSchedulePage,
                                                    total: totalSchedulePages,
                                                }}
                                            />
                                        </div>

                                        <div className="flex w-full gap-2 sm:w-auto">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 sm:flex-none"
                                                disabled={
                                                    currentSchedulePage === 1
                                                }
                                                onClick={() =>
                                                    setCurrentSchedulePage(
                                                        (p) => p - 1,
                                                    )
                                                }
                                            >
                                                <FormattedMessage defaultMessage="Previous" />
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 sm:flex-none"
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
                                                <FormattedMessage defaultMessage="Next" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ================= TAB 3 â€” AVAILABILITY ================= */}

                        <TabsContent value="availability">
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold">
                                    {data.code} {data.name}
                                </h2>
                                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
                                    {/* LEFT */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-sm text-muted-foreground">
                                            <FormattedMessage defaultMessage="Departure Date" />
                                        </span>

                                        {/* FROM */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                <FormattedMessage defaultMessage="From" />
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
                                                <FormattedMessage defaultMessage="To" />
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
                                                <FormattedMessage defaultMessage="Reset Date" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* RIGHT */}
                                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium whitespace-nowrap">
                                        <FormattedMessage
                                            defaultMessage="Total Available Pax: {total}"
                                            values={{
                                                total: filteredData.reduce(
                                                    (acc, row) =>
                                                        acc +
                                                        (row.available || 0),
                                                    0,
                                                ),
                                            }}
                                        />
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
                                                    <FormattedMessage defaultMessage="Departure → Return" />
                                                </th>
                                                <th className="border-b p-2 text-right font-semibold">
                                                    <FormattedMessage defaultMessage="Max Pax" />
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
                                                            {
                                                                manualReservedLimitDescription
                                                            }
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
                                                            <FormattedMessage defaultMessage="Waiting Payment" />
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
                                                            <FormattedMessage defaultMessage="Waiting Payment Approval" />
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
                                                            <FormattedMessage defaultMessage="Down Payment" />
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
                                                            <FormattedMessage defaultMessage="Full Payment" />
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
                                                            <FormattedMessage defaultMessage="Booking Reserved" />
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
                                                            <FormattedMessage defaultMessage="Cancel" />
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
                                                            <FormattedMessage defaultMessage="Refund" />
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
                                                            <FormattedMessage defaultMessage="Expired" />
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
                                                            <FormattedMessage defaultMessage="Waiting List" />
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </th>
                                                <th className="border-b p-2 text-right font-semibold">
                                                    <FormattedMessage defaultMessage="Available" />
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
                                                    const bgClass =
                                                        i % 2 === 0
                                                            ? 'bg-transparent'
                                                            : 'bg-muted/20';
                                                    const status =
                                                        getManualReservedStatus(
                                                            row,
                                                        );
                                                    const hasStatus =
                                                        status.kind !== 'idle';

                                                    return (
                                                        <Fragment key={row.id}>
                                                            <tr
                                                                className={`border-t hover:bg-muted/40 transition-colors ${bgClass}`}
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
                                                                        {
                                                                            row.WPA
                                                                        }
                                                                    </span>
                                                                </td>

                                                                {/* BRS */}
                                                                <td className="border-b p-2 text-right">
                                                                    <span
                                                                        className={`inline-flex min-w-[60px] justify-center rounded-full px-2 py-1 text-xs font-semibold'
                                }`}
                                                                    >
                                                                        {
                                                                            row.BRS
                                                                        }
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
                                                                                    onClick={() => {
                                                                                        handleAvailabilitySave(
                                                                                            row,
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    {savingAvailability ? (
                                                                                        <Spinner className="mr-2 h-4 w-4" />
                                                                                    ) : (
                                                                                        <Save className="mr-2 h-4 w-4" />
                                                                                    )}
                                                                                    <FormattedMessage defaultMessage="Save Availability" />
                                                                                </DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            {hasStatus && (
                                                                <tr
                                                                    className={`hover:bg-muted/40 transition-colors ${bgClass}`}
                                                                >
                                                                    <td
                                                                        colSpan={
                                                                            3
                                                                        }
                                                                        className={`sticky left-0 z-20 border-b px-3 pb-3 pt-2 align-middle ${bgClass === 'bg-muted/20' ? 'bg-muted/20' : 'bg-background'}`}
                                                                    >
                                                                        <div className="flex justify-center w-full">
                                                                            <div className="flex items-center justify-center gap-4 rounded-md border bg-background/50 px-4 py-1.5 shadow-sm w-max whitespace-nowrap">
                                                                                {status.kind ===
                                                                                'scheduled' ? (
                                                                                    <>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                                                                                                {status.isDue
                                                                                                    ? 'Pending'
                                                                                                    : 'Queued'}
                                                                                            </span>
                                                                                            <span className="text-xs font-semibold text-foreground">
                                                                                                RS{' '}
                                                                                                {
                                                                                                    status.configuredValue
                                                                                                }
                                                                                            </span>
                                                                                            <span className="text-xs text-muted-foreground">
                                                                                                &bull;{' '}
                                                                                                {status.isDue
                                                                                                    ? 'Waiting for next scheduler run'
                                                                                                    : `Start ${formatManualReservedDateTime(status.startAt.toISOString())}`}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="h-4 w-px bg-border"></div>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                                                                                            onClick={() =>
                                                                                                handleManualReservedReset(
                                                                                                    row,
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <RefreshCw className="h-3 w-3" />
                                                                                        </Button>
                                                                                    </>
                                                                                ) : null}
                                                                                {status.kind ===
                                                                                'active_timed' ? (
                                                                                    <>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                                                                                                Countdown
                                                                                            </span>
                                                                                            <span className="text-xs font-semibold text-foreground">
                                                                                                {formatManualReservedCountdown(
                                                                                                    status.expiresAt,
                                                                                                )}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="h-4 w-px bg-border"></div>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                                                                                            onClick={() =>
                                                                                                handleManualReservedReset(
                                                                                                    row,
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <RefreshCw className="h-3 w-3" />
                                                                                        </Button>
                                                                                    </>
                                                                                ) : null}
                                                                                {status.kind ===
                                                                                'active_open' ? (
                                                                                    <>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-700">
                                                                                                Active
                                                                                            </span>
                                                                                            <span className="text-xs font-semibold text-foreground">
                                                                                                RS{' '}
                                                                                                {
                                                                                                    status.configuredValue
                                                                                                }
                                                                                            </span>
                                                                                            <span className="text-xs text-muted-foreground">
                                                                                                &bull;
                                                                                                Start{' '}
                                                                                                {status.startAt
                                                                                                    ? formatManualReservedDateTime(
                                                                                                          status.startAt.toISOString(),
                                                                                                      )
                                                                                                    : '-'}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="h-4 w-px bg-border"></div>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                                                                                            onClick={() =>
                                                                                                handleManualReservedReset(
                                                                                                    row,
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <RefreshCw className="h-3 w-3" />
                                                                                        </Button>
                                                                                    </>
                                                                                ) : null}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td
                                                                        colSpan={
                                                                            11
                                                                        }
                                                                        className="border-b p-0"
                                                                    ></td>
                                                                </tr>
                                                            )}
                                                        </Fragment>
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
                                                <FormattedMessage defaultMessage="Previous" />
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
                                                <FormattedMessage defaultMessage="Next" />
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
                                                            <FormattedMessage
                                                                defaultMessage="{count} pax"
                                                                values={{
                                                                    count: row.available,
                                                                }}
                                                            />
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
                                                                onClick={() => {
                                                                    handleAvailabilitySave(
                                                                        availability[
                                                                            actualIndex
                                                                        ],
                                                                    );
                                                                }}
                                                            >
                                                                {savingAvailability ? (
                                                                    <Spinner className="mr-2 h-4 w-4" />
                                                                ) : (
                                                                    <Save className="mr-2 h-4 w-4" />
                                                                )}
                                                                <FormattedMessage defaultMessage="Save Availability" />
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {/* Input grid */}
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    {AVAILABILITY_MOBILE_FIELDS.map(
                                                        (field) => (
                                                            <Fragment
                                                                key={field.key}
                                                            >
                                                                <div className="text-muted-foreground">
                                                                    {
                                                                        field.label
                                                                    }
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
                                                            </Fragment>
                                                        ),
                                                    )}
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
                                                <FormattedMessage defaultMessage="Previous" />
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
                                                <FormattedMessage defaultMessage="Next" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-start pt-6"></div>
                            <div className="mt-20 flex items-center justify-between px-4 py-3"></div>
                        </TabsContent>

                        {/* ================= TAB 4 â€” ADD ONS ================= */}
                        <TabsContent value="addons">
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold">
                                    {data.code} {data.name}
                                </h2>
                                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
                                    {/* LEFT */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                            <FormattedMessage defaultMessage="Departure Date" />
                                        </span>

                                        {/* FROM */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                <FormattedMessage defaultMessage="From" />
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
                                                <FormattedMessage defaultMessage="To" />
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
                                                <FormattedMessage defaultMessage="Reset Date" />
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
                                                                        {'->'}{' '}
                                                                        {formatDate(
                                                                            schedule.return_date,
                                                                        )}
                                                                    </div>

                                                                    <div className="mt-1 text-sm text-muted-foreground">
                                                                        <FormattedMessage
                                                                            defaultMessage="{count} add ons"
                                                                            values={{
                                                                                count: rows.length,
                                                                            }}
                                                                        />
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
                                                                                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                                                                    {/* DESCRIPTION */}
                                                                                    <div className="space-y-2">
                                                                                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                                                                            <FormattedMessage defaultMessage="Add Ons Description" />
                                                                                        </Label>

                                                                                        <Input
                                                                                            type="text"
                                                                                            placeholder={intl.formatMessage(
                                                                                                {
                                                                                                    defaultMessage:
                                                                                                        'Example: Extra baggage, Visa, Single supplement',
                                                                                                },
                                                                                            )}
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
                                                                                            <FormattedMessage defaultMessage="Price Per Pax" />
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

                                                                                    {/* TAXABLE */}
                                                                                    <div className="space-y-2">
                                                                                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                                                                            <FormattedMessage defaultMessage="Included in PPN" />
                                                                                        </Label>

                                                                                        <div className="flex h-10 items-center rounded-xl border px-3">
                                                                                            <label className="flex items-center gap-2 text-sm">
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    checked={
                                                                                                        row.is_taxable
                                                                                                    }
                                                                                                    onChange={(
                                                                                                        e,
                                                                                                    ) =>
                                                                                                        updateRow(
                                                                                                            schedule.id,
                                                                                                            index,
                                                                                                            'is_taxable',
                                                                                                            e
                                                                                                                .target
                                                                                                                .checked,
                                                                                                        )
                                                                                                    }
                                                                                                />
                                                                                                <FormattedMessage defaultMessage="Taxable" />
                                                                                            </label>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* EDITABLE */}
                                                                                    <div className="space-y-2">
                                                                                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                                                                            <FormattedMessage defaultMessage="Editable" />
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
                                                                                                <FormattedMessage defaultMessage="Allow Edit" />
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
                                                                                                <FormattedMessage defaultMessage="Save Add Ons" />
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
                                                                                                <FormattedMessage defaultMessage="Delete Add Ons" />
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
                                                                    <FormattedMessage defaultMessage="+ Add Add Ons" />
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
                                            <FormattedMessage defaultMessage="Previous" />
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
                                            <FormattedMessage defaultMessage="Next" />
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
                                            <FormattedMessage defaultMessage="Copy Schedule To New Departure Dates" />
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
                                                    {'->'}{' '}
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
                                            <FormattedMessage defaultMessage="No date selected" />
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
                                                <FormattedMessage defaultMessage="Remove" />
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
                                    <FormattedMessage defaultMessage="Cancel" />
                                </Button>

                                <Button
                                    type="button"
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                    onClick={submitCopySchedules}
                                >
                                    <FormattedMessage defaultMessage="Generate" />
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={manualReservedEditorOpen}
                        onOpenChange={setManualReservedEditorOpen}
                    >
                        <DialogContent className="sm:max-w-[520px]">
                            <DialogHeader>
                                <DialogTitle>
                                    Set Manual Reserved Start Time
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                                    {manualReservedEditorRow
                                        ? `Schedule ${manualReservedEditorRow.departureDate}. ${manualReservedLimitDescription}.`
                                        : 'Select a start date and time for this manual reserved value.'}
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="manual_reserved_start_date">
                                            Start Date
                                        </Label>
                                        <Input
                                            id="manual_reserved_start_date"
                                            type="date"
                                            value={
                                                manualReservedEditorStartDate
                                            }
                                            onChange={(event) =>
                                                setManualReservedEditorStartDate(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="manual_reserved_start_time">
                                            Start Time
                                        </Label>
                                        <Input
                                            id="manual_reserved_start_time"
                                            type="time"
                                            value={
                                                manualReservedEditorStartTime
                                            }
                                            onChange={(event) =>
                                                setManualReservedEditorStartTime(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    RS value will start counting on{' '}
                                    {formatManualReservedSummaryTime(
                                        manualReservedEditorStartDate,
                                        manualReservedEditorStartTime,
                                    )}
                                    {hasManualReservedLimit
                                        ? ` and will automatically reset to 0 at ${formatManualReservedDateTime(
                                              getManualReservedExpiresAt(
                                                  manualReservedEditorStartDate,
                                                  manualReservedEditorStartTime,
                                              ),
                                          )}.`
                                        : ' and will remain active until it is reset manually.'}
                                </p>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setManualReservedEditorOpen(false)
                                    }
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        if (!manualReservedEditorRow) {
                                            return;
                                        }

                                        const selectedAvailability =
                                            availability.find(
                                                (row) =>
                                                    row.schedule_id ===
                                                    manualReservedEditorRow.scheduleId,
                                            );

                                        if (!selectedAvailability) {
                                            toast.error(
                                                'Availability row was not found.',
                                            );

                                            return;
                                        }

                                        submitAvailabilityPayload(
                                            [
                                                buildAvailabilityPayloadRow(
                                                    selectedAvailability,
                                                    manualReservedEditorStartDate,
                                                    manualReservedEditorStartTime,
                                                ),
                                            ],
                                            {
                                                onSuccess: () => {
                                                    setManualReservedSummaryRows(
                                                        [
                                                            {
                                                                scheduleId:
                                                                    manualReservedEditorRow.scheduleId,
                                                                departureDate:
                                                                    manualReservedEditorRow.departureDate,
                                                                startAt: `${manualReservedEditorStartDate} ${manualReservedEditorStartTime}`,
                                                                expiresAt:
                                                                    getManualReservedExpiresAt(
                                                                        manualReservedEditorStartDate,
                                                                        manualReservedEditorStartTime,
                                                                    ),
                                                                originalAvailable:
                                                                    Number(
                                                                        selectedAvailability.available +
                                                                            selectedAvailability.RS,
                                                                    ),
                                                                limitLabel:
                                                                    manualReservedLimitLabel,
                                                            },
                                                        ],
                                                    );
                                                    setManualReservedEditorOpen(
                                                        false,
                                                    );
                                                    setManualReservedSummaryOpen(
                                                        true,
                                                    );
                                                },
                                            },
                                        );
                                    }}
                                >
                                    Save
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={manualReservedSummaryOpen}
                        onOpenChange={setManualReservedSummaryOpen}
                    >
                        <DialogContent className="sm:max-w-[640px]">
                            <DialogHeader>
                                <DialogTitle>Manual Reserved Saved</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                                {manualReservedSummaryRows.map((row) => (
                                    <div
                                        key={
                                            row.scheduleId ?? row.departureDate
                                        }
                                        className="rounded-xl border p-4 text-sm"
                                    >
                                        <div className="font-medium">
                                            Schedule {row.departureDate}
                                        </div>
                                        <div className="mt-2 space-y-1 text-muted-foreground">
                                            <p>
                                                RS value will start counting on{' '}
                                                {formatManualReservedDateTime(
                                                    row.startAt,
                                                )}
                                                .
                                            </p>
                                            {row.expiresAt ? (
                                                <p>
                                                    It will automatically reset
                                                    to 0 at{' '}
                                                    {formatManualReservedDateTime(
                                                        row.expiresAt,
                                                    )}
                                                    .
                                                </p>
                                            ) : (
                                                <p>
                                                    It will remain active until
                                                    it is reset manually.
                                                </p>
                                            )}
                                            {row.limitLabel ? (
                                                <p>Limit: {row.limitLabel}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    onClick={() =>
                                        setManualReservedSummaryOpen(false)
                                    }
                                >
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </form>
        </CompanyDashboardLayout>
    );
}
