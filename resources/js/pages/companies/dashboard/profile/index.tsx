import { update } from '@/actions/App/Http/Controllers/Companies/Dashboard/ProfileController';
import InputError from '@/components/input-error';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { MediaPicker } from '@/components/media-picker';
import { Button } from '@/components/ui/button';
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
import { extractImageSrc } from '@/lib/utils';
import { Head, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

export type ProfilePageProps = {
  profile: any;
};

export default function Profile({ profile }: ProfilePageProps) {
  console.log('profile', profile);
  const form = useForm({
    name: profile.name,
    email: profile.email,
    username: profile.username,
    phone: (profile.phone || '') as string,
    customer_service_phone: profile.customer_service_phone || '',
    address: profile.address || '',
    subdomain: profile.domain.subdomain,
    domain_enabled: profile.domain.domain_enabled,
    domain: profile.domain.domain || '',
    photo_id: profile.photo_id || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.setData('photo_id', form.data.photo_id || undefined);
    form.put(update({ company: profile.username }).url, {
      onSuccess: () => {
        toast.success('Profile updated successfully');
      },
    });
  };

  return (
    <CompanyDashboardLayout
      breadcrumb={[{ title: 'Settings' }, { title: 'Profile' }]}
      openMenuIds={['settings']}
      activeMenuIds={[`settings.profile`]}
      containerClassName=""
    >
      <Head title="Profile" />

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 p-4 max-w-4xl mx-auto"
      >
        <div className="grid grid-cols-2 gap-6">
          <div className="grid gap-2 col-span-2">
            <MediaPicker
              params={{ owner_type: 'company', owner_id: profile.id }}
              uploadParams={{
                owner_type: 'company',
                owner_id: profile.id,
              }}
              type="photo"
              onChange={(media) => form.setData('photo_id', (media as any)?.id)}
            >
              {(media, change) => (
                <div className="flex flex-col items-center justify-items-center gap-2">
                  <img
                    className="aspect-square max-w-30 rounded-full object-cover shadow"
                    src={
                      typeof media === 'string'
                        ? media
                        : extractImageSrc(media as any).src
                    }
                  />
                  <Button className="w-fit" onClick={change} type="button">
                    Change
                  </Button>
                </div>
              )}
            </MediaPicker>
            <InputError message={form.errors.name} className="mt-2" />
          </div>
          <div className="grid gap-2 col-span-2">
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              type="text"
              required
              autoFocus
              tabIndex={1}
              autoComplete="name"
              name="name"
              placeholder="Professional Travel Agency"
              value={form.data.name}
              onChange={(e) => form.setData('name', e.target.value)}
            />
            <InputError message={form.errors.name} className="mt-2" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Company Email</Label>
            <Input
              id="email"
              type="email"
              disabled
              required
              tabIndex={2}
              autoComplete="email"
              name="email"
              placeholder="email@example.com"
              value={form.data.email}
              onChange={(e) => form.setData('email', e.target.value)}
            />
            <InputError message={form.errors.email} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="username">Company Username</Label>
            <Input
              id="username"
              type="text"
              required
              autoFocus
              tabIndex={1}
              autoComplete="username"
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
            <InputError message={form.errors.username} className="mt-2" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Company Phone</Label>
            <Input
              id="phone"
              type="text"
              required
              autoFocus
              tabIndex={1}
              autoComplete="tel"
              name="phone"
              placeholder="Phone number"
              value={form.data.phone}
              onChange={(e) => form.setData('phone', e.target.value)}
            />
            <InputError message={form.errors.phone} className="mt-2" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customer_service_phone">
              Customer Service Phone
            </Label>
            <Input
              id="customer_service_phone"
              type="text"
              required
              autoFocus
              tabIndex={1}
              autoComplete="tel"
              name="customer_service_phone"
              placeholder="Phone number"
              value={form.data.customer_service_phone}
              onChange={(e) =>
                form.setData('customer_service_phone', e.target.value)
              }
            />
            <InputError
              message={form.errors.customer_service_phone}
              className="mt-2"
            />
          </div>

          <div className="grid gap-2 col-span-2">
            <Label htmlFor="address">Company Address</Label>
            <FieldDescription>
              Enter the full address of your company.
            </FieldDescription>
            <Input
              id="address"
              type="text"
              required
              autoFocus
              tabIndex={1}
              autoComplete="address"
              name="address"
              placeholder="Full address"
              value={form.data.address}
              onChange={(e) => form.setData('address', e.target.value)}
            />
            <InputError message={form.errors.address} className="mt-2" />
          </div>

          <div className="grid gap-2 col-span-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <FieldDescription>
              This URL will point to your public tour catalog. You can setup
              custom domain like <code>example.com</code> later.
            </FieldDescription>
            <InputGroup>
              <InputGroupInput
                id="subdomain"
                type="text"
                required
                autoFocus
                tabIndex={1}
                autoComplete="subdomain"
                name="subdomain"
                placeholder="example"
                value={form.data.subdomain}
                onChange={(e) => form.setData('subdomain', e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                .{import.meta.env.VITE_APP_HOST}
                {import.meta.env.VITE_APP_PORT
                  ? `:${import.meta.env.VITE_APP_PORT}`
                  : ''}
              </InputGroupAddon>
            </InputGroup>
            <InputError message={form.errors.subdomain} className="mt-2" />
          </div>

          <Separator className="col-span-2" />
          <div className="grid gap-2 col-span-2">
            <div className="flex gap-2">
              <Label htmlFor="domain">Custom Domain</Label>
              <Switch
                checked={form.data.domain_enabled}
                onCheckedChange={(checked) =>
                  form.setData('domain_enabled', checked)
                }
              />
            </div>
            <FieldDescription>
              You can setup custom domain like <code>example.com</code> that
              points to your landing page and public tour catalog. This requires
              additional DNS configuration. You can also use the default
              subdomain provided by the system.
            </FieldDescription>
            <div className="flex gap-2">
              {form.data.domain_enabled ? (
                <Input
                  className="flex-1"
                  id="domain"
                  type="text"
                  required
                  autoFocus
                  tabIndex={1}
                  autoComplete="domain"
                  placeholder="example.com"
                  value={form.data.domain}
                  onChange={(e) => form.setData('domain', e.target.value)}
                />
              ) : (
                <div className="text-muted-foreground text-xs">
                  Custom domain is not enabled.
                </div>
              )}
            </div>
            <InputError message={form.errors.domain} className="mt-2" />
          </div>

          <div className="col-span-2">
            <Button
              disabled={form.processing}
              type="submit"
              className="mt-2 w-full"
              tabIndex={5}
              data-test="register-user-button"
            >
              {form.processing && <Spinner />}
              Update Profile
            </Button>
          </div>
        </div>
      </form>
    </CompanyDashboardLayout>
  );
}
