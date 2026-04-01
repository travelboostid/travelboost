import AuthLayout from '@/components/layouts/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Head, useForm, Link } from '@inertiajs/react';
import React from 'react';

export default function VerifyEmail({ status, company }: { status?: string; company?: any }) {
  const { post, processing } = useForm({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/email/verification-notification');
  };

  return (
    <AuthLayout
      title={`Verify email - ${company?.name || 'Agent'}`}
      description="Please verify your email address by clicking on the link we just emailed to you."
    >
      <Head title="Email verification" />

      {status === 'verification-link-sent' && (
        <div className="mb-4 text-center text-sm font-medium text-green-600">
          A new verification link has been sent to the email address you
          provided during registration.
        </div>
      )}

      <form onSubmit={submit} className="space-y-6 text-center">
        <Button type="submit" disabled={processing} variant="secondary" className="w-full">
          {processing && <Spinner />}
          Resend verification email
        </Button>

        <Link
          href="/logout"
          method="post"
          as="button"
          className="mx-auto block mt-4 text-sm text-muted-foreground hover:text-foreground underline"
        >
          Log out
        </Link>
      </form>
    </AuthLayout>
  );
}