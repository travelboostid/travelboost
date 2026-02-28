import ProfileController from '@/actions/App/Http/Controllers/Me/Settings/ProfileController';
import type { MediaResource } from '@/api/model';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import UserDashboardLayout from '@/components/layouts/user-dashboard';
import { MediaPicker } from '@/components/media-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { send } from '@/routes/verification';
import { Transition } from '@headlessui/react';
import { Form, Head, Link } from '@inertiajs/react';
import { UserIcon } from 'lucide-react';

export default function Profile({
  mustVerifyEmail,
  status,
}: {
  mustVerifyEmail: boolean;
  status?: string;
}) {
  const { auth } = usePageSharedDataProps();

  return (
    <UserDashboardLayout breadcrumb={[{ title: 'Profile Settings' }]}>
      <Head title="Profile settings" />

      <h1 className="sr-only">Profile Settings</h1>
      <div className="space-y-6 p-4">
        <Heading
          variant="small"
          title="Profile information"
          description="Update your name and email address"
        />

        <Form
          {...ProfileController.update.form()}
          options={{
            preserveScroll: true,
          }}
          className="space-y-6"
        >
          {({ processing, recentlySuccessful, errors }) => (
            <>
              <div className="grid justify-items-center gap-2">
                <MediaPicker
                  params={{ owner_type: 'user', owner_id: auth.user.id }}
                  uploadParams={{ owner_type: 'user', owner_id: auth.user.id }}
                  defaultValue={auth.user.photo_url}
                  type="photo"
                >
                  {(media, change) => (
                    <>
                      <Avatar className="h-40 w-40">
                        <AvatarImage
                          src={
                            typeof media === 'string'
                              ? media
                              : ((media?.data as any)?.files as any[])?.[0]?.url
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
                      <Button className="w-fit" onClick={change} type="button">
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
                  defaultValue={auth.user.username}
                />
                <InputError message={errors.username} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>

                <Input
                  id="name"
                  className="mt-1 block w-full"
                  defaultValue={auth.user.name}
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Full name"
                />

                <InputError className="mt-2" message={errors.name} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email address</Label>

                <Input
                  id="email"
                  type="email"
                  className="mt-1 block w-full"
                  defaultValue={auth.user.email}
                  name="email"
                  required
                  autoComplete="username"
                  placeholder="Email address"
                />

                <InputError className="mt-2" message={errors.email} />
              </div>

              {mustVerifyEmail && auth.user.email_verified_at === null && (
                <div>
                  <p className="-mt-4 text-sm text-muted-foreground">
                    Your email address is unverified.{' '}
                    <Link
                      href={send()}
                      as="button"
                      className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                    >
                      Click here to resend the verification email.
                    </Link>
                  </p>

                  {status === 'verification-link-sent' && (
                    <div className="mt-2 text-sm font-medium text-green-600">
                      A new verification link has been sent to your email
                      address.
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4">
                <Button disabled={processing} data-test="update-profile-button">
                  Save
                </Button>

                <Transition
                  show={recentlySuccessful}
                  enter="transition ease-in-out"
                  enterFrom="opacity-0"
                  leave="transition ease-in-out"
                  leaveTo="opacity-0"
                >
                  <p className="text-sm text-neutral-600">Saved</p>
                </Transition>
              </div>
            </>
          )}
        </Form>
      </div>
    </UserDashboardLayout>
  );
}
