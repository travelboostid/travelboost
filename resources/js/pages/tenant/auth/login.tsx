import InputError from '@/components/input-error';
import AuthLayout from '@/components/layouts/auth/auth-layout';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, useForm } from '@inertiajs/react';
import React from 'react';

type Props = {
  status?: string;
  canResetPassword?: boolean;
  canRegister?: boolean;
  company?: any;
};

export default function Login({ status, canResetPassword, canRegister, company }: Props) {
  const { data, setData, post, processing, errors, reset } = useForm({
    username_or_email: '',
    password: '',
    remember: false,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/login', {
      onFinish: () => reset('password'),
    });
  };

  return (
    <AuthLayout
      title={`Log in to ${company?.name || 'Agent'}`}
      description="Enter your email or username and password below to log in"
    >
      <Head title="Log in" />

      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="username_or_email">Username or Email</Label>
            <Input
              id="username_or_email"
              type="text"
              name="username_or_email"
              value={data.username_or_email}
              onChange={(e) => setData('username_or_email', e.target.value)}
              required
              autoFocus
              tabIndex={1}
              autoComplete="username_or_email"
              placeholder="bintang123 or email@example.com"
            />
            <InputError message={errors.username_or_email} />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              {canResetPassword && (
                <TextLink href="/forgot-password" className="ml-auto text-sm" tabIndex={5}>
                  Forgot password?
                </TextLink>
              )}
            </div>
            <Input
              id="password"
              type="password"
              name="password"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              required
              tabIndex={2}
              autoComplete="current-password"
              placeholder="Password"
            />
            <InputError message={errors.password} />
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="remember"
              name="remember"
              checked={data.remember}
              onCheckedChange={(checked) => setData('remember', checked as boolean)}
              tabIndex={3}
            />
            <Label htmlFor="remember">Remember me</Label>
          </div>

          <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing}>
            {processing && <Spinner />}
            Log in
          </Button>
        </div>

        {canRegister && (
          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <TextLink href="/register" tabIndex={5}>
              Sign up
            </TextLink>
          </div>
        )}
      </form>

      {status && (
        <div className="mb-4 text-center text-sm font-medium text-green-600">
          {status}
        </div>
      )}
    </AuthLayout>
  );
}