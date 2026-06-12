import { update } from '@/actions/App/Http/Controllers/Companies/Dashboard/TourController';
import type { MediaResource } from '@/api/model';
import InputError from '@/components/input-error';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { MediaPicker } from '@/components/media-picker';
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
import { extractImageSrc } from '@/lib/utils';
import { Form } from '@inertiajs/react';
import { FormattedMessage, useIntl } from 'react-intl';
import { toast } from 'sonner';
import SelectCategory from './components/select-category';

type Props = {
    tour: any;
};
export default function Page({ tour }: Props) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const handleSuccess = () => {
        toast.success(intl.formatMessage({ defaultMessage: 'Success' }), {
            position: 'top-center',
            description: intl.formatMessage({
                defaultMessage: 'Tour data updated successfully',
            }),
        });
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
                    title: intl.formatMessage({ defaultMessage: 'Edit' }),
                },
            ]}
        >
            <Form
                {...update.form({ company: company.username, tour: tour.id })}
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
                                    defaultValue={tour.image}
                                >
                                    {(media, change) => (
                                        <div className="flex flex-col items-center justify-items-center gap-2">
                                            <img
                                                className="aspect-video max-w-[360px] rounded object-cover shadow"
                                                src={
                                                    typeof media === 'string'
                                                        ? media
                                                        : extractImageSrc(
                                                              media as any,
                                                          ).src
                                                }
                                            />
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
                                    defaultValue={tour.code}
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
                                    defaultValue={tour.name}
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
                                    defaultValue={tour.description}
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
                                    defaultValue={tour.duration_days}
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
                                    defaultValue={tour.continent}
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
                                    defaultValue={tour.region}
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
                                    defaultValue={tour.country}
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
                                    defaultValue={tour.destination}
                                />
                                <InputError message={errors.destination} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="category_id">
                                    <FormattedMessage defaultMessage="Category" />
                                </Label>
                                <SelectCategory
                                    name="category_id"
                                    defaultValue={tour.category_id}
                                />

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
                                    uploadParams={{
                                        owner_type: 'company',
                                        owner_id: company.id,
                                    }}
                                    type="document"
                                    defaultValue={tour.document}
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
                                <Select
                                    name="status"
                                    defaultValue={tour.status}
                                >
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
                            <FormattedMessage defaultMessage="Update" />
                        </Button>
                    </div>
                )}
            </Form>
        </CompanyDashboardLayout>
    );
}
