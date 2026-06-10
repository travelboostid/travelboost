import type { MediaResource } from '@/api/model';
import InputError from '@/components/input-error';
import { TourDocumentPicker } from '@/components/media/tour-document-picker';
import { TourImagePicker } from '@/components/media/tour-image-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MoneyInput from '@/components/ui/money-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import SelectCategory from '@/pages/companies/dashboard/tours/components/select-category';
import SelectContinent from '@/pages/companies/dashboard/tours/components/select-continent';
import SelectCountry from '@/pages/companies/dashboard/tours/components/select-country';
import SelectProductCommissionCategory from '@/pages/companies/dashboard/tours/components/select-product-commission-category';
import SelectRegion from '@/pages/companies/dashboard/tours/components/select-region';
import { update } from '@/routes/admin/tours/products';
import { useForm } from '@inertiajs/react';
import { Loader2, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { TourProductSchedulesPanel } from './tour-product-schedules-panel';

type ProductCommissionCategory = {
    id: number;
    category_name: string;
};

type PriceCategory = { id: number; name: string };

type CurrencyOption = { code: string; name: string };

type Props = {
    tour: any;
    priceCategories: PriceCategory[];
    productCommissionCategories: ProductCommissionCategory[];
    currencies: CurrencyOption[];
};

function FormSection({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-5">
            <div className="space-y-1">
                <h2 className="text-base font-semibold">{title}</h2>
                {description ? (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>
            {children}
        </section>
    );
}

export function TourProductEditForm({
    tour,
    priceCategories,
    productCommissionCategories,
    currencies,
}: Props) {
    const [continentId, setContinentId] = useState<number | null>(
        tour.continent_id ?? null,
    );
    const [regionId, setRegionId] = useState<number | null>(
        tour.region_id ?? null,
    );
    const [countryId, setCountryId] = useState<number | null>(
        tour.country_id ?? null,
    );

    const form = useForm({
        code: tour.code || '',
        name: tour.name || '',
        description: tour.description || '',
        duration_days: tour.duration_days || '',
        status: tour.status || 'inactive',
        destination: tour.destination || '',
        continent_id: tour.continent_id || '',
        region_id: tour.region_id || '',
        country_id: tour.country_id || '',
        category_id: tour.category_id || '',
        product_commission_category_id:
            tour.product_commission_category_id || '',
        image_id: tour.image?.id || '',
        document_id: tour.document?.id || '',
        showprice: String(tour.showprice ?? 0),
        promote_price: String(tour.promote_price ?? 0),
        promote_title: tour.promote_title || '',
        promote_note: tour.promote_note || '',
        earlybird: tour.earlybird ? String(tour.earlybird) : '',
        earlybird_note: tour.earlybird_note || '',
        currency: tour.currency || 'IDR',
    });

    const scheduleCount = tour.schedules?.length ?? 0;

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        form.put(update({ tour: tour.id }).url, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Tour updated successfully');
            },
        });
    };

    return (
        <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {tour.name || tour.code}
                        </h1>
                        <Badge variant="outline" className="font-mono">
                            {tour.code}
                        </Badge>
                        <Badge
                            variant={
                                form.data.status === 'active'
                                    ? 'default'
                                    : 'secondary'
                            }
                            className="capitalize"
                        >
                            {form.data.status}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Vendor: {tour.company?.name || '—'}
                        {tour.user?.name
                            ? ` · Created by ${tour.user.name}`
                            : ''}
                    </p>
                </div>
                <Button type="submit" disabled={form.processing}>
                    {form.processing ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <Save className="size-4" />
                    )}
                    Save changes
                </Button>
            </div>

            <Tabs defaultValue="details" className="gap-6">
                <TabsList variant="line">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="location">Location</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="catalog">Catalog</TabsTrigger>
                    <TabsTrigger value="schedules" className="gap-2">
                        Schedules
                        {scheduleCount > 0 ? (
                            <span className="text-xs text-muted-foreground">
                                ({scheduleCount})
                            </span>
                        ) : null}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-6 space-y-6">
                    <FormSection
                        title="Basic information"
                        description="Core tour identity and catalog visibility."
                    >
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="code">Code</Label>
                                <Input
                                    id="code"
                                    value={form.data.code}
                                    onChange={(e) =>
                                        form.setData('code', e.target.value)
                                    }
                                />
                                <InputError message={form.errors.code} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                />
                                <InputError message={form.errors.name} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    rows={4}
                                    value={form.data.description}
                                    onChange={(e) =>
                                        form.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError message={form.errors.description} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration_days">
                                    Duration (days)
                                </Label>
                                <Input
                                    id="duration_days"
                                    type="number"
                                    min={1}
                                    value={form.data.duration_days}
                                    onChange={(e) =>
                                        form.setData(
                                            'duration_days',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={form.errors.duration_days}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={form.data.status}
                                    onValueChange={(value) =>
                                        form.setData('status', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="inactive">
                                            Inactive
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.status} />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <SelectCategory
                                    companyId={tour.company_id}
                                    value={form.data.category_id || undefined}
                                    onChange={(value) =>
                                        form.setData(
                                            'category_id',
                                            value === '0' ? '' : value,
                                        )
                                    }
                                />
                                <InputError message={form.errors.category_id} />
                            </div>
                            <div className="space-y-2">
                                <Label>Commission category</Label>
                                <SelectProductCommissionCategory
                                    categories={productCommissionCategories}
                                    value={
                                        form.data.product_commission_category_id
                                            ? Number(
                                                  form.data
                                                      .product_commission_category_id,
                                              )
                                            : undefined
                                    }
                                    onChange={(value) =>
                                        form.setData(
                                            'product_commission_category_id',
                                            value === '0' ? '' : value,
                                        )
                                    }
                                />
                                <InputError
                                    message={
                                        form.errors
                                            .product_commission_category_id
                                    }
                                />
                            </div>
                        </div>
                    </FormSection>
                </TabsContent>

                <TabsContent value="location" className="mt-6">
                    <FormSection
                        title="Location"
                        description="Geographic context shown on listings and filters."
                    >
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Continent</Label>
                                <SelectContinent
                                    name="continent_id"
                                    value={continentId || 0}
                                    onChange={(value) => {
                                        const id = Number(value);
                                        setContinentId(id || null);
                                        setRegionId(null);
                                        setCountryId(null);
                                        form.setData('continent_id', value);
                                        form.setData('region_id', '');
                                        form.setData('country_id', '');
                                    }}
                                />
                                <InputError
                                    message={form.errors.continent_id}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Region</Label>
                                <SelectRegion
                                    name="region_id"
                                    continentId={continentId}
                                    value={regionId || 0}
                                    onChange={(value) => {
                                        setRegionId(Number(value) || null);
                                        setCountryId(null);
                                        form.setData('region_id', value);
                                        form.setData('country_id', '');
                                    }}
                                />
                                <InputError message={form.errors.region_id} />
                            </div>
                            <div className="space-y-2">
                                <Label>Country</Label>
                                <SelectCountry
                                    name="country_id"
                                    continentId={continentId}
                                    regionId={regionId}
                                    value={countryId || 0}
                                    onChange={(value) => {
                                        setCountryId(Number(value) || null);
                                        form.setData('country_id', value);
                                    }}
                                />
                                <InputError message={form.errors.country_id} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="destination">Destination</Label>
                                <Input
                                    id="destination"
                                    value={form.data.destination}
                                    onChange={(e) =>
                                        form.setData(
                                            'destination',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError message={form.errors.destination} />
                            </div>
                        </div>
                    </FormSection>
                </TabsContent>

                <TabsContent value="media" className="mt-6 space-y-8">
                    <FormSection
                        title="Cover image"
                        description="Primary image used in catalogs and search."
                    >
                        <TourImagePicker
                            defaultValue={tour.image}
                            owner={{
                                type: 'company',
                                id: tour.company_id,
                            }}
                            onChange={(media) => {
                                form.setData(
                                    'image_id',
                                    (media as MediaResource)?.id || '',
                                );
                            }}
                        />
                        <InputError message={form.errors.image_id} />
                    </FormSection>

                    <Separator />

                    <FormSection
                        title="Itinerary document"
                        description="PDF or document attached to the tour product."
                    >
                        <TourDocumentPicker
                            defaultValue={tour.document}
                            owner={{
                                type: 'company',
                                id: tour.company_id,
                            }}
                            onChange={(media) => {
                                form.setData(
                                    'document_id',
                                    (media as MediaResource)?.id || '',
                                );
                            }}
                        />
                        <InputError message={form.errors.document_id} />
                    </FormSection>
                </TabsContent>

                <TabsContent value="catalog" className="mt-6">
                    <FormSection
                        title="Catalog pricing"
                        description="Public-facing prices and promotional messaging."
                    >
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Currency</Label>
                                <Select
                                    value={form.data.currency}
                                    onValueChange={(value) =>
                                        form.setData('currency', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currencies.map((currency) => (
                                            <SelectItem
                                                key={currency.code}
                                                value={currency.code}
                                            >
                                                {currency.code} —{' '}
                                                {currency.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.currency} />
                            </div>
                            <div className="space-y-2">
                                <Label>Normal price</Label>
                                <MoneyInput
                                    value={form.data.showprice}
                                    onChange={(value) =>
                                        form.setData('showprice', value)
                                    }
                                />
                                <InputError message={form.errors.showprice} />
                            </div>
                            <div className="space-y-2">
                                <Label>Promotion title</Label>
                                <Input
                                    value={form.data.promote_title}
                                    onChange={(e) =>
                                        form.setData(
                                            'promote_title',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={form.errors.promote_title}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Promotion price</Label>
                                <MoneyInput
                                    value={form.data.promote_price}
                                    onChange={(value) =>
                                        form.setData('promote_price', value)
                                    }
                                />
                                <InputError
                                    message={form.errors.promote_price}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Promotion note</Label>
                                <Input
                                    value={form.data.promote_note}
                                    onChange={(e) =>
                                        form.setData(
                                            'promote_note',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={form.errors.promote_note}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Early bird price</Label>
                                <MoneyInput
                                    value={form.data.earlybird}
                                    onChange={(value) =>
                                        form.setData('earlybird', value)
                                    }
                                />
                                <InputError message={form.errors.earlybird} />
                            </div>
                            <div className="space-y-2">
                                <Label>Early bird note</Label>
                                <Input
                                    value={form.data.earlybird_note}
                                    onChange={(e) =>
                                        form.setData(
                                            'earlybird_note',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={form.errors.earlybird_note}
                                />
                            </div>
                        </div>
                    </FormSection>
                </TabsContent>

                <TabsContent value="schedules" className="mt-6">
                    <TourProductSchedulesPanel
                        tourId={tour.id}
                        durationDays={form.data.duration_days}
                        priceCategories={priceCategories}
                        initialSchedules={tour.schedules || []}
                    />
                </TabsContent>
            </Tabs>
        </form>
    );
}
