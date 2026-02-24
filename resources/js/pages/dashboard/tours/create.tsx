import { store } from '@/actions/App/Http/Controllers/DashboardTourController';
import type { MediaResource } from '@/api/model';
import InputError from '@/components/input-error';
import DashboardLayout from '@/components/layouts/dashboard-layout';
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
import { extractImageSrc } from '@/lib/utils';
import { Form, router } from '@inertiajs/react';
import SelectCategory from '../../../components/select-category';
import SelectContinent from '../../../components/select-continent';
import SelectRegion from '../../../components/select-region';
import SelectCountry from '../../../components/select-country';
import { useState } from 'react';

export default function Page() {
  const [continentId, setContinentId] = useState<number | null>(null);
  const [regionId, setRegionId] = useState<number | null>(null);
  const [countryId, setCountryId] = useState<number | null>(null);
  
  const handleSuccess = () => {
    router.visit('/dashboard/tours', { replace: true });
  };
  return (
    <DashboardLayout
      openMenuIds={['tours']}
      activeMenuIds={['tours.index']}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Tours', url: '/dashboard/tours' },
        { title: 'Create' },
      ]}
    >
      <Form {...store.form()} className="space-y-4" onSuccess={handleSuccess}>
        {({ errors, processing }) => (
          <div className="container mx-auto space-y-4 p-4">
            {/* <div className="grid gap-6"> changed for show in 2 column */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Image */}
              {/* <div className="grid gap-2"> */}
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="name">Image</Label>
                <MediaPicker type="image">
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
                />
                <InputError message={errors.name} />
              </div>

              {/* Description */}
              <div className="grid gap-2">
              {/* <div className="grid gap-2 md:col-span-2"> */}
                <Label htmlFor="description">Description</Label>
                { /*<Textarea
                  id="description"
                  name="description"
                  placeholder="Tour description"
                /> */ }
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Tour description"
                  className="min-h-[65px] resize-none"
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = el.scrollHeight + 'px';
                  }}
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
                />
                <InputError message={errors.duration_days} />
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
                <Label htmlFor="continent_id">Continent</Label>
                <SelectContinent
                  name="continent_id"
                  value={continentId ?? undefined}
                  onChange={(val) => {
                    setContinentId(Number(val));
                    setRegionId(null);
                    setCountryId(null);
                  }}
                />

                {/* SEND TO SERVER */}
                <input type="hidden" name="continent" value={continentId ?? ''} />

                <InputError message={errors.continent_id} />
              </div>

              {/* Region */}
              {/* <div className="grid gap-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  type="text"
                  name="region"
                  placeholder="Region"
                />
                <InputError message={errors.region} />
              </div> */}
              {/*<div className="grid gap-2">
                <Label htmlFor="region_id">Region</Label>
                <SelectRegion name="region_id" />

                <InputError message={errors.region_id} />
              </div> */}
              <div className="grid gap-2">
                <Label htmlFor="region_id">Region</Label>
                <SelectRegion
                  name="region_id"
                  continentId={continentId}
                  value={regionId ?? undefined}
                  onChange={(val) => {
                    setRegionId(Number(val));
                    setCountryId(null);
                  }}
                />

                {/* SEND TO SERVER */}
                <input type="hidden" name="region" value={regionId ?? ''} />

                <InputError message={errors.region_id} />
              </div>

              {/* Country */}
              {/* <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  type="text"
                  name="country"
                  placeholder="Country"
                />
                <InputError message={errors.country} />
              </div> */}
              <div className="grid gap-2">
                <Label htmlFor="country_id">Country</Label>
                <SelectCountry
                  name="country_id"
                  continentId={continentId}
                  regionId={regionId}
                  value={countryId ?? undefined}
                  onChange={(val) => setCountryId(Number(val))}
                />

                {/* SEND TO SERVER */}
                <input type="hidden" name="country" value={countryId ?? ''} />

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
                />
                <InputError message={errors.destination} />
              </div>

              {/* Category */}
              <div className="grid gap-2">
                <Label htmlFor="category_id">Category</Label>
                <SelectCategory name="category_id" />

                <InputError message={errors.category_id} />
              </div>

              {/* Document */}
              <div className="grid gap-2">
              {/* <div className="grid gap-2 md:col-span-2"> */}
                <Label htmlFor="name">Document</Label>
                <MediaPicker type="document">
                  {(media, change) => (
                    <Item variant="outline">
                      <ItemContent>
                        <ItemTitle>
                          {media?.name || 'No document selected'}
                        </ItemTitle>
                      </ItemContent>
                      <input
                        type="hidden"
                        name="document_id"
                        value={media?.id || undefined}
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
                <Select name="status" defaultValue="active">
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
              {processing && <Spinner />}Create
            </Button>
          </div>
        )}
      </Form>
    </DashboardLayout>
  );
}
