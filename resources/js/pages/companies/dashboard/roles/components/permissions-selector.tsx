import type { ReactNode } from 'react';
import { useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { FormattedMessage } from 'react-intl';

const PERMISSION_DETAILS_MAP: Record<
  string,
  {
    name: ReactNode;
    description?: ReactNode;
  }
> = {
  'user.query': {
    name: <FormattedMessage defaultMessage="View Users" />,
    description: (
      <FormattedMessage defaultMessage="Allows viewing users and their details." />
    ),
  },
  'user.mutation': {
    name: <FormattedMessage defaultMessage="Manage Users" />,
    description: (
      <FormattedMessage defaultMessage="Allows managing customers" />
    ),
  },
  'company.query': {
    name: <FormattedMessage defaultMessage="View Company Details" />,
    description: (
      <FormattedMessage defaultMessage="Allows viewing company information and details." />
    ),
  },
  'company.mutation': {
    name: <FormattedMessage defaultMessage="Manage Company Details" />,
    description: (
      <FormattedMessage defaultMessage="Allows editing company information and details." />
    ),
  },
  'company-settings.query': {
    name: <FormattedMessage defaultMessage="View Company Settings" />,
    description: (
      <FormattedMessage defaultMessage="Allows viewing company settings and configuration." />
    ),
  },
  'company-settings.mutation': {
    name: <FormattedMessage defaultMessage="Manage Company Settings" />,
    description: (
      <FormattedMessage defaultMessage="Allows editing company settings and configuration." />
    ),
  },
  'company-team.query': {
    name: <FormattedMessage defaultMessage="View Company Team" />,
    description: (
      <FormattedMessage defaultMessage="Allows viewing company team members." />
    ),
  },
  'company-team.mutation': {
    name: <FormattedMessage defaultMessage="Manage Company Team" />,
    description: (
      <FormattedMessage defaultMessage="Allows managing company team members." />
    ),
  },
  'wallet.query': {
    name: <FormattedMessage defaultMessage="View Wallet" />,
    description: (
      <FormattedMessage defaultMessage="Allows viewing wallet information and balance." />
    ),
  },
  'wallet.mutation': {
    name: <FormattedMessage defaultMessage="Manage Wallet" />,
    description: (
      <FormattedMessage defaultMessage="Allows managing wallet settings and configuration." />
    ),
  },
  'wallet-transaction.query': {
    name: <FormattedMessage defaultMessage="View Wallet Transactions" />,
    description: (
      <FormattedMessage defaultMessage="Allows viewing wallet transaction history." />
    ),
  },
  'wallet-transaction.mutation': {
    name: <FormattedMessage defaultMessage="Manage Wallet Transactions" />,
    description: (
      <FormattedMessage defaultMessage="Allows managing wallet transactions." />
    ),
  },
  'withdrawal.query': {
    name: <FormattedMessage defaultMessage="View Withdrawals" />,
    description: (
      <FormattedMessage defaultMessage="Allows viewing withdrawal requests and history." />
    ),
  },
  'withdrawal.mutation': {
    name: <FormattedMessage defaultMessage="Manage Withdrawals" />,
    description: (
      <FormattedMessage defaultMessage="Allows creating and managing withdrawal requests." />
    ),
  },
  'payment.query': {
    name: <FormattedMessage defaultMessage="View Payments" />,
    description: (
      <FormattedMessage defaultMessage="Allows viewing payment information and history." />
    ),
  },
  'payment.mutation': {
    name: <FormattedMessage defaultMessage="Manage Payments" />,
    description: (
      <FormattedMessage defaultMessage="Allows managing payments." />
    ),
  },
  'bank-account.query': {
    name: <FormattedMessage defaultMessage="View Bank Accounts" />,
    description: (
      <FormattedMessage defaultMessage="Allows viewing bank account information." />
    ),
  },
  'bank-account.mutation': {
    name: <FormattedMessage defaultMessage="Manage Bank Accounts" />,
    description: (
      <FormattedMessage defaultMessage="Allows adding, editing, and deleting bank accounts." />
    ),
  },
  'tour.query': {
    name: <FormattedMessage defaultMessage="View Tours" />,
    description: (
      <FormattedMessage defaultMessage="Allows viewing tour information and details." />
    ),
  },
  'tour.mutation': {
    name: <FormattedMessage defaultMessage="Manage Tours" />,
    description: (
      <FormattedMessage defaultMessage="Allows creating, editing, and deleting tours." />
    ),
  },
  'tour-category.query': {
    name: <FormattedMessage defaultMessage="View Tour Categories" />,
    description: (
      <FormattedMessage defaultMessage="Allows viewing tour categories." />
    ),
  },
  'tour-category.mutation': {
    name: <FormattedMessage defaultMessage="Manage Tour Categories" />,
    description: (
      <FormattedMessage defaultMessage="Allows managing tour categories." />
    ),
  },
  'role.query': {
    name: <FormattedMessage defaultMessage="View Roles" />,
    description: (
      <FormattedMessage defaultMessage="Allows viewing roles and their permissions." />
    ),
  },
  'role.mutation': {
    name: <FormattedMessage defaultMessage="Manage Roles" />,
    description: (
      <FormattedMessage defaultMessage="Allows creating, editing, and deleting roles." />
    ),
  },
};

export default function PermissionsSelector({
  permissions,
  value,
  defaultValue,
  onChange,
  disabled,
}: {
  permissions: any[];
  value?: Record<string, boolean>;
  defaultValue?: Record<string, boolean>;
  onChange?: (value: Record<string, boolean>) => void;
  disabled?: boolean;
}) {
  const [internalValue, setInternalValue] = useState<Record<string, boolean>>(
    value || defaultValue || {},
  );
  const handleChange = (v: Record<string, boolean>) => {
    const newValue = { ...internalValue, ...v };
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {permissions.map((permission) => {
        const details = PERMISSION_DETAILS_MAP[permission.name];
        const name = details ? details.name : permission.name;
        const description = details ? (
          details.description
        ) : (
          <FormattedMessage defaultMessage="No description available." />
        );

        return (
          <Field
            orientation="horizontal"
            key={permission.id}
            className="flex items-center gap-2"
          >
            <Checkbox
              id={`permission-${permission.id}`}
              name={`permission-${permission.id}`}
              checked={internalValue[permission.name] || false}
              onCheckedChange={(checked) =>
                handleChange({ [permission.name]: Boolean(checked) })
              }
              disabled={disabled}
            />
            <FieldContent>
              <FieldLabel htmlFor="terms-checkbox-2">{name}</FieldLabel>
              <FieldDescription className="text-xs">
                {description}
              </FieldDescription>
            </FieldContent>
          </Field>
        );
      })}
    </div>
  );
}
