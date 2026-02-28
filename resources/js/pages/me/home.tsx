import UserDashboardLayout from '@/components/layouts/user-dashboard';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Head } from '@inertiajs/react';

export default function Home() {
  const { auth } = usePageSharedDataProps();

  return (
    <UserDashboardLayout breadcrumb={[{ title: 'Home' }]}>
      <Head title="Home" />
      <div className="p-4">
        Hello, {auth.user.name}. Welcome to your profile
      </div>
    </UserDashboardLayout>
  );
}
