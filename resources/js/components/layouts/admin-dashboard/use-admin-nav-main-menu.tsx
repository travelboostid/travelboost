import {
    BoltIcon,
    DatabaseIcon,
    HomeIcon,
    PlaneIcon,
    Settings2Icon,
    SettingsIcon,
    WalletIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import type { MenuItem } from '../components/sidebar-menu-renderer';

export default function useAdminNavMainMenu() {
    return useMemo(
        () =>
            [
                {
                    id: 'dashboard',
                    title: 'Dashboard',
                    urlOrAction: `/admin/dashboard`,
                    icon: HomeIcon,
                },
                {
                    id: 'database',
                    title: 'Database',
                    urlOrAction: `#`,
                    icon: DatabaseIcon,
                    items: [
                        {
                            id: 'database.vendors',
                            title: 'Vendor',
                            urlOrAction: '/admin/database/vendors',
                        },
                        {
                            id: 'database.agents',
                            title: 'Agent',
                            urlOrAction: '/admin/database/agents',
                        },
                        {
                            id: 'database.affiliates',
                            title: 'Affiliate',
                            urlOrAction: '/admin/database/affiliates',
                        },
                        {
                            id: 'database.users',
                            title: 'Users',
                            urlOrAction: '/admin/database/users',
                        },
                        {
                            id: 'database.permissions',
                            title: 'Permissions',
                            urlOrAction: '/admin/database/permissions',
                        },
                        {
                            id: 'database.roles',
                            title: 'Roles',
                            urlOrAction: '/admin/database/roles',
                        },
                        {
                            id: 'database.medias',
                            title: 'Media',
                            urlOrAction: '/admin/database/medias',
                        },
                        {
                            id: 'database.knowledge-bases',
                            title: 'Knowledge Bases',
                            urlOrAction: '/admin/database/knowledge-bases',
                        },
                    ],
                },
                {
                    id: 'tours',
                    title: 'Tours',
                    urlOrAction: '#',
                    icon: PlaneIcon,
                    items: [
                        {
                            id: 'tours.products',
                            title: 'Products',
                            urlOrAction: '/admin/tours/products',
                        },
                        {
                            id: 'tours.vendor-catalogs',
                            title: 'Vendor Catalog',
                            urlOrAction: '/admin/tours/vendor-catalogs',
                        },
                        {
                            id: 'tours.orders',
                            title: 'Orders',
                            urlOrAction: '/admin/tours/orders',
                        },
                    ],
                },
                {
                    id: 'funds',
                    title: 'Funds',
                    urlOrAction: '#',
                    icon: WalletIcon,
                    items: [
                        {
                            id: 'funds.wallets',
                            title: 'Wallets',
                            urlOrAction: '/admin/funds/wallets',
                        },
                        {
                            id: 'funds.wallet-transactions',
                            title: 'Wallet Transactions',
                            urlOrAction: '/admin/funds/wallet-transactions',
                        },
                        {
                            id: 'funds.payments',
                            title: 'Payments',
                            urlOrAction: '/admin/funds/payments',
                        },
                        {
                            id: 'funds.bank-accounts',
                            title: 'Bank Accounts',
                            urlOrAction: '/admin/funds/bank-accounts',
                        },
                        {
                            id: 'funds.withdrawals',
                            title: 'Withdrawals',
                            urlOrAction: '/admin/funds/withdrawals',
                        },
                    ],
                },
                {
                    id: 'reports',
                    title: 'Reports',
                    urlOrAction: '#',
                    icon: BoltIcon,
                    items: [
                        {
                            id: 'reports.inventories',
                            title: 'Inventory Status',
                            urlOrAction: '/admin/reports/inventories',
                        },
                    ],
                },
                {
                    id: 'settings',
                    title: 'Settings',
                    urlOrAction: '#',
                    icon: SettingsIcon,
                    items: [
                        {
                            id: 'settings.users',
                            title: 'User Management',
                            urlOrAction: '/admin/database/users',
                        },
                        {
                            id: 'settings.vouchers',
                            title: 'Vouchers',
                            urlOrAction: '/admin/vouchers',
                        },
                    ],
                },
                {
                    id: 'configurations',
                    title: 'App Configurations',
                    urlOrAction: '/admin/app-configs',
                    icon: Settings2Icon,
                },
            ] as MenuItem[],
        [],
    );
}
