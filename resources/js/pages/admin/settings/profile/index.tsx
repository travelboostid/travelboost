import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Head, useForm } from '@inertiajs/react';
import type { FormEventHandler } from 'react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { auth } = usePageSharedDataProps();

  const { data, setData, put, processing, errors } = useForm({
    name: auth.user.name ?? '',
    email: auth.user.email ?? '',
    phone: (auth.user as any).phone ?? '',
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    put('/admin/settings/profile', {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Profile updated successfully', {
          position: 'top-center',
        });
      },
    });
  };

  return (
    <AdminDashboardLayout
      containerClassName="p-4"
      breadcrumb={[{ title: 'Settings' }, { title: 'Manage Profile' }]}
    >
      <Head title="Manage Profile" />
      <div className="mx-auto max-w-xl">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Profile Information</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Update your account's profile information and email address.
          </p>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                required
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                required
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="text"
                value={data.phone}
                onChange={(e) => setData('phone', e.target.value)}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>
            <Button type="submit" disabled={processing} className="w-full">
              Save Changes
            </Button>
          </form>
        </div>
      </div>
    </AdminDashboardLayout>
  );
}
