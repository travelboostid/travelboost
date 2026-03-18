import UserDashboardLayout from '@/components/layouts/user-dashboard';

import AcceptInvitation from './accept-invitation';
import RegisterAgentAccount from './register-agent-account';

export default function Onboarding({ invitations }: { invitations: any[] }) {
  return (
    <UserDashboardLayout
      containerClassName="p-4"
      breadcrumb={[{ title: 'Onboarding' }]}
    >
      {invitations.length ? (
        <AcceptInvitation invitations={invitations} />
      ) : (
        <RegisterAgentAccount />
      )}
    </UserDashboardLayout>
  );
}
