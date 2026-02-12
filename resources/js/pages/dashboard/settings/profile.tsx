import type { MediaResource } from '@/api/model';
import InputError from '@/components/input-error';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { MediaPicker } from '@/components/media-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { User } from '@/types';
import { Form, Head } from '@inertiajs/react';
import { UserIcon } from 'lucide-react';

type Props = {
  user: User;
};

export default function Profile({ user }: Props) {
  return (
    <DashboardLayout
      openMenuIds={['settings']}
      activeMenuIds={[`settings.profile`]}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Settings' },
        { title: 'Profile' },
      ]}
    >
      <Head title="Profile" />
      <div className="p-4">
        <Form
          action="/dashboard/settings/profile"
          method="put"
          className="flex flex-col gap-6"
          setDefaultsOnSuccess
        >
          {({ processing, errors }) => (
            <>
              <div className="grid gap-6">
                <div className="grid justify-items-center gap-2">
                  <MediaPicker defaultValue={user.photo_url} type="photo">
                    {(media, change) => (
                      <>
                        <Avatar className="h-40 w-40">
                          <AvatarImage
                            src={
                              typeof media === 'string'
                                ? media
                                : (media?.data?.files as any[])?.[0]?.url
                            }
                          />
                          <AvatarFallback>
                            <UserIcon />
                          </AvatarFallback>
                        </Avatar>
                        <input
                          type="hidden"
                          name="photo_id"
                          value={(media as MediaResource)?.id}
                        />
                        <Button
                          className="w-fit"
                          onClick={change}
                          type="button"
                        >
                          Change
                        </Button>
                      </>
                    )}
                  </MediaPicker>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    name="username"
                    required
                    autoComplete="username"
                    placeholder="john_doe"
                    defaultValue={user.username}
                  />
                  <InputError message={errors.username} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    disabled
                    id="email"
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="john@example.com"
                    defaultValue={user.email}
                  />
                  <InputError message={errors.email} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="John Doe"
                    defaultValue={user.name}
                  />
                  <InputError message={errors.name} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    name="phone"
                    required
                    autoComplete="tel"
                    placeholder="+1 (555) 123-4567"
                    defaultValue={user.phone || ''}
                  />
                  <InputError message={errors.phone} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <textarea
                    id="address"
                    name="address"
                    required
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="123 Main St, City, State, ZIP Code"
                    defaultValue={user.address || ''}
                  />
                  <InputError message={errors.address} />
                </div>

                <Button
                  type="submit"
                  className="mt-4 w-full"
                  tabIndex={4}
                  disabled={processing}
                >
                  {processing && <Spinner />}
                  Update
                </Button>
              </div>
            </>
          )}
        </Form>
      </div>
    </DashboardLayout>
  );
}
