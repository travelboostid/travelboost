import { useCreateAgentSubscriptionPayment } from '@/api/payment/payment';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';
import usePageProps from '@/hooks/use-page-props';
import { AlertTriangleIcon } from 'lucide-react';
import { useState } from 'react';
import type { AgentSubscriptionPageProps } from '..';

export default function SubscriptionAlert() {
  const [packageId, setPackageId] = useState('1');
  const { company } = usePageProps<AgentSubscriptionPageProps>();
  const createPayment = useCreateAgentSubscriptionPayment();
  const { agentSubscription, agentSubscriptionPackages } =
    usePageProps<AgentSubscriptionPageProps>();

  const handlePay = () => {
    createPayment.mutate(
      {
        data: {
          package_id: +packageId,
          company_id: company.id,
        },
      },
      {
        onSuccess: (payment) => {
          const snapToken = (payment.data.payload as any)?.snap_token as string;
          (window as any).snap.pay(snapToken);
        },
      },
    );
  };

  if (agentSubscription?.status === 'active') {
    return null; // Don't show the alert if there's an active subscription
  }

  return (
    <div className="grid gap-2">
      {!agentSubscription && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
          <AlertTriangleIcon />
          <AlertTitle>Your subscription is not active.</AlertTitle>
          <AlertDescription>
            You currently do not have an active subscription. Please select a
            subscription plan to continue using our services without
            interruption.
          </AlertDescription>
        </Alert>
      )}
      {agentSubscription?.status === 'expired' && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
          <AlertTriangleIcon />
          <AlertTitle>Your subscription has expired.</AlertTitle>
          <AlertDescription>
            Your subscription has expired. Please select a new subscription plan
            to continue using our services.
          </AlertDescription>
        </Alert>
      )}
      <div>
        <RadioGroup value={packageId} onValueChange={setPackageId}>
          {agentSubscriptionPackages.map((pkg) => (
            <FieldLabel htmlFor={`${pkg.name}-plan`} key={pkg.id}>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>{pkg.name}</FieldTitle>
                  <FieldDescription>
                    IDR {pkg.price.toLocaleString('id-ID')} /{' '}
                    {pkg.duration_months} months
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem
                  value={pkg.id.toString()}
                  id={`${pkg.name}-plan`}
                />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </div>
      <Button
        className="w-full"
        onClick={handlePay}
        disabled={createPayment.isPending}
      >
        {createPayment.isPending && <Spinner />}
        Pay Now
      </Button>
    </div>
  );
}
