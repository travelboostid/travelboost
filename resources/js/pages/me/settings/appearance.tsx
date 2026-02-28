import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import UserDashboardLayout from '@/components/layouts/user-dashboard';
import { Head } from '@inertiajs/react';

export default function Appearance() {
  return (
    <UserDashboardLayout breadcrumb={[{ title: 'Appearance Settings' }]}>
      <Head title="Appearance settings" />

      <h1 className="sr-only">Appearance Settings</h1>
      <div className="space-y-6">
        <Heading
          variant="small"
          title="Appearance settings"
          description="Update your account's appearance settings"
        />
        <AppearanceTabs />
      </div>
    </UserDashboardLayout>
  );
}
