import InputError from '@/components/input-error';
import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
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
import {
  Camera,
  ImagePlus,
  LinkIcon,
  Save,
  User as UserIcon,
} from 'lucide-react';
import React, { useRef, useState } from 'react';

export default function AffiliateProfileEdit() {
  const { user } = usePage().props as any;
  const profile = user?.affiliate_profile || user?.affiliateProfile || {};

  const idInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [idPreview, setIdPreview] = useState<string | null>(
    profile.identity_photo_path
      ? `/storage/${profile.identity_photo_path}`
      : null,
  );

  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile.profile_photo_path
      ? `/storage/${profile.profile_photo_path}`
      : null,
  );

  const { data, setData, post, processing, errors, recentlySuccessful } =
    useForm({
      phone: profile.phone || '',
      address: profile.address || '',
      province: profile.province || '',
      city: profile.city || '',
      district: profile.district || '',
      village: profile.village || '',
      postal_code: profile.postal_code || '',
      identity_number: profile.identity_number || '',
      identity_photo: null as File | null,
      profile_photo: null as File | null,
      _method: 'POST',
    });

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData('identity_photo', file);
      const reader = new FileReader();
      reader.onload = (e) => setIdPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData('profile_photo', file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/affiliate/dashboard/setup/profile', {
      preserveScroll: true,
    });
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
          <div className="p-4 mb-4 text-sm text-emerald-800 rounded-lg bg-emerald-50 border border-emerald-200">
            Profile has been successfully updated!
          </div>
        )}

        <form onSubmit={submit} className="space-y-6">
          {/* FOTO PROFIL & AKUN DASAR */}
          <Card className="border-slate-200 shadow-sm">
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
                {/* Upload Avatar */}
                <div className="flex flex-col items-center gap-3 shrink-0 mx-auto md:mx-0">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full border-4 border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center shadow-sm">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-12 h-12 text-slate-300" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    Update Photo
                  </span>
                  <Input
                    type="file"
                    ref={avatarInputRef}
                    className="hidden"
                    accept="image/jpeg, image/png, image/jpg"
                    onChange={handleAvatarChange}
                  />
                  <InputError message={errors.profile_photo} />
                </div>

                {/* Data Akun ReadOnly */}
                <div className="flex-1 grid gap-4 md:grid-cols-2 w-full">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={user.name}
                      disabled
                      className="bg-slate-50 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      value={user.email}
                      disabled
                      className="bg-slate-50 cursor-not-allowed"
                    />
                  </div>

                  {/* LOGIKA INFORMASI REFERRAL */}
                  {(() => {
                    const profile =
                      user?.affiliate_profile || user?.affiliateProfile;
                    const tier = profile?.tier;
                    const uplineMA = profile?.upline; // Master Affiliate
                    const uplinePartner =
                      uplineMA?.affiliate_profile?.upline ||
                      uplineMA?.affiliateProfile?.upline; // Partner

                    // Jika user adalah Affiliator Biasa
                    if (tier === 'affiliate') {
                      return (
                        <>
                          <div className="space-y-2">
                            <Label className="text-blue-700">
                              Invited By (Master Affiliate)
                            </Label>
                            <Input
                              value={uplineMA?.name || '-'}
                              disabled
                              className="bg-blue-50/50 border-blue-100 font-medium"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-blue-700">
                              Network Partner
                            </Label>
                            <Input
                              value={uplinePartner?.name || '-'}
                              disabled
                              className="bg-blue-50/50 border-blue-100 font-medium"
                            />
                          </div>
                        </>
                      );
                    }

                    // Jika user adalah Master Affiliate
                    if (
                      tier === 'master_affiliate' ||
                      tier === 'master-affiliate'
                    ) {
                      return (
                        <div className="space-y-2">
                          <Label className="text-blue-700">Partner Under</Label>
                          <Input
                            value={uplineMA?.name || '-'}
                            disabled
                            className="bg-blue-50/50 border-blue-100 font-medium"
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
                      className="bg-slate-50 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-blue-700">
                      <LinkIcon className="w-3 h-3" /> Landing Page Link
                    </Label>
                    <Input
                      value={`${user.username}.travelboost.co.id`}
                      disabled
                      className="bg-blue-50/50 border-blue-200 text-blue-800 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KONTAK & ALAMAT */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Contact & Address</CardTitle>
              <CardDescription>
                Where can we reach you and send documents?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 md:w-1/2">
                <Label htmlFor="phone">Phone / WhatsApp Number</Label>
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
                  <Input
                    id="province"
                    value={data.province}
                    onChange={(e) => setData('province', e.target.value)}
                  />
                  <InputError message={errors.province} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City / Regency</Label>
                  <Input
                    id="city"
                    value={data.city}
                    onChange={(e) => setData('city', e.target.value)}
                  />
                  <InputError message={errors.city} />
                </div>

                {/* HIDE KECAMATAN & KELURAHAN (Bisa diaktifkan kembali nanti) */}
                {/* <div className="space-y-2">
                  <Label htmlFor="district">District (Kecamatan)</Label>
                  <Input id="district" value={data.district} onChange={e => setData('district', e.target.value)} />
                  <InputError message={errors.district} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="village">Village (Kelurahan)</Label>
                  <Input id="village" value={data.village} onChange={e => setData('village', e.target.value)} />
                  <InputError message={errors.village} />
                </div> 
                */}

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

          {/* IDENTITAS */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Identity Verification</CardTitle>
              <CardDescription>
                Please provide valid identity information for verification and
                commission payouts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 md:w-1/2">
                <Label htmlFor="identity_number">
                  ID Number (KTP/SIM/Passport)
                </Label>
                <Input
                  id="identity_number"
                  value={data.identity_number}
                  onChange={(e) => setData('identity_number', e.target.value)}
                  placeholder="16 digit ID number"
                />
                <InputError message={errors.identity_number} />
              </div>

              <div className="space-y-2">
                <Label>Upload ID Photo</Label>
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
                <InputError message={errors.identity_photo} />
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
