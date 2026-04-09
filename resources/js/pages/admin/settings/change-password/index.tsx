import PasswordController from '@/actions/App/Http/Controllers/Me/Settings/PasswordController';
import InputError from '@/components/input-error';
import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { useRef } from 'react';

export default function ChangePasswordPage() {
  const passwordInput = useRef<HTMLInputElement>(null);
  const currentPasswordInput = useRef<HTMLInputElement>(null);

  return (
    <AdminDashboardLayout
      openMenuIds={['settings']}
      activeMenuIds={['settings']}
      containerClassName="p-4"
      breadcrumb={[{ title: 'Settings' }, { title: 'Changes Password' }]}
    >
      <Head title="Change Password" />
      <div className="mx-auto max-w-xl">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Change Password</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Ensure your account is using a long, random password to stay secure.
          </p>

          <Form
            {...PasswordController.update.form()}
            options={{
              preserveScroll: true,
            }}
            resetOnError={[
              'password',
              'password_confirmation',
              'current_password',
            ]}
            resetOnSuccess
            onError={(errors) => {
              if (errors.password) {
                passwordInput.current?.focus();
              }

              if (errors.current_password) {
                currentPasswordInput.current?.focus();
              }
            }}
            className="space-y-4"
          >
            {({ errors, processing, recentlySuccessful }) => (
              <>
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    ref={currentPasswordInput}
                    name="current_password"
                    type="password"
                    className="block w-full"
                    autoComplete="current-password"
                  />
                  <InputError message={errors.current_password} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    ref={passwordInput}
                    name="password"
                    type="password"
                    className="block w-full"
                    autoComplete="new-password"
                  />
                  <InputError message={errors.password} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_confirmation">
                    Confirm Password
                  </Label>
                  <Input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    className="block w-full"
                    autoComplete="new-password"
                  />
                  <InputError message={errors.password_confirmation} />
                </div>

                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                    Update Password
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
      </div>
    </AdminDashboardLayout>
  );
}
