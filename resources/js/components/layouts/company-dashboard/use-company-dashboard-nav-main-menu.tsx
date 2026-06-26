import { useGetCompanies } from '@/api/company/company';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import type { LucideIcon } from 'lucide-react';
import {
    BadgePercentIcon,
    BarChart3Icon,
    BoltIcon,
    BookUserIcon,
    FolderSearchIcon,
    HomeIcon,
    PlaneIcon,
    SettingsIcon,
    UsersRoundIcon,
    WalletIcon,
} from 'lucide-react';
import type { HTMLAttributeAnchorTarget } from 'react';
import React from 'react';
import { FormattedMessage } from 'react-intl';

type MenuItemBase = {
    id: string;
    title: string | React.ReactNode;
    urlOrAction: string | (() => void);
    target?: HTMLAttributeAnchorTarget;
    icon?: LucideIcon;
    shouldDisplay?: (roles: string[], permissions: string[]) => boolean;
    disabled?: boolean;
    badgeCount?: number;
};

type MenuItem =
    | (MenuItemBase & {
          items?: MenuItem[];
          actions?: never;
      })
    | (MenuItemBase & {
          items?: never;
          actions?: MenuItem[];
      })
    | (MenuItemBase & {
          items?: never;
          actions?: never;
      });

export function useCompanyDashboardNavMainMenu() {
    const {
        company,
        auth,
        subscriptionRules,
        bookingModificationRequestCounts,
    } = usePageSharedDataProps() as any;

    const { data } = useGetCompanies(
        { type: 'vendor' },
        { query: { enabled: company.type === 'agent' } },
    );

    let baseHost = window.location.hostname;
    if (baseHost === '127.0.0.1') {
        baseHost = 'localhost';
    }

    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';

    const companySubdomain = `${protocol}//${company.username}.${baseHost}${port}`;
    const isMarketingDisabled = !!subscriptionRules?.isMarketingDisabled;
    const bookingModificationRequestBadgeCount = Number(
        bookingModificationRequestCounts?.total ?? 0,
    );

    const renderTitle = (node: React.ReactNode, isLocked: boolean) => {
        if (isLocked) {
            return (
                <span className="pointer-events-none block w-full cursor-not-allowed select-none opacity-50">
                    {node}
                </span>
            );
        }
        return node;
    };

    const handleLockedClick = (e: any) => {
        e?.preventDefault();
        e?.stopPropagation();
    };

    const isSuperAdmin = auth.roles.some(
        (role: string) =>
            role.endsWith(':superadmin') || role === 'admin:superadmin',
    );

    const SUPERADMIN_PERMISSIONS = [
        'agents.query',
        'agents.mutation',
        'customers.query',
        'customers.mutation',
        'tour-management.query',
        'tour-management.mutation',
        'booking.query',
        'booking.mutation',
        'funds.query',
        'funds.mutation',
        'reports.query',
        'reports.mutation',
        'booking-list.query',
        'booking-list.mutation',
        'room-listings.query',
        'room-listings.mutation',
        'seat-availability.query',
        'seat-availability.mutation',
        'settings.query',
        'settings.mutation',
        'parameter.query',
        'parameter.mutation',
        'chat-ai.query',
        'chat-ai.mutation',
        'commission.query',
        'commission.mutation',
        'vendor-config.query',
        'vendor-config.mutation',
        'marketings.query',
        'marketings.mutation',
        'subscription-ai.query',
        'subscription-ai.mutation',
        'user.query',
        'user.mutation',
        'company.query',
        'company.mutation',
        'company-settings.query',
        'company-settings.mutation',
        'company-team.query',
        'company-team.mutation',
        'wallet.query',
        'wallet.mutation',
        'wallet-transaction.query',
        'wallet-transaction.mutation',
        'withdrawal.query',
        'withdrawal.mutation',
        'payment.query',
        'payment.mutation',
        'bank-account.query',
        'bank-account.mutation',
        'tour.query',
        'tour.mutation',
        'tour-category.query',
        'tour-category.mutation',
        'role.query',
        'role.mutation',
        'media.query',
        'media.mutation',
    ];

    const effectivePermissions = isSuperAdmin
        ? SUPERADMIN_PERMISSIONS
        : auth.permissions;

    const hasRole = (role: string): boolean => auth.roles.includes(role);

    const hasPermission = (permission: string): boolean =>
        effectivePermissions.includes(permission);

    const hasAnyPermission = (permissions: string[]): boolean =>
        permissions.some((permission) => hasPermission(permission));

    const canViewTourManagement = hasPermission('tour-management.query');
    const canViewTourCategories = hasPermission('tour-management.query');
    const canViewAgents = hasPermission('agents.query');
    const canViewCustomers = hasPermission('customers.query');
    const canViewFunds = hasPermission('funds.query');
    const canViewReports = hasPermission('reports.query');
    const canViewBookingList = hasPermission('booking-list.query');
    const canViewRoomListings = hasPermission('room-listings.query');
    const canViewSeatAvailability = hasPermission('seat-availability.query');
    const canViewSettings = hasPermission('settings.query');
    const canViewParameters = hasPermission('parameter.query');
    const canViewChatbot = hasPermission('chat-ai.query');
    const canViewVendorConfig = hasPermission('vendor-config.query');
    const canViewSubscription = hasPermission('subscription-ai.query');
    const canViewCommission = hasPermission('commission.query');
    const canViewMarketings = hasPermission('marketings.query');
    const canViewBookings = hasPermission('booking.query');

    const unfilteredMenus = [
        {
            id: 'home',
            title: <FormattedMessage defaultMessage="Dashboard" />,
            urlOrAction: `/companies/${company.username}/dashboard`,
            icon: HomeIcon,
            shouldDisplay: (roles, _permissions) =>
                roles.includes('user:vendor') || roles.includes('user:agent'),
        },
        {
            id: 'vendor-tours',
            title: <FormattedMessage defaultMessage="Vendor Catalogs" />,
            urlOrAction: '#',
            icon: FolderSearchIcon,
            items:
                (data?.data || []).map((vendor: any) => ({
                    id: `vendor-tours.${vendor.username}`,
                    title: vendor.name,
                    urlOrAction: `/companies/${company.username}/dashboard/vendors/${vendor.username}/tours`,
                    shouldDisplay: () =>
                        hasRole('user:agent') && canViewVendorConfig,
                })) || [],
            shouldDisplay: () =>
                hasRole('user:agent') &&
                canViewVendorConfig &&
                (data?.data || []).length > 0,
        },
        {
            id: 'agent-registrations',
            title: <FormattedMessage defaultMessage="Agents" />,
            urlOrAction: `/companies/${company.username}/dashboard/agent-registrations`,
            icon: UsersRoundIcon,
            shouldDisplay: () => hasRole('user:vendor') && canViewAgents,
        },
        {
            id: 'tours',
            title: <FormattedMessage defaultMessage="Tours" />,
            urlOrAction: '#',
            icon: PlaneIcon,
            items: [
                {
                    id: 'tours.index',
                    title: <FormattedMessage defaultMessage="Products" />,
                    urlOrAction: `/companies/${company.username}/dashboard/tours`,
                    shouldDisplay: () =>
                        hasRole('user:vendor') && canViewTourManagement,
                },
                {
                    id: 'tours.preview',
                    title: <FormattedMessage defaultMessage="My Catalogs" />,
                    urlOrAction: `/companies/${company.username}/dashboard/vendors/${company.username}/tours`,
                    shouldDisplay: () =>
                        hasRole('user:vendor') && canViewTourManagement,
                },
                {
                    id: 'tours.orders',
                    title: <FormattedMessage defaultMessage="Bookings" />,
                    urlOrAction: `/companies/${company.username}/dashboard/bookings`,
                    shouldDisplay: () =>
                        hasRole('user:vendor') && canViewBookings,
                },
                {
                    id: 'tours.waiting-lists',
                    title: <FormattedMessage defaultMessage="Waiting Lists" />,
                    urlOrAction: `/companies/${company.username}/dashboard/waiting-lists`,
                    shouldDisplay: () =>
                        hasRole('user:vendor') && canViewBookings,
                },
                {
                    id: 'tours.booking-correction',
                    title: (
                        <FormattedMessage defaultMessage="Booking Correction" />
                    ),
                    urlOrAction: `/companies/${company.username}/dashboard/booking-correction`,
                    badgeCount: bookingModificationRequestBadgeCount,
                    shouldDisplay: () =>
                        hasRole('user:vendor') && canViewBookings,
                },
                {
                    id: 'tours.categories',
                    title: (
                        <FormattedMessage defaultMessage="Product Categories" />
                    ),
                    urlOrAction: `/companies/${company.username}/dashboard/categories`,
                    shouldDisplay: () =>
                        hasRole('user:vendor') && canViewTourCategories,
                },
                {
                    id: 'tours.price-categories',
                    title: (
                        <FormattedMessage defaultMessage="Price Categories" />
                    ),
                    urlOrAction: `/companies/${company.username}/dashboard/price-categories`,
                    shouldDisplay: () =>
                        hasRole('user:vendor') && canViewTourCategories,
                },
                {
                    id: 'tours.visa-categories',
                    title: (
                        <FormattedMessage defaultMessage="Visa Categories" />
                    ),
                    urlOrAction: `/companies/${company.username}/dashboard/visa-categories`,
                    shouldDisplay: () =>
                        hasRole('user:vendor') && canViewTourCategories,
                },
            ],
            shouldDisplay: () =>
                hasRole('user:vendor') &&
                hasAnyPermission(['tour-management.query', 'booking.query']),
        },
        {
            id: 'agent-tours',
            title: <FormattedMessage defaultMessage="Tours" />,
            urlOrAction: '#',
            icon: PlaneIcon,
            items: [
                {
                    id: 'agent-tours.index',
                    title: <FormattedMessage defaultMessage="Products" />,
                    urlOrAction: `/companies/${company.username}/dashboard/agent-tours`,
                    shouldDisplay: () =>
                        hasRole('user:agent') && canViewTourManagement,
                },
                {
                    id: 'agent-tours.catalogs',
                    title: <FormattedMessage defaultMessage="My Catalogs" />,
                    urlOrAction: `/companies/${company.username}/dashboard/vendors/${company.username}/tours`,
                    shouldDisplay: () =>
                        hasRole('user:agent') && canViewTourManagement,
                },
                {
                    id: 'agent-tours.bookings',
                    title: <FormattedMessage defaultMessage="Bookings" />,
                    urlOrAction: `/companies/${company.username}/dashboard/bookings`,
                    shouldDisplay: () =>
                        hasRole('user:agent') && canViewBookings,
                },
                {
                    id: 'agent-tours.waiting-lists',
                    title: <FormattedMessage defaultMessage="Waiting Lists" />,
                    urlOrAction: `/companies/${company.username}/dashboard/waiting-lists`,
                    shouldDisplay: () =>
                        hasRole('user:agent') && canViewBookings,
                },
                {
                    id: 'agent-tours.booking-correction',
                    title: (
                        <FormattedMessage defaultMessage="Booking Correction" />
                    ),
                    urlOrAction: `/companies/${company.username}/dashboard/booking-correction`,
                    shouldDisplay: () =>
                        hasRole('user:agent') && canViewBookings,
                },
                {
                    id: 'agent-tours.categories',
                    title: (
                        <FormattedMessage defaultMessage="Product Categories" />
                    ),
                    urlOrAction: `/companies/${company.username}/dashboard/categories`,
                    shouldDisplay: () =>
                        hasRole('user:agent') && canViewTourCategories,
                },
            ],
            shouldDisplay: () =>
                hasRole('user:agent') &&
                hasAnyPermission(['tour-management.query', 'booking.query']),
        },
        {
            id: 'customers',
            title: <FormattedMessage defaultMessage="Customers" />,
            urlOrAction: `/companies/${company.username}/dashboard/customers`,
            icon: BookUserIcon,
            shouldDisplay: () => canViewCustomers,
        },
        {
            id: 'funds',
            title: <FormattedMessage defaultMessage="Funds" />,
            urlOrAction: `/companies/${company.username}/dashboard/wallets`,
            icon: WalletIcon,
            items: [
                {
                    id: 'funds.wallets',
                    title: <FormattedMessage defaultMessage="Wallet" />,
                    urlOrAction: `/companies/${company.username}/dashboard/wallets`,
                    shouldDisplay: () => hasPermission('funds.query'),
                },
                {
                    id: 'funds.wallet-transactions',
                    title: (
                        <FormattedMessage defaultMessage="Wallet Transactions" />
                    ),
                    urlOrAction: `/companies/${company.username}/dashboard/wallet-transactions`,
                    shouldDisplay: () => hasPermission('funds.query'),
                },
                {
                    id: 'funds.commission-history',
                    title: (
                        <FormattedMessage defaultMessage="Commission History" />
                    ),
                    urlOrAction: `/companies/${company.username}/dashboard/commission-history`,
                    shouldDisplay: () =>
                        hasRole('user:agent') && hasPermission('funds.query'),
                },
                {
                    id: 'funds.bank-accounts',
                    title: <FormattedMessage defaultMessage="Bank Accounts" />,
                    urlOrAction: `/companies/${company.username}/dashboard/bank-accounts`,
                    shouldDisplay: () => hasPermission('funds.query'),
                },
                {
                    id: 'funds.withdrawals',
                    title: <FormattedMessage defaultMessage="Withdrawals" />,
                    urlOrAction: `/companies/${company.username}/dashboard/withdrawals`,
                    shouldDisplay: () => hasPermission('funds.query'),
                },
                {
                    id: 'funds.payments',
                    title: (
                        <FormattedMessage defaultMessage="Payment History" />
                    ),
                    urlOrAction: `/companies/${company.username}/dashboard/payments`,
                    shouldDisplay: () => hasPermission('funds.query'),
                },
            ],
            shouldDisplay: () =>
                (hasRole('user:agent') || hasRole('user:vendor')) &&
                canViewFunds,
        },
        {
            id: 'marketings',
            title: <FormattedMessage defaultMessage="Marketings" />,
            urlOrAction: '#',
            icon: BoltIcon,
            items: [
                {
                    id: 'marketings.landing-page.edit',
                    title: renderTitle(
                        <FormattedMessage defaultMessage="Edit Landing Page" />,
                        isMarketingDisabled,
                    ),
                    urlOrAction: isMarketingDisabled
                        ? (handleLockedClick as any)
                        : `/companies/${company.username}/dashboard/page/edit`,
                    disabled: isMarketingDisabled,
                    shouldDisplay: () =>
                        hasRole('user:agent') && canViewMarketings,
                },
                {
                    id: 'marketings.landing-page.view',
                    title: renderTitle(
                        <FormattedMessage defaultMessage="My Landing Page" />,
                        isMarketingDisabled,
                    ),
                    urlOrAction: isMarketingDisabled
                        ? (handleLockedClick as any)
                        : companySubdomain,
                    target: isMarketingDisabled ? undefined : '_blank',
                    disabled: isMarketingDisabled,
                    shouldDisplay: () =>
                        hasRole('user:agent') && canViewMarketings,
                },
                {
                    id: 'marketings.analytics',
                    title: renderTitle(
                        <FormattedMessage defaultMessage="Analytics" />,
                        isMarketingDisabled,
                    ),
                    urlOrAction: isMarketingDisabled
                        ? (handleLockedClick as any)
                        : `/companies/${company.username}/dashboard/analytics`,
                    disabled: isMarketingDisabled,
                    shouldDisplay: () =>
                        hasRole('user:agent') && canViewMarketings,
                },
            ],
            shouldDisplay: () => hasRole('user:agent') && canViewMarketings,
        },
        {
            id: 'reports',
            title: <FormattedMessage defaultMessage="Reports" />,
            urlOrAction: '#',
            icon: BarChart3Icon,
            items: [
                {
                    id: 'reports.sales',
                    title: <FormattedMessage defaultMessage="Sales Report" />,
                    urlOrAction: `/companies/${company.username}/dashboard/reports/sales`,
                    shouldDisplay: () =>
                        (hasRole('user:agent') || hasRole('user:vendor')) &&
                        canViewReports,
                },
                {
                    id: 'reports.commissions',
                    title: (
                        <FormattedMessage defaultMessage="Commission Report" />
                    ),
                    urlOrAction: `/companies/${company.username}/dashboard/reports/commissions`,
                    shouldDisplay: () =>
                        (hasRole('user:agent') || hasRole('user:vendor')) &&
                        canViewReports,
                },
                {
                    id: 'reports.bookings',
                    title: <FormattedMessage defaultMessage="Booking List" />,
                    urlOrAction: `/companies/${company.username}/dashboard/reports/bookings`,
                    shouldDisplay: () =>
                        (hasRole('user:agent') || hasRole('user:vendor')) &&
                        canViewBookingList,
                },
                {
                    id: 'reports.room-listings',
                    title: <FormattedMessage defaultMessage="Room Listings" />,
                    urlOrAction: `/companies/${company.username}/dashboard/reports/room-listings`,
                    shouldDisplay: () =>
                        hasRole('user:vendor') && canViewRoomListings,
                },
                {
                    id: 'reports.seat-availability',
                    title: (
                        <FormattedMessage defaultMessage="Seat Availability" />
                    ),
                    urlOrAction: `/companies/${company.username}/dashboard/reports/seat-availabilities`,
                    shouldDisplay: () =>
                        hasRole('user:vendor') && canViewSeatAvailability,
                },
            ],
            shouldDisplay: () =>
                (hasRole('user:agent') || hasRole('user:vendor')) &&
                hasAnyPermission([
                    'reports.query',
                    'booking-list.query',
                    'room-listings.query',
                    'seat-availability.query',
                ]),
        },
        {
            id: 'settings',
            title: <FormattedMessage defaultMessage="Settings" />,
            urlOrAction: '#',
            icon: SettingsIcon,
            items: [
                {
                    id: 'settings.profile',
                    title: <FormattedMessage defaultMessage="Profile" />,
                    urlOrAction: `/companies/${company.username}/dashboard/profile`,
                    shouldDisplay: () => canViewSettings,
                },
                {
                    id: 'settings.linked-accounts',
                    title: (
                        <FormattedMessage defaultMessage="Linked accounts" />
                    ),
                    urlOrAction: `/companies/${company.username}/dashboard/linked-accounts`,
                    shouldDisplay: () => canViewSettings,
                },
                {
                    id: 'settings.parameter-vendor',
                    title: <FormattedMessage defaultMessage="Parameters" />,
                    urlOrAction: `/companies/${company.username}/dashboard/parameter-vendor`,
                    shouldDisplay: () =>
                        hasRole('user:vendor') && canViewParameters,
                },
                {
                    id: 'settings.parameter-agent',
                    title: <FormattedMessage defaultMessage="Parameters" />,
                    urlOrAction: `/companies/${company.username}/dashboard/parameter-agent`,
                    shouldDisplay: () =>
                        hasRole('user:agent') && canViewParameters,
                },
                {
                    id: 'settings.teams',
                    title: (
                        <FormattedMessage defaultMessage="User Management" />
                    ),
                    urlOrAction: `/companies/${company.username}/dashboard/teams`,
                    shouldDisplay: () => canViewSettings,
                },
                {
                    id: 'settings.roles',
                    title: <FormattedMessage defaultMessage="Access Roles" />,
                    urlOrAction: `/companies/${company.username}/dashboard/roles`,
                    shouldDisplay: () => canViewSettings,
                },
                {
                    id: 'settings.chatbot',
                    title: <FormattedMessage defaultMessage="Chat AI" />,
                    urlOrAction: `/companies/${company.username}/dashboard/chatbot`,
                    shouldDisplay: () =>
                        (hasRole('user:vendor') && canViewChatbot) ||
                        (hasRole('user:agent') && canViewSubscription),
                },
                {
                    id: 'settings.vendor-registrations',
                    title: (
                        <FormattedMessage defaultMessage="Registration to Vendor" />
                    ),
                    urlOrAction: `/companies/${company.username}/dashboard/vendor-registrations`,
                    shouldDisplay: () =>
                        hasRole('user:agent') && canViewVendorConfig,
                },
                {
                    id: 'settings.agent-subscriptions',
                    title: 'Agent Subscriptions',
                    urlOrAction: `/companies/${company.username}/dashboard/agent-subscriptions`,
                    shouldDisplay: () =>
                        hasRole('user:agent') && canViewSubscription,
                },
            ],
            shouldDisplay: () =>
                (hasRole('user:agent') || hasRole('user:vendor')) &&
                hasAnyPermission([
                    'settings.query',
                    'parameter.query',
                    'chat-ai.query',
                    'vendor-config.query',
                    'subscription-ai.query',
                ]),
        },
        {
            id: 'commission-setup',
            title: <FormattedMessage defaultMessage="Commission Setup" />,
            urlOrAction: '#',
            icon: BadgePercentIcon,
            items: [
                {
                    id: 'commission-setup.agent-tiers',
                    title: (
                        <FormattedMessage defaultMessage="Agent Categories" />
                    ),
                    urlOrAction: `/companies/${company.username}/dashboard/agent-tiers`,
                    shouldDisplay: () =>
                        hasRole('user:vendor') && canViewCommission,
                },
                {
                    id: 'commission-setup.product-categories',
                    title: (
                        <FormattedMessage defaultMessage="Product Categories" />
                    ),
                    urlOrAction: `/companies/${company.username}/dashboard/product-commission-categories`,
                    shouldDisplay: () =>
                        hasRole('user:vendor') && canViewCommission,
                },
                {
                    id: 'commission-setup.tour-rules',
                    title: (
                        <FormattedMessage defaultMessage="Base Commission" />
                    ),
                    urlOrAction: `/companies/${company.username}/dashboard/tour-commission-rules`,
                    shouldDisplay: () =>
                        hasRole('user:vendor') && canViewCommission,
                },
                {
                    id: 'commission-setup.additional-rules',
                    title: (
                        <FormattedMessage defaultMessage="Additional Commission" />
                    ),
                    urlOrAction: `/companies/${company.username}/dashboard/tour-commission-rules/additional`,
                    shouldDisplay: () =>
                        hasRole('user:vendor') && canViewCommission,
                },
            ],
            shouldDisplay: () => hasRole('user:vendor') && canViewCommission,
        },
    ] as MenuItem[];

    const isMenuVisible = (menu: MenuItem): boolean => {
        if (menu.shouldDisplay) {
            return menu.shouldDisplay(auth.roles, effectivePermissions);
        }
        return true;
    };

    const filterMenuItems = (menus: MenuItem[]): MenuItem[] => {
        const filtered: MenuItem[] = [];
        for (const menu of menus) {
            if (!isMenuVisible(menu)) {
                continue;
            }
            if (menu.items) {
                const filteredChildren = filterMenuItems(menu.items);
                if (filteredChildren.length > 0) {
                    filtered.push({ ...menu, items: filteredChildren });
                }
            } else {
                filtered.push(menu);
            }
        }
        return filtered;
    };

    return filterMenuItems(unfilteredMenus);
}
