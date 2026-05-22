import InputError from '@/components/input-error';
import AuthLayout from '@/components/layouts/auth/auth-layout';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

export default function Login() {
    const intl = useIntl();
    const { flash } = usePage().props as any;

    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            login: '',
            password: '',
            remember: false,
        });

    useEffect(() => {
        if (flash?.account_inactive) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setModalMessage(flash.account_inactive);
            setShowModal(true);
        }

        if ((errors as any)?.access_denied) {
            setModalMessage((errors as any).access_denied);
            setShowModal(true);
        } else if (flash?.not_affiliate) {
            setModalMessage(flash.not_affiliate);
            setShowModal(true);
        }
    }, [flash, errors]);

    const handleCloseModal = () => {
        setShowModal(false);
        clearErrors('access_denied' as any);
        if (modalMessage === flash?.account_inactive) {
            window.location.href = '/';
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/affiliate/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <AuthLayout
                title={intl.formatMessage({
                    id: 'auth.login_title',
                    defaultMessage: 'Log in to your account',
                })}
                description={intl.formatMessage({
                    id: 'auth.login_description',
                    defaultMessage: 'Welcome back! Please enter your details.',
                })}
            >
                <Head title="Log in" />

                <form onSubmit={submit} className="flex flex-col gap-6">
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="login">
                                {intl.formatMessage({
                                    id: 'auth.email_or_username',
                                    defaultMessage: 'Email or Username',
                                })}
                            </Label>
                            <Input
                                id="login"
                                type="text"
                                required
                                autoFocus
                                autoComplete="username"
                                name="login"
                                value={data.login}
                                onChange={(e) =>
                                    setData('login', e.target.value)
                                }
                                placeholder="name@example.com / username"
                            />
                            <InputError message={errors.login} />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">
                                    {intl.formatMessage({
                                        id: 'auth.password',
                                        defaultMessage: 'Password',
                                    })}
                                </Label>
                                <TextLink
                                    href="/forgot-password"
                                    className="ml-auto text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                    tabIndex={5}
                                >
                                    {intl.formatMessage({
                                        id: 'auth.forgot_password',
                                        defaultMessage: 'Forgot password?',
                                    })}
                                </TextLink>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    name="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
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
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                        >
                            {processing && <Spinner className="mr-2" />}
                            {intl.formatMessage({
                                id: 'auth.sign_in',
                                defaultMessage: 'Sign in',
                            })}
                        </Button>
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                        {intl.formatMessage({
                            id: 'auth.dont_have_account',
                            defaultMessage: "Don't have an account?",
                        })}{' '}
                        <TextLink href="/affiliate/register">
                            {intl.formatMessage({
                                id: 'auth.sign_up',
                                defaultMessage: 'Sign up',
                            })}
                        </TextLink>
                    </div>
                </form>
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
                        <h3 className="text-lg font-bold text-foreground mb-2">
                            Access Denied
                        </h3>
                        <p className="text-muted-foreground text-sm mb-6">
                            {modalMessage}
                        </p>
                        <Button onClick={handleCloseModal} className="w-full">
                            Understood
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
