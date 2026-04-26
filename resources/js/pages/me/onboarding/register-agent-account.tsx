import InputError from '@/components/input-error';
import { IdentityCardPicker } from '@/components/media/identity-card-picker';
import { PhotoPicker } from '@/components/media/photo-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { createCompany } from '@/routes/me/onboarding';
import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';
import { Building, CreditCard, MapPin, Save, ShieldCheck } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

interface Props {
  affiliate?: {
    id: number;
    name: string;
    username: string;
  };
}

export default function RegisterAgentAccount({ affiliate }: Props) {
  const { auth } = usePageSharedDataProps();

  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [identityMedia, setIdentityMedia] = useState<any>(null);

  const form = useForm({
    name: auth.user.name || '',
    email: auth.user.email || '',
    username: auth.user.username || '',
    phone: (auth.user.phone || '') as string,
    customer_service_phone: '',
    address: '',
    province: '',
    city: '',
    district: '',
    village: '',
    postal_code: '',
    subdomain: auth.user.username || '',
    photo_id: undefined as number | undefined,
    identity_number: '',
    identity_card_id: undefined as number | undefined,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post(createCompany().url, {
      preserveScroll: true,
    });
  };

  return (
    <>
      <Head title="Register an agent account" />
      <div className="max-w-5xl mx-auto space-y-6 pt-2 pb-20">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            <FormattedMessage defaultMessage="Register Agent Account" />
          </h1>
          <p className="text-muted-foreground">
            <FormattedMessage defaultMessage="Complete your company profile to start managing bookings and customers." />
          </p>
        </div>

        {affiliate && (
          <div className="rounded-xl border bg-emerald-50 text-card-foreground shadow-sm p-5 grid gap-1 border-emerald-200">
            <Label className="text-sm font-semibold text-emerald-800">
              <FormattedMessage defaultMessage="Invited By:" />
            </Label>
            <div className="text-[1.1rem] font-bold text-[#208066] dark:text-[#2ba384]">
              {affiliate.name}
            </div>
            <Input
              type="text"
              defaultValue={affiliate.username}
              readOnly
              className="bg-emerald-100/50 cursor-not-allowed mt-2 border-emerald-200 font-medium text-emerald-900 focus-visible:ring-0"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-sm border-border">
            <CardHeader className="bg-muted/30 flex flex-row items-center justify-between py-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                <FormattedMessage defaultMessage="Agency Identity" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-4">
                  <PhotoPicker
                    owner={{ type: 'user', id: auth.user.id }}
                    onChange={(media) =>
                      form.setData('photo_id', (media as any)?.id)
                    }
                  />
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                    <FormattedMessage defaultMessage="Agency Logo" />
                  </Label>
                  <InputError message={form.errors.photo_id} />
                </div>

                <div className="flex-1 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label>
                      <FormattedMessage defaultMessage="Account Owner Name" />
                    </Label>
                    <Input
                      type="text"
                      value={auth.user.name}
                      readOnly
                      className="bg-slate-50 cursor-not-allowed font-medium text-muted-foreground focus-visible:ring-0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">
                      <FormattedMessage defaultMessage="Agency Name" />{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      required
                      value={form.data.name}
                      onChange={(e) => form.setData('name', e.target.value)}
                      className="focus-visible:ring-primary"
                    />
                    <InputError message={form.errors.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">
                      <FormattedMessage defaultMessage="Username" />{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="username"
                      required
                      value={form.data.username}
                      onChange={(e) => {
                        if (form.data.subdomain === form.data.username) {
                          form.setData('subdomain', e.target.value);
                        }
                        form.setData('username', e.target.value);
                      }}
                      className="focus-visible:ring-primary"
                    />
                    <InputError message={form.errors.username} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <FormattedMessage defaultMessage="Business Email" />{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={form.data.email}
                      onChange={(e) => form.setData('email', e.target.value)}
                      className="focus-visible:ring-primary"
                    />
                    <InputError message={form.errors.email} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subdomain">
                      <FormattedMessage defaultMessage="Subdomain" />{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <InputGroup>
                      <InputGroupInput
                        id="subdomain"
                        required
                        value={form.data.subdomain}
                        onChange={(e) =>
                          form.setData('subdomain', e.target.value)
                        }
                      />
                      <InputGroupAddon
                        align="inline-end"
                        className="bg-muted text-muted-foreground italic"
                      >
                        .{import.meta.env.VITE_APP_HOST}
                      </InputGroupAddon>
                    </InputGroup>
                    <InputError message={form.errors.subdomain} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardHeader className="bg-muted/30 border-b py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-secondary" />
                <FormattedMessage defaultMessage="Location & Contact" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <FormattedMessage defaultMessage="Office Phone" />{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  required
                  value={form.data.phone}
                  onChange={(e) => form.setData('phone', e.target.value)}
                  className="focus-visible:ring-primary"
                />
                <InputError message={form.errors.phone} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cs_phone">
                  <FormattedMessage defaultMessage="CS Phone (WhatsApp)" />{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cs_phone"
                  required
                  value={form.data.customer_service_phone}
                  onChange={(e) =>
                    form.setData('customer_service_phone', e.target.value)
                  }
                  className="focus-visible:ring-primary"
                />
                <InputError message={form.errors.customer_service_phone} />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="address">
                  <FormattedMessage defaultMessage="Full Address" />{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="address"
                  required
                  value={form.data.address}
                  onChange={(e) => form.setData('address', e.target.value)}
                  className="min-h-[80px] focus-visible:ring-primary"
                />
                <InputError message={form.errors.address} />
              </div>

              <div className="space-y-2">
                <Label>
                  <FormattedMessage defaultMessage="Province" />{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <select
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={form.data.province}
                  onChange={(e) => {
                    form.setData('province', e.target.value);
                    form.setData('city', '');
                    form.setData('district', '');
                    form.setData('village', '');
                  }}
                >
                  <option value="">Select Province</option>
                  {provinces.map((p: any) => (
                    <option key={p.code} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <InputError message={form.errors.province} />
              </div>

              <div className="space-y-2">
                <Label>
                  <FormattedMessage defaultMessage="City" />{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <select
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                  value={form.data.city}
                  onChange={(e) => {
                    form.setData('city', e.target.value);
                    form.setData('district', '');
                    form.setData('village', '');
                  }}
                  disabled={!form.data.province}
                >
                  <option value="">Select City</option>
                  {cities.map((c: any) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <InputError message={form.errors.city} />
              </div>

              <div className="space-y-2">
                <Label>
                  <FormattedMessage defaultMessage="District (Kecamatan)" />{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <select
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                  value={form.data.district}
                  onChange={(e) => {
                    form.setData('district', e.target.value);
                    form.setData('village', '');
                  }}
                  disabled={!form.data.city}
                >
                  <option value="">Select District</option>
                  {districts.map((d: any) => (
                    <option key={d.code} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <InputError message={form.errors.district} />
              </div>

              <div className="space-y-2">
                <Label>
                  <FormattedMessage defaultMessage="Village (Kelurahan)" />{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <select
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                  value={form.data.village}
                  onChange={(e) => form.setData('village', e.target.value)}
                  disabled={!form.data.district}
                >
                  <option value="">Select Village</option>
                  {villages.map((v: any) => (
                    <option key={v.code} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <InputError message={form.errors.village} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="postal_code">
                  <FormattedMessage defaultMessage="Postal Code" />
                </Label>
                <Input
                  id="postal_code"
                  value={form.data.postal_code}
                  onChange={(e) => form.setData('postal_code', e.target.value)}
                  className="focus-visible:ring-primary"
                  placeholder="12345"
                />
                <InputError message={form.errors.postal_code} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/20 border-l-4">
            <CardHeader className="bg-primary/5 py-4 border-b">
              <CardTitle className="text-lg flex items-center gap-2 text-primary font-bold">
                <ShieldCheck className="w-5 h-5" />
                <FormattedMessage defaultMessage="Verification Documents" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-8 md:grid-cols-2 items-start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="identity_number"
                      className="font-bold flex items-center gap-2 text-foreground"
                    >
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <FormattedMessage defaultMessage="National ID Number (NIK)" />{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="identity_number"
                      required
                      value={form.data.identity_number}
                      onChange={(e) =>
                        form.setData(
                          'identity_number',
                          e.target.value.replace(/\D/g, ''),
                        )
                      }
                      className="text-xl tracking-widest font-mono h-12 focus-visible:ring-primary"
                      placeholder="16 Digit NIK"
                      maxLength={16}
                    />
                    {form.data.identity_number.length > 0 &&
                      form.data.identity_number.length < 16 && (
                        <p className="text-[0.8rem] font-medium text-destructive mt-1">
                          <FormattedMessage defaultMessage="ID Number must be exactly 16 digits." />
                        </p>
                      )}
                    <InputError message={form.errors.identity_number} />
                  </div>

                  <div className="p-4 rounded-xl border-2 border-dashed bg-muted/10 flex flex-col gap-3">
                    <Label className="font-bold text-sm">
                      <FormattedMessage defaultMessage="Upload Identity Photo" />{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <IdentityCardPicker
                      owner={{ type: 'user', id: auth.user.id }}
                      onChange={(media: any) => {
                        form.setData('identity_card_id', media.id);
                        setIdentityMedia(media);
                      }}
                    />
                    <InputError message={form.errors.identity_card_id} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
                    <FormattedMessage defaultMessage="Identity Preview" />
                  </Label>
                  <div className="relative aspect-[3/2] w-full rounded-xl overflow-hidden bg-slate-200 border-2 border-slate-300 flex items-center justify-center shadow-inner group">
                    {identityMedia?.data?.url ? (
                      <img
                        src={identityMedia.data.url}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        alt="KTP Preview"
                      />
                    ) : (
                      <div className="text-center p-6 text-muted-foreground italic">
                        <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <FormattedMessage defaultMessage="No ID uploaded yet" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={form.processing}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-12 h-12 font-bold shadow-xl shadow-primary/20"
            >
              {form.processing ? <Spinner className="mr-2" /> : null}
              <Save className="w-5 h-5 mr-2" />
              <FormattedMessage defaultMessage="Complete Registration" />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
