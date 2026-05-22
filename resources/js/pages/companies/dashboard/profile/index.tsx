import GeoCitySelector from '@/components/geo-city-selector';
import GeoDistrictSelector from '@/components/geo-district-selector';
import GeoProvinceSelector from '@/components/geo-province-selector';
import GeoVillageSelector from '@/components/geo-village-selector';
import InputError from '@/components/input-error';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { IdentityCardPicker } from '@/components/media/identity-card-picker';
import { PhotoPicker } from '@/components/media/photo-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { update } from '@/routes/companies/dashboard/settings/profile';
import { Head, useForm } from '@inertiajs/react';
import { Building, CreditCard, MapPin, Save, ShieldCheck } from 'lucide-react';
import React, { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { toast } from 'sonner';

export type ProfilePageProps = {
    profile: any;
    account_status: string;
};

export default function Profile({ profile, account_status }: ProfilePageProps) {
    const intl = useIntl();

    const [identityPreviewUrl, setIdentityPreviewUrl] = useState<string | null>(
        null,
    );

    const form = useForm({
        name: profile.name || '',
        email: profile.email || '',
        username: profile.username || '',
        phone: profile.phone || '',
        customer_service_phone: profile.customer_service_phone || '',
        address: profile.address || '',
        province_id: profile.province_id || 0,
        city_id: profile.city_id || 0,
        district_id: profile.district_id || 0,
        village_id: profile.village_id || 0,
        postal_code: profile.postal_code || '',
        subdomain: profile.domain?.subdomain || '',
        domain_enabled: Boolean(profile.domain?.domain),
        domain: profile.domain?.domain || '',
        photo_id: profile.photo_id || undefined,
        identity_number: profile.identity_number || '',
        identity_card_id: profile.identity_card_id || undefined,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(update({ username: profile.username }).url, {
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

    const isStatusActive = account_status === 'active';

    const currentIdentityPreview =
        identityPreviewUrl ||
        profile.identity_card?.data?.url ||
        profile.identity_card?.url ||
        profile.identity_card?.original_url;
    const invitedBy = profile.invited_by
        ? [
              profile.invited_by.name,
              profile.invited_by.referral_code
                  ? `(${profile.invited_by.referral_code})`
                  : null,
          ]
              .filter(Boolean)
              .join(' ')
        : '-';

    return (
        <CompanyDashboardLayout
            breadcrumb={[
                { title: intl.formatMessage({ defaultMessage: 'Settings' }) },
                { title: intl.formatMessage({ defaultMessage: 'Profile' }) },
            ]}
            openMenuIds={['settings']}
            activeMenuIds={[`settings.profile`]}
        >
            <Head title={intl.formatMessage({ defaultMessage: 'Profile' })} />

            {/* PERBAIKAN RESPONSIVE: Tambahkan px-4 sm:px-6 lg:px-8 agar rapi di layar kecil */}
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-20">
                <div className="flex items-center justify-between mt-4 md:mt-0">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            <FormattedMessage defaultMessage="Profile Settings" />
                        </h1>
                        <p className="text-muted-foreground text-sm md:text-base">
                            <FormattedMessage defaultMessage="Manage your agency identity and verification documents." />
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Agency Identity Card */}
                    <Card className="shadow-sm border-border overflow-hidden">
                        <CardHeader className="bg-muted/30 flex flex-row items-center justify-between py-4 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Building className="w-5 h-5 text-primary" />
                                <FormattedMessage defaultMessage="Agency Identity" />
                            </CardTitle>
                            <div
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isStatusActive ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'}`}
                            >
                                <span
                                    className={`w-2 h-2 rounded-full ${isStatusActive ? 'bg-primary' : 'bg-destructive'}`}
                                />
                                {isStatusActive ? 'Active' : 'Inactive'}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex flex-col lg:flex-row gap-8">
                                <div className="flex flex-col items-center gap-4 shrink-0">
                                    <PhotoPicker
                                        owner={{
                                            type: 'company',
                                            id: profile.id,
                                        }}
                                        onChange={(media) =>
                                            form.setData(
                                                'photo_id',
                                                (media as any)?.id,
                                            )
                                        }
                                        defaultValue={profile.photo_url}
                                    />
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                                        Logo
                                    </Label>
                                </div>

                                <div className="flex-1 grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">
                                            <FormattedMessage defaultMessage="Agency Name" />{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="name"
                                            value={form.data.name}
                                            onChange={(e) =>
                                                form.setData(
                                                    'name',
                                                    e.target.value,
                                                )
                                            }
                                            className="focus-visible:ring-primary"
                                        />
                                        <InputError
                                            message={form.errors.name}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="username">
                                            <FormattedMessage defaultMessage="Username" />{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="username"
                                            value={form.data.username}
                                            onChange={(e) =>
                                                form.setData(
                                                    'username',
                                                    e.target.value,
                                                )
                                            }
                                            className="focus-visible:ring-primary"
                                        />
                                        <InputError
                                            message={form.errors.username}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">
                                            <FormattedMessage defaultMessage="Business Email" />{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={form.data.email}
                                            onChange={(e) =>
                                                form.setData(
                                                    'email',
                                                    e.target.value,
                                                )
                                            }
                                            className="focus-visible:ring-primary"
                                        />
                                        <InputError
                                            message={form.errors.email}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="invited_by">
                                            <FormattedMessage defaultMessage="Invited By" />
                                        </Label>
                                        <Input
                                            id="invited_by"
                                            value={invitedBy}
                                            readOnly
                                            className="bg-muted text-muted-foreground"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subdomain">
                                            <FormattedMessage defaultMessage="Subdomain" />{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <InputGroup>
                                            <InputGroupInput
                                                id="subdomain"
                                                value={form.data.subdomain}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'subdomain',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputGroupAddon
                                                align="inline-end"
                                                className="bg-muted text-muted-foreground italic"
                                            >
                                                .{import.meta.env.VITE_APP_HOST}
                                            </InputGroupAddon>
                                        </InputGroup>
                                        <InputError
                                            message={form.errors.subdomain}
                                        />
                                    </div>

                                    <div className="sm:col-span-2 pt-4">
                                        <div className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-primary/5">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-bold">
                                                    <FormattedMessage defaultMessage="Custom Domain" />
                                                </Label>
                                                <FieldDescription>
                                                    <FormattedMessage defaultMessage="Enable this to use your professional domain (e.g. travel.com)" />
                                                </FieldDescription>
                                            </div>
                                            <Switch
                                                checked={
                                                    form.data.domain_enabled
                                                }
                                                onCheckedChange={(checked) => {
                                                    form.setData(
                                                        'domain_enabled',
                                                        checked,
                                                    );
                                                    if (!checked) {
                                                        form.setData(
                                                            'domain',
                                                            '',
                                                        );
                                                    }
                                                }}
                                            />
                                        </div>
                                        {form.data.domain_enabled && (
                                            <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                                <Input
                                                    placeholder="www.yourdomain.com"
                                                    value={form.data.domain}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            'domain',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="focus-visible:ring-primary"
                                                />
                                                <InputError
                                                    message={form.errors.domain}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location & Contact Card */}
                    <Card className="shadow-sm border-border overflow-hidden">
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
                                    value={form.data.phone}
                                    onChange={(e) =>
                                        form.setData('phone', e.target.value)
                                    }
                                />
                                <InputError message={form.errors.phone} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cs_phone">
                                    <FormattedMessage defaultMessage="[WhatsApp] Customer Service" />{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="cs_phone"
                                    value={form.data.customer_service_phone}
                                    onChange={(e) =>
                                        form.setData(
                                            'customer_service_phone',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={form.errors.customer_service_phone}
                                />
                            </div>
                            <div className="sm:col-span-2 space-y-2">
                                <Label htmlFor="address">
                                    <FormattedMessage defaultMessage="Detail Address" />{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                    id="address"
                                    value={form.data.address}
                                    onChange={(e) =>
                                        form.setData('address', e.target.value)
                                    }
                                    className="min-h-[80px]"
                                />
                                <InputError message={form.errors.address} />
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    <FormattedMessage defaultMessage="Province" />{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <GeoProvinceSelector
                                    value={String(form.data.province_id)}
                                    onValueChange={(v) =>
                                        form.setData('province_id', Number(v))
                                    }
                                />
                                <InputError message={form.errors.province_id} />
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    <FormattedMessage defaultMessage="City" />{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <GeoCitySelector
                                    provinceId={form.data.province_id}
                                    value={String(form.data.city_id)}
                                    onValueChange={(v) =>
                                        form.setData('city_id', Number(v))
                                    }
                                />
                                <InputError message={form.errors.city_id} />
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    <FormattedMessage defaultMessage="District (Kecamatan)" />{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <GeoDistrictSelector
                                    cityId={form.data.city_id}
                                    value={String(form.data.district_id)}
                                    onValueChange={(v) =>
                                        form.setData('district_id', Number(v))
                                    }
                                />
                                <InputError message={form.errors.district_id} />
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    <FormattedMessage defaultMessage="Village (Kelurahan)" />{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <GeoVillageSelector
                                    districtId={form.data.district_id}
                                    value={String(form.data.village_id)}
                                    onValueChange={(v) =>
                                        form.setData('village_id', Number(v))
                                    }
                                />
                                <InputError message={form.errors.village_id} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="postal_code">
                                    <FormattedMessage defaultMessage="Postal Code" />
                                </Label>
                                <Input
                                    id="postal_code"
                                    value={form.data.postal_code}
                                    onChange={(e) =>
                                        form.setData(
                                            'postal_code',
                                            e.target.value,
                                        )
                                    }
                                    className="focus-visible:ring-primary"
                                    placeholder="12345"
                                />
                                <InputError message={form.errors.postal_code} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Verification Card with Preview KTP */}
                    <Card className="shadow-sm border-primary/20 border-l-4 overflow-hidden">
                        <CardHeader className="bg-primary/5 py-4 border-b">
                            <CardTitle className="text-lg flex items-center gap-2 text-primary font-bold">
                                <ShieldCheck className="w-5 h-5" />
                                <FormattedMessage defaultMessage="Verification Documents" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {/* PERBAIKAN GRID & TINGGI: items-stretch agar kiri & kanan sejajar tingginya */}
                            <div className="grid gap-6 md:gap-8 lg:grid-cols-2 items-stretch">
                                {/* KOLOM KIRI: Input NIK dan Unggah Gambar */}
                                <div className="flex flex-col space-y-4 justify-start">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="identity_number"
                                            className="font-bold flex items-center gap-2 text-foreground"
                                        >
                                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                                            <FormattedMessage defaultMessage="National ID Number (NIK)" />{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="identity_number"
                                            value={form.data.identity_number}
                                            onChange={(e) =>
                                                form.setData(
                                                    'identity_number',
                                                    e.target.value.replace(
                                                        /\D/g,
                                                        '',
                                                    ),
                                                )
                                            }
                                            className="text-xl tracking-widest font-mono h-12 focus-visible:ring-primary"
                                            placeholder="16 Digit NIK"
                                            maxLength={16}
                                        />
                                        <InputError
                                            message={
                                                form.errors.identity_number
                                            }
                                        />
                                    </div>

                                    <div className="flex-1 p-4 rounded-xl border-2 border-dashed bg-muted/10 flex flex-col gap-3">
                                        <Label className="font-bold text-sm">
                                            <FormattedMessage defaultMessage="Change Identity Photo" />{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <IdentityCardPicker
                                            owner={{
                                                type: 'company',
                                                id: profile.id,
                                            }}
                                            onChange={(media: any) => {
                                                form.setData(
                                                    'identity_card_id',
                                                    media?.id,
                                                );
                                                // PERBAIKAN: Set preview URL agar langsung tampil!
                                                setIdentityPreviewUrl(
                                                    media?.url ||
                                                        media?.original_url ||
                                                        media?.data?.url ||
                                                        null,
                                                );
                                            }}
                                            defaultValue={profile.identity_card}
                                        />
                                        <InputError
                                            message={
                                                form.errors.identity_card_id
                                            }
                                        />
                                    </div>
                                </div>

                                {/* KOLOM KANAN: Preview KTP */}
                                <div className="flex flex-col space-y-3">
                                    <Label className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
                                        <FormattedMessage defaultMessage="Current Identity Preview" />
                                    </Label>
                                    {/* PERBAIKAN TINGGI PREVIEW: flex-1 dan min-h-[200px] dengan object-contain */}
                                    <div className="relative flex-1 w-full min-h-[200px] rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 flex items-center justify-center shadow-inner group">
                                        {currentIdentityPreview ? (
                                            <img
                                                src={currentIdentityPreview}
                                                className="w-full h-full object-contain p-2 transition-transform group-hover:scale-105"
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
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-12 h-12 font-bold shadow-xl shadow-primary/20 w-full sm:w-auto"
                        >
                            {form.processing ? (
                                <Spinner className="mr-2" />
                            ) : null}
                            <Save className="w-5 h-5 mr-2" />
                            <FormattedMessage defaultMessage="Save Changes" />
                        </Button>
                    </div>
                </form>
            </div>
        </CompanyDashboardLayout>
    );
}
