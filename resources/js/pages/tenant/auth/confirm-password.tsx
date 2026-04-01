import InputError from '@/components/input-error';
import AuthLayout from '@/components/layouts/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, useForm } from '@inertiajs/react';
import React from 'react';

export default function ConfirmPassword({ company }: { company?: any }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    password: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/confirm-password', {
      onFinish: () => reset('password'),
    });
  };

  return (
    <AuthLayout
      title={`Confirm your password - ${company?.name || 'Agent'}`}
      description="This is a secure area of the application. Please confirm your password before continuing."
    >
      <Head title="Confirm password" />

      <form onSubmit={submit} className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={data.password}
            onChange={(e) => setData('password', e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            autoFocus
          />
          <InputError message={errors.password} />
        </div>

        <div className="flex items-center">
          <Button type="submit" className="w-full" disabled={processing}>
            {processing && <Spinner />}
            Confirm password
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}