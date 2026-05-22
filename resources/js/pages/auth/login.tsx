import InputError from '@/components/input-error';
import AuthLayout from '@/components/layouts/auth/auth-layout';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { show as showRegister } from '@/routes/companies/register';
import { store } from '@/routes/login';
// import { request } from '@/routes/password';
import { Form, Head, usePage } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = {
    status?: string;
    // canResetPassword: boolean;
    company: any;
};

export default function Login({ status }: Props) {
    const { flash } = usePage().props as any;

    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (flash?.account_inactive) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setModalMessage(flash.account_inactive);
            setShowModal(true);
        }
    }, [flash]);

    const handleCloseModal = () => {
        setShowModal(false);
        window.location.href = '/';
    };

    return (
        <>
            <AuthLayout
                title="Log in to your account"
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
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="username_or_email">
                                        Username or Email
                                    </Label>
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
                                    <InputError
                                        message={errors.username_or_email}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">
                                            Password
                                        </Label>
                                        {/* {canResetPassword && (
                      <TextLink
                        href={request()}
                        className="ml-auto text-sm"
                        tabIndex={5}
                      >
                        Forgot password?
                      </TextLink>
                    )} */}
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder="Password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff size={16} />
                                            ) : (
                                                <Eye size={16} />
                                            )}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        tabIndex={3}
                                    />
                                    <Label htmlFor="remember">
                                        Remember me
                                    </Label>
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

                            <div className="text-center text-sm text-muted-foreground">
                                Don't have an account?{' '}
                                <TextLink href={showRegister()} tabIndex={5}>
                                    Sign up
                                </TextLink>
                            </div>
                        </>
                    )}
                </Form>

                {status && (
                    <div className="mb-4 text-center text-sm font-medium text-green-600">
                        {status}
                    </div>
                )}
            </AuthLayout>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-background p-6 rounded-lg shadow-xl max-w-sm w-full text-center border border-border">
                        <div className="mb-4">
                            <svg
                                className="mx-auto h-12 w-12 text-destructive"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            Account Deactivated
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                            {modalMessage}
                        </p>
                        <p className="text-sm text-muted-foreground mb-6">
                            Your account has been deactivated, contact the
                            Travelboost admin at care@travelboost.co.id for
                            further information.
                        </p>
                        <Button onClick={handleCloseModal} className="w-full">
                            OK
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
