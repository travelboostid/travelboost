import {
    index,
    store,
} from '@/actions/App/Http/Controllers/Companies/Dashboard/TourController';
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
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import SelectCategory from './components/select-category';
import SelectContinent from './components/select-continent';
import SelectCountry from './components/select-country';
import SelectCurrency from './components/select-currency';
import SelectRegion from './components/select-region';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { TourDocumentPicker } from '@/components/media/tour-document-picker';
import { TourImagePicker } from '@/components/media/tour-image-picker';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import SelectProductCommissionCategory from './components/select-product-commission-category';
import SelectVisaCategory from './components/select-visa-category';
import VisaCategoryPreview from './components/visa-category-preview';

///////////tab 2
type RoomPrice = {
    room_type_id: number;
    price: string;
    promotion: Adjustment;
    commission: Adjustment;
};

type Adjustment = {
    type: 'percent' | 'value';
    value: string;
};

type Schedule = {
    departure_date: string;
    return_date: string;
    prices: RoomPrice[];
    //promotion: Adjustment
    //commission: Adjustment
};

type PriceCategory = {
    id: number;
    name: string;
};

type ProductCommissionCategory = {
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
/////////////

function RequiredLabel({ children }: { children: React.ReactNode }) {
    return (
        <Label className="flex items-center gap-1.5">
            <span>{children}</span>
            <span className="text-rose-500">*</span>
        </Label>
    );
}

export default function Page() {
    const intl = useIntl();
    const [activeTab, setActiveTab] = useState<'tour' | 'schedule'>('tour');

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

    const [currentSchedulePage, setCurrentSchedulePage] = useState(1);

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
                                <FormattedMessage defaultMessage="Master" />
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
                                <FormattedMessage defaultMessage="Schedule and Price" />
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
                                <FormattedMessage defaultMessage="Availability" />
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
                                <FormattedMessage defaultMessage="Adds On" />
                            </TabsTrigger>
                        </TabsList>

                        {/* ================= TAB 1 — TOUR ================= */}
                        <TabsContent value="tour" className="space-y-6">
                            {/* <div className="grid gap-6"> changed for show in 2 column */}
                            <div className="mx-auto max-w-7xl space-y-6">
                                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-pink-50/40 to-white p-6 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
                                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                                        Product Setup
                                    </p>
                                    <h1 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-100">
                                        {data.name.trim() || 'Product Tour'}
                                    </h1>
                                    <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                                        Configure the master information, travel
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
                                                <FormattedMessage defaultMessage="Input By:" />{' '}
                                                {auth.user?.name || '-'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-12">
                                        <div className="grid min-w-0 gap-2 lg:col-span-4">
                                            <RequiredLabel>
                                                <FormattedMessage defaultMessage="Code" />
                                            </RequiredLabel>
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
                                        <div className="grid min-w-0 gap-2 lg:col-span-6">
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
                                        <div className="grid min-w-0 gap-2 lg:col-span-2">
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

                                        <div className="grid gap-5 lg:col-span-12 lg:grid-cols-[minmax(180px,0.8fr)_minmax(0,1.4fr)]">
                                            <div className="grid gap-2">
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
                                                    message={
                                                        errors.duration_days
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
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
                                        </div>

                                        <div className="grid gap-2 lg:col-span-12">
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

                                        <div className="grid gap-2 lg:col-span-4">
                                            <RequiredLabel>
                                                <FormattedMessage defaultMessage="Continent" />
                                            </RequiredLabel>
                                            <SelectContinent
                                                name="continent_id"
                                                value={continentId ?? undefined}
                                                onChange={(val) => {
                                                    const id = Number(val);

                                                    setContinentId(id);
                                                    setRegionId(null);
                                                    setCountryId(null);

                                                    setData('continent_id', id);
                                                    setData('region_id', '');
                                                    setData('country_id', '');
                                                }}
                                            />
                                            <InputError
                                                message={errors.continent_id}
                                            />
                                        </div>

                                        <div className="grid gap-2 lg:col-span-4">
                                            <RequiredLabel>
                                                <FormattedMessage defaultMessage="Region" />
                                            </RequiredLabel>
                                            <SelectRegion
                                                name="region_id"
                                                continentId={continentId}
                                                value={regionId ?? undefined}
                                                onChange={(val) => {
                                                    const id = Number(val);

                                                    setRegionId(id);
                                                    setCountryId(null);

                                                    setData('region_id', id);
                                                    setData('country_id', '');
                                                }}
                                            />
                                            <InputError
                                                message={errors.region_id}
                                            />
                                        </div>

                                        <div className="grid gap-2 lg:col-span-4">
                                            <RequiredLabel>
                                                <FormattedMessage defaultMessage="Country" />
                                            </RequiredLabel>
                                            <SelectCountry
                                                name="country_id"
                                                continentId={continentId}
                                                regionId={regionId}
                                                value={countryId ?? undefined}
                                                onChange={(val) => {
                                                    const id = Number(val);

                                                    setCountryId(id);
                                                    setData('country_id', id);
                                                }}
                                            />
                                            <InputError
                                                message={errors.country_id}
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
                                    {/* <div className="grid gap-2 md:col-span-2"> */}
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
                                                    owner={{
                                                        id: company.id,
                                                        type: 'company',
                                                    }}
                                                    onChange={(media) => {
                                                        const mediaId =
                                                            typeof media ===
                                                                'object' &&
                                                            media
                                                                ? (
                                                                      media as MediaResource
                                                                  ).id
                                                                : null;

                                                        setData(
                                                            'image_id',
                                                            mediaId,
                                                        );
                                                    }}
                                                />
                                            </div>
                                            <InputError
                                                message={errors.media_id}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="name">
                                                    PDF Itinerary
                                                </Label>
                                                <div className="max-w-none">
                                                    <TourDocumentPicker
                                                        owner={{
                                                            id: company.id,
                                                            type: 'company',
                                                        }}
                                                        onChange={(media) => {
                                                            const mediaId =
                                                                typeof media ===
                                                                    'object' &&
                                                                media
                                                                    ? media.id
                                                                    : null;

                                                            setData(
                                                                'document_id',
                                                                mediaId,
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
                                                {/* hidden raw value */}
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
                                                    Currency
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
                                                        id="promote_price_display"
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
                                                    {/* hidden raw value */}
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
                                <Button
                                    type="button"
                                    disabled={processing}
                                    /*onClick={() => {
                      post(store.url({ company: company.username }), {
                        onSuccess: (page: any) => {
                          const tourId = page.props.tour.id

                          router.visit(`/dashboard/tours/${tourId}/edit?tab=schedule`)
                        },
                      })
                    }}*/
                                    onClick={() => {
                                        post(
                                            store.url({
                                                company: company.username,
                                            }),
                                        );
                                    }}
                                >
                                    {processing && <Spinner />}
                                    <FormattedMessage defaultMessage="Save & Continue" />
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
                                            disabled
                                        >
                                            +{' '}
                                            <FormattedMessage defaultMessage="Add New Schedule" />
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
                                                className="rounded-lg border px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* RIGHT */}
                                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium">
                                        <FormattedMessage defaultMessage="Currency:" />
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

                                            <tr className="text-xs text-muted-foreground">
                                                <th className="p-2">
                                                    <FormattedMessage defaultMessage="Category" />
                                                </th>
                                                <th className="p-2">
                                                    <FormattedMessage defaultMessage="Price" />
                                                </th>
                                                <th className="p-2">
                                                    <FormattedMessage defaultMessage="Promotion" />
                                                </th>
                                                <th className="p-2">
                                                    <FormattedMessage defaultMessage="Commission" />
                                                </th>
                                            </tr>
                                        </thead>
                                        {/* ================= BODY ================= */}
                                        <tbody>
                                            {schedules.map((item, index) => (
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
                                                            onChange={(e) =>
                                                                updateSchedule(
                                                                    index,
                                                                    'departure_date',
                                                                    e.target
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
                                                            onChange={(e) =>
                                                                updateSchedule(
                                                                    index,
                                                                    'return_date',
                                                                    e.target
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
                                                            {item.prices.map(
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
                                                                                {intl.formatMessage(
                                                                                    {
                                                                                        defaultMessage:
                                                                                            'Select Category',
                                                                                    },
                                                                                )}
                                                                            </option>

                                                                            {priceCategories.map(
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
                                                                        <Input
                                                                            type="number"
                                                                            className="no-spinner"
                                                                            placeholder={intl.formatMessage(
                                                                                {
                                                                                    defaultMessage:
                                                                                        'Price',
                                                                                },
                                                                            )}
                                                                            value={
                                                                                room.price
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateRoom(
                                                                                    index,
                                                                                    rIndex,
                                                                                    'price',
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                        />

                                                                        {/* PROMOTION */}
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            {/* PERCENT */}
                                                                            <Input
                                                                                type="number"
                                                                                className="no-spinner"
                                                                                placeholder={intl.formatMessage(
                                                                                    {
                                                                                        defaultMessage:
                                                                                            '%',
                                                                                    },
                                                                                )}
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
                                                                                disabled={
                                                                                    room
                                                                                        .promotion
                                                                                        .type ===
                                                                                        'value' &&
                                                                                    room
                                                                                        .promotion
                                                                                        .value !==
                                                                                        ''
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) => {
                                                                                    const val =
                                                                                        e
                                                                                            .target
                                                                                            .value;

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

                                                                            {/* VALUE */}
                                                                            <Input
                                                                                type="number"
                                                                                className="no-spinner"
                                                                                placeholder={intl.formatMessage(
                                                                                    {
                                                                                        defaultMessage:
                                                                                            'Value',
                                                                                    },
                                                                                )}
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
                                                                                disabled={
                                                                                    room
                                                                                        .promotion
                                                                                        .type ===
                                                                                        'percent' &&
                                                                                    room
                                                                                        .promotion
                                                                                        .value !==
                                                                                        ''
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) => {
                                                                                    const val =
                                                                                        e
                                                                                            .target
                                                                                            .value;

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
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            {/* PERCENT */}
                                                                            <Input
                                                                                type="number"
                                                                                className="no-spinner"
                                                                                placeholder={intl.formatMessage(
                                                                                    {
                                                                                        defaultMessage:
                                                                                            '%',
                                                                                    },
                                                                                )}
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
                                                                                disabled={
                                                                                    room
                                                                                        .commission
                                                                                        .type ===
                                                                                        'value' &&
                                                                                    room
                                                                                        .commission
                                                                                        .value !==
                                                                                        ''
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) => {
                                                                                    const val =
                                                                                        e
                                                                                            .target
                                                                                            .value;

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

                                                                            {/* VALUE */}
                                                                            <Input
                                                                                type="number"
                                                                                className="no-spinner"
                                                                                placeholder={intl.formatMessage(
                                                                                    {
                                                                                        defaultMessage:
                                                                                            'Value',
                                                                                    },
                                                                                )}
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
                                                                                disabled={
                                                                                    room
                                                                                        .commission
                                                                                        .type ===
                                                                                        'percent' &&
                                                                                    room
                                                                                        .commission
                                                                                        .value !==
                                                                                        ''
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) => {
                                                                                    const val =
                                                                                        e
                                                                                            .target
                                                                                            .value;

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
                                                                                <FormattedMessage defaultMessage="Delete Room" />
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
                                                                >
                                                                    +{' '}
                                                                    <FormattedMessage defaultMessage="Add Room" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* ACTION */}
                                                    <td className="p-2">
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            onClick={() =>
                                                                removeSchedule(
                                                                    index,
                                                                )
                                                            }
                                                        >
                                                            <FormattedMessage defaultMessage="Delete" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* MOBILE VERSION */}
                                <div className="md:hidden space-y-4">
                                    {schedules.map((item, index) => (
                                        <div
                                            key={index}
                                            className="border rounded-lg p-3 space-y-3"
                                        >
                                            {/* HEADER */}
                                            <div className="flex justify-between items-center">
                                                <p className="font-medium text-sm">
                                                    <FormattedMessage
                                                        defaultMessage="Schedule #{number}"
                                                        values={{
                                                            number: index + 1,
                                                        }}
                                                    />
                                                </p>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        removeSchedule(index)
                                                    }
                                                >
                                                    <FormattedMessage defaultMessage="Delete" />
                                                </Button>
                                            </div>

                                            {/* DATES */}
                                            <div className="grid grid-cols-2 gap-2">
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
                                                                e.target.value,
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
                                                        value={item.return_date}
                                                        onChange={(e) =>
                                                            updateSchedule(
                                                                index,
                                                                'return_date',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            {/* ROOMS */}
                                            <div className="space-y-3">
                                                {item.prices.map(
                                                    (room, rIndex) => (
                                                        <div
                                                            key={rIndex}
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
                                                                    <FormattedMessage defaultMessage="Delete Room" />
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

                                                                    {priceCategories.map(
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
                                                                <Input
                                                                    type="number"
                                                                    placeholder={intl.formatMessage(
                                                                        {
                                                                            defaultMessage:
                                                                                'Price',
                                                                        },
                                                                    )}
                                                                    value={
                                                                        room.price
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateRoom(
                                                                            index,
                                                                            rIndex,
                                                                            'price',
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            </div>

                                                            {/* PROMOTION */}
                                                            <div className="space-y-1">
                                                                <p className="text-xs text-muted-foreground">
                                                                    <FormattedMessage defaultMessage="Promotion" />
                                                                </p>

                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {/* % */}
                                                                    <Input
                                                                        type="number"
                                                                        className="no-spinner"
                                                                        placeholder={intl.formatMessage(
                                                                            {
                                                                                defaultMessage:
                                                                                    '%',
                                                                            },
                                                                        )}
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
                                                                        disabled={
                                                                            room
                                                                                .promotion
                                                                                .type ===
                                                                                'value' &&
                                                                            room
                                                                                .promotion
                                                                                .value !==
                                                                                ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            const val =
                                                                                e
                                                                                    .target
                                                                                    .value;

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

                                                                    {/* VALUE */}
                                                                    <Input
                                                                        type="number"
                                                                        className="no-spinner"
                                                                        placeholder={intl.formatMessage(
                                                                            {
                                                                                defaultMessage:
                                                                                    'Value',
                                                                            },
                                                                        )}
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
                                                                        disabled={
                                                                            room
                                                                                .promotion
                                                                                .type ===
                                                                                'percent' &&
                                                                            room
                                                                                .promotion
                                                                                .value !==
                                                                                ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            const val =
                                                                                e
                                                                                    .target
                                                                                    .value;

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
                                                                    <FormattedMessage defaultMessage="Commission" />
                                                                </p>

                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {/* % */}
                                                                    <Input
                                                                        type="number"
                                                                        className="no-spinner"
                                                                        placeholder={intl.formatMessage(
                                                                            {
                                                                                defaultMessage:
                                                                                    '%',
                                                                            },
                                                                        )}
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
                                                                        disabled={
                                                                            room
                                                                                .commission
                                                                                .type ===
                                                                                'value' &&
                                                                            room
                                                                                .commission
                                                                                .value !==
                                                                                ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            const val =
                                                                                e
                                                                                    .target
                                                                                    .value;

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

                                                                    {/* VALUE */}
                                                                    <Input
                                                                        type="number"
                                                                        className="no-spinner"
                                                                        placeholder={intl.formatMessage(
                                                                            {
                                                                                defaultMessage:
                                                                                    'Value',
                                                                            },
                                                                        )}
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
                                                                        disabled={
                                                                            room
                                                                                .commission
                                                                                .type ===
                                                                                'percent' &&
                                                                            room
                                                                                .commission
                                                                                .value !==
                                                                                ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            const val =
                                                                                e
                                                                                    .target
                                                                                    .value;

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
                                                    className="w-full"
                                                >
                                                    +{' '}
                                                    <FormattedMessage defaultMessage="Add Room" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-start pt-6 border-t">
                                <Button
                                    type="submit"
                                    disabled={
                                        processing || schedules.length === 0
                                    }
                                >
                                    <FormattedMessage defaultMessage="Save Schedule" />
                                </Button>
                            </div>
                        </TabsContent>
                        {/* ================= TAB 3 — AVAILABILITY ================= */}

                        <TabsContent value="availability">
                            <div className="space-y-4">
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
                                                className="rounded-lg border px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* RIGHT */}
                                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium">
                                        <FormattedMessage defaultMessage="Quantity: pax" />
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
                                                            <FormattedMessage defaultMessage="Manual Reserved" />
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

                                        <tbody></tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-start pt-6 border-t"></div>
                        </TabsContent>

                        {/* ================= TAB 4 — ADD ONS ================= */}
                        <TabsContent value="addons">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
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
                                                className="rounded-lg border px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium">
                                        <FormattedMessage defaultMessage="Currency:" />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
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
