import InputError from '@/components/input-error';
import AuthLayout from '@/components/layouts/auth/auth-layout';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function LoginAffiliate() {
  const { data, setData, post, processing, errors, reset } = useForm({
    login: '',
    password: '',
    remember: false,
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post('/affiliate/login', {
      onSuccess: () => reset('password'),
    });
  };

  return (
    <AuthLayout
      title="Login Portal Mitra"
      description="Masukkan email/username dan password untuk masuk"
    >
      <Head title="Login Mitra" />

      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="login">Email atau Username</Label>
            <Input
              id="login"
              type="text"
              required
              autoFocus
              tabIndex={1}
              value={data.login}
              onChange={(e) => setData('login', e.target.value)}
              placeholder="nama@email.com atau username"
            />
            <InputError message={errors.login} />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              required
              tabIndex={2}
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              placeholder="Password"
            />
            <InputError message={errors.password} />
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="remember"
              checked={data.remember}
              onCheckedChange={(checked) =>
                setData('remember', checked === true)
              }
              tabIndex={3}
            />
            <Label htmlFor="remember">Ingat Saya</Label>
          </div>

          <Button
            type="submit"
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
            tabIndex={4}
            disabled={processing}
          >
            {processing && <Spinner className="mr-2" />}
            Masuk
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground mt-2">
          Belum bergabung?{' '}
          <TextLink href="/affiliate/register" tabIndex={5}>
            Daftar sekarang
          </TextLink>
        </div>
      </form>
    </AuthLayout>
  );
}
