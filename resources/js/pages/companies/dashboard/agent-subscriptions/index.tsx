import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { CurrentSubscription } from './components/current-subscription';
import ExtendSubscriptionCard from './components/extend-subscription-card';
import SubscriptionAlert from './components/subscription-alert';

dayjs.extend(relativeTime);

export type AgentSubscriptionPageProps = {
  agentSubscription: any | null;
  agentSubscriptionPackages: any[];
};

// Mock data for current subscription
const mockCurrentSubscription = {
  id: 'sub_001',
  plan: 'Pro',
  status: 'active',
  startDate: '2024-01-15',
  endDate: '2025-01-15',
  billingAmount: 99.99,
  billingCycle: 'yearly',
};

// Mock payment history data
const mockPaymentHistory = [
  {
    id: 'pay_001',
    date: '2024-01-15',
    period: '1 Year',
    amount: 99.99,
    status: 'completed',
    type: 'subscription',
  },
  {
    id: 'pay_002',
    date: '2023-01-15',
    period: '1 Year',
    amount: 99.99,
    status: 'completed',
    type: 'subscription',
  },
  {
    id: 'pay_003',
    date: '2022-06-15',
    period: '6 Months',
    amount: 49.99,
    status: 'completed',
    type: 'subscription',
  },
  {
    id: 'pay_004',
    date: '2022-01-15',
    period: '1 Year',
    amount: 89.99,
    status: 'completed',
    type: 'subscription',
  },
];

export default function Page({
  agentSubscription,
}: AgentSubscriptionPageProps) {
  return (
    <CompanyDashboardLayout
      containerClassName="mx-auto max-w-4xl w-full space-y-8 p-4"
      breadcrumb={[{ title: 'Settings' }, { title: 'Agent Subscriptions' }]}
    >
      {agentSubscription ? (
        <>
          {/* Current Subscription Section */}
          <CurrentSubscription />
          {/* Payment History Section */}
          <ExtendSubscriptionCard />
        </>
      ) : (
        <SubscriptionAlert />
      )}
    </CompanyDashboardLayout>
  );
}
