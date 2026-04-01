import InputError from '@/components/input-error';
import AuthLayout from '@/components/layouts/auth/auth-layout';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import React from 'react';

export default function ForgotPassword({ status, company }: { status?: string; company?: any }) {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/forgot-password');
  };

  return (
    <AuthLayout
      title={`Forgot password - ${company?.name || 'Agent'}`}
      description="Enter your email to receive a password reset link"
    >
      <Head title="Forgot password" />

      {status && (
        <div className="mb-4 text-center text-sm font-medium text-green-600">
          {status}
        </div>
      )}

      <div className="space-y-6">
        <form onSubmit={submit} className="flex flex-col gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              autoComplete="off"
              autoFocus
              placeholder="email@example.com"
            />
            <InputError message={errors.email} />
          </div>

          <div className="my-6 flex items-center justify-start">
            <Button type="submit" className="w-full" disabled={processing}>
              {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Email password reset link
            </Button>
          </div>
        </form>

        <div className="space-x-1 text-center text-sm text-muted-foreground">
          <span>Or, return to</span>
          <TextLink href="/login">log in</TextLink>
        </div>
      </div>
    </AuthLayout>
  );
}