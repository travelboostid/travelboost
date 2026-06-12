import GeoCitySelector from '@/components/geo-city-selector';
import GeoDistrictSelector from '@/components/geo-district-selector';
import GeoProvinceSelector from '@/components/geo-province-selector';
import GeoVillageSelector from '@/components/geo-village-selector';
import InputError from '@/components/input-error';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { IdentityCardPicker } from '@/components/media/identity-card-picker';
import { PhotoPicker } from '@/components/media/photo-picker';
import { Badge } from '@/components/ui/badge';
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
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { update } from '@/routes/companies/dashboard/settings/profile';
import { Head, useForm } from '@inertiajs/react';
import {
    Building2,
    MapPin,
    Save,
    ShieldCheck,
    type LucideIcon,
} from 'lucide-react';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { toast } from 'sonner';

export type ProfilePageProps = {
    profile: any;
    account_status: string;
};

function RequiredMark() {
    return (
        <span className="text-destructive" aria-hidden="true">
            {' '}
            *
        </span>
    );
}

type SectionTone = 'primary' | 'sky' | 'emerald';

const sectionToneStyles: Record<
    SectionTone,
    { card: string; header: string; iconWrap: string }
> = {
    primary: {
        card: 'ring-1 ring-primary/10',
        header: 'border-b border-primary/15 bg-linear-to-r from-primary/12 via-primary/5 to-transparent',
        iconWrap:
            'bg-primary text-primary-foreground shadow-sm shadow-primary/25 ring-1 ring-primary/20',
    },
    sky: {
        card: 'ring-1 ring-sky-500/10',
        header: 'border-b border-sky-500/15 bg-linear-to-r from-sky-500/12 via-sky-500/5 to-transparent',
        iconWrap:
            'bg-sky-500 text-white shadow-sm shadow-sky-500/25 ring-1 ring-sky-500/20',
    },
    emerald: {
        card: 'ring-1 ring-emerald-500/10',
        header: 'border-b border-emerald-500/15 bg-linear-to-r from-emerald-500/12 via-emerald-500/5 to-transparent',
        iconWrap:
            'bg-emerald-600 text-white shadow-sm shadow-emerald-500/25 ring-1 ring-emerald-500/20',
    },
};

function ProfileSectionHeader({
    icon: Icon,
    title,
    description,
    tone,
}: {
    icon: LucideIcon;
    title: React.ReactNode;
    description: React.ReactNode;
    tone: SectionTone;
}) {
    const style = sectionToneStyles[tone];

    return (
        <CardHeader
            className={cn('gap-0 px-6 py-4 [.border-b]:pb-4', style.header)}
        >
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl',
                        style.iconWrap,
                    )}
                >
                    <Icon className="size-5" />
                </div>
                <div className="min-w-0 space-y-1">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
            </div>
        </CardHeader>
    );
}

