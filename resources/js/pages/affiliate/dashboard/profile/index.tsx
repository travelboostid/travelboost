import InputError from '@/components/input-error';
import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { toast } from 'sonner';

export default function ProfileIndex({ user }: { user: any }) {
  const profile = user.affiliate_profile;
  const upline = profile?.upline;

  // Form hanya untuk field yang boleh diubah (Nama & WhatsApp)
  const { data, setData, patch, processing, errors, isDirty } = useForm({
    name: user.name,
    phone: user.phone,
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    patch('/affiliate/dashboard/profile', {
      preserveScroll: true,
      onSuccess: () => toast.success('Profil berhasil diperbarui!'),
      onError: () =>
        toast.error('Gagal memperbarui profil. Silakan periksa isian Anda.'),
    });
  };

  return (
    <AffiliateDashboardLayout
      breadcrumb={[
        { title: 'Mitra', url: '/affiliate/dashboard' },
        { title: 'Pengaturan', url: '#' },
        { title: 'Profil Pribadi', url: '/affiliate/dashboard/profile' },
      ]}
    >
      <Head title="Profil Pribadi - Mitra" />

      <div className="max-w-4xl space-y-6">
        {/* --- FORM UPDATE PROFIL --- */}
        <Card>
          <CardHeader>
            <CardTitle>Profil Pribadi</CardTitle>
            <CardDescription>
              Perbarui informasi dasar akun Anda. Email dan Username tidak dapat
              diubah karena terikat dengan sistem subdomain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Nama Lengkap (Editable) */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Nama Lengkap Anda"
                  />
                  <InputError message={errors.name} />
                </div>

                {/* Nomor WA (Editable) */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor WhatsApp</Label>
                  <Input
                    id="phone"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                    placeholder="08123456789"
                  />
                  <InputError message={errors.phone} />
                </div>

                {/* Email (Readonly) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground">
                    Email Terdaftar
                  </Label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-slate-50 dark:bg-slate-900 cursor-not-allowed text-muted-foreground"
                  />
                </div>

                {/* Username (Readonly) */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-muted-foreground">
                    Username / Subdomain
                  </Label>
                  <Input
                    id="username"
                    value={user.username}
                    disabled
                    className="bg-slate-50 dark:bg-slate-900 cursor-not-allowed text-muted-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={processing || !isDirty}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {processing && <Spinner className="mr-2" />}
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* --- INFO JARINGAN & REFERAL (Read-only) --- */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Jaringan</CardTitle>
            <CardDescription>
              Detail status kemitraan dan referensi jaringan Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Kode Referal Anda
                </p>
                <p className="text-lg font-semibold">
                  {profile?.referral_code || '-'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Bagikan kode ini untuk mengundang agen.
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Atasan Langsung (Upline)
                </p>
                {upline ? (
                  <div>
                    <p className="text-base font-semibold">{upline.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Terdaftar melalui referensi ini.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm font-medium italic text-slate-500">
                    Tanpa Upline (Pendaftaran Mandiri)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AffiliateDashboardLayout>
  );
}
