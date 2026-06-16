import {
    index,
    store,
} from '@/actions/App/Http/Controllers/Companies/Dashboard/TourController';
import type { MediaResource } from '@/api/model';
import InputError from '@/components/input-error';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { MediaPicker } from '@/components/media-picker';
import { TourMediaImage } from '@/components/tours/tour-media-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemTitle,
} from '@/components/ui/item';
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
import { Form, router } from '@inertiajs/react';
import { FormattedMessage, useIntl } from 'react-intl';
import SelectCategory from './components/select-category';

export default function Page() {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const handleSuccess = () => {
        router.visit(index({ username: company.username }), { replace: true });
    };
    return (
        <CompanyDashboardLayout
            openMenuIds={['tours']}
            activeMenuIds={['agent-tours.index']}
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
            <Form
                {...store.form({ username: company.username })}
                className="space-y-4"
                onSuccess={handleSuccess}
            >
                {({ errors, processing }) => (
                    <div className="container mx-auto space-y-4 p-4">
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    <FormattedMessage defaultMessage="Image" />
                                </Label>
                                <MediaPicker
                                    params={{
                                        owner_type: 'company',
                                        owner_id: company.id,
                                    }}
                                    uploadParams={{
                                        owner_type: 'company',
                                        owner_id: company.id,
                                    }}
                                    type="image"
                                >
                                    {(media, change) => (
                                        <div className="flex flex-col items-center justify-items-center gap-2">
                                            {typeof media === 'string' ? (
                                                <img
                                                    className="aspect-video max-w-[360px] rounded object-cover shadow"
                                                    src={media}
                                                    alt=""
                                                />
                                            ) : (
                                                <TourMediaImage
                                                    media={media as any}
                                                    className="aspect-video max-w-[360px] rounded object-cover shadow"
                                                />
                                            )}
                                            <input
                                                type="hidden"
                                                name="image_id"
                                                value={
                                                    (media as MediaResource)?.id
                                                }
                                            />
                                            <Button
                                                className="w-fit"
                                                onClick={change}
                                                type="button"
                                            >
                                                <FormattedMessage defaultMessage="Change" />
                                            </Button>
                                        </div>
                                    )}
                                </MediaPicker>
                                <InputError message={errors.media_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="code">
                                    <FormattedMessage defaultMessage="Code" />
                                </Label>
                                <Input
                                    id="code"
                                    type="text"
                                    name="code"
                                    required
                                    placeholder={intl.formatMessage({
                                        defaultMessage: 'Tour Code',
                                    })}
                                />
                                <InputError message={errors.code} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    <FormattedMessage defaultMessage="Name" />
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    name="name"
                                    required
                                    placeholder={intl.formatMessage({
                                        defaultMessage: 'Tour Name',
                                    })}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">
                                    <FormattedMessage defaultMessage="Description" />
                                </Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder={intl.formatMessage({
                                        defaultMessage: 'Tour description',
                                    })}
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="duration_days">
                                    <FormattedMessage defaultMessage="Duration in Days" />
                                </Label>
                                <Input
                                    id="duration_days"
                                    type="number"
                                    name="duration_days"
                                    required
                                    placeholder={intl.formatMessage({
                                        defaultMessage: 'Duration',
                                    })}
                                />
                                <InputError message={errors.duration_days} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="continent">
                                    <FormattedMessage defaultMessage="Continent" />
                                </Label>
                                <Input
                                    id="continent"
                                    type="text"
                                    name="continent"
                                    placeholder={intl.formatMessage({
                                        defaultMessage: 'Continent',
                                    })}
                                />
                                <InputError message={errors.continent} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="region">
                                    <FormattedMessage defaultMessage="Region" />
                                </Label>
                                <Input
                                    id="region"
                                    type="text"
                                    name="region"
                                    placeholder={intl.formatMessage({
                                        defaultMessage: 'Region',
                                    })}
                                />
                                <InputError message={errors.region} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="country">
                                    <FormattedMessage defaultMessage="Country" />
                                </Label>
                                <Input
                                    id="country"
                                    type="text"
                                    name="country"
                                    placeholder={intl.formatMessage({
                                        defaultMessage: 'Country',
                                    })}
                                />
                                <InputError message={errors.country} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="destination">
                                    <FormattedMessage defaultMessage="Destination" />
                                </Label>
                                <Input
                                    id="destination"
                                    type="text"
                                    name="destination"
                                    placeholder={intl.formatMessage({
                                        defaultMessage: 'Destination',
                                    })}
                                />
                                <InputError message={errors.destination} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="category_id">
                                    <FormattedMessage defaultMessage="Category" />
                                </Label>
                                <SelectCategory name="category_id" />

                                <InputError message={errors.category_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    <FormattedMessage defaultMessage="Document" />
                                </Label>
                                <MediaPicker
                                    params={{
                                        owner_type: 'company',
                                        owner_id: company.id,
                                    }}
                                    type="document"
                                >
                                    {(media, change) => (
                                        <Item variant="outline">
                                            <ItemContent>
                                                <ItemTitle>
                                                    {(media as any)?.name ||
                                                        intl.formatMessage({
                                                            defaultMessage:
                                                                'No document selected',
                                                        })}
                                                </ItemTitle>
                                            </ItemContent>
                                            <input
                                                type="hidden"
                                                name="document_id"
                                                value={
                                                    (media as any)?.id ||
                                                    undefined
                                                }
                                            />
                                            <ItemActions>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={change}
                                                    type="button"
                                                >
                                                    <FormattedMessage defaultMessage="Change" />
                                                </Button>
                                            </ItemActions>
                                        </Item>
                                    )}
                                </MediaPicker>
                                <InputError message={errors.document_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="status">
                                    <FormattedMessage defaultMessage="Status" />
                                </Label>
                                <Select name="status" defaultValue="active">
                                    <SelectTrigger className="w-full max-w-48">
                                        <SelectValue
                                            placeholder={intl.formatMessage({
                                                defaultMessage: 'Select status',
                                            })}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>
                                                <FormattedMessage defaultMessage="Select status" />
                                            </SelectLabel>
                                            <SelectItem value="active">
                                                <FormattedMessage defaultMessage="Active" />
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                <FormattedMessage defaultMessage="Inactive" />
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.status} />
                            </div>
                        </div>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}
                            <FormattedMessage defaultMessage="Create" />
                        </Button>
                    </div>
                )}
            </Form>
        </CompanyDashboardLayout>
    );
}
