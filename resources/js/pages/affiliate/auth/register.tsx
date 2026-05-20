import { TermsAgreement } from '@/components/auth/terms-agreement';
import InputError from '@/components/input-error';
import AuthLayout from '@/components/layouts/auth/auth-layout';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';

export default function Register() {
  const intl = useIntl();
  const { referralCode, uplineName } = usePage().props as any;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState('');

  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    password_confirmation: '',
    referral_code: referralCode || '',
    ktp_number: '',
    ktp_file: null as File | null,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      setTermsError(
        'You must agree to the Terms and Conditions before creating an account.',
      );
      return;
    }

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

          <div className="grid gap-2">
            <Label htmlFor="name">
              {intl.formatMessage({ id: 'auth.name', defaultMessage: 'Name' })}
            </Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              placeholder="Full name"
              tabIndex={1}
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
              placeholder="email@example.com"
              tabIndex={2}
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
              placeholder="Username"
              tabIndex={3}
              required
            />
            <InputError message={errors.username} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">
              {intl.formatMessage({
                id: 'auth.phone',
                defaultMessage: 'Phone number',
              })}
            </Label>
            <Input
              id="phone"
              value={data.phone}
              onChange={(e) => setData('phone', e.target.value)}
              placeholder="Phone number"
              tabIndex={4}
              required
            />
            <InputError message={errors.phone} />
          </div>

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
              minLength={16}
              pattern="\d{16}"
              value={data.ktp_number}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setData('ktp_number', val);
              }}
              placeholder="16-digit KTP number"
              tabIndex={5}
              required
            />
            {data.ktp_number.length > 0 && data.ktp_number.length < 16 && (
              <p className="text-[0.8rem] font-medium text-destructive">
                {intl.formatMessage({
                  id: 'auth.ktp_warning',
                  defaultMessage: 'KTP Number must be exactly 16 digits.',
                })}
              </p>
            )}
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
              tabIndex={6}
              required
            />
            <InputError message={errors.ktp_file} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">
              {intl.formatMessage({
                id: 'auth.password',
                defaultMessage: 'Password',
              })}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                placeholder="Password"
                tabIndex={7}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <InputError message={errors.password} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password_confirmation">
              {intl.formatMessage({
                id: 'auth.confirm_password',
                defaultMessage: 'Confirm password',
              })}
            </Label>
            <div className="relative">
              <Input
                id="password_confirmation"
                type={showConfirmPassword ? 'text' : 'password'}
                value={data.password_confirmation}
                onChange={(e) =>
                  setData('password_confirmation', e.target.value)
                }
                placeholder="Confirm password"
                tabIndex={8}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <TermsAgreement
            variant="affiliate"
            checked={termsAccepted}
            onCheckedChange={(checked) => {
              setTermsAccepted(checked);
              if (checked) {
                setTermsError('');
              }
            }}
            tabIndex={9}
            error={termsError}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={processing || !termsAccepted}
            tabIndex={10}
          >
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
          <TextLink href="/affiliate/login" tabIndex={11}>
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
