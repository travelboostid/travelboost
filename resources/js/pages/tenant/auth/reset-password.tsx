import InputError from '@/components/input-error';
import AuthLayout from '@/components/layouts/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, useForm } from '@inertiajs/react';
import React from 'react';

type Props = {
  token: string;
  email: string;
  company?: any;
};

export default function ResetPassword({ token, email, company }: Props) {
  const { data, setData, post, processing, errors, reset } = useForm({
    token: token,
    email: email,
    password: '',
    password_confirmation: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/reset-password', {
      onFinish: () => reset('password', 'password_confirmation'),
    });
  };

  return (
    <AuthLayout
      title={`Reset password - ${company?.name || 'Agent'}`}
      description="Please enter your new password below"
    >
      <Head title="Reset password" />

      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              className="mt-1 block w-full"
              readOnly
            />
            <InputError message={errors.email} className="mt-2" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              autoComplete="new-password"
              className="mt-1 block w-full"
              autoFocus
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
              autoComplete="new-password"
              className="mt-1 block w-full"
              placeholder="Confirm password"
            />
            <InputError message={errors.password_confirmation} className="mt-2" />
          </div>

          <Button type="submit" className="mt-4 w-full" disabled={processing}>
            {processing && <Spinner />}
            Reset password
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}