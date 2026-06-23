import type { MediaResource } from '@/api/model';
import InputError from '@/components/input-error';
import { TourDocumentPicker } from '@/components/media/tour-document-picker';
import { TourImagePicker } from '@/components/media/tour-image-picker';
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
import { TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { FormattedMessage } from 'react-intl';
import SelectCategory from '../select-category';
import SelectContinent from '../select-continent';
import SelectCountry from '../select-country';
import SelectCurrency from '../select-currency';
import SelectProductCommissionCategory from '../select-product-commission-category';
import SelectRegion from '../select-region';
import SelectVisaCategory from '../select-visa-category';
import { RequiredLabel } from '../shared/required-label';
import VisaCategoryPreview from '../visa-category-preview';

type MasterTabProps = {
    context: any;
};

export function EditTourMasterTab({ context }: MasterTabProps) {
    const {
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
    } = context;

    return (
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
                        Refine the master information, travel classification,
                        publishing assets, and pricing details before managing
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
                                        name: tour.user?.name || '-',
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
                                placeholder={intl.formatMessage({
                                    defaultMessage: 'Tour Code',
                                })}
                                //defaultValue={tour.code}
                                value={data.code}
                                onChange={(e) =>
                                    setData('code', e.target.value)
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
                                placeholder={intl.formatMessage({
                                    defaultMessage: 'Tour Name',
                                })}
                                //defaultValue={tour.name}
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid min-w-0 gap-2 lg:col-span-2 lg:order-1">
                            <RequiredLabel>Status</RequiredLabel>
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
                                        <SelectLabel>Status</SelectLabel>
                                        <SelectItem value="inactive">
                                            Inactive
                                        </SelectItem>
                                        <SelectItem value="active">
                                            Active
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status} />
                        </div>

                        <div className="grid gap-2 lg:col-span-4 lg:order-2">
                            <RequiredLabel>Duration</RequiredLabel>
                            <Input
                                id="duration_days"
                                type="number"
                                name="duration_days"
                                required
                                placeholder="Duration in days"
                                value={data.duration_days}
                                onChange={(e) =>
                                    setData('duration_days', e.target.value)
                                }
                            />
                            <InputError message={errors.duration_days} />
                        </div>

                        <div className="grid gap-2 lg:col-span-8 lg:order-2">
                            <RequiredLabel>Destination</RequiredLabel>
                            <Input
                                id="destination"
                                type="text"
                                name="destination"
                                placeholder="Destination"
                                value={data.destination}
                                onChange={(e) =>
                                    setData('destination', e.target.value)
                                }
                            />
                            <InputError message={errors.destination} />
                        </div>

                        <div className="grid gap-2 md:col-span-2 lg:col-span-12 lg:order-3">
                            <RequiredLabel>Description</RequiredLabel>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Describe the tour highlights, experience, and important notes"
                                className="min-h-[140px] resize-none"
                                onInput={(e) => {
                                    const el = e.currentTarget;
                                    el.style.height = 'auto';
                                    el.style.height = el.scrollHeight + 'px';
                                }}
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                            />
                            <InputError message={errors.description} />
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
                                categories={productCommissionCategories}
                                onChange={(val) =>
                                    setData(
                                        'product_commission_category_id',
                                        Number(val),
                                    )
                                }
                            />

                            <InputError
                                message={errors.product_commission_category_id}
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

                            <InputError message={errors.continent_id} />
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
                            <InputError message={errors.region_id} />
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

                            <InputError message={errors.country_id} />
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
                                value={data.category_id || undefined}
                                onChange={(val) =>
                                    setData('category_id', Number(val))
                                }
                            />

                            <InputError message={errors.category_id} />
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
                    <div className="border-b bg-muted/40 px-6 py-4">
                        <h2 className="text-lg font-semibold">
                            Catalog, Commission & Travel Access
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Link this product to the right catalog grouping,
                            commission structure, and visa setup.
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
                                    value={data.category_id || undefined}
                                    onChange={(val) =>
                                        setData('category_id', Number(val))
                                    }
                                />

                                <InputError message={errors.category_id} />
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
                                    categories={productCommissionCategories}
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
                                <RequiredLabel>Visa Category</RequiredLabel>

                                <SelectVisaCategory
                                    value={data.visa_category_id || undefined}
                                    categories={visaCategories}
                                    onChange={(val) =>
                                        setData(
                                            'visa_category_id',
                                            val === '0' ? '' : Number(val),
                                        )
                                    }
                                />

                                <InputError message={errors.visa_category_id} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                            <div className="hidden lg:block" />
                            <div className="hidden lg:block" />
                            <div className="min-w-0">
                                <VisaCategoryPreview
                                    category={selectedVisaCategory}
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
                                    Keep the image clear and representative for
                                    catalog browsing.
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
                                        const mediaId = (media as MediaResource)
                                            ?.id;

                                        setData('image_id', mediaId || '');
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">PDF Itinerary</Label>

                                <div className="max-w-none">
                                    <TourDocumentPicker
                                        owner={{
                                            type: 'company',
                                            id: company.id,
                                        }}
                                        value={selectedDocument}
                                        onChange={(doc: any) => {
                                            setSelectedDocument(doc);
                                            setData('document_id', doc?.id);
                                        }}
                                    />
                                </div>

                                <InputError message={errors.document_id} />
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
                                    placeholder={intl.formatMessage({
                                        defaultMessage: 'Normal Price',
                                    })}
                                    value={displayPrice}
                                    onChange={(e) =>
                                        handlePriceChange(e.target.value)
                                    }
                                />
                                <input
                                    type="hidden"
                                    name="showprice"
                                    value={rawPrice}
                                />
                                <InputError message={errors.showprice} />
                            </div>

                            <div className="grid gap-2">
                                <RequiredLabel>
                                    <FormattedMessage defaultMessage="Currency" />
                                </RequiredLabel>

                                <SelectCurrency
                                    value={data.currency}
                                    onChange={(val) => setData('currency', val)}
                                />
                                <InputError message={errors.currency} />
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
                                        placeholder={intl.formatMessage({
                                            defaultMessage: 'Title Promotion',
                                        })}
                                        //defaultValue={tour.promote_title}
                                        value={data.promote_title}
                                        onChange={(e) =>
                                            setData(
                                                'promote_title',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.promote_title}
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
                                        placeholder={intl.formatMessage({
                                            defaultMessage: 'Promotion Price',
                                        })}
                                        value={displayPrice1}
                                        onChange={(e) =>
                                            handlePriceChange1(e.target.value)
                                        }
                                    />
                                    <input
                                        type="hidden"
                                        name="promote_price"
                                        value={rawPrice1}
                                    />
                                    <InputError
                                        message={errors.promote_price}
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
                                        placeholder={intl.formatMessage({
                                            defaultMessage: 'Promotion Note',
                                        })}
                                        //defaultValue={tour.promote_note}
                                        value={data.promote_note}
                                        onChange={(e) =>
                                            setData(
                                                'promote_note',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={errors.promote_note} />
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
    );
}
