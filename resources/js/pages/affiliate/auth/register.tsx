import InputError from '@/components/input-error';
import AuthLayout from '@/components/layouts/auth/auth-layout';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

export default function RegisterAffiliate() {
  const [isRefLocked, setIsRefLocked] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    referral_code: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refFromUrl = params.get('ref');
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];

    const isLocal =
      hostname.includes('localhost') || hostname.includes('127.0.0.1');
    const excludedSubdomains = ['www', 'dev', 'app', 'affiliate'];

    if (refFromUrl) {
      setData('referral_code', refFromUrl);
      setIsRefLocked(true);
    } else if (!isLocal && !excludedSubdomains.includes(subdomain)) {
      setData('referral_code', subdomain);
      setIsRefLocked(true);
    }
  }, []);

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post('/affiliate/register', {
      onSuccess: () => {
        reset();
        setShowModal(true); // Tampilkan modal saat respon sukses
      },
    });
  };

  const handleModalOk = () => {
    // Arahkan ke halaman login
    router.visit('/affiliate/login');
  };

  return (
    <AuthLayout
      title="Daftar Program Mitra"
      description="Lengkapi data diri Anda untuk bergabung ke dalam jaringan."
    >
      <Head title="Register Mitra" />

      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              type="text"
              required
              autoFocus
              tabIndex={1}
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              placeholder="Contoh: Budi Santoso"
            />
            <InputError message={errors.name} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="username">Username (Untuk Link / Subdomain)</Label>
            <Input
              id="username"
              type="text"
              required
              tabIndex={2}
              value={data.username}
              onChange={(e) => setData('username', e.target.value)}
              placeholder="Contoh: budi-travel"
            />
            <InputError message={errors.username} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              tabIndex={3}
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              placeholder="nama@email.com"
            />
            <InputError message={errors.email} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Nomor WhatsApp</Label>
            <Input
              id="phone"
              type="text"
              required
              tabIndex={4}
              value={data.phone}
              onChange={(e) => setData('phone', e.target.value)}
              placeholder="081234567890"
            />
            <InputError message={errors.phone} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="referral_code">Kode Referensi (Opsional)</Label>
            <Input
              id="referral_code"
              type="text"
              tabIndex={5}
              value={data.referral_code}
              onChange={(e) => setData('referral_code', e.target.value)}
              disabled={isRefLocked}
              placeholder="Kosongkan jika tidak ada"
              className={
                isRefLocked
                  ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed'
                  : ''
              }
            />
            <InputError message={errors.referral_code} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              tabIndex={6}
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              placeholder="Minimal 8 karakter"
            />
            <InputError message={errors.password} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password_confirmation">Konfirmasi Password</Label>
            <Input
              id="password_confirmation"
              type="password"
              required
              tabIndex={7}
              value={data.password_confirmation}
              onChange={(e) => setData('password_confirmation', e.target.value)}
              placeholder="Ulangi password"
            />
            <InputError message={errors.password_confirmation} />
          </div>

          <Button
            type="submit"
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white"
            tabIndex={8}
            disabled={processing}
          >
            {processing && <Spinner className="mr-2" />}
            Daftar Sekarang
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground mt-2">
          Sudah memiliki akun?{' '}
          <TextLink href="/affiliate/login" tabIndex={9}>
            Masuk di sini
          </TextLink>
        </div>
      </form>

      {/* --- MODAL SUCCESS --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">
              Pendaftaran Berhasil!
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm leading-relaxed">
              Akun mitra Anda telah berhasil dibuat. Silakan login untuk
              mengakses dashboard Anda.
            </p>
            <Button
              onClick={handleModalOk}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Oke, Lanjut Login
            </Button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
