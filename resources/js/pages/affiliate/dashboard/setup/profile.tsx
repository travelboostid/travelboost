import InputError from '@/components/input-error';
import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Head, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { LinkIcon, Save, ShieldCheck, User as UserIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export default function AffiliateProfileEdit() {
  const { user } = usePage().props as any;
  const profile = user?.affiliate_profile || user?.affiliateProfile || {};

  const [identityMedia, setIdentityMedia] = useState<any>(
    profile.identity_card ? profile.identity_card : null,
  );

  const { data, setData, post, processing, errors, recentlySuccessful } =
    useForm({
      name: user.name || '',
      phone: profile.phone || '',
      address: profile.address || '',
      province: profile.province || '',
      city: profile.city || '',
      district: profile.district || '',
      village: profile.village || '',
      postal_code: profile.postal_code || '',
      identity_number: profile.identity_number || '',
      identity_card_id: profile.identity_card_id || undefined,
      photo_id: profile.photo_id || undefined,
      _method: 'POST',
    });

  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/regions/provinces').then((res) => setProvinces(res.data));
  }, []);

  useEffect(() => {
    const p = provinces.find((x) => x.name === data.province);
    if (p)
      axios
        .get(`/api/regions/cities/${p.code}`)
        .then((res) => setCities(res.data));
    else setCities([]);
  }, [data.province, provinces]);

  useEffect(() => {
    const c = cities.find((x) => x.name === data.city);
    if (c)
      axios
        .get(`/api/regions/districts/${c.code}`)
        .then((res) => setDistricts(res.data));
    else setDistricts([]);
  }, [data.city, cities]);

  useEffect(() => {
    const d = districts.find((x) => x.name === data.district);
    if (d)
      axios
        .get(`/api/regions/villages/${d.code}`)
        .then((res) => setVillages(res.data));
    else setVillages([]);
  }, [data.district, districts]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/affiliate/dashboard/setup/profile', { preserveScroll: true });
  };

  return (
    <AffiliateDashboardLayout
      breadcrumb={[
        { title: 'Dashboard', url: '/affiliate/dashboard' },
        { title: 'Setup', url: '#' },
        { title: 'Profile', url: '/affiliate/dashboard/setup/profile' },
      ]}
    >
      <Head title="Edit Profile" />

      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Profile Information
          </h1>
          <p className="text-muted-foreground">
            Complete your profile to expedite the verification process.
          </p>
        </div>

        {recentlySuccessful && (
          <div className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 border border-green-200">
            Profile has been successfully updated!
          </div>
        )}

        <form onSubmit={submit} className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" /> Account Details
              </CardTitle>
              <CardDescription>
                Your basic login credentials and landing page link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center gap-4 shrink-0 mx-auto md:mx-0">
                  <PhotoPicker
                    owner={{ type: 'user', id: user.id }}
                    onChange={(media: any) => {
                      setData('photo_id', media?.id);
                    }}
                    defaultValue={profile.photo_url}
                  />
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest text-center">
                    Update Photo
                  </Label>
                  <InputError message={errors.photo_id as string} />
                </div>

                <div className="flex-1 grid gap-4 md:grid-cols-2 w-full">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">
                      Account Status
                    </Label>
                    <div className="pt-1 flex items-center h-10">
                      {profile?.approved_at ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          Pending Approval
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                    />
                    <InputError message={errors.name} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      value={user.email}
                      disabled
                      className="bg-muted/50 cursor-not-allowed text-muted-foreground"
                    />
                  </div>

                  {(() => {
                    const tier = profile?.tier;
                    const uplineMA = profile?.upline;
                    if (tier === 'affiliate' && uplineMA) {
                      return (
                        <div className="space-y-2">
                          <Label className="text-primary">
                            Invited By (Master Affiliate)
                          </Label>
                          <Input
                            value={uplineMA.name}
                            disabled
                            className="bg-primary/5 border-primary/20 font-medium"
                          />
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="space-y-2">
                    <Label>Username / Referral Code</Label>
                    <Input
                      value={user.username}
                      disabled
                      className="bg-muted/50 cursor-not-allowed text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="join_date"
                      className="text-muted-foreground"
                    >
                      Join Date
                    </Label>
                    <Input
                      id="join_date"
                      value={
                        profile?.approved_at
                          ? new Date(profile.approved_at).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              },
                            )
                          : '-'
                      }
                      disabled
                      className="bg-muted/50 cursor-not-allowed text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-primary">
                      <LinkIcon className="w-3 h-3" /> Landing Page Link
                    </Label>
                    <Input
                      value={`${user.username}.travelboost.co.id`}
                      disabled
                      className="bg-primary/5 border-primary/20 text-primary font-medium cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Contact & Address</CardTitle>
              <CardDescription>
                Where can we reach you and send documents?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 md:w-1/2">
                <Label htmlFor="phone">Phone / WhatsApp Number *</Label>
                <Input
                  id="phone"
                  value={data.phone}
                  onChange={(e) => setData('phone', e.target.value)}
                  placeholder="e.g. 081234567890"
                />
                <InputError message={errors.phone} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Detail Address</Label>
                <Textarea
                  id="address"
                  value={data.address}
                  onChange={(e) => setData('address', e.target.value)}
                  placeholder="Street name, building, house number..."
                  className="min-h-[100px]"
                />
                <InputError message={errors.address} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <select
                    id="province"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={data.province}
                    onChange={(e) => {
                      setData('province', e.target.value);
                      setData('city', '');
                      setData('district', '');
                      setData('village', '');
                    }}
                  >
                    <option value="">Select Province</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <InputError message={errors.province} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City / Regency</Label>
                  <select
                    id="city"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={data.city}
                    onChange={(e) => {
                      setData('city', e.target.value);
                      setData('district', '');
                      setData('village', '');
                    }}
                    disabled={!data.province}
                  >
                    <option value="">Select City</option>
                    {cities.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <InputError message={errors.city} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District (Kecamatan)</Label>
                  <select
                    id="district"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={data.district}
                    onChange={(e) => {
                      setData('district', e.target.value);
                      setData('village', '');
                    }}
                    disabled={!data.city}
                  >
                    <option value="">Select District</option>
                    {districts.map((d) => (
                      <option key={d.code} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <InputError message={errors.district} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="village">Village (Kelurahan)</Label>
                  <select
                    id="village"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={data.village}
                    onChange={(e) => setData('village', e.target.value)}
                    disabled={!data.district}
                  >
                    <option value="">Select Village</option>
                    {villages.map((v) => (
                      <option key={v.code} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                  <InputError message={errors.village} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={data.postal_code}
                    onChange={(e) => setData('postal_code', e.target.value)}
                  />
                  <InputError message={errors.postal_code} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm border-l-4 border-l-primary/20">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <ShieldCheck className="w-5 h-5" />
                Identity Verification
              </CardTitle>
              <CardDescription>
                Please provide valid identity information for verification and
                commission payouts.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-8 md:grid-cols-2 items-start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="identity_number">
                      ID Number (KTP/SIM/Passport) *
                    </Label>
                    <Input
                      id="identity_number"
                      type="text"
                      maxLength={16}
                      minLength={16}
                      pattern="\d{16}"
                      value={data.identity_number}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setData('identity_number', val);
                      }}
                      className="text-lg tracking-widest font-mono h-12"
                      placeholder="16 digit ID number"
                    />
                    {data.identity_number.length > 0 &&
                      data.identity_number.length < 16 && (
                        <p className="text-[0.8rem] font-medium text-destructive">
                          ID Number must be exactly 16 digits.
                        </p>
                      )}
                    <InputError message={errors.identity_number} />
                  </div>

                  <div className="p-4 rounded-xl border-2 border-dashed bg-muted/10 flex flex-col gap-3">
                    <Label className="font-bold text-sm">
                      Upload Identity Photo *
                    </Label>
                    <IdentityCardPicker
                      owner={{ type: 'user', id: user.id }}
                      onChange={(media: any) => {
                        setData('identity_card_id', media.id);
                        setIdentityMedia(media);
                      }}
                    />
                    <InputError message={errors.identity_card_id as string} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
                    Identity Preview
                  </Label>
                  <div className="relative aspect-[3/2] w-full rounded-xl overflow-hidden bg-slate-200 border-2 border-slate-300 flex items-center justify-center shadow-inner group">
                    {identityMedia?.data?.url ? (
                      <img
                        src={identityMedia.data.url}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        alt="ID Preview"
                      />
                    ) : (
                      <div className="text-center p-6 text-muted-foreground italic">
                        <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        No ID uploaded yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={processing}
              className="min-w-[150px]"
            >
              {processing ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AffiliateDashboardLayout>
  );
}
