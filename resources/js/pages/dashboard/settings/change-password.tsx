import { update } from '@/actions/App/Http/Controllers/DashboardSettingsChangePasswordController';
import InputError from '@/components/input-error';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Form, Head } from '@inertiajs/react';

export default function ChangePassword() {
  return (
    <DashboardLayout
      openMenuIds={['settings']}
      activeMenuIds={[`settings.change-password`]}
      breadcrumb={[
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Settings' },
        { title: 'Change Password' },
      ]}
    >
      <Head title="Change Password" />
      <div className="max-w-lg p-4">
        <Form
          {...update.form()}
          className="flex flex-col gap-6"
          setDefaultsOnSuccess
        >
          {({ processing, errors }) => (
            <>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="current_password">Old Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    name="current_password"
                    required
                    autoComplete="current_password"
                    placeholder="Current password"
                  />
                  <InputError message={errors.current_password} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    required
                    autoComplete="password"
                    placeholder="New Password"
                  />
                  <InputError message={errors.password} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password_confirmation">
                    Confirm New Password
                  </Label>
                  <Input
                    id="password_confirmation"
                    type="password"
                    name="password_confirmation"
                    required
                    autoComplete="password_confirmation"
                    placeholder="New Password"
                  />
                  <InputError message={errors.password_confirmation} />
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
