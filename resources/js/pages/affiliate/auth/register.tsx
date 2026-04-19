import InputError from '@/components/input-error';
import AuthLayout from '@/components/layouts/auth/auth-layout';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, useForm, usePage } from '@inertiajs/react';
import React from 'react';
import { useIntl } from 'react-intl';

export default function Register() {
  const intl = useIntl();
  const { referralCode, uplineName } = usePage().props as any;

  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    username: '',
    password: '',
    password_confirmation: '',
    referral_code: referralCode || '',
    ktp_number: '',
    ktp_file: null as File | null,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/affiliate/register');
  };

  return (
    <AuthLayout
      title={intl.formatMessage({
        id: 'auth.register_title',
        defaultMessage: 'Create an account',
      })}
      description={intl.formatMessage({
        id: 'auth.register_desc',
        defaultMessage:
          'Enter your details below to create your affiliate account',
      })}
    >
      <Head title="Register" />
      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="grid gap-6">
          {/* info referral jika ada */}
          {referralCode && (
            <div className="p-4 bg-muted/50 border rounded-lg space-y-2">
              <Label>
                {intl.formatMessage({
                  id: 'auth.invited_by',
                  defaultMessage: 'Invited By:',
                })}
              </Label>
              <div className="text-primary font-bold text-lg">{uplineName}</div>
              <Input value={data.referral_code} readOnly className="bg-muted" />
            </div>
          )}

          {/* data profil */}
          <div className="grid gap-2">
            <Label htmlFor="name">
              {intl.formatMessage({ id: 'auth.name', defaultMessage: 'Name' })}
            </Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              required
            />
            <InputError message={errors.name} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">
              {intl.formatMessage({
                id: 'auth.email',
                defaultMessage: 'Email address',
              })}
            </Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              required
            />
            <InputError message={errors.email} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="username">
              {intl.formatMessage({
                id: 'auth.username',
                defaultMessage: 'Username',
              })}
            </Label>
            <Input
              id="username"
              value={data.username}
              onChange={(e) => setData('username', e.target.value)}
              required
            />
            <InputError message={errors.username} />
          </div>

          {/* input ktp */}
          <div className="grid gap-2">
            <Label htmlFor="ktp_number">
              {intl.formatMessage({
                id: 'auth.ktp_number',
                defaultMessage: 'KTP Number',
              })}
            </Label>
            <Input
              id="ktp_number"
              type="text"
              maxLength={16}
              value={data.ktp_number}
              onChange={(e) => setData('ktp_number', e.target.value)}
              required
            />
            <InputError message={errors.ktp_number} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ktp_file">
              {intl.formatMessage({
                id: 'auth.ktp_file',
                defaultMessage: 'Upload KTP',
              })}
            </Label>
            <Input
              id="ktp_file"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setData('ktp_file', e.target.files ? e.target.files[0] : null)
              }
              required
            />
            <InputError message={errors.ktp_file} />
          </div>

          {/* password */}
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
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              required
            />
            <InputError message={errors.password} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password_confirmation">
              {intl.formatMessage({
                id: 'auth.confirm_password',
                defaultMessage: 'Confirm password',
              })}
            </Label>
            <Input
              id="password_confirmation"
              type="password"
              value={data.password_confirmation}
              onChange={(e) => setData('password_confirmation', e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={processing}>
            {processing && <Spinner />}
            {intl.formatMessage({
              id: 'auth.btn_register',
              defaultMessage: 'Create account',
            })}
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          {intl.formatMessage({
            id: 'auth.has_account',
            defaultMessage: 'Already have an account?',
          })}{' '}
          <TextLink href="/affiliate/login">
            {intl.formatMessage({
              id: 'auth.log_in',
              defaultMessage: 'Log in',
            })}
          </TextLink>
        </div>
      </form>
    </AuthLayout>
  );
}
