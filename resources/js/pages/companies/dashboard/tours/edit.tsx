import { store as storeTourAvailability } from '@/actions/App/Http/Controllers/Companies/Dashboard/TourAvailabilityController';
import { update } from '@/actions/App/Http/Controllers/Companies/Dashboard/TourController';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { router, useForm, usePage } from '@inertiajs/react';
import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import { CopyScheduleDialog } from './components/form/copy-schedule-dialog';
import { EditTourMasterTab } from './components/form/edit-tour-master-tab';
import { ManualReservedEditorDialog } from './components/form/manual-reserved-editor-dialog';
import { ManualReservedSummaryDialog } from './components/form/manual-reserved-summary-dialog';
import {
    TourFormTabsList,
    TourTabFallback,
} from './components/form/tour-form-tabs-list';
import type {
    AddOn,
    AddOnsState,
    AvailabilityField,
    AvailabilityRow,
    LocalDateTimeParts,
    ManualReservedSummary,
    PriceCategory,
    Schedule,
    TourFormTab,
    VisaCategory,
} from './components/shared/types';

import { useEffect } from 'react';

import { Tabs } from '@/components/ui/tabs';

import axios from 'axios';
import { format } from 'date-fns';

const EditTourScheduleTab = lazy(() =>
    import('./components/form/edit-tour-schedule-tab').then((module) => ({
        default: module.EditTourScheduleTab,
    })),
);
const EditTourAvailabilityTab = lazy(() =>
    import('./components/form/edit-tour-availability-tab').then((module) => ({
        default: module.EditTourAvailabilityTab,
    })),
);
const EditTourAddOnsTab = lazy(() =>
    import('./components/form/edit-tour-add-ons-tab').then((module) => ({
        default: module.EditTourAddOnsTab,
    })),
);

type Props = {
    tour: any;
};

