import GeoCitySelector from '@/components/geo-city-selector';
import GeoDistrictSelector from '@/components/geo-district-selector';
import GeoProvinceSelector from '@/components/geo-province-selector';
import GeoVillageSelector from '@/components/geo-village-selector';
import InputError from '@/components/input-error';
import TenantLayout from '@/components/layouts/tenant-layout';
import { PhotoPicker } from '@/components/media/photo-picker';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    KeyRoundIcon,
    MailIcon,
    MapPinIcon,
    SaveIcon,
    UserIcon,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

type CustomerProfile = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    username: string;
    gender?: string | null;
    photo_id?: number | null;
    photo_url?: string | null;
    province_id?: number | null;
    city_id?: number | null;
    district_id?: number | null;
    village_id?: number | null;
    postal_code?: string | null;
};

type CustomerProfilePageProps = {
    profile: CustomerProfile;
};

const getMediaId = (media: any) => media?.id ?? media?.data?.id ?? undefined;

export default function CustomerProfilePage({
    profile,
}: CustomerProfilePageProps) {
    const { url } = usePage();
    const [passwordOpen, setPasswordOpen] = useState(() => {
        const params = new URLSearchParams(url.split('?')[1] || '');

        return params.get('change_password') === '1';
    });
    const profileForm = useForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        username: profile.username || '',
        gender: profile.gender || 'unspecified',
        photo_id: profile.photo_id || undefined,
        province_id: profile.province_id || 0,
        city_id: profile.city_id || 0,
        district_id: profile.district_id || 0,
        village_id: profile.village_id || 0,
        postal_code: profile.postal_code || '',
    });
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submitProfile = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        profileForm.transform((data) => ({
            ...data,
            photo_id: data.photo_id || null,
            province_id: data.province_id || null,
            city_id: data.city_id || null,
            district_id: data.district_id || null,
            village_id: data.village_id || null,
            postal_code: data.postal_code || null,
        }));

        profileForm.patch('/customers/profile', {
            preserveScroll: true,
            onSuccess: () => toast.success('Profile updated successfully.'),
            onError: () =>
                toast.error('Please check the profile form and try again.'),
        });
    };

    const submitPassword = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        passwordForm.put('/customers/profile/password', {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset();
                setPasswordOpen(false);
                toast.success('Password updated successfully.');
            },
        });
    };

    return (
        <TenantLayout>
            <Head title="Customer Profile" />

            <main className="bg-background py-10 text-foreground sm:py-14">
                <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 rounded-[1.5rem] border border-border bg-card p-5 shadow-sm sm:p-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                                    Travel Desk
                                </p>
                                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                                    Customer Profile
                                </h1>
                                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                    Manage your account identity, contact
                                    details, and address for future bookings.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 rounded-full px-5"
                                onClick={() => setPasswordOpen(true)}
                            >
                                <KeyRoundIcon className="size-4" />
                                Change Password
                            </Button>
                        </div>
                    </div>

                    <form
                        onSubmit={submitProfile}
                        className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]"
                    >
                        <section className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
                            <div className="flex flex-col items-center gap-4">
                                <PhotoPicker
                                    owner={{ type: 'user', id: profile.id }}
                                    defaultValue={profile.photo_url}
                                    onChange={(media: any) =>
                                        profileForm.setData(
                                            'photo_id',
                                            getMediaId(media),
                                        )
                                    }
                                />
                                <div className="text-center">
                                    <p className="text-base font-semibold text-foreground">
                                        {profileForm.data.name || 'Customer'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        @{profileForm.data.username}
                                    </p>
                                </div>
                                <InputError
                                    message={profileForm.errors.photo_id}
                                />
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm sm:p-6">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <UserIcon className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">
                                            Personal Information
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            Keep your booking identity accurate.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={profileForm.data.name}
                                            onChange={(event) =>
                                                profileForm.setData(
                                                    'name',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={profileForm.errors.name}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="username">
                                            Username
                                        </Label>
                                        <Input
                                            id="username"
                                            value={profileForm.data.username}
                                            onChange={(event) =>
                                                profileForm.setData(
                                                    'username',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                profileForm.errors.username
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={profileForm.data.email}
                                            onChange={(event) =>
                                                profileForm.setData(
                                                    'email',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={profileForm.errors.email}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={profileForm.data.phone}
                                            onChange={(event) =>
                                                profileForm.setData(
                                                    'phone',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={profileForm.errors.phone}
                                        />
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>Gender</Label>
                                        <Select
                                            value={profileForm.data.gender}
                                            onValueChange={(value) =>
                                                profileForm.setData(
                                                    'gender',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unspecified">
                                                    Prefer not to say
                                                </SelectItem>
                                                <SelectItem value="male">
                                                    Male
                                                </SelectItem>
                                                <SelectItem value="female">
                                                    Female
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={profileForm.errors.gender}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm sm:p-6">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <MapPinIcon className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">
                                            Address
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            Used for invoices and booking
                                            correspondence.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="address">
                                            Detail Address
                                        </Label>
                                        <Textarea
                                            id="address"
                                            value={profileForm.data.address}
                                            onChange={(event) =>
                                                profileForm.setData(
                                                    'address',
                                                    event.target.value,
                                                )
                                            }
                                            className="min-h-24"
                                        />
                                        <InputError
                                            message={profileForm.errors.address}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Province</Label>
                                        <GeoProvinceSelector
                                            value={String(
                                                profileForm.data.province_id ||
                                                    '',
                                            )}
                                            onValueChange={(value) => {
                                                profileForm.setData(
                                                    'province_id',
                                                    Number(value),
                                                );
                                                profileForm.setData(
                                                    'city_id',
                                                    0,
                                                );
                                                profileForm.setData(
                                                    'district_id',
                                                    0,
                                                );
                                                profileForm.setData(
                                                    'village_id',
                                                    0,
                                                );
                                            }}
                                        />
                                        <InputError
                                            message={
                                                profileForm.errors.province_id
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <GeoCitySelector
                                            provinceId={
                                                profileForm.data.province_id
                                            }
                                            value={String(
                                                profileForm.data.city_id || '',
                                            )}
                                            onValueChange={(value) => {
                                                profileForm.setData(
                                                    'city_id',
                                                    Number(value),
                                                );
                                                profileForm.setData(
                                                    'district_id',
                                                    0,
                                                );
                                                profileForm.setData(
                                                    'village_id',
                                                    0,
                                                );
                                            }}
                                        />
                                        <InputError
                                            message={profileForm.errors.city_id}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>District</Label>
                                        <GeoDistrictSelector
                                            cityId={profileForm.data.city_id}
                                            value={String(
                                                profileForm.data.district_id ||
                                                    '',
                                            )}
                                            onValueChange={(value) => {
                                                profileForm.setData(
                                                    'district_id',
                                                    Number(value),
                                                );
                                                profileForm.setData(
                                                    'village_id',
                                                    0,
                                                );
                                            }}
                                        />
                                        <InputError
                                            message={
                                                profileForm.errors.district_id
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Village</Label>
                                        <GeoVillageSelector
                                            districtId={
                                                profileForm.data.district_id
                                            }
                                            value={String(
                                                profileForm.data.village_id ||
                                                    '',
                                            )}
                                            onValueChange={(value) =>
                                                profileForm.setData(
                                                    'village_id',
                                                    Number(value),
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                profileForm.errors.village_id
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="postal_code">
                                            Postal Code
                                        </Label>
                                        <Input
                                            id="postal_code"
                                            value={profileForm.data.postal_code}
                                            onChange={(event) =>
                                                profileForm.setData(
                                                    'postal_code',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                profileForm.errors.postal_code
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    className="h-11 rounded-full px-6"
                                    disabled={profileForm.processing}
                                >
                                    <SaveIcon className="size-4" />
                                    Save Profile
                                </Button>
                            </div>
                        </section>
                    </form>
                </div>
            </main>

            <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
                <DialogContent className="rounded-[1.5rem] sm:max-w-md">
                    <DialogHeader>
                        <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <MailIcon className="size-5" />
                        </div>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Use a strong password to keep your bookings secure.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current_password">
                                Current Password
                            </Label>
                            <Input
                                id="current_password"
                                type="password"
                                value={passwordForm.data.current_password}
                                onChange={(event) =>
                                    passwordForm.setData(
                                        'current_password',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={passwordForm.errors.current_password}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(event) =>
                                    passwordForm.setData(
                                        'password',
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={passwordForm.errors.password}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">
                                Confirm New Password
                            </Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(event) =>
                                    passwordForm.setData(
                                        'password_confirmation',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setPasswordOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={passwordForm.processing}
                            >
                                Save Password
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </TenantLayout>
    );
}
