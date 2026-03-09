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
import { useState } from 'react';
import { toast } from 'sonner';
import SelectCategory from './components/select-category';
import SelectContinent from './components/select-continent';
import SelectCountry from './components/select-country';
import SelectRegion from './components/select-region';

type Props = {
  tour: any;
};
export default function Page({ tour }: Props) {
  const [continentId, setContinentId] = useState<number | null>(
    tour.continent_id ?? null,
  );
  const [regionId, setRegionId] = useState<number | null>(
    tour.region_id ?? null,
  );
  const [countryId, setCountryId] = useState<number | null>(
    tour.country_id ?? null,
  );
  const [categoryId, setCategoryId] = useState<number | null>(
    tour.category_id ?? null,
  );
  const { company } = usePageSharedDataProps();
  const handleSuccess = () => {
    toast.success('Success', {
      position: 'top-center',
      description: 'Tour data updated successfully',
    });
  };

  return (
    <CompanyDashboardLayout
      openMenuIds={['tours']}
      activeMenuIds={['tours.index']}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Tours', url: '/dashboard/tours' },
        { title: 'Edit' },
      ]}
    >
      <Form
        {...update.form({ company: company.username, tour: tour.id })}
        className="space-y-4"
        onSuccess={handleSuccess}
      >
        {({ errors, processing }) => (
          <div className="container mx-auto space-y-4 p-4">
            {/* <div className="grid gap-6"> changed for show in 2 column */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Image */}
              {/* <div className="grid gap-2"> */}
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="name">Image</Label>
                <MediaPicker
                  type="image"
                  params={{ owner_type: 'company', owner_id: company.id }}
                  uploadParams={{ owner_type: 'company', owner_id: company.id }}
                  defaultValue={tour.image}
                >
                  {(media, change) => (
                    <div className="flex flex-col items-center justify-items-center gap-2">
                      <img
                        className="aspect-video max-w-[360px] rounded object-cover shadow"
                        src={
                          typeof media === 'string'
                            ? media
                            : extractImageSrc(media as any).src
                        }
                      />
                      <input
                        type="hidden"
                        name="image_id"
                        value={(media as MediaResource)?.id}
                      />
                      <Button className="w-fit" onClick={change} type="button">
                        Change
                      </Button>
                    </div>
                  )}
                </MediaPicker>
                <InputError message={errors.media_id} />
              </div>

              {/* Code */}
              <div className="grid gap-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  type="text"
                  name="code"
                  required
                  placeholder="Tour Code"
                  defaultValue={tour.code}
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
                  defaultValue={tour.name}
                />
                <InputError message={errors.name} />
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Tour description"
                  defaultValue={tour.description}
                />
                <InputError message={errors.description} />
              </div>

              {/* Duration */}
              <div className="grid gap-2">
                <Label htmlFor="duration_days">Duration in Days</Label>
                <Input
                  id="duration_days"
                  type="number"
                  name="duration_days"
                  required
                  placeholder="Duration"
                  defaultValue={tour.duration_days}
                />
                <InputError message={errors.duration_days} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="continent_id">Continent</Label>
                <SelectContinent
                  name="continent_id"
                  value={continentId || 0}
                  onChange={(val) => {
                    setContinentId(Number(val));
                    setRegionId(null);
                    setCountryId(null);
                  }}
                />

                <InputError message={errors.continent_id} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="region_id">Region</Label>
                <SelectRegion
                  name="region_id"
                  continentId={continentId}
                  value={regionId || 0}
                  onChange={(val) => {
                    setRegionId(Number(val));
                    setCountryId(null);
                  }}
                />
                <InputError message={errors.region_id} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="country_id">Country</Label>
                <SelectCountry
                  name="country_id"
                  continentId={continentId}
                  regionId={regionId}
                  value={countryId || 0}
                  onChange={(val) => {
                    setCountryId(Number(val));
                  }}
                />

                <InputError message={errors.country_id} />
              </div>

              {/* Destination */}
              <div className="grid gap-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  type="text"
                  name="destination"
                  placeholder="Destination"
                  defaultValue={tour.destination}
                />
                <InputError message={errors.destination} />
              </div>

              {/* Category */}
              <div className="grid gap-2">
                <Label htmlFor="category_id">Category</Label>
                <SelectCategory
                  name="category_id"
                  value={categoryId ?? undefined}
                  onChange={(val) => {
                    setCategoryId(Number(val));
                  }}
                />

                <InputError message={errors.category_id} />
              </div>

              {/* Document */}
              <div className="grid gap-2">
                <Label htmlFor="name">Document</Label>
                <MediaPicker
                  type="document"
                  defaultValue={tour.document}
                  params={{ owner_type: 'company', owner_id: company.id }}
                  uploadParams={{ owner_type: 'company', owner_id: company.id }}
                >
                  {(media, change) => (
                    <Item variant="outline">
                      <ItemContent>
                        <ItemTitle>
                          {(media as any)?.name || 'No document selected'}
                        </ItemTitle>
                      </ItemContent>
                      <input
                        type="hidden"
                        name="document_id"
                        value={(media as any)?.id || undefined}
                      />
                      <ItemActions>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={change}
                          type="button"
                        >
                          Change
                        </Button>
                      </ItemActions>
                    </Item>
                  )}
                </MediaPicker>
                <InputError message={errors.document_id} />
              </div>

              {/* Status */}
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={tour.status}>
                  <SelectTrigger className="w-full max-w-48">
                    <SelectValue placeholder="Select a fruit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Select status</SelectLabel>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <InputError message={errors.status} />
              </div>
            </div>
            <Button type="submit" disabled={processing}>
              {processing && <Spinner />}Update
            </Button>
          </div>
        )}
      </Form>
    </CompanyDashboardLayout>
  );
}
