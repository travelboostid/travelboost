import {
    index,
    store,
} from '@/actions/App/Http/Controllers/Companies/Dashboard/TourController';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { router, useForm, usePage } from '@inertiajs/react';
import { lazy, Suspense, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';

import { Tabs } from '@/components/ui/tabs';

import { CreateTourMasterTab } from './components/form/create-tour-master-tab';
import {
    TourFormTabsList,
    TourTabFallback,
} from './components/form/tour-form-tabs-list';
import type {
    PriceCategory,
    ProductCommissionCategory,
    Schedule,
    TourFormTab,
    VisaCategory,
} from './components/shared/types';

const CreateTourScheduleTab = lazy(() =>
    import('./components/form/create-tour-schedule-tab').then((module) => ({
        default: module.CreateTourScheduleTab,
    })),
);
const CreateTourAvailabilityTab = lazy(() =>
    import('./components/form/create-tour-availability-tab').then((module) => ({
        default: module.CreateTourAvailabilityTab,
    })),
);
const CreateTourAddOnsTab = lazy(() =>
    import('./components/form/create-tour-add-ons-tab').then((module) => ({
        default: module.CreateTourAddOnsTab,
    })),
);

export default function Page() {
    const intl = useIntl();
    const [activeTab, setActiveTab] = useState<TourFormTab>('tour');

    const [continentId, setContinentId] = useState<number | null>(null);
    const [regionId, setRegionId] = useState<number | null>(null);
    const [countryId, setCountryId] = useState<number | null>(null);
    const { company } = usePageSharedDataProps();
    const { auth } = usePage().props as any;
    const handleSuccess = () => {
        router.visit(index({ username: company.username }), { replace: true });
    };

    //for price
    const [displayPrice, setDisplayPrice] = useState('');
    const [rawPrice, setRawPrice] = useState('');

    const handlePriceChange = (value: string) => {
        const numeric = value.replace(/\D/g, '');
        setRawPrice(numeric);
        setData('showprice', numeric);

        const formatted = new Intl.NumberFormat('id-ID').format(
            Number(numeric),
        );
        setDisplayPrice(formatted);
    };
    //

    //for price
    const [displayPrice1, setDisplayPrice1] = useState('0');
    const [rawPrice1, setRawPrice1] = useState('0');

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
    //

    //30032026
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        code: '',
        destination: '',
        duration_days: '',
        showprice: '',
        promote_price: 0,
        promote_title: '',
        promote_note: '',

        continent_id: '', // ✅ wajib
        region_id: '',
        country_id: '',
        category_id: '',
        product_commission_category_id: '',
        visa_category_id: '',
        status: 'inactive',
        image_id: '',
        document_id: '',

        currency: 'IDR',
    });

    const { priceCategories, productCommissionCategories, visaCategories } =
        usePage<{
            priceCategories: PriceCategory[];
            productCommissionCategories: ProductCommissionCategory[];
            visaCategories: VisaCategory[];
        }>().props;

    const selectedVisaCategory = useMemo(() => {
        const selectedId = Number(data.visa_category_id || 0);

        if (!selectedId) {
            return null;
        }

        return (
            visaCategories?.find(
                (category: VisaCategory) => category.id === selectedId,
            ) ?? null
        );
    }, [data.visa_category_id, visaCategories]);

    const [schedules, setSchedules] = useState<Schedule[]>([]);

    const addSchedule = () => {
        setSchedules([
            ...schedules,
            {
                departure_date: '',
                return_date: '',
                prices: [
                    {
                        room_type_id: null,
                        price: '',
                        promotion: { type: 'percent', value: '' },
                        commission: { type: 'percent', value: '' },
                    },
                ],
                promotion: { type: 'percent', value: '' },
                commission: { type: 'percent', value: '' },
            },
        ]);
    };

    const updateSchedule = (
        index: number,
        field: keyof Schedule,
        value: string,
    ) => {
        const updated = [...schedules];
        updated[index][field] = value as any;
        setSchedules(updated);
    };

    const removeSchedule = (index: number) => {
        const updated = schedules.filter((_, i) => i !== index);
        setSchedules(updated);
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
                                percent: '',
                                value: '',
                            },
                            commission: {
                                percent: '',
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
        const updated = [...schedules];
        updated[scheduleIndex].prices = updated[scheduleIndex].prices.filter(
            (_, i) => i !== roomIndex,
        );
        setSchedules(updated);
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

    //paging schedule
    const [searchDepartureTab2, _setSearchDepartureTab2] = useState('');
    const schedulePerPage = 10;

    const [currentSchedulePage, _setCurrentSchedulePage] = useState(1);

    const filteredSchedules = schedules.filter((item) => {
        if (!searchDepartureTab2) return true;

        return item.departure_date === searchDepartureTab2;
    });

    const _totalSchedulePages = Math.ceil(
        filteredSchedules.length / schedulePerPage,
    );

    const _paginatedSchedulesTab = filteredSchedules.slice(
        (currentSchedulePage - 1) * schedulePerPage,
        currentSchedulePage * schedulePerPage,
    );
    //

    //search availability
    const [_searchDeparture, _setSearchDeparture] = useState('');

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
                    title: intl.formatMessage({ defaultMessage: 'Create' }),
                },
            ]}
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();

                    // ensure values always exist
                    setData((prev) => ({
                        ...prev,
                        showprice: prev.showprice || '0',
                        promote_price: prev.promote_price || '0',
                    }));

                    post(store.url({ company: company.username }), {
                        onSuccess: handleSuccess,
                    });
                }}
                className="space-y-4"
            >
                <div className="container mx-auto space-y-4 p-4">
                    <Tabs
                        value={activeTab}
                        onValueChange={(val) =>
                            setActiveTab(val as TourFormTab)
                        }
                    >
                        <TourFormTabsList />

                        {/* ================= TAB 1 — TOUR ================= */}
                        {activeTab === 'tour' && (
                            <CreateTourMasterTab
                                context={{
                                    auth,
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
                                    post,
                                    processing,
                                    productCommissionCategories,
                                    rawPrice,
                                    rawPrice1,
                                    regionId,
                                    selectedVisaCategory,
                                    setContinentId,
                                    setCountryId,
                                    setData,
                                    setRegionId,
                                    visaCategories,
                                }}
                            />
                        )}

                        {/* ================= TAB 2 — JADWAL ================= */}
                        {activeTab === 'schedule' && (
                            <Suspense fallback={<TourTabFallback />}>
                                <CreateTourScheduleTab
                                    context={{
                                        addRoom,
                                        addSchedule,
                                        intl,
                                        priceCategories,
                                        processing,
                                        removeRoom,
                                        removeSchedule,
                                        schedules,
                                        updateRoom,
                                        updateRoomAdjustment,
                                        updateSchedule,
                                    }}
                                />
                            </Suspense>
                        )}
                        {/* ================= TAB 3 — AVAILABILITY ================= */}

                        {activeTab === 'availability' && (
                            <Suspense fallback={<TourTabFallback />}>
                                <CreateTourAvailabilityTab />
                            </Suspense>
                        )}

                        {/* ================= TAB 4 — ADD ONS ================= */}
                        {activeTab === 'addons' && (
                            <Suspense fallback={<TourTabFallback />}>
                                <CreateTourAddOnsTab />
                            </Suspense>
                        )}
                    </Tabs>

                    <input
                        type="hidden"
                        name="schedules"
                        value={JSON.stringify(schedules)}
                    />
                </div>
            </form>
        </CompanyDashboardLayout>
    );
}
