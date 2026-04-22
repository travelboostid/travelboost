import InputError from '@/components/input-error';
import { MediaPicker } from '@/components/media-picker';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { extractImageSrc } from '@/lib/utils';
import { createCompany } from '@/routes/me/onboarding';
import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';
import { Camera, ImagePlus, User as UserIcon } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface Props {
  affiliate?: {
    id: number;
    name: string;
    username: string;
  };
}

export default function RegisterAgentAccount({ affiliate }: Props) {
  const { auth } = usePageSharedDataProps();

  const idInputRef = useRef<HTMLInputElement>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  const form = useForm({
    name: '',
    email: auth.user.email,
    username: auth.user.username,
    phone: (auth.user.phone || '') as string,
    customer_service_phone: '',
    address: '',
    province: '',
    city: '',
    district: '',
    village: '',
    postal_code: '',
    subdomain: auth.user.username,
    photo_id: undefined,
    identity_number: '',
    identity_photo: null as File | null,
  });

  useEffect(() => {
    axios.get('/api/regions/provinces').then((res) => setProvinces(res.data));
  }, []);

  useEffect(() => {
    const p = provinces.find((x) => x.name === form.data.province);
    if (p) {
      axios
        .get(`/api/regions/cities/${p.code}`)
        .then((res) => setCities(res.data));
    } else {
      setCities([]);
    }
  }, [form.data.province, provinces]);

  useEffect(() => {
    const c = cities.find((x) => x.name === form.data.city);
    if (c) {
      axios
        .get(`/api/regions/districts/${c.code}`)
        .then((res) => setDistricts(res.data));
    } else {
      setDistricts([]);
    }
  }, [form.data.city, cities]);

  useEffect(() => {
    const d = districts.find((x) => x.name === form.data.district);
    if (d) {
      axios
        .get(`/api/regions/villages/${d.code}`)
        .then((res) => setVillages(res.data));
    } else {
      setVillages([]);
    }
  }, [form.data.district, districts]);

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setData('identity_photo', file);
      const reader = new FileReader();
      reader.onload = (e) => setIdPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post(createCompany().url, {
      preserveScroll: true,
      onSuccess: () => {
        form.reset();
      },
    });
  };

  return (
    <>
      <Head title="Register an agent account" />
      <div className="max-w-4xl mx-auto space-y-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Register Agent Account
          </h1>
          <p className="text-muted-foreground">
            Complete your company profile to start managing bookings and
            customers.
          </p>
        </div>

        {affiliate && (
          <div className="rounded-xl border bg-emerald-50 text-card-foreground shadow-sm p-5 grid gap-1 border-emerald-200">
            <Label className="text-sm font-semibold text-emerald-800">
              Invited By:
            </Label>
            <div className="text-[1.1rem] font-bold text-[#208066] dark:text-[#2ba384]">
              {affiliate.name}
            </div>
            <Input
              type="text"
              defaultValue={affiliate.username}
              readOnly
              className="bg-emerald-100/50 cursor-not-allowed mt-2 border-emerald-200 font-medium"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" /> Company Information
              </CardTitle>
              <CardDescription>
                Provide your core business details and branding.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <MediaPicker
                  params={{ owner_type: 'user', owner_id: auth.user.id }}
                  uploadParams={{
                    owner_type: 'user',
                    owner_id: auth.user.id,
                  }}
                  type="photo"
                  onChange={(media) =>
                    form.setData('photo_id', (media as any)?.id)
                  }
                >
                  {(media, change) => (
                    <div className="flex flex-col items-center gap-3 shrink-0 mx-auto md:mx-0">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-4 border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center shadow-sm">
                          {media ? (
                            <img
                              className="w-full h-full object-cover"
                              src={
                                typeof media === 'string'
                                  ? media
                                  : extractImageSrc(media as any).src
                              }
                            />
                          ) : (
                            <ImagePlus className="w-12 h-12 text-slate-300" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={change}
                          className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors"
                        >
                          <Camera className="w-5 h-5" />
                        </button>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        Company Logo
                      </span>
                    </div>
                  )}
                </MediaPicker>

                <div className="flex-1 grid gap-4 md:grid-cols-2 w-full">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Account Owner Name</Label>
                    <Input
                      type="text"
                      value={auth.user.name}
                      readOnly
                      className="bg-slate-50 cursor-not-allowed font-medium text-muted-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      required
                      autoFocus
                      name="name"
                      placeholder="Professional Travel Agency"
                      value={form.data.name}
                      onChange={(e) => form.setData('name', e.target.value)}
                    />
                    <InputError message={form.errors.name} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Company Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      name="email"
                      placeholder="email@example.com"
                      value={form.data.email}
                      onChange={(e) => form.setData('email', e.target.value)}
                    />
                    <InputError message={form.errors.email} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Company Username *</Label>
                    <Input
                      id="username"
                      type="text"
                      required
                      name="username"
                      placeholder="Username"
                      value={form.data.username}
                      onChange={(e) => {
                        if (form.data.subdomain === form.data.username) {
                          form.setData('subdomain', e.target.value);
                        }
                        form.setData('username', e.target.value);
                      }}
                    />
                    <InputError message={form.errors.username} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Subdomain *</Label>
                    <InputGroup>
                      <InputGroupInput
                        id="subdomain"
                        type="text"
                        required
                        name="subdomain"
                        placeholder="example"
                        value={form.data.subdomain}
                        onChange={(e) =>
                          form.setData('subdomain', e.target.value)
                        }
                      />
                      <InputGroupAddon align="inline-end">
                        .{import.meta.env.VITE_APP_HOST}
                        {import.meta.env.VITE_APP_PORT
                          ? `:${import.meta.env.VITE_APP_PORT}`
                          : ''}
                      </InputGroupAddon>
                    </InputGroup>
                    <InputError message={form.errors.subdomain} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Contact & Address</CardTitle>
              <CardDescription>
                Where can customers reach your agency?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Company Phone *</Label>
                  <Input
                    id="phone"
                    type="text"
                    required
                    name="phone"
                    placeholder="Phone number"
                    value={form.data.phone}
                    onChange={(e) => form.setData('phone', e.target.value)}
                  />
                  <InputError message={form.errors.phone} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_service_phone">
                    Customer Service Phone *
                  </Label>
                  <Input
                    id="customer_service_phone"
                    type="text"
                    required
                    name="customer_service_phone"
                    placeholder="Phone number"
                    value={form.data.customer_service_phone}
                    onChange={(e) =>
                      form.setData('customer_service_phone', e.target.value)
                    }
                  />
                  <InputError message={form.errors.customer_service_phone} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Detail Address *</Label>
                <Textarea
                  id="address"
                  required
                  name="address"
                  placeholder="Street name, building, house number..."
                  className="min-h-[100px]"
                  value={form.data.address}
                  onChange={(e) => form.setData('address', e.target.value)}
                />
                <InputError message={form.errors.address} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="province">Province *</Label>
                  <select
                    id="province"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.data.province}
                    onChange={(e) => {
                      form.setData('province', e.target.value);
                      form.setData('city', '');
                      form.setData('district', '');
                      form.setData('village', '');
                    }}
                  >
                    <option value="">Select Province</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <InputError message={form.errors.province} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City / Regency *</Label>
                  <select
                    id="city"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.data.city}
                    onChange={(e) => {
                      form.setData('city', e.target.value);
                      form.setData('district', '');
                      form.setData('village', '');
                    }}
                    disabled={!form.data.province}
                  >
                    <option value="">Select City</option>
                    {cities.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <InputError message={form.errors.city} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">District (Kecamatan) *</Label>
                  <select
                    id="district"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.data.district}
                    onChange={(e) => {
                      form.setData('district', e.target.value);
                      form.setData('village', '');
                    }}
                    disabled={!form.data.city}
                  >
                    <option value="">Select District</option>
                    {districts.map((d) => (
                      <option key={d.code} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <InputError message={form.errors.district} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="village">Village (Kelurahan) *</Label>
                  <select
                    id="village"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.data.village}
                    onChange={(e) => form.setData('village', e.target.value)}
                    disabled={!form.data.district}
                  >
                    <option value="">Select Village</option>
                    {villages.map((v) => (
                      <option key={v.code} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                  <InputError message={form.errors.village} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="postal_code">Postal Code (Optional)</Label>
                  <Input
                    id="postal_code"
                    value={form.data.postal_code}
                    onChange={(e) =>
                      form.setData('postal_code', e.target.value)
                    }
                  />
                  <InputError message={form.errors.postal_code} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Identity Verification</CardTitle>
              <CardDescription>
                Provide valid identity information for legal and operational
                compliance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 md:w-1/2">
                <Label htmlFor="identity_number">
                  ID Number (KTP/SIM/Passport) *
                </Label>
                <Input
                  id="identity_number"
                  type="text"
                  maxLength={16}
                  minLength={16}
                  pattern="\d{16}"
                  value={form.data.identity_number}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    form.setData('identity_number', val);
                  }}
                  placeholder="16 digit ID number"
                  required
                />
                {form.data.identity_number.length > 0 &&
                  form.data.identity_number.length < 16 && (
                    <p className="text-[0.8rem] font-medium text-destructive">
                      ID Number must be exactly 16 digits.
                    </p>
                  )}
                <InputError message={form.errors.identity_number} />
              </div>

              <div className="space-y-2">
                <Label>Upload ID Photo *</Label>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div
                    onClick={() => idInputRef.current?.click()}
                    className="w-full sm:w-64 h-40 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 cursor-pointer overflow-hidden transition-colors"
                  >
                    {idPreview ? (
                      <img
                        src={idPreview}
                        alt="ID Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <ImagePlus className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-500 font-medium">
                          Click to upload photo
                        </span>
                        <span className="text-xs text-slate-400 mt-1">
                          JPG, PNG (Max 2MB)
                        </span>
                      </>
                    )}
                  </div>
                  <Input
                    type="file"
                    ref={idInputRef}
                    className="hidden"
                    accept="image/jpeg, image/png, image/jpg"
                    onChange={handleIdChange}
                    required={!form.data.identity_photo}
                  />
                  {idPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => idInputRef.current?.click()}
                    >
                      Change Photo
                    </Button>
                  )}
                </div>
                <InputError message={form.errors.identity_photo} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={form.processing}
              className="min-w-[200px]"
            >
              {form.processing ? <Spinner className="mr-2" /> : null}
              Complete Registration
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
