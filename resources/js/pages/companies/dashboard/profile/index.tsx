import { useGetGeoCities } from '@/api/geo-city/geo-city';
import { useGetGeoDistricts } from '@/api/geo-district/geo-district';
import { useGetGeoProvinces } from '@/api/geo-province/geo-province';
import { useGetGeoVillages } from '@/api/geo-village/geo-village';
import InputError from '@/components/input-error';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { IdentityCardPicker } from '@/components/media/identity-card-picker';
import { PhotoPicker } from '@/components/media/photo-picker';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { update } from '@/routes/company/settings/profile';
import { Head, useForm } from '@inertiajs/react';
import { Building, Save } from 'lucide-react';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { toast } from 'sonner';

export type ProfilePageProps = {
  profile: any;
};

export default function Profile({ profile }: ProfilePageProps) {
  const intl = useIntl();

  const form = useForm({
    name: profile.name || '',
    email: profile.email || '',
    username: profile.username || '',
    phone: (profile.phone || '') as string,
    customer_service_phone: profile.customer_service_phone || '',
    address: profile.address || '',
    province_id: profile.province_id || '',
    city_id: profile.city_id || '',
    district_id: profile.district_id || '',
    village_id: profile.village_id || '',
    province: profile.province || '',
    city: profile.city || '',
    district: profile.district || '',
    village: profile.village || '',
    postal_code: profile.postal_code || '',
    subdomain: profile.domain?.subdomain || '',
    domain_enabled: profile.domain?.domain_enabled || false,
    domain: profile.domain?.domain || '',
    photo_id: profile.photo_id || undefined,
    identity_number: profile.identity_number || '',
    identity_card_id: profile.identity_card_id || undefined,
  });

  const { data: provincesData } = useGetGeoProvinces({
    query: { queryKey: ['geo-provinces'] },
  });
  const { data: citiesData } = useGetGeoCities(
    {
      province_id: form.data.province_id,
    },
    {
      query: {
        enabled: !!form.data.province_id,
        queryKey: ['geo-cities', form.data.province_id],
      },
    },
  );
  const { data: districtsData } = useGetGeoDistricts(
    {
      city_id: form.data.city_id,
    },
    {
      query: {
        enabled: !!form.data.city_id,
        queryKey: ['geo-districts', form.data.city_id],
      },
    },
  );
  const { data: villagesData } = useGetGeoVillages(
    {
      district_id: form.data.district_id,
    },
    {
      query: {
        enabled: !!form.data.district_id,
        queryKey: ['geo-villages', form.data.district_id],
      },
    },
  );

  const provinces = provincesData?.data || [];
  const cities = citiesData?.data || [];
  const districts = districtsData?.data || [];
  const villages = villagesData?.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    console.log('Submitting form with data:', form.data);
    e.preventDefault();
    form.put(update({ company: profile.username }).url, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(
          intl.formatMessage({
            defaultMessage: 'Profile updated successfully',
          }),
        );
      },
    });
  };

  return (
    <CompanyDashboardLayout
      breadcrumb={[
        { title: intl.formatMessage({ defaultMessage: 'Settings' }) },
        { title: intl.formatMessage({ defaultMessage: 'Profile' }) },
      ]}
      openMenuIds={['settings']}
      activeMenuIds={[`settings.profile`]}
      containerClassName=""
    >
      <Head title={intl.formatMessage({ defaultMessage: 'Profile' })} />

      <div className="max-w-4xl mx-auto space-y-6 pt-2 pb-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <FormattedMessage defaultMessage="Company Profile" />
          </h1>
          <p className="text-muted-foreground">
            <FormattedMessage defaultMessage="Manage your agency information, branding, and verification details." />
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />{' '}
                <FormattedMessage defaultMessage="Company Information" />
              </CardTitle>
              <CardDescription>
                <FormattedMessage defaultMessage="Provide your core business details and branding." />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <PhotoPicker
                  owner={{ type: 'company', id: profile.id }}
                  onChange={(media) =>
                    form.setData('photo_id', (media as any)?.id)
                  }
                  defaultValue={profile.photo_url}
                />

                <div className="flex-1 grid gap-4 md:grid-cols-2 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      <FormattedMessage defaultMessage="Company Name *" />
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      required
                      name="name"
                      placeholder={intl.formatMessage({
                        defaultMessage: 'Professional Travel Agency',
                      })}
                      value={form.data.name}
                      onChange={(e) => form.setData('name', e.target.value)}
                    />
                    <InputError message={form.errors.name} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <FormattedMessage defaultMessage="Company Email *" />
                    </Label>
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
                    <Label htmlFor="username">
                      <FormattedMessage defaultMessage="Company Username *" />
                    </Label>
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
                    <Label htmlFor="subdomain">
                      <FormattedMessage defaultMessage="Subdomain *" />
                    </Label>
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

                  <div className="space-y-2 col-span-2 pt-2">
                    <Separator className="mb-4" />
                    <div className="flex gap-2">
                      <Label htmlFor="domain">
                        <FormattedMessage defaultMessage="Custom Domain" />
                      </Label>
                      <Switch
                        checked={form.data.domain_enabled}
                        onCheckedChange={(checked) =>
                          form.setData('domain_enabled', checked)
                        }
                      />
                    </div>
                    <FieldDescription>
                      <FormattedMessage defaultMessage="You can setup custom domain like example.com that points to your landing page and public tour catalog. This requires additional DNS configuration." />
                    </FieldDescription>
                    <div className="flex gap-2 mt-2">
                      {form.data.domain_enabled ? (
                        <Input
                          className="flex-1"
                          id="domain"
                          type="text"
                          name="domain"
                          placeholder="example.com"
                          value={form.data.domain}
                          onChange={(e) =>
                            form.setData('domain', e.target.value)
                          }
                        />
                      ) : (
                        <div className="text-muted-foreground text-xs">
                          <FormattedMessage defaultMessage="Custom domain is not enabled." />
                        </div>
                      )}
                    </div>
                    <InputError message={form.errors.domain} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>
                <FormattedMessage defaultMessage="Contact & Address" />
              </CardTitle>
              <CardDescription>
                <FormattedMessage defaultMessage="Where can customers reach your agency?" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <FormattedMessage defaultMessage="Company Phone *" />
                  </Label>
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
                    <FormattedMessage defaultMessage="Customer Service Phone *" />
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
                <Label htmlFor="address">
                  <FormattedMessage defaultMessage="Detail Address *" />
                </Label>
                <Textarea
                  id="address"
                  required
                  name="address"
                  placeholder="Street name, building, house number..."
                  className="min-h-25"
                  value={form.data.address}
                  onChange={(e) => form.setData('address', e.target.value)}
                />
                <InputError message={form.errors.address} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="province">
                    <FormattedMessage defaultMessage="Province *" />
                  </Label>
                  <select
                    id="province"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.data.province_id}
                    onChange={(e) => {
                      form.setData('province_id', e.target.value);
                      form.setData('city_id', '');
                      form.setData('district_id', '');
                      form.setData('village_id', '');
                    }}
                  >
                    <option value="">Select Province</option>
                    {provinces.map((p: any) => (
                      <option key={p.code} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <InputError message={form.errors.province_id} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">
                    <FormattedMessage defaultMessage="City / Regency *" />
                  </Label>
                  <select
                    id="city"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.data.city_id}
                    onChange={(e) => {
                      form.setData('city_id', e.target.value);
                      form.setData('district_id', '');
                      form.setData('village_id', '');
                    }}
                  >
                    <option value="">Select City</option>
                    {cities.map((c: any) => (
                      <option key={c.code} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <InputError message={form.errors.city_id} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">
                    <FormattedMessage defaultMessage="District (Kecamatan) *" />
                  </Label>
                  <select
                    id="district"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.data.district_id}
                    onChange={(e) => {
                      form.setData('district_id', e.target.value);
                      form.setData('village_id', '');
                    }}
                  >
                    <option value="">Select District</option>
                    {districts.map((d: any) => (
                      <option key={d.code} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <InputError message={form.errors.district_id} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="village">
                    <FormattedMessage defaultMessage="Village (Kelurahan) *" />
                  </Label>
                  <select
                    id="village"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.data.village}
                    onChange={(e) => form.setData('village', e.target.value)}
                  >
                    <option value="">Select Village</option>
                    {villages.map((v: any) => (
                      <option key={v.code} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                  <InputError message={form.errors.village} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="postal_code">
                    <FormattedMessage defaultMessage="Postal Code (Optional)" />
                  </Label>
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
              <CardTitle>
                <FormattedMessage defaultMessage="Identity Verification" />
              </CardTitle>
              <CardDescription>
                <FormattedMessage defaultMessage="Provide valid identity information for legal and operational compliance." />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 md:w-1/2">
                <Label htmlFor="identity_number">
                  <FormattedMessage defaultMessage="ID Number (KTP/SIM/Passport) *" />
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
                <InputError message={form.errors.identity_number} />
              </div>

              <div className="space-y-2">
                <Label>
                  <FormattedMessage defaultMessage="Upload ID Photo *" />
                </Label>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <IdentityCardPicker
                    owner={{ type: 'company', id: profile.id }}
                    onChange={(media: any) => {
                      form.setData('identity_card_id', media.id);
                    }}
                    defaultValue={profile.identity_card}
                  />
                </div>
                <InputError message={form.errors.identity_card_id} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={form.processing}
              className="min-w-50"
            >
              {form.processing ? <Spinner className="mr-2" /> : null}
              <Save className="w-4 h-4 mr-2" />
              <FormattedMessage defaultMessage="Save Changes" />
            </Button>
          </div>
        </form>
      </div>
    </CompanyDashboardLayout>
  );
}
