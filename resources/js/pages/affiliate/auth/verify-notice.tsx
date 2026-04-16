import AuthLayout from '@/components/layouts/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';

export default function VerifyNotice() {
  return (
    <AuthLayout
      title="Check your email"
      description="We have sent a verification link to your registered email address."
    >
      <Head title="Verify Email" />

      <div className="flex flex-col gap-6 text-center mt-2">
        <p className="text-sm text-muted-foreground">
          Thank you for joining! Before you can access your dashboard, please
          check your email inbox (including the spam folder) and click the
          verification link we sent you.
        </p>

        <Button asChild className="w-full mt-4">
          <Link href="/affiliate/login">Back to Login</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
