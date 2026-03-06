import { Button } from '@/components/ui/button';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { register } from '@/routes/company/vendor-registrations';
import { router } from '@inertiajs/react';

type VendorPartnershipRegistrationButtonProps = {
  vendor: any;
  partnership: any;
};

export default function VendorPartnershipRegistrationButton({
  vendor,
  partnership,
}: VendorPartnershipRegistrationButtonProps) {
  const { company } = usePageSharedDataProps();

  console.log('vvv', partnership);

  const handleCopy = () => {
    router.post(
      register({
        company: company.username,
      }),
      { vendor_id: vendor.id },
      {
        preserveScroll: true,
        onSuccess: () => {
          // optional: toast
        },
      },
    );
  };

  if (!partnership) {
    return <Button onClick={handleCopy}>Register</Button>;
  } else if (partnership.status === 'pending') {
    return <Button disabled>Waiting Approval</Button>;
  } else if (partnership.status === 'active') {
    return <Button disabled>Registered</Button>;
  } else {
    return null;
  }
}
