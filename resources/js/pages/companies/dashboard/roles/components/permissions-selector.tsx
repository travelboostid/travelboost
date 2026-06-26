import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

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
    'agents.query': {
        name: <FormattedMessage defaultMessage="View Agents" />,
        description: (
            <FormattedMessage defaultMessage="Allows viewing agent registrations and access details." />
        ),
    },
    'agents.mutation': {
        name: <FormattedMessage defaultMessage="Manage Agents" />,
        description: (
            <FormattedMessage defaultMessage="Allows managing agent registrations and access details." />
        ),
    },
    'customers.query': {
        name: <FormattedMessage defaultMessage="View Customers" />,
        description: (
            <FormattedMessage defaultMessage="Allows viewing customer pages and customer details." />
        ),
    },
    'customers.mutation': {
        name: <FormattedMessage defaultMessage="Manage Customers" />,
        description: (
            <FormattedMessage defaultMessage="Allows managing customer pages and customer-related actions." />
        ),
    },
    'tour-management.query': {
        name: <FormattedMessage defaultMessage="View Tour Management" />,
        description: (
            <FormattedMessage defaultMessage="Allows viewing products, catalogs, and tour category setup." />
        ),
    },
    'tour-management.mutation': {
        name: <FormattedMessage defaultMessage="Manage Tour Management" />,
        description: (
            <FormattedMessage defaultMessage="Allows managing products, catalogs, and tour category setup." />
        ),
    },
    'booking.query': {
        name: <FormattedMessage defaultMessage="View Bookings" />,
        description: (
            <FormattedMessage defaultMessage="Allows viewing bookings, booking correction, and waiting lists." />
        ),
    },
    'booking.mutation': {
        name: <FormattedMessage defaultMessage="Manage Bookings" />,
        description: (
            <FormattedMessage defaultMessage="Allows managing bookings, booking correction, and waiting lists." />
        ),
    },
    'funds.query': {
        name: <FormattedMessage defaultMessage="View Funds" />,
        description: (
            <FormattedMessage defaultMessage="Allows viewing wallet, payment, bank account, withdrawal, and fund pages." />
        ),
    },
    'funds.mutation': {
        name: <FormattedMessage defaultMessage="Manage Funds" />,
        description: (
            <FormattedMessage defaultMessage="Allows managing wallet, payment, bank account, withdrawal, and fund actions." />
        ),
    },
    'reports.query': {
        name: <FormattedMessage defaultMessage="View Reports" />,
        description: (
            <FormattedMessage defaultMessage="Allows viewing sales and commission reports." />
        ),
    },
    'reports.mutation': {
        name: <FormattedMessage defaultMessage="Manage Reports" />,
        description: (
            <FormattedMessage defaultMessage="Allows exporting and managing sales and commission reports." />
        ),
    },
    'booking-list.query': {
        name: <FormattedMessage defaultMessage="View Booking List" />,
        description: (
            <FormattedMessage defaultMessage="Allows viewing booking list reports." />
        ),
    },
    'booking-list.mutation': {
        name: <FormattedMessage defaultMessage="Manage Booking List" />,
        description: (
            <FormattedMessage defaultMessage="Allows exporting and managing booking list reports." />
        ),
    },
    'room-listings.query': {
        name: <FormattedMessage defaultMessage="View Room Listings" />,
        description: (
            <FormattedMessage defaultMessage="Allows viewing room listing reports." />
        ),
    },
    'room-listings.mutation': {
        name: <FormattedMessage defaultMessage="Manage Room Listings" />,
        description: (
            <FormattedMessage defaultMessage="Allows exporting and printing room listing reports." />
        ),
    },
    'seat-availability.query': {
        name: <FormattedMessage defaultMessage="View Seat Availability" />,
        description: (
            <FormattedMessage defaultMessage="Allows viewing seat availability reports." />
        ),
    },
    'seat-availability.mutation': {
        name: <FormattedMessage defaultMessage="Manage Seat Availability" />,
        description: (
            <FormattedMessage defaultMessage="Allows managing seat availability actions and exports." />
        ),
    },
    'settings.query': {
        name: <FormattedMessage defaultMessage="View Settings" />,
        description: (
            <FormattedMessage defaultMessage="Allows viewing profile, linked accounts, user management, and access roles." />
        ),
    },
    'settings.mutation': {
        name: <FormattedMessage defaultMessage="Manage Settings" />,
        description: (
            <FormattedMessage defaultMessage="Allows managing profile, linked accounts, user management, and access roles." />
        ),
    },
    'parameter.query': {
        name: <FormattedMessage defaultMessage="View Parameters" />,
        description: (
            <FormattedMessage defaultMessage="Allows viewing vendor or agent parameters." />
        ),
    },
    'parameter.mutation': {
        name: <FormattedMessage defaultMessage="Manage Parameters" />,
        description: (
            <FormattedMessage defaultMessage="Allows managing vendor or agent parameters." />
        ),
    },
    'chat-ai.query': {
        name: <FormattedMessage defaultMessage="View Chat AI" />,
        description: (
            <FormattedMessage defaultMessage="Allows viewing Chat AI and vendor AI credit pages." />
        ),
    },
    'chat-ai.mutation': {
        name: <FormattedMessage defaultMessage="Manage Chat AI" />,
        description: (
            <FormattedMessage defaultMessage="Allows managing Chat AI and vendor AI credit actions." />
        ),
    },
    'commission.query': {
        name: <FormattedMessage defaultMessage="View Commission Setup" />,
        description: (
            <FormattedMessage defaultMessage="Allows viewing commission setup pages." />
        ),
    },
    'commission.mutation': {
        name: <FormattedMessage defaultMessage="Manage Commission Setup" />,
        description: (
            <FormattedMessage defaultMessage="Allows managing commission setup pages and rules." />
        ),
    },
    'vendor-config.query': {
        name: <FormattedMessage defaultMessage="View Vendor Config" />,
        description: (
            <FormattedMessage defaultMessage="Allows viewing vendor catalogs and vendor registration pages." />
        ),
    },
    'vendor-config.mutation': {
        name: <FormattedMessage defaultMessage="Manage Vendor Config" />,
        description: (
            <FormattedMessage defaultMessage="Allows managing vendor registrations and vendor catalog actions." />
        ),
    },
    'marketings.query': {
        name: <FormattedMessage defaultMessage="View Marketings" />,
        description: (
            <FormattedMessage defaultMessage="Allows viewing landing page and marketing analytics pages." />
        ),
    },
    'marketings.mutation': {
        name: <FormattedMessage defaultMessage="Manage Marketings" />,
        description: (
            <FormattedMessage defaultMessage="Allows managing landing page and marketing analytics configuration." />
        ),
    },
    'subscription-ai.query': {
        name: <FormattedMessage defaultMessage="View Subscription & AI" />,
        description: (
            <FormattedMessage defaultMessage="Allows viewing agent subscription and AI pages." />
        ),
    },
    'subscription-ai.mutation': {
        name: <FormattedMessage defaultMessage="Manage Subscription & AI" />,
        description: (
            <FormattedMessage defaultMessage="Allows managing agent subscription and AI pages." />
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

    useEffect(() => {
        if (value) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setInternalValue(value);
        }
    }, [value]);

    const syncPermissionDependencies = (
        currentValue: Record<string, boolean>,
        permissionName: string,
        checked: boolean,
    ) => {
        const nextValue = {
            ...currentValue,
            [permissionName]: checked,
        };

        if (permissionName.endsWith('.mutation') && checked) {
            const queryPermissionName = permissionName.replace(
                /\.mutation$/,
                '.query',
            );
            nextValue[queryPermissionName] = true;
        }

        if (permissionName.endsWith('.query') && !checked) {
            const mutationPermissionName = permissionName.replace(
                /\.query$/,
                '.mutation',
            );
            nextValue[mutationPermissionName] = false;
        }

        return nextValue;
    };

    const handleCheckedChange = (permissionName: string, checked: boolean) => {
        const nextValue = syncPermissionDependencies(
            internalValue,
            permissionName,
            checked,
        );

        setInternalValue(nextValue);
        onChange?.(nextValue);
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
                                handleCheckedChange(
                                    permission.name,
                                    Boolean(checked),
                                )
                            }
                            disabled={disabled}
                        />
                        <FieldContent>
                            <FieldLabel htmlFor="terms-checkbox-2">
                                {name}
                            </FieldLabel>
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
