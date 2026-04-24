import InputError from '@/components/input-error';
import AuthLayout from '@/components/layouts/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { Form, Head } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <AuthLayout
        title="Log in to your admin account"
        description="Enter your email and password below to log in"
      >
        <Head title="Log in" />

        <Form
          {...store.form()}
          resetOnSuccess={['password']}
          className="flex flex-col gap-6"
        >
          {({ processing, errors }) => (
            <>
              <input type="hidden" name="intent" value="login-as-admin" />
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="username_or_email">Username or Email</Label>
                  <Input
                    id="username_or_email"
                    type="text"
                    name="username_or_email"
                    required
                    autoFocus
                    tabIndex={1}
                    autoComplete="username_or_email"
                    placeholder="john_doe or john@doe.com"
                  />
                  <InputError message={errors.username_or_email} />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      tabIndex={2}
                      autoComplete="current-password"
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <InputError message={errors.password} />
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox id="remember" name="remember" tabIndex={3} />
                  <Label htmlFor="remember">Remember me</Label>
                </div>

                <Button
                  type="submit"
                  className="mt-4 w-full"
                  tabIndex={4}
                  disabled={processing}
                  data-test="login-button"
                >
                  {processing && <Spinner />}
                  Log in
                </Button>
              </div>
            </>
          )}
        </Form>
      </AuthLayout>
    </>
  );
}
