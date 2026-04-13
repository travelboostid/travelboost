import InputError from '@/components/input-error';
import AuthLayout from '@/components/layouts/auth/auth-layout';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, useForm, usePage } from '@inertiajs/react';
import React from 'react';

export default function Register() {
  const { referralCode, uplineName } = usePage().props as any;

  // Gunakan useForm standar agar data terkirim ke Affiliate Controller, bukan Vendor
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    username: '',
    password: '',
    password_confirmation: '',
    referral_code: referralCode || '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/affiliate/register');
  };

  return (
    <AuthLayout
      title="Create an account"
      description="Enter your details below to create your affiliate account"
    >
      <Head title="Register" />
      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="grid gap-6">
          {referralCode && (
            <div className="p-4 bg-muted/50 border rounded-lg space-y-2">
              <Label>Invited By:</Label>
              <div className="text-primary font-bold text-lg">{uplineName}</div>
              <Input
                value={data.referral_code}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                You are registering under this network. This code cannot be
                changed.
              </p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              required
              placeholder="Full name"
            />
            <InputError message={errors.name} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              required
              placeholder="email@example.com"
            />
            <InputError message={errors.email} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={data.username}
              onChange={(e) => setData('username', e.target.value)}
              required
              placeholder="Username"
            />
            <InputError message={errors.username} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              required
              placeholder="Password"
            />
            <InputError message={errors.password} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password_confirmation">Confirm password</Label>
            <Input
              id="password_confirmation"
              type="password"
              value={data.password_confirmation}
              onChange={(e) => setData('password_confirmation', e.target.value)}
              required
              placeholder="Confirm password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={processing}>
            {processing && <Spinner />}
            Create account
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <TextLink href="/affiliate/login">Log in</TextLink>
        </div>
      </form>
    </AuthLayout>
  );
}
