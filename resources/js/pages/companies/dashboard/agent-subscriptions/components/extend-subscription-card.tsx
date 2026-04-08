import { useCreateAgentSubscriptionPayment } from '@/api/payment/payment';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { useState } from 'react';
import type { AgentSubscriptionPageProps } from '..';

export default function ExtendSubscriptionCard() {
  const [packageId, setPackageId] = useState('1');
  const { company } = usePageProps<AgentSubscriptionPageProps>();
  const createPayment = useCreateAgentSubscriptionPayment();
  const { agentSubscriptionPackages } =
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
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Extend Subscription</CardTitle>
        <CardDescription>
          Choose a package to extend your subscription and continue enjoying our
          services without interruption.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
      <CardFooter>
        <CardAction>
          <Button
            className="w-full"
            onClick={handlePay}
            disabled={createPayment.isPending}
          >
            {createPayment.isPending && <Spinner />}
            Pay Now
          </Button>
        </CardAction>
      </CardFooter>
    </Card>
  );
}
