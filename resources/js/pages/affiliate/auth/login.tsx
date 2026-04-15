import InputError from '@/components/input-error';
import AuthLayout from '@/components/layouts/auth/auth-layout';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, useForm } from '@inertiajs/react';
import React from 'react';

export default function Login() {
  const { data, setData, post, processing, errors, reset } = useForm({
    login: '',
    password: '',
    remember: false,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/affiliate/login', {
      onFinish: () => reset('password'),
    });
  };

  return (
    <AuthLayout
      title="Log in to your account"
      description="Enter your email or username and password to access your dashboard"
    >
      <Head title="Log in" />

      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="grid gap-6">
          {/* Kolom Input Login (Email / Username) */}
          <div className="grid gap-2">
            <Label htmlFor="login">Email or Username</Label>
            <Input
              id="login"
              type="text" // Diubah ke 'text' agar bisa menerima username tanpa '@'
              name="login"
              value={data.login}
              autoFocus
              onChange={(e) => setData('login', e.target.value)}
              placeholder="email@example.com or username"
            />
            <InputError message={errors.login} />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              name="password"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              placeholder="Password"
            />
            <InputError message={errors.password} />
          </div>

          <Button type="submit" className="w-full" disabled={processing}>
            {processing && <Spinner />}
            Log in
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <TextLink href="/affiliate/register">Sign up</TextLink>
        </div>
      </form>
    </AuthLayout>
  );
}
