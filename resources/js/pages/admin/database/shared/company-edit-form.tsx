import type { MediaResource } from '@/api/model';
import { PhotoPicker } from '@/components/media/photo-picker';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import type { AdminCompanyRow } from './company-types';

type CompanyEditFormProps = {
    company: AdminCompanyRow;
    entityLabel: 'Agent' | 'Vendor';
    updateUrl: string;
};

export function CompanyEditForm({
    company,
    entityLabel,
    updateUrl,
}: CompanyEditFormProps) {
    const form = useForm({
        name: company.name,
        username: company.username,
        email: company.email,
        phone: company.phone ?? '',
        customer_service_phone: company.customer_service_phone ?? '',
        address: company.address ?? '',
        note: company.note ?? '',
        photo_id: company.photo_id,
        allow_package_one_agents: company.allow_package_one_agents ?? false,
    });

    const handleSubmit = () => {
        form.put(updateUrl, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`${entityLabel} updated successfully`);
            },
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{entityLabel} profile</CardTitle>
                <CardDescription>
                    Update company account details and notes.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                    <PhotoPicker
                        owner={{ type: 'company', id: company.id }}
                        defaultValue={company.photo_url}
                        onChange={(media) =>
                            form.setData(
                                'photo_id',
                                (media as MediaResource)?.id ?? null,
                            )
                        }
                    />
                    <div className="min-w-0 flex-1 space-y-1 text-center sm:text-left">
                        <p className="text-sm font-medium text-foreground">
                            Company logo
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Upload or select an existing image from this
                            company&apos;s media library.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                        <FieldLabel htmlFor="name">Name</FieldLabel>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                        />
                        <FieldError>{form.errors.name}</FieldError>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="username">Username</FieldLabel>
                        <Input
                            id="username"
                            value={form.data.username}
                            onChange={(e) =>
                                form.setData('username', e.target.value)
                            }
                        />
                        <FieldError>{form.errors.username}</FieldError>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                            id="email"
                            type="email"
                            value={form.data.email}
                            onChange={(e) =>
                                form.setData('email', e.target.value)
                            }
                        />
                        <FieldError>{form.errors.email}</FieldError>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="phone">Phone</FieldLabel>
                        <Input
                            id="phone"
                            value={form.data.phone}
                            onChange={(e) =>
                                form.setData('phone', e.target.value)
                            }
                        />
                        <FieldError>{form.errors.phone}</FieldError>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="customer_service_phone">
                            Customer service phone
                        </FieldLabel>
                        <Input
                            id="customer_service_phone"
                            value={form.data.customer_service_phone}
                            onChange={(e) =>
                                form.setData(
                                    'customer_service_phone',
                                    e.target.value,
                                )
                            }
                        />
                        <FieldError>
                            {form.errors.customer_service_phone}
                        </FieldError>
                    </Field>
                    <Field className="sm:col-span-2">
                        <FieldLabel htmlFor="address">Address</FieldLabel>
                        <Input
                            id="address"
                            value={form.data.address}
                            onChange={(e) =>
                                form.setData('address', e.target.value)
                            }
                        />
                        <FieldError>{form.errors.address}</FieldError>
                    </Field>
                    <Field className="sm:col-span-2">
                        <FieldLabel htmlFor="note">Note</FieldLabel>
                        <Textarea
                            id="note"
                            rows={4}
                            value={form.data.note}
                            onChange={(e) =>
                                form.setData('note', e.target.value)
                            }
                            placeholder="Optional note about this company."
                        />
                        <FieldError>{form.errors.note}</FieldError>
                    </Field>
                    {entityLabel === 'Vendor' ? (
                        <Field className="sm:col-span-2">
                            <div className="flex items-start justify-between gap-4 rounded-xl border border-border/70 p-4">
                                <div className="space-y-1">
                                    <FieldLabel htmlFor="allow_package_one_agents">
                                        Allow package `1` agents
                                    </FieldLabel>
                                    <FieldDescription>
                                        Free-trial agents can book this vendor,
                                        appear in booking step 1, and keep
                                        subdomain access only when this is
                                        enabled.
                                    </FieldDescription>
                                </div>
                                <Switch
                                    id="allow_package_one_agents"
                                    checked={form.data.allow_package_one_agents}
                                    onCheckedChange={(checked) =>
                                        form.setData(
                                            'allow_package_one_agents',
                                            checked,
                                        )
                                    }
                                />
                            </div>
                            <FieldError>
                                {form.errors.allow_package_one_agents}
                            </FieldError>
                        </Field>
                    ) : null}
                </div>

                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={form.processing}
                >
                    Save {entityLabel.toLowerCase()}
                </Button>
            </CardContent>
        </Card>
    );
}
