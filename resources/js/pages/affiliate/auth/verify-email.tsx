import AuthLayout from '@/components/layouts/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const isVerified = !!user?.email_verified_at;

    const { post, processing } = useForm({});

    const resend = (e: React.FormEvent) => {
        e.preventDefault();
        post('/affiliate/email/verification-notification');
    };

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        post('/affiliate/logout');
    };

    return (
        <AuthLayout
            title="Verify email"
            description={
                isVerified
                    ? "Your email has been successfully verified! You can now access your affiliate dashboard."
                    : "Please verify your email address by clicking on the link we just emailed to you."
            }
        >
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </div>
            )}

            {isVerified ? (
                <div className="space-y-6 text-center">
                    <Button asChild className="w-full">
                        <Link href="/affiliate/dashboard">
                            Go to Affiliate Dashboard
                        </Link>
                    </Button>
                </div>
            ) : (
                <form onSubmit={resend} className="space-y-6 text-center">
                    <Button disabled={processing} className="w-full">
                        {processing && <Spinner />}
                        Resend verification email
                    </Button>

                    <div className="flex items-center justify-between text-xs pt-4 border-t mt-4">
                        <Link href="/affiliate/dashboard" className="text-primary hover:underline font-semibold">
                            View Dashboard anyway
                        </Link>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="text-muted-foreground hover:text-foreground hover:underline font-semibold cursor-pointer"
                        >
                            Log out
                        </button>
                    </div>
                </form>
            )}
        </AuthLayout>
    );
}
