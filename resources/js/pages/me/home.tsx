import UserDashboardLayout from '@/components/layouts/user-dashboard';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Head } from '@inertiajs/react';

export default function Home() {
  const { auth } = usePageSharedDataProps();

  return (
    <UserDashboardLayout breadcrumb={[{ title: 'Home' }]}>
      <Head title="Home" />
      <div className="p-4">
        Hello, {auth.user.name}. Welcome to Travelboost!
      </div>
      <div className="p-4">
        Continue registration of your company and start boosting your travel
        business.
      </div>
    </UserDashboardLayout>
  );
}
