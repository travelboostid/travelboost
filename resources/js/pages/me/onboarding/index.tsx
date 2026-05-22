import UserDashboardLayout from '@/components/layouts/user-dashboard';
import AcceptInvitation from './accept-invitation';
import RegisterAgentAccount from './register-agent-account';

interface Props {
    invitations: any[];
    affiliate?: {
        id: number;
        name: string;
        username: string;
    };
}

export default function Onboarding({ invitations, affiliate }: Props) {
    return (
        <UserDashboardLayout
            containerClassName="p-4"
            breadcrumb={[{ title: 'Onboarding' }]}
        >
            {invitations.length ? (
                <AcceptInvitation invitations={invitations} />
            ) : (
                <RegisterAgentAccount affiliate={affiliate} />
            )}
        </UserDashboardLayout>
    );
}
