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
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { extractImageSrc } from '@/lib/utils';
import { Form, router } from '@inertiajs/react';
import { useState } from 'react';
import SelectCategory from './components/select-category';
import SelectContinent from './components/select-continent';
import SelectCountry from './components/select-country';
import SelectRegion from './components/select-region';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function Page() {
  const [continentId, setContinentId] = useState<number | null>(null);
  const [regionId, setRegionId] = useState<number | null>(null);
  const [countryId, setCountryId] = useState<number | null>(null);
  const { company } = usePageSharedDataProps();
  const handleSuccess = () => {
    router.visit(index({ username: company.username }), { replace: true });
  };

  //for price
  const [displayPrice, setDisplayPrice] = useState("")
  const [rawPrice, setRawPrice] = useState("")

  const handlePriceChange = (value: string) => {
    const numeric = value.replace(/\D/g, "")
    setRawPrice(numeric)

    const formatted = new Intl.NumberFormat("id-ID").format(Number(numeric))
    setDisplayPrice(formatted)
  }
  //

  //for price
  const [displayPrice1, setDisplayPrice1] = useState("0")
  const [rawPrice1, setRawPrice1] = useState("0")

  const handlePriceChange1 = (value: string) => {
    let numeric1 = value.replace(/\D/g, "")

    if (numeric1 === "") numeric1 = "0" // 🔥 default 0

    setRawPrice1(numeric1)

    const formatted1 = new Intl.NumberFormat("id-ID").format(Number(numeric1))
    setDisplayPrice1(formatted1)
  }
  //

  //27032026
  const [schedules, setSchedules] = useState<any[]>([])

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
        {...store.form({ company: company.username })}
        className="space-y-4"
        onSuccess={handleSuccess}
      >
        {({ errors, processing }) => (
          <div className="container mx-auto space-y-4 p-4">
            
            <Tabs defaultValue="tour" className="w-full">

              <TabsList className="mb-4">
                <TabsTrigger value="tour">Tour</TabsTrigger>
                <TabsTrigger value="schedule">Jadwal</TabsTrigger>
              </TabsList>

              {/* ================= TAB 1 — TOUR ================= */}
              <TabsContent value="tour">

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
                    {/* <div className="grid gap-2 md:col-span-2"> */}
                    <Label htmlFor="description">Description</Label>
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
                    <InputError message={errors.continent_id} />
                  </div>

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
                    <InputError message={errors.region_id} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="country_id">Country</Label>
                    <SelectCountry
                      name="country_id"
                      continentId={continentId}
                      regionId={regionId}
                      value={countryId ?? undefined}
                      onChange={(val) => setCountryId(Number(val))}
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
                    <Label htmlFor="name">Document Itinerary</Label>
                    <MediaPicker
                      type="document"
                      params={{ owner_type: 'company', owner_id: company.id }}
                      uploadParams={{ owner_type: 'company', owner_id: company.id }}
                    >
                      {(media, change) => {
                        const url =
                          (media as any)?.url ||
                          (media as any)?.data?.url

                        return (
                          <Item variant="outline" className="space-y-2">
                            <ItemContent className="space-y-2">

                              {url ? (
                                <iframe
                                  src={window.location.origin + url}
                                  className="w-full h-56 rounded border"
                                  title="PDF Preview"
                                />
                              ) : (
                                <ItemTitle>No document selected</ItemTitle>
                              )}

                              <ItemTitle>
                                {(media as any)?.name || ''}
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
                        )
                      }}
                    </MediaPicker>
                    <InputError message={errors.document_id} />
                  </div>

                  {/* Status */}
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status at Catalog</Label>
                    {/* <Select name="status" defaultValue="active"> */}
                    <Select name="status" defaultValue="inactive">
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

                  {/* Normal Price show on catalog */}
                  <div className="grid gap-2">
                    <Label htmlFor="showprice">Normal Price show on catalog</Label>
                    <Input
                      id="showprice"
                      type="text"
                      required
                      placeholder="Normal Price"
                      value={displayPrice}
                      onChange={(e) => handlePriceChange(e.target.value)}
                    />

                    <input type="hidden" name="showprice" value={rawPrice} />
                    <InputError message={errors.showprice} />
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-4 space-y-4">

                    <div className="text-sm font-semibold text-muted-foreground">
                      Promotion Settings
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* promote title */}
                      <div className="grid gap-2">
                        <Label htmlFor="promote_title">Title Promotion on Catalog</Label>
                        <Input
                          id="promote_title"
                          type="text"
                          name="promote_title"
                          placeholder="Title Promotion"
                        />
                        <InputError message={errors.promote_title} />
                      </div>

                      {/* Promote Price */}
                      <div className="grid gap-2">
                        <Label htmlFor="promote_price">Promotion Price show on catalog</Label>
                        <Input
                          id="promote_price"
                          type="text"
                          placeholder="Promotion Price"
                          value={displayPrice1}
                          onChange={(e) => handlePriceChange1(e.target.value)}
                        />
                        <input type="hidden" name="promote_price" value={rawPrice1} />
                        <InputError message={errors.promote_price} />
                      </div>

                      {/* promote note — full width */}
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="promote_note">Promotion Note on Catalog</Label>
                        <Input
                          id="promote_note"
                          type="text"
                          name="promote_note"
                          placeholder="Promotion Note"
                        />
                        <InputError message={errors.promote_note} />
                      </div>

                    </div>
                  </div>

                </div>

              </TabsContent>

              {/* ================= TAB 2 — JADWAL ================= */}
              <TabsContent value="schedule">

                <div className="space-y-4">

                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Tour Schedule
                    </h3>

                    <Button
                      type="button"
                      onClick={() =>
                        setSchedules([
                          ...schedules,
                          {
                            departure_date: "",
                            return_date: "",
                            quota: "",
                            price: "",
                          },
                        ])
                      }
                    >
                      + Add New Schedule
                    </Button>
                  </div>

                  {/* Grid */}
                  <div className="rounded-lg border overflow-hidden">

                    <table className="w-full text-sm">

                      <thead className="bg-muted">
                        <tr>
                          <th className="p-2 text-left">Departure</th>
                          <th className="p-2 text-left">Return</th>
                          <th className="p-2 text-left">Quota</th>
                          <th className="p-2 text-left">Price</th>
                          <th className="p-2 text-left">Action</th>
                        </tr>
                      </thead>

                      <tbody>

                        {schedules.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-muted-foreground">
                              No schedules yet
                            </td>
                          </tr>
                        )}

                        {schedules.map((s, i) => (
                          <tr key={i} className="border-t">

  <td className="p-2">
    <Input
      type="date"
      value={s.departure_date}
      onChange={(e) => {
        const copy = [...schedules]
        copy[i].departure_date = e.target.value
        setSchedules(copy)
      }}
    />
    <input
      type="hidden"
      name={`schedules[${i}][departure_date]`}
      value={s.departure_date}
    />
  </td>

  <td className="p-2">
    <Input
      type="date"
      value={s.return_date}
      onChange={(e) => {
        const copy = [...schedules]
        copy[i].return_date = e.target.value
        setSchedules(copy)
      }}
    />
    <input
      type="hidden"
      name={`schedules[${i}][return_date]`}
      value={s.return_date}
    />
  </td>

  <td className="p-2">
    <Input
      type="number"
      value={s.quota}
      onChange={(e) => {
        const copy = [...schedules]
        copy[i].quota = e.target.value
        setSchedules(copy)
      }}
    />
    <input
      type="hidden"
      name={`schedules[${i}][quota]`}
      value={s.quota}
    />
  </td>

  <td className="p-2">
    <Input
      type="number"
      value={s.price}
      onChange={(e) => {
        const copy = [...schedules]
        copy[i].price = e.target.value
        setSchedules(copy)
      }}
    />
    <input
      type="hidden"
      name={`schedules[${i}][price]`}
      value={s.price}
    />
  </td>

  <td className="p-2">
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={() =>
        setSchedules(schedules.filter((_, idx) => idx !== i))
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

                </div>

              </TabsContent>

            </Tabs>

            <Button type="submit" disabled={processing}>
              {processing && <Spinner />}Create
            </Button>
          </div>
        )}
      </Form>
    </CompanyDashboardLayout>
  );
}