export default function Profile({ profile, account_status }: ProfilePageProps) {
    const intl = useIntl();
    const profileType = String(
        profile.type?.value ?? profile.type ?? '',
    ).toLowerCase();
    const profileEntity = profileType === 'vendor' ? 'Vendor' : 'Agent';
    const isStatusActive = account_status === 'active';

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
        const previousUsername = profile.username;

        form.put(update({ company: previousUsername }).url, {
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

    const invitedBy = profile.invited_by
        ? [
              profile.invited_by.name,
              profile.invited_by.referral_code
                  ? `(${profile.invited_by.referral_code})`
                  : null,
          ]
              .filter(Boolean)
              .join(' ')
        : null;

    return (
        <CompanyDashboardLayout
            breadcrumb={[
                { title: intl.formatMessage({ defaultMessage: 'Settings' }) },
                { title: intl.formatMessage({ defaultMessage: 'Profile' }) },
            ]}
            openMenuIds={['settings']}
            activeMenuIds={['settings.profile']}
        >
            <Head title={intl.formatMessage({ defaultMessage: 'Profile' })} />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4 pb-20 sm:p-6">
                <Card
                    className={cn(
                        'overflow-hidden border shadow-sm gap-0 py-0',
                        sectionToneStyles.primary.card,
                    )}
                >
                    <div
                        className={cn(
                            'flex flex-col gap-4 border-b-0 px-6 py-4 sm:flex-row sm:items-center sm:justify-between',
                            sectionToneStyles.primary.header,
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={cn(
                                    'flex size-10 shrink-0 items-center justify-center rounded-xl',
                                    sectionToneStyles.primary.iconWrap,
                                )}
                            >
                                <Building2 className="size-5" />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                    <FormattedMessage defaultMessage="Profile" />
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    <FormattedMessage
                                        defaultMessage="Manage your {entity} identity, contact details, and verification documents."
                                        values={{
                                            entity: profileEntity.toLowerCase(),
                                        }}
                                    />
                                </p>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className={
                                isStatusActive
                                    ? 'border-primary/30 bg-primary/5 text-primary'
                                    : 'border-destructive/30 bg-destructive/5 text-destructive'
                            }
                        >
                            <span
                                className={`mr-1.5 inline-block size-1.5 rounded-full ${isStatusActive ? 'bg-primary' : 'bg-destructive'}`}
                            />
                            {isStatusActive ? (
                                <FormattedMessage defaultMessage="Active" />
                            ) : (
                                <FormattedMessage defaultMessage="Inactive" />
                            )}
                        </Badge>
                    </div>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card
                        className={cn(
                            'overflow-hidden border shadow-sm gap-0 py-0',
                            sectionToneStyles.primary.card,
                        )}
                    >
                        <ProfileSectionHeader
                            icon={Building2}
                            tone="primary"
                            title={
                                <FormattedMessage defaultMessage="Identity" />
                            }
                            description={
                                <FormattedMessage defaultMessage="Public-facing name, login details, and branded URLs." />
                            }
                        />
                        <CardContent className="px-6 pt-6 pb-6">
                            <div className="flex flex-col gap-8 lg:flex-row">
                                <div className="flex shrink-0 flex-col items-center gap-2">
                                    <PhotoPicker
                                        owner={{
                                            type: 'company',
                                            id: profile.id,
                                        }}
                                        onChange={(media) =>
                                            form.setData(
                                                'photo_id',
                                                (media as { id?: number })?.id,
                                            )
                                        }
                                        defaultValue={profile.photo_url}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        <FormattedMessage defaultMessage="Logo (optional)" />
                                    </p>
                                </div>

                                <div className="grid flex-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">
                                            <FormattedMessage
                                                defaultMessage="{entity} name"
                                                values={{
                                                    entity: profileEntity,
                                                }}
                                            />
                                            <RequiredMark />
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
                                        />
                                        <InputError
                                            message={form.errors.name}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">
                                            <FormattedMessage defaultMessage="Business email" />
                                            <RequiredMark />
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
                                        />
                                        <InputError
                                            message={form.errors.email}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="username">
                                            <FormattedMessage defaultMessage="Username" />
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
                                        />
                                        <FieldDescription>
                                            <FormattedMessage defaultMessage="Used in your dashboard URL. Leave unchanged unless you need to update it." />
                                        </FieldDescription>
                                        <InputError
                                            message={form.errors.username}
                                        />
                                    </div>

                                    {invitedBy ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="invited_by">
                                                <FormattedMessage defaultMessage="Invited by" />
                                            </Label>
                                            <Input
                                                id="invited_by"
                                                value={invitedBy}
                                                readOnly
                                                className="bg-muted text-muted-foreground"
                                            />
                                        </div>
                                    ) : null}

                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="subdomain">
                                            <FormattedMessage defaultMessage="Subdomain" />
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
                                                className="bg-muted text-muted-foreground"
                                            >
                                                .{import.meta.env.VITE_APP_HOST}
                                            </InputGroupAddon>
                                        </InputGroup>
                                        <FieldDescription>
                                            <FormattedMessage defaultMessage="Optional branded subdomain for your public site." />
                                        </FieldDescription>
                                        <InputError
                                            message={form.errors.subdomain}
                                        />
                                    </div>

                                    <div className="space-y-3 sm:col-span-2">
                                        <div className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5 pr-4">
                                                <Label>
                                                    <FormattedMessage defaultMessage="Custom domain" />
                                                </Label>
                                                <FieldDescription>
                                                    <FormattedMessage defaultMessage="Use your own domain instead of the default subdomain." />
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
                                        {form.data.domain_enabled ? (
                                            <div className="space-y-2">
                                                <Label htmlFor="domain">
                                                    <FormattedMessage defaultMessage="Domain" />
                                                    <RequiredMark />
                                                </Label>
                                                <Input
                                                    id="domain"
                                                    placeholder="www.yourdomain.com"
                                                    value={form.data.domain}
                                                    onChange={(e) =>
                                                        form.setData(
                                                            'domain',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={form.errors.domain}
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className={cn(
                            'overflow-hidden border shadow-sm gap-0 py-0',
                            sectionToneStyles.sky.card,
                        )}
                    >
                        <ProfileSectionHeader
                            icon={MapPin}
                            tone="sky"
                            title={
                                <FormattedMessage defaultMessage="Location & contact" />
                            }
                            description={
                                <FormattedMessage defaultMessage="Office contact details and address. Region fields are optional." />
                            }
                        />
                        <CardContent className="grid gap-4 px-6 pt-6 pb-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="phone">
                                    <FormattedMessage defaultMessage="Office phone" />
                                    <RequiredMark />
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
                                    <FormattedMessage defaultMessage="Customer service (WhatsApp)" />
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

                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="address">
                                    <FormattedMessage defaultMessage="Street address" />
                                    <RequiredMark />
                                </Label>
                                <Textarea
                                    id="address"
                                    value={form.data.address}
                                    onChange={(e) =>
                                        form.setData('address', e.target.value)
                                    }
                                    className="min-h-20"
                                />
                                <InputError message={form.errors.address} />
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    <FormattedMessage defaultMessage="Province" />
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
                                    <FormattedMessage defaultMessage="City" />
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
                                    <FormattedMessage defaultMessage="District" />
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
                                    <FormattedMessage defaultMessage="Village" />
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
                                    <FormattedMessage defaultMessage="Postal code" />
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
                                    placeholder="12345"
                                />
                                <InputError message={form.errors.postal_code} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        className={cn(
                            'overflow-hidden border shadow-sm gap-0 py-0',
                            sectionToneStyles.emerald.card,
                        )}
                    >
                        <ProfileSectionHeader
                            icon={ShieldCheck}
                            tone="emerald"
                            title={
                                <FormattedMessage defaultMessage="Verification" />
                            }
                            description={
                                <FormattedMessage defaultMessage="Optional identity documents for account verification." />
                            }
                        />
                        <CardContent className="space-y-6 px-6 pt-6 pb-6">
                            <div className="space-y-2">
                                <Label htmlFor="identity_number">
                                    <FormattedMessage defaultMessage="National ID number (NIK)" />
                                </Label>
                                <Input
                                    id="identity_number"
                                    value={form.data.identity_number}
                                    onChange={(e) =>
                                        form.setData(
                                            'identity_number',
                                            e.target.value.replace(/\D/g, ''),
                                        )
                                    }
                                    className="font-mono tracking-wider"
                                    placeholder="16 digit NIK"
                                    maxLength={16}
                                    inputMode="numeric"
                                />
                                <FieldDescription>
                                    <FormattedMessage defaultMessage="16 digits, numbers only." />
                                </FieldDescription>
                                <InputError
                                    message={form.errors.identity_number}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    <FormattedMessage defaultMessage="Identity card photo" />
                                </Label>
                                <IdentityCardPicker
                                    owner={{
                                        type: 'company',
                                        id: profile.id,
                                    }}
                                    onChange={(
                                        media: { id?: number } | null,
                                    ) => {
                                        form.setData(
                                            'identity_card_id',
                                            media?.id,
                                        );
                                    }}
                                    defaultValue={profile.identity_card}
                                />
                                <InputError
                                    message={form.errors.identity_card_id}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={form.processing}
                            size="lg"
                            className="h-11 w-full sm:w-auto"
                        >
                            {form.processing ? (
                                <Spinner className="mr-2" />
                            ) : (
                                <Save className="mr-2 size-4" />
                            )}
                            <FormattedMessage defaultMessage="Save changes" />
                        </Button>
                    </div>
                </form>
            </div>
        </CompanyDashboardLayout>
    );
}
