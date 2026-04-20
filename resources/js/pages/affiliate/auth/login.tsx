import InputError from '@/components/input-error';
import AuthLayout from '@/components/layouts/auth/auth-layout';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, useForm, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

export default function Login() {
  const intl = useIntl();
  const { flash } = usePage().props as any;

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const { data, setData, post, processing, errors, reset } = useForm({
    login: '',
    password: '',
    remember: false,
  });

  useEffect(() => {
    if (flash?.account_inactive) {
      setModalMessage(flash.account_inactive);
      setShowModal(true);
    }
  }, [flash]);

  const handleCloseModal = () => {
    setShowModal(false);
    window.location.href = '/';
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
          id: 'auth.login_desc',
          defaultMessage:
            'Enter your email or username and password to access your dashboard',
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
                name="login"
                value={data.login}
                autoFocus
                onChange={(e) => setData('login', e.target.value)}
                placeholder="email@example.com or username"
              />
              <InputError message={errors.login} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">
                {intl.formatMessage({
                  id: 'auth.password',
                  defaultMessage: 'Password',
                })}
              </Label>
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
              {intl.formatMessage({
                id: 'auth.btn_login',
                defaultMessage: 'Log in',
              })}
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {intl.formatMessage({
              id: 'auth.no_account',
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

      {/* komponen modal popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-background p-6 rounded-lg shadow-xl max-w-sm w-full text-center border border-border">
            {/* icon warning */}
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
            <h3 className="text-lg font-semibold mb-2">Akun Dinonaktifkan</h3>
            <p className="text-sm text-muted-foreground mb-6">{modalMessage}</p>
            <Button onClick={handleCloseModal} className="w-full">
              OK
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
