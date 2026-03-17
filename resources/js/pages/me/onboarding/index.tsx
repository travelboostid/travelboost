import InputError from '@/components/input-error';
import UserDashboardLayout from '@/components/layouts/user-dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Form, Head } from '@inertiajs/react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createCompany } from '@/routes/me/onboarding';
import { CircleAlertIcon } from 'lucide-react';

export default function Register() {
  return (
    <UserDashboardLayout
      containerClassName="p-4"
      breadcrumb={[{ title: 'Onboarding' }]}
    >
      <Head title="Register an agent account" />
      <div className="grid gap-4 max-w-240 mx-auto">
        <Alert className="border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400">
          <CircleAlertIcon />
          <AlertTitle>Please complete your agent registration</AlertTitle>
          <AlertDescription className="text-sky-600/80 dark:text-sky-400/80">
            Fill in the details below to create your agent account and start
            managing your bookings and customers.
          </AlertDescription>
        </Alert>
        <Form
          {...createCompany.form()}
          disableWhileProcessing
          className="flex flex-col gap-6"
        >
          {({ processing, errors }) => (
            <>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    autoFocus
                    tabIndex={1}
                    autoComplete="name"
                    name="name"
                    placeholder="Full name"
                  />
                  <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Company Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    tabIndex={2}
                    autoComplete="email"
                    name="email"
                    placeholder="email@example.com"
                  />
                  <InputError message={errors.email} />
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
                  />
                  <InputError message={errors.username} className="mt-2" />
                </div>

                <Button
                  type="submit"
                  className="mt-2 w-full"
                  tabIndex={5}
                  data-test="register-user-button"
                >
                  {processing && <Spinner />}
                  Create agent account
                </Button>
              </div>
            </>
          )}
        </Form>
      </div>
    </UserDashboardLayout>
  );
}
