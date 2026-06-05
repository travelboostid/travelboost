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
import { useState } from 'react';
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
/////////////

export default function Page() {
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
        status: 'inactive',
        image_id: '',
        document_id: '',

        currency: 'IDR',
    });

    const { priceCategories, productCommissionCategories } = usePage<{
        priceCategories: PriceCategory[];
        productCommissionCategories: ProductCommissionCategory[];
    }>().props;

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

    //paging schedule
    const [searchDepartureTab2, setSearchDepartureTab2] = useState('');
    const schedulePerPage = 10;

    const [currentSchedulePage, setCurrentSchedulePage] = useState(1);

    const filteredSchedules = schedules.filter((item) => {
        if (!searchDepartureTab2) return true;

        return item.departure_date === searchDepartureTab2;
    });

    const totalSchedulePages = Math.ceil(
        filteredSchedules.length / schedulePerPage,
    );

    const paginatedSchedulesTab = filteredSchedules.slice(
        (currentSchedulePage - 1) * schedulePerPage,
        currentSchedulePage * schedulePerPage,
    );
    //

    //search availability
    const [searchDeparture, setSearchDeparture] = useState('');

    return (
        <CompanyDashboardLayout
            openMenuIds={['tours']}
            activeMenuIds={['tours.index']}
            breadcrumb={[
                { title: 'Tours', url: '/dashboard/tours' },
                { title: 'Create' },
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
                                    <div className="flex flex-col items-center p-6">
                                        <TourImagePicker
                                            owner={{
                                                id: company.id,
                                                type: 'company',
                                            }}
                                            onChange={(media) => {
                                                const mediaId =
                                                    typeof media === 'object' &&
                                                    media
                                                        ? (
                                                              media as MediaResource
                                                          ).id
                                                        : null;

                                                setData('image_id', mediaId);
                                            }}
                                        />
                                        <InputError message={errors.media_id} />
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
                                            {/* <div className="grid gap-2 md:col-span-2"> */}
                                            <Label htmlFor="description">
                                                Description
                                            </Label>
                                            {/*<Textarea
                      id="description"
                      name="description"
                      placeholder="Tour description"
                    /> */}
                                            <Textarea
                                                id="description"
                                                name="description"
                                                placeholder="Tour description"
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

                                        {/* Product Commission Category */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="product_commission_category_id">
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

                                        {/* Continent */}
                                        {/* <div className="grid gap-2">
                    <Label htmlFor="continent">Continent</Label>
                    <Input
                      id="continent"
                      type="text"
                      name="continent"
                      placeholder="Continent"
                    />
                    <InputError message={errors.continent} />
                  </div> */}
                                        {/* Category */}
                                        {/* <div className="grid gap-2">
                    <Label htmlFor="continent_id">Continent</Label>
                    <SelectContinent name="continent_id" />

                    <InputError message={errors.continent_id} />
                  </div> */}
                                        <div className="grid gap-2">
                                            <Label htmlFor="continent_id">
                                                Continent
                                            </Label>
                                            <SelectContinent
                                                name="continent_id"
                                                value={continentId ?? undefined}
                                                onChange={(val) => {
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

                                    </div>
                                </div>

                                {/* Document */}
                                <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
                                    {/* <div className="grid gap-2 md:col-span-2"> */}
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
                                                    id: company.id,
                                                    type: 'company',
                                                }}
                                                onChange={(media) => {
                                                    const mediaId =
                                                        typeof media ===
                                                            'object' && media
                                                            ? media.id
                                                            : null;

                                                    setData(
                                                        'document_id',
                                                        mediaId,
                                                    );
                                                }}
                                            />
                                            <InputError
                                                message={errors.document_id}
                                            />
                                        </div>

                                        {/* Status */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* STATUS */}
                                            <div className="grid gap-2">
                                                <Label htmlFor="status">
                                                    Status at Catalog
                                                </Label>

                                                <Select
                                                    name="status"
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
                                                        id="promote_price_display"
                                                        type="text"
                                                        placeholder="Promotion Price"
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
                                                        Promotion Note on
                                                        Catalog
                                                    </Label>
                                                    <Input
                                                        id="promote_note"
                                                        type="text"
                                                        name="promote_note"
                                                        placeholder="Promotion Note"
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
                                {/* Created By */}
                                <div className="grid gap-2">
                                    <Label>Input By</Label>

                                    <div className="rounded-xl border bg-muted/30 px-4 py-3">
                                        <div className="font-medium">
                                            {auth.user?.name || '-'}
                                        </div>

                                        {/* <div className="text-sm text-muted-foreground">
                                            User ID: {auth.user?.id || '-'}
                                        </div> */}
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
                                            disabled
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
                                                className="rounded-lg border px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* RIGHT */}
                                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium">
                                        Currency:
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
                                                                                Select
                                                                                Category
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
                                                                            placeholder="Price"
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
                                                                                placeholder="%"
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
                                                                                placeholder="Value"
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
                                                                                placeholder="%"
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
                                                                                placeholder="Value"
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
                                                                                Delete
                                                                                Room
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
                                                                    + Add Room
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
                                                            Delete
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
                                                    Schedule #{index + 1}
                                                </p>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        removeSchedule(index)
                                                    }
                                                >
                                                    Delete
                                                </Button>
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
                                                                e.target.value,
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
                                                                    Room #
                                                                    {rIndex + 1}
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
                                                                    Delete Room
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
                                                                    Price
                                                                </p>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Price"
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
                                                                    Promotion
                                                                </p>

                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {/* % */}
                                                                    <Input
                                                                        type="number"
                                                                        className="no-spinner"
                                                                        placeholder="%"
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
                                                                        placeholder="Value"
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
                                                                    Commission
                                                                </p>

                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {/* % */}
                                                                    <Input
                                                                        type="number"
                                                                        className="no-spinner"
                                                                        placeholder="%"
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
                                                                        placeholder="Value"
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
                                                    + Add Room
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
                                    Save Schedule
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
                                            Departure Date
                                        </span>

                                        {/* FROM */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                From
                                            </span>

                                            <input
                                                type="date"
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
                                                className="rounded-lg border px-3 py-2 text-sm"
                                            />
                                        </div>
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
                                            Departure Date
                                        </span>

                                        {/* FROM */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                From
                                            </span>

                                            <input
                                                type="date"
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
                                                className="rounded-lg border px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium">
                                        Currency:
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
