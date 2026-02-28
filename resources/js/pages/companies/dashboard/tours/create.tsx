import {
  index,
  store,
} from '@/actions/App/Http/Controllers/Companies/Dashboard/TourController';
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
import { extractImageSrc } from '@/lib/utils';
import { Form, router } from '@inertiajs/react';
import SelectCategory from './components/select-category';

export default function Page() {
  const { company } = usePageSharedDataProps();
  const handleSuccess = () => {
    router.visit(index({ username: company.username }), { replace: true });
  };
  return (
    <CompanyDashboardLayout
      openMenuIds={['tours']}
      activeMenuIds={['tours.index']}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Tours', url: '/dashboard/tours' },
        { title: 'Create' },
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
              {/* Image */}
              <div className="grid gap-2">
                <Label htmlFor="name">Image</Label>
                <MediaPicker
                  params={{ owner_type: 'company', owner_id: company.id }}
                  type="image"
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Tour description"
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
              <div className="grid gap-2">
                <Label htmlFor="continent">Continent</Label>
                <Input
                  id="continent"
                  type="text"
                  name="continent"
                  placeholder="Continent"
                />
                <InputError message={errors.continent} />
              </div>

              {/* Region */}
              <div className="grid gap-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  type="text"
                  name="region"
                  placeholder="Region"
                />
                <InputError message={errors.region} />
              </div>

              {/* Country */}
              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  type="text"
                  name="country"
                  placeholder="Country"
                />
                <InputError message={errors.country} />
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
                <Label htmlFor="name">Document</Label>
                <MediaPicker
                  params={{ owner_type: 'company', owner_id: company.id }}
                  type="document"
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
    </CompanyDashboardLayout>
  );
}