const _EDITABLE_AVAILABILITY_FIELDS: AvailabilityField[] = ['max_pax', 'RS'];

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

    const [activeTab, setActiveTab] = useState<TourFormTab>('tour');

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

    const _buildAvailabilityPayloadRow = (
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
        } catch (_err) {
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

    const _updateAdjustment = (
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
        payload: ReturnType<typeof _buildAvailabilityPayloadRow>[],
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

        submitAvailabilityPayload([_buildAvailabilityPayloadRow(row)]);
    };

    const handleManualReservedReset = (row: AvailabilityRow): void => {
        submitAvailabilityPayload([
            _buildAvailabilityPayloadRow({
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

    const _buildAvailabilityPayload = () => {
        return availability.map((row) => _buildAvailabilityPayloadRow(row));
    };

    const _buildAvailabilityPayloadLegacy = () => {
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
    void _buildAvailabilityPayloadLegacy;

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

    const _deleteRow = (scheduleId: number, index: number) => {
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
        } catch (_err) {
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

            const _deletedItem = rows[index];

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
    const _copySchedule = (item) => {
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
    const [_copyDates, _setCopyDates] = useState<string[]>(['']);

    const openCopyModal = (index: number) => {
        setCopySourceIndex(index);
        _setCopyDates(['']);
        setSelectedSchedule(schedules[index]);
        setCopyOpen(true);
    };

    const _addCopyDate = () => {
        _setCopyDates((prev) => [...prev, '']);
    };

    const _updateCopyDate = (idx: number, value: string) => {
        _setCopyDates((prev) => prev.map((d, i) => (i === idx ? value : d)));
    };

    const _removeCopyDate = (idx: number) => {
        _setCopyDates((prev) => prev.filter((_, i) => i !== idx));
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
                intl.formatMessage(
                    {
                        defaultMessage:
                            'Schedule copied successfully to {dates}',
                    },
                    { dates: filteredDates.join(', ') },
                ),
            );
        } catch (_err) {
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
                        onValueChange={(val) =>
                            setActiveTab(val as TourFormTab)
                        }
                    >
                        <TourFormTabsList />

                        {/* ================= TAB 1 â€” TOUR ================= */}
                        {activeTab === 'tour' && (
                            <EditTourMasterTab
                                context={{
                                    company,
                                    continentId,
                                    countryId,
                                    data,
                                    displayPrice,
                                    displayPrice1,
                                    errors,
                                    handlePriceChange,
                                    handlePriceChange1,
                                    intl,
                                    processing,
                                    productCommissionCategories,
                                    rawPrice,
                                    rawPrice1,
                                    regionId,
                                    selectedDocument,
                                    selectedVisaCategory,
                                    setContinentId,
                                    setCountryId,
                                    setData,
                                    setRegionId,
                                    setSelectedDocument,
                                    tour,
                                    visaCategories,
                                }}
                            />
                        )}

                        {/* ================= TAB 2 â€” JADWAL ================= */}

                        {activeTab === 'schedule' && (
                            <Suspense fallback={<TourTabFallback />}>
                                <EditTourScheduleTab
                                    context={{
                                        addRoom,
                                        addSchedule,
                                        currentSchedulePage,
                                        data,
                                        intl,
                                        openCopyModal,
                                        openDropdownIndex,
                                        paginatedSchedulesTab,
                                        priceCategories,
                                        removeRoom,
                                        removeSchedule,
                                        schedules,
                                        searchDepartureFromTab2,
                                        searchDepartureToTab2,
                                        setCurrentSchedulePage,
                                        setOpenDropdownIndex,
                                        setSearchDepartureFromTab2,
                                        setSearchDepartureToTab2,
                                        submitSchedule,
                                        totalSchedulePages,
                                        tour,
                                        updateRoom,
                                        updateRoomAdjustment,
                                        updateSchedule,
                                    }}
                                />
                            </Suspense>
                        )}

                        {/* ================= TAB 3 â€” AVAILABILITY ================= */}

                        {activeTab === 'availability' && (
                            <Suspense fallback={<TourTabFallback />}>
                                <EditTourAvailabilityTab
                                    context={{
                                        AVAILABILITY_MOBILE_FIELDS,
                                        currentPage,
                                        data,
                                        filteredData,
                                        formatDate,
                                        formatManualReservedCountdown,
                                        formatManualReservedDateTime,
                                        getManualReservedStatus,
                                        handleAvailabilitySave,
                                        handleManualReservedReset,
                                        manualReservedLimitDescription,
                                        pageSize,
                                        paginatedAvailability,
                                        savingAvailability,
                                        searchDepartureFrom,
                                        searchDepartureTo,
                                        setCurrentPage,
                                        setSearchDepartureFrom,
                                        setSearchDepartureTo,
                                        totalPages,
                                        updateAvailability,
                                    }}
                                />
                            </Suspense>
                        )}

                        {/* ================= TAB 4 â€” ADD ONS ================= */}
                        {activeTab === 'addons' && (
                            <Suspense fallback={<TourTabFallback />}>
                                <EditTourAddOnsTab
                                    context={{
                                        addOns,
                                        addOnsSearchDepartureFrom,
                                        addOnsSearchDepartureTo,
                                        addRow,
                                        currentAddOnsPage,
                                        data,
                                        formatDate,
                                        handleDelete,
                                        paginatedAddOnsSchedules,
                                        savingAddOns,
                                        setAddOnsSearchDepartureFrom,
                                        setAddOnsSearchDepartureTo,
                                        setCurrentAddOnsPage,
                                        syncAddOns,
                                        totalAddOnsPages,
                                        tour,
                                        updateRow,
                                    }}
                                />
                            </Suspense>
                        )}
                    </Tabs>

                    <CopyScheduleDialog
                        context={{
                            copyOpen,
                            formatDate,
                            selectedDates,
                            selectedSchedule,
                            setCopyOpen,
                            setSelectedDates,
                            submitCopySchedules,
                            tour,
                        }}
                    />

                    <ManualReservedEditorDialog
                        context={{
                            _buildAvailabilityPayloadRow,
                            availability,
                            formatManualReservedDateTime,
                            formatManualReservedSummaryTime,
                            getManualReservedExpiresAt,
                            hasManualReservedLimit,
                            manualReservedEditorOpen,
                            manualReservedEditorRow,
                            manualReservedEditorStartDate,
                            manualReservedEditorStartTime,
                            manualReservedLimitDescription,
                            manualReservedLimitLabel,
                            setManualReservedEditorOpen,
                            setManualReservedEditorStartDate,
                            setManualReservedEditorStartTime,
                            setManualReservedSummaryOpen,
                            setManualReservedSummaryRows,
                            submitAvailabilityPayload,
                        }}
                    />

                    <ManualReservedSummaryDialog
                        context={{
                            manualReservedSummaryOpen,
                            manualReservedSummaryRows,
                            setManualReservedSummaryOpen,
                            formatManualReservedDateTime,
                        }}
                    />
                </div>
            </form>
        </CompanyDashboardLayout>
    );
}
