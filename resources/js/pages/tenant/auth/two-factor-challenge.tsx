import InputError from '@/components/input-error';
import AuthLayout from '@/components/layouts/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import { Head, useForm } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import React, { useMemo, useState } from 'react';

export default function TwoFactorChallenge({ company }: { company?: any }) {
  const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
  
  const { data, setData, post, processing, errors, clearErrors, reset } = useForm({
    code: '',
    recovery_code: '',
  });

  const authConfigContent = useMemo(() => {
    if (showRecoveryInput) {
      return {
        title: 'Recovery Code',
        description: 'Please confirm access to your account by entering one of your emergency recovery codes.',
        toggleText: 'login using an authentication code',
      };
    }
    return {
      title: 'Authentication Code',
      description: 'Enter the authentication code provided by your authenticator application.',
      toggleText: 'login using a recovery code',
    };
  }, [showRecoveryInput]);

  const toggleRecoveryMode = (): void => {
    setShowRecoveryInput(!showRecoveryInput);
    clearErrors();
    reset('code', 'recovery_code');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/two-factor-challenge', {
      onSuccess: () => {
        if (!showRecoveryInput) reset('code');
      }
    });
  };

  return (
    <AuthLayout title={`${authConfigContent.title} - ${company?.name || 'Agent'}`} description={authConfigContent.description}>
      <Head title="Two-Factor Authentication" />

      <div className="space-y-6">
        <form onSubmit={submit} className="space-y-4">
          {showRecoveryInput ? (
            <>
              <Input
                name="recovery_code"
                type="text"
                value={data.recovery_code}
                onChange={(e) => setData('recovery_code', e.target.value)}
                placeholder="Enter recovery code"
                autoFocus={showRecoveryInput}
                required
              />
              <InputError message={errors.recovery_code} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3 text-center">
              <div className="flex w-full items-center justify-center">
                <InputOTP
                  name="code"
                  maxLength={OTP_MAX_LENGTH}
                  value={data.code}
                  onChange={(value) => setData('code', value)}
                  disabled={processing}
                  pattern={REGEXP_ONLY_DIGITS}
                >
                  <InputOTPGroup>
                    {Array.from({ length: OTP_MAX_LENGTH }, (_, index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <InputError message={errors.code} />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={processing}>
            Continue
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <span>or you can </span>
            <button
              type="button"
              className="cursor-pointer text-foreground underline decoration-neutral-300 underline-offset-4 hover:decoration-current"
              onClick={toggleRecoveryMode}
            >
              {authConfigContent.toggleText}
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}