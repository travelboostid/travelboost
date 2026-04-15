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
import { router, useForm, usePage } from '@inertiajs/react'
import { useState } from 'react';
import { toast } from 'sonner';
import SelectCategory from './components/select-category';
import SelectContinent from './components/select-continent';
import SelectCountry from './components/select-country';
import SelectRegion from './components/select-region';
import SelectCurrency from './components/select-currency';

import { useEffect } from "react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

///////////tab 2
type RoomPrice = {
  room_type_id: number | null
  price: string
  promotion: Adjustment
  commission: Adjustment
}

type Adjustment = {
  type: 'percent' | 'value'
  value: string
}

type Schedule = {
  departure_date: string
  return_date: string
  quota: string
  prices: RoomPrice[]
  //promotion: Adjustment
  //commission: Adjustment
}

type PriceCategory = {
  id: number
  name: string
}

type Props = {
  tour: any;
};
export default function Page({ tour }: Props) {
  const { props } = usePage() as any // ✅ di sini

  const [activeTab, setActiveTab] = useState<'tour' | 'schedule'>('tour')

  useEffect(() => {
    if (props.flash?.tab) {
      setActiveTab(props.flash.tab)
    }
  }, [props.flash?.tab])

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

  //for price
  /*const [displayPrice, setDisplayPrice] = useState("0")
  const [rawPrice, setRawPrice] = useState("0")

  const handlePriceChange = (value: string) => {
    let numeric = value.replace(/\D/g, '');

    if (numeric === '') numeric = '0';

    setRawPrice(numeric);

    const formatted = new Intl.NumberFormat("id-ID").format(Number(numeric))
    setDisplayPrice(formatted)
  }

  useEffect(() => {
    const numeric = tour.showprice != null
      ? String(tour.showprice)
      : "0"

    setRawPrice(numeric)

    const formatted = new Intl.NumberFormat("id-ID").format(Number(numeric))
    setDisplayPrice(formatted)
  }, [tour.showprice])*/

  const [displayPrice, setDisplayPrice] = useState("")
  const [rawPrice, setRawPrice] = useState("")

  const handlePriceChange = (value: string) => {
    const numeric = value.replace(/\D/g, "")
    setRawPrice(numeric)
    setData('showprice', numeric)

    const formatted = new Intl.NumberFormat("id-ID").format(Number(numeric))
    setDisplayPrice(formatted)
  }

  useEffect(() => {
    const numeric = tour.showprice != null
      ? String(tour.showprice)
      : "0"

    setRawPrice(numeric)

    const formatted = new Intl.NumberFormat("id-ID").format(Number(numeric))
    setDisplayPrice(formatted)

    // 🔥 WAJIB
    setData('showprice', numeric)
  }, [tour.showprice])
  //

  //for price
  /*const [displayPrice1, setDisplayPrice1] = useState("0")
  const [rawPrice1, setRawPrice1] = useState("0")

  const handlePriceChange1 = (value: string) => {
    let numeric1 = value.replace(/\D/g, '');

    if (numeric1 === '') numeric1 = '0';

    setRawPrice1(numeric1);

    const formatted1 = new Intl.NumberFormat("id-ID").format(Number(numeric1))
    setDisplayPrice1(formatted1)
  }

  useEffect(() => {
    const numeric = tour.promote_price
      ? String(tour.promote_price)
      : "0"

    setRawPrice1(numeric)

    const formatted = new Intl.NumberFormat("id-ID").format(Number(numeric))
    setDisplayPrice1(formatted)
  }, [tour.promote_price])*/

  const [displayPrice1, setDisplayPrice1] = useState("0")
  const [rawPrice1, setRawPrice1] = useState("0")

  const handlePriceChange1 = (value: string) => {
    let numeric1 = value.replace(/\D/g, "")

    if (numeric1 === "") numeric1 = "0" // 🔥 default 0

    setRawPrice1(numeric1)
    setData('promote_price', numeric1)

    const formatted1 = new Intl.NumberFormat("id-ID").format(Number(numeric1))
    setDisplayPrice1(formatted1)
  }

  useEffect(() => {
    const numeric = tour.promote_price != null
      ? String(tour.promote_price)
      : "0"

    setRawPrice1(numeric)

    const formatted = new Intl.NumberFormat("id-ID").format(Number(numeric))
    setDisplayPrice1(formatted)

    // 🔥 WAJIB
    setData('promote_price', numeric)
  }, [tour.promote_price])
  //

  const { data, setData, put, processing, errors } = useForm({
    name: tour.name || '',
    description: tour.description || '',
    code: tour.code || '',
    destination: tour.destination || '',
    duration_days: tour.duration_days || '',

    showprice: rawPrice,
    promote_price: rawPrice1,
    promote_title: tour.promote_title || '',
    promote_note: tour.promote_note || '',

    continent_id: tour.continent_id || '',
    region_id: tour.region_id || '',
    country_id: tour.country_id || '',
    category_id: tour.category_id || '',
    status: tour.status || 'inactive',

    image_id: tour.image?.id || '',
    document_id: tour.document?.id || '',

    currency: tour.currency || 'IDR',

    schedules: [], // nanti inject
  })

  const { priceCategories } = usePage<{
      priceCategories: PriceCategory[]
    }>().props

  const [schedules, setSchedules] = useState<Schedule[]>(
    (tour.schedules || []).map((s: any) => ({
      departure_date: s.departure_date ?? '',
      return_date: s.return_date ?? '',
      quota: String(s.quota ?? ''),
      prices: (s.prices || []).map((p: any) => ({
        room_type_id: p.room_type_id,
        price: String(p.price ?? ''),
        promotion: {
          type: p.promotion_type ?? 'percent',
          value: String(p.promotion_value ?? ''),
        },
        commission: {
          type: p.commission_type ?? 'percent',
          value: String(p.commission_value ?? ''),
        },
      })),
    }))
  )
    const addSchedule = () => {
      setSchedules([
        ...schedules,
        {
          departure_date: '',
          return_date: '',
          quota: '',
          prices: [
            {
              room_type_id: null,
              price: '',
              promotion: { type: 'percent', value: '' },
              commission: { type: 'percent', value: '' },
            }
          ],
          //promotion: { type: 'percent', value: '' },
          //commission: { type: 'percent', value: '' },
        }
      ])
    }
  
    const updateSchedule = (
      index: number,
      field: keyof Schedule,
      value: string
    ) => {
      const updated = [...schedules]
      updated[index][field] = value as any
      setSchedules(updated)
    }
  
    const removeSchedule = (index: number) => {
      const updated = schedules.filter((_, i) => i !== index)
      setSchedules(updated)
    }
  
  const addRoom = (index: number) => {
    setSchedules((prev) =>
      prev.map((schedule, i) => {
        if (i !== index) return schedule
  
        return {
          ...schedule,
          prices: [
            ...schedule.prices,
            {
              room_type_id: null,
              price: '',
              promotion: {
                type: 'percent',
                value: '',
              },
              commission: {
                type: 'percent',
                value: '',
              },
            },
          ],
        }
      })
    )
  }
  
  const updateRoom = (
    scheduleIndex: number,
    roomIndex: number,
    field: string,
    value: any
  ) => {
    setSchedules((prev) =>
      prev.map((schedule, i) => {
        if (i !== scheduleIndex) return schedule
  
        return {
          ...schedule,
          prices: schedule.prices.map((room, r) => {
            if (r !== roomIndex) return room
  
            return {
              ...room,
              [field]: value,
            }
          }),
        }
      })
    )
  }
  
  const removeRoom = (scheduleIndex: number, roomIndex: number) => {
    const updated = [...schedules]
    updated[scheduleIndex].prices = updated[scheduleIndex].prices.filter(
      (_, i) => i !== roomIndex
    )
    setSchedules(updated)
  }
  
  const updateAdjustment = (
    index: number,
    field: 'promotion' | 'commission',
    key: 'type' | 'value',
    value: string
  ) => {
    const updated = [...schedules]
    updated[index][field][key] = value as any
    setSchedules(updated)
  }
  
  const updateRoomAdjustment = (
    scheduleIndex: number,
    roomIndex: number,
    field: 'promotion' | 'commission',
    key: 'type' | 'value',
    value: string
  ) => {
    const updated = [...schedules]
    updated[scheduleIndex].prices[roomIndex][field][key] = value as any
    setSchedules(updated)
  }

  return (
    <CompanyDashboardLayout
      openMenuIds={['tours']}
      activeMenuIds={['tours.index']}
      breadcrumb={[
        { title: 'Tours', url: '/dashboard/tours' },
        { title: 'Edit' },
      ]}
    >
      {/* <Form
        {...update.form({ company: company.username, tour: tour.id })}
        className="space-y-4"
        onSuccess={handleSuccess}
      > */}
      <form
        onSubmit={(e) => {
          e.preventDefault()

          /*console.log('SEND DATA:', {
            ...data,
            schedules
          })*/

          // 🔥 update state dulu
          setData((prev) => ({
            ...prev,
            showprice: Number(rawPrice),
            promote_price: Number(rawPrice1),
            schedules: schedules, // ✅ langsung object (JANGAN stringify)
          }))

          // 🔥 kirim TANPA data:
          put(update.url({
            company: company.username,
            tour: tour.id
          }), {
            onSuccess: () => {
              handleSuccess()
              setActiveTab('schedule')
            },
          })
        }}
      >
          <div className="container mx-auto space-y-4 p-4">
            {/*<Tabs defaultValue="tour" className="w-full" key="tour-form">*/}
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
              <TabsList className="mb-4">
                <TabsTrigger value="tour">Master</TabsTrigger>
                <TabsTrigger value="schedule">Schedule and Price</TabsTrigger>
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
                        defaultValue={tour.image} 
                        params={{ owner_type: 'company', owner_id: company.id }}
                        uploadParams={{ owner_type: 'company', owner_id: company.id }}
                      >
                        {(media, change) => {
                          const mediaId = (media as MediaResource)?.id
                  
                          // 🔥 sync ke inertia
                          if (mediaId && data.image_id !== mediaId) {
                            setData('image_id', mediaId)
                          }
                  
                          return (
                            <div className="flex flex-col items-center gap-2">
                              <img
                                className="aspect-video max-w-[360px] rounded object-cover shadow"
                                src={
                                  typeof media === 'string'
                                  ? media
                                  : extractImageSrc(media as any).src
                                }
                              />
                  
                              <Button type="button" onClick={change}>
                                Change
                              </Button>
                            </div>
                          )
                        }}
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
                      //defaultValue={tour.code}
                      value={data.code}
                      onChange={(e) => setData('code', e.target.value)}
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
                      //defaultValue={tour.name}
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
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
                      //defaultValue={tour.description}
                      className="min-h-[65px] resize-none"
                      onInput={(e) => {
                        const el = e.currentTarget;
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      }}
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
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
                      //defaultValue={tour.duration_days}
                      value={data.duration_days}
                      onChange={(e) => setData('duration_days', e.target.value)}
                    />
                    <InputError message={errors.duration_days} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="continent_id">Continent</Label>
                    <SelectContinent
                      name="continent_id"
                      value={continentId ?? undefined}
                      onChange={(val) => {
                        /*setContinentId(Number(val));
                        setRegionId(null);
                        setCountryId(null);*/
                        const id = Number(val)

                        setContinentId(id)
                        setRegionId(null)
                        setCountryId(null)

                        setData('continent_id', id) // ✅ WAJIB
                        setData('region_id', '')    // reset
                        setData('country_id', '')
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
                        /*setRegionId(Number(val));
                        setCountryId(null);*/
                        const id = Number(val)

                        setRegionId(id)
                        setCountryId(null)

                        setData('region_id', id) // ✅
                        setData('country_id', '') // reset
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
                      onChange={(val) => {
                        //setCountryId(Number(val));
                        const id = Number(val)

                        setCountryId(id)
                        setData('country_id', id) // ✅
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
                      //defaultValue={tour.destination}
                      value={data.destination}
                      onChange={(e) => setData('destination', e.target.value)}
                    />
                    <InputError message={errors.destination} />
                  </div>

                  {/* Category */}
                  <div className="grid gap-2">
                    <Label htmlFor="category_id">Category</Label>
                    <SelectCategory
                      name="category_id"
                      //value={categoryId ?? undefined}
                      /*onChange={(val) => {
                        setCategoryId(Number(val));
                      }}*/
                     value={data.category_id || undefined} 
                     onChange={(val) => setData('category_id', Number(val))}
                    />

                    <InputError message={errors.category_id} />
                  </div>

                  {/* Document */}
                  <div className="grid gap-2">
                      {/* <div className="grid gap-2 md:col-span-2"> */}
                      <Label htmlFor="name">Document Itinerary</Label>
                      <MediaPicker
                        type="document"
                        defaultValue={tour.document}
                        params={{ owner_type: 'company', owner_id: company.id }}
                        uploadParams={{ owner_type: 'company', owner_id: company.id }}
                      >
                        {(media, change) => {
                          const mediaId = (media as any)?.id
                          const url = (media as any)?.url || (media as any)?.data?.url
                  
                          // 🔥 sync ke inertia
                          if (mediaId && data.document_id !== mediaId) {
                            setData('document_id', mediaId)
                          }
                  
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
                  

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Status */}
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select name="status"
                      //</div>defaultValue={tour.status}
                      value={data.status}
                      onValueChange={(val) => setData('status', val)}
                      >
                        <SelectTrigger className="w-full max-w-48">
                          <SelectValue placeholder="Select status" />
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

                    {/* CURRENCY */}
                    <div className="grid gap-2">
                      <Label>Currency</Label>
                    
                      <SelectCurrency
                        value={data.currency}
                        onChange={(val) => setData('currency', val)}
                      />
                    
                    </div>
                  </div>
                  

                  {/* Normal Price show on catalog */}
                  <div className="grid gap-2">
                    <Label htmlFor="showprice">Normal Price show on catalog</Label>
                    <Input
                      id="showprice_display"
                      type="text"
                      placeholder="Normal Price"
                      value={displayPrice}
                      onChange={(e) => handlePriceChange(e.target.value)}
                    />
                    <input
                      type="hidden"
                      name="showprice"
                      value={rawPrice}
                    />
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
                            //defaultValue={tour.promote_title}
                            value={data.promote_title}
                            onChange={(e) => setData('promote_title', e.target.value)}
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
                            //defaultValue={tour.promote_note}
                            value={data.promote_note}
                            onChange={(e) => setData('promote_note', e.target.value)}
                          />
                          <InputError message={errors.promote_note} />
                        </div>
                  
                      </div>
                  </div>
                </div>
                <div className="flex justify-start pt-6 border-t">
                  <Button type="submit" disabled={processing}>
                    {processing && <Spinner />}
                    Save & Continue
                  </Button>
                </div>
              </TabsContent>
              
              {/* ================= TAB 2 — JADWAL ================= */}

              <TabsContent value="schedule">
                <div className="space-y-4">
                
                                  {/* HEADER */}
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Tour Schedule and Price</h3>
                
                                    <Button type="button" onClick={addSchedule}>
                                      + Add New Schedule
                                    </Button>
                                  </div>
                
                                  {/* DESKTOP TABLE */}
                                  <div className="rounded-lg border overflow-hidden hidden md:block">
                                    <table className="w-full text-sm">
                                      
                                      {/* ================= HEADER ================= */}
                                      <thead className="bg-muted">
                                        <tr>
                                          <th className="p-3 text-left" rowSpan={2}>Departure</th>
                                          <th className="p-3 text-left" rowSpan={2}>Return</th>
                
                                          <th className="p-3 text-center" colSpan={4}>
                                            Prices
                                          </th>
                
                                          <th className="p-3 text-left" rowSpan={2}>Action</th>
                                        </tr>
                
                                        <tr className="text-xs text-muted-foreground">
                                          <th className="p-2">Category</th>
                                          <th className="p-2">Price</th>
                                          <th className="p-2">Promotion</th>
                                          <th className="p-2">Commission</th>
                                        </tr>
                                      </thead>
                
                                      {/* ================= BODY ================= */}
                                      <tbody>
                                        {schedules.map((item, index) => (
                                          <tr key={index} className="align-top border-t">
                
                                            {/* DATE */}
                                            <td className="p-2">
                                              <Input
                                                type="date"
                                                value={item.departure_date}
                                                onChange={(e) =>
                                                  updateSchedule(index, 'departure_date', e.target.value)
                                                }
                                              />
                                            </td>
                
                                            <td className="p-2">
                                              <Input
                                                type="date"
                                                value={item.return_date}
                                                onChange={(e) =>
                                                  updateSchedule(index, 'return_date', e.target.value)
                                                }
                                              />
                                            </td>
                
                                            {/* PRICES */}
                                            <td colSpan={4} className="p-2">
                                              <div className="space-y-3">
                
                                                {item.prices.map((room, rIndex) => (
                                                  <div
                                                    key={rIndex}
                                                    className="grid grid-cols-4 gap-2 items-start p-2 border rounded-md"
                                                  >
                
                                                    {/* ROOM */}
                                                    <select
                                                      className="border rounded px-2 h-9 text-sm w-full"
                                                      value={room.room_type_id ?? ''}
                                                      onChange={(e) =>
                                                        updateRoom(index, rIndex, 'room_type_id', Number(e.target.value))
                                                      }
                                                    >
                                                      <option value="">Select Category</option>
                
                                                      {priceCategories.map((cat) => (
                                                        <option key={cat.id} value={cat.id}>
                                                          {cat.name}
                                                        </option>
                                                      ))}
                                                    </select>
                
                                                    {/* PRICE */}
                                                    <Input
                                                      type="number"
                                                      className="no-spinner"
                                                      placeholder="Price"
                                                      value={room.price}
                                                      onChange={(e) =>
                                                        updateRoom(index, rIndex, 'price', e.target.value)
                                                      }
                                                    />
                
                                                    {/* PROMOTION */}
                                                    <div className="grid grid-cols-2 gap-2">
                
                                                      {/* PERCENT */}
                                                      <Input
                                                        type="number"
                                                        className="no-spinner"
                                                        placeholder="%"
                                                        value={room.promotion.type === 'percent' ? room.promotion.value : ''}
                                                        disabled={room.promotion.type === 'value' && room.promotion.value !== ''}
                                                        onChange={(e) => {
                                                          const val = e.target.value
                
                                                          updateRoomAdjustment(index, rIndex, 'promotion', 'type', 'percent')
                                                          updateRoomAdjustment(index, rIndex, 'promotion', 'value', val)
                                                        }}
                                                      />
                
                                                      {/* VALUE */}
                                                      <Input
                                                        type="number"
                                                        className="no-spinner"
                                                        placeholder="Value"
                                                        value={room.promotion.type === 'value' ? room.promotion.value : ''}
                                                        disabled={room.promotion.type === 'percent' && room.promotion.value !== ''}
                                                        onChange={(e) => {
                                                          const val = e.target.value
                
                                                          updateRoomAdjustment(index, rIndex, 'promotion', 'type', 'value')
                                                          updateRoomAdjustment(index, rIndex, 'promotion', 'value', val)
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
                                                        value={room.commission.type === 'percent' ? room.commission.value : ''}
                                                        disabled={room.commission.type === 'value' && room.commission.value !== ''}
                                                        onChange={(e) => {
                                                          const val = e.target.value
                
                                                          updateRoomAdjustment(index, rIndex, 'commission', 'type', 'percent')
                                                          updateRoomAdjustment(index, rIndex, 'commission', 'value', val)
                                                        }}
                                                      />
                
                                                      {/* VALUE */}
                                                      <Input
                                                        type="number"
                                                        className="no-spinner"
                                                        placeholder="Value"
                                                        value={room.commission.type === 'value' ? room.commission.value : ''}
                                                        disabled={room.commission.type === 'percent' && room.commission.value !== ''}
                                                        onChange={(e) => {
                                                          const val = e.target.value
                
                                                          updateRoomAdjustment(index, rIndex, 'commission', 'type', 'value')
                                                          updateRoomAdjustment(index, rIndex, 'commission', 'value', val)
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
                                                        onClick={() => removeRoom(index, rIndex)}
                                                      >
                                                        Delete Category
                                                      </Button>
                                                    </div>
                
                                                  </div>
                                                ))}
                
                                                {/* ADD ROOM */}
                                                <div>
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => addRoom(index)}
                                                  >
                                                    + Add Category
                                                  </Button>
                                                </div>
                
                                              </div>
                                            </td>
                
                                            {/* ACTION */}
                                            <td className="p-2">
                                              <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={() => removeSchedule(index)}
                                              >
                                                Delete Schedule
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
                                      <div key={index} className="border rounded-lg p-3 space-y-3">
                
                                        {/* HEADER */}
                                        <div className="flex justify-between items-center">
                                          <p className="font-medium text-sm">
                                            Schedule #{index + 1}
                                          </p>
                
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => removeSchedule(index)}
                                          >
                                            Delete
                                          </Button>
                                        </div>
                
                                        {/* DATES */}
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <p className="text-xs text-muted-foreground">Departure</p>
                                            <Input
                                              type="date"
                                              value={item.departure_date}
                                              onChange={(e) =>
                                                updateSchedule(index, 'departure_date', e.target.value)
                                              }
                                            />
                                          </div>
                
                                          <div>
                                            <p className="text-xs text-muted-foreground">Return</p>
                                            <Input
                                              type="date"
                                              value={item.return_date}
                                              onChange={(e) =>
                                                updateSchedule(index, 'return_date', e.target.value)
                                              }
                                            />
                                          </div>
                                        </div>
                
                                        {/* ROOMS */}
                                        <div className="space-y-3">
                                          {item.prices.map((room, rIndex) => (
                                            <div
                                              key={rIndex}
                                              className="border rounded-md p-3 space-y-2"
                                            >
                
                                              {/* ROOM HEADER */}
                                              <div className="flex justify-between items-center">
                                                <p className="text-xs font-medium text-muted-foreground">
                                                  Room #{rIndex + 1}
                                                </p>
                
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="ghost"
                                                  className="text-red-500"
                                                  onClick={() => removeRoom(index, rIndex)}
                                                >
                                                  Delete Room
                                                </Button>
                                              </div>
                
                                              {/* ROOM TYPE */}
                                              <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">Category</p>
                
                                                <select
                                                  className="w-full border rounded-md px-3 h-10 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                                  value={room.room_type_id ?? ''}
                                                  onChange={(e) =>
                                                    updateRoom(index, rIndex, 'room_type_id', Number(e.target.value))
                                                  }
                                                >
                                                  <option value="">Select Category</option>
                
                                                  {priceCategories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                      {cat.name}
                                                    </option>
                                                  ))}
                                                </select>
                                              </div>
                
                                              {/* PRICE */}
                                              <div>
                                                <p className="text-xs text-muted-foreground">Price</p>
                                                <Input
                                                  type="number"
                                                  placeholder="Price"
                                                  value={room.price}
                                                  onChange={(e) =>
                                                    updateRoom(index, rIndex, 'price', e.target.value)
                                                  }
                                                />
                                              </div>
                
                                              {/* PROMOTION */}
                                              <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">Promotion</p>
                
                                                <div className="grid grid-cols-2 gap-2">
                                                  {/* % */}
                                                  <Input
                                                    type="number"
                                                    className="no-spinner"
                                                    placeholder="%"
                                                    value={room.promotion.type === 'percent' ? room.promotion.value : ''}
                                                    disabled={room.promotion.type === 'value' && room.promotion.value !== ''}
                                                    onChange={(e) => {
                                                      const val = e.target.value
                
                                                      updateRoomAdjustment(index, rIndex, 'promotion', 'type', 'percent')
                                                      updateRoomAdjustment(index, rIndex, 'promotion', 'value', val)
                                                    }}
                                                  />
                
                                                  {/* VALUE */}
                                                  <Input
                                                    type="number"
                                                    className="no-spinner"
                                                    placeholder="Value"
                                                    value={room.promotion.type === 'value' ? room.promotion.value : ''}
                                                    disabled={room.promotion.type === 'percent' && room.promotion.value !== ''}
                                                    onChange={(e) => {
                                                      const val = e.target.value
                
                                                      updateRoomAdjustment(index, rIndex, 'promotion', 'type', 'value')
                                                      updateRoomAdjustment(index, rIndex, 'promotion', 'value', val)
                                                    }}
                                                  />
                                                </div>
                                              </div>
                
                                              {/* COMMISSION */}
                                              <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground">Commission</p>
                
                                                <div className="grid grid-cols-2 gap-2">
                                                  {/* % */}
                                                  <Input
                                                    type="number"
                                                    className="no-spinner"
                                                    placeholder="%"
                                                    value={room.commission.type === 'percent' ? room.commission.value : ''}
                                                    disabled={room.commission.type === 'value' && room.commission.value !== ''}
                                                    onChange={(e) => {
                                                      const val = e.target.value
                
                                                      updateRoomAdjustment(index, rIndex, 'commission', 'type', 'percent')
                                                      updateRoomAdjustment(index, rIndex, 'commission', 'value', val)
                                                    }}
                                                  />
                
                                                  {/* VALUE */}
                                                  <Input
                                                    type="number"
                                                    className="no-spinner"
                                                    placeholder="Value"
                                                    value={room.commission.type === 'value' ? room.commission.value : ''}
                                                    disabled={room.commission.type === 'percent' && room.commission.value !== ''}
                                                    onChange={(e) => {
                                                      const val = e.target.value
                
                                                      updateRoomAdjustment(index, rIndex, 'commission', 'type', 'value')
                                                      updateRoomAdjustment(index, rIndex, 'commission', 'value', val)
                                                    }}
                                                  />
                                                </div>
                                              </div>
                
                                            </div>
                                          ))}
                
                                          {/* ADD ROOM */}
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => addRoom(index)}
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
                                      disabled={processing || schedules.length === 0}
                                    >
                                      Save Schedule
                                    </Button>
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
