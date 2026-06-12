<?php

return [
    'scheduler_timezone' => env('SCHEDULER_TIMEZONE', 'Asia/Jakarta'),
    'agent_subscription_expiry_check_time' => env('AGENT_SUBSCRIPTION_EXPIRY_CHECK_TIME', '00:00'),
    'permissions' => [
        ['name' => 'user.query', 'display_name' => 'Query User', 'description' => 'Allow viewing users'],
        ['name' => 'user.mutation', 'display_name' => 'Mutate User', 'description' => 'Allow creating, editing, or deleting users'],

        ['name' => 'company.query', 'display_name' => 'Query Company', 'description' => 'Allow viewing companies'],
        ['name' => 'company.mutation', 'display_name' => 'Mutate Company', 'description' => 'Allow creating, editing, or deleting companies'],

        ['name' => 'company-settings.query', 'display_name' => 'Query Company Settings', 'description' => 'Allow viewing company settings'],
        ['name' => 'company-settings.mutation', 'display_name' => 'Mutate Company Settings', 'description' => 'Allow creating, editing, or deleting company settings'],

        ['name' => 'company-team.query', 'display_name' => 'Query Company Team', 'description' => 'Allow viewing company teams'],
        ['name' => 'company-team.mutation', 'display_name' => 'Mutate Company Team', 'description' => 'Allow creating, editing, or deleting company teams'],

        ['name' => 'wallet.query', 'display_name' => 'Query Fund', 'description' => 'Allow viewing funds'],
        ['name' => 'wallet.mutation', 'display_name' => 'Mutate Fund', 'description' => 'Allow changes to money related features'],

        ['name' => 'payment.query', 'display_name' => 'Query Payment', 'description' => 'Allow viewing payments'],
        ['name' => 'payment.mutation', 'display_name' => 'Mutate Payment', 'description' => 'Allow creating, editing, or deleting payments'],

        ['name' => 'wallet-transaction.query', 'display_name' => 'Query Fund Transaction', 'description' => 'Allow viewing fund transactions'],
        ['name' => 'wallet-transaction.mutation', 'display_name' => 'Mutate Fund Transaction', 'description' => 'Allow creating, editing, or deleting fund transactions'],

        ['name' => 'withdrawal.query', 'display_name' => 'Query Withdrawal', 'description' => 'Allow viewing withdrawals'],
        ['name' => 'withdrawal.mutation', 'display_name' => 'Mutate Withdrawal', 'description' => 'Allow creating, editing, or deleting withdrawals'],

        ['name' => 'bank-account.query', 'display_name' => 'Query Bank Account', 'description' => 'Allow viewing bank accounts'],
        ['name' => 'bank-account.mutation', 'display_name' => 'Mutate Bank Account', 'description' => 'Allow creating, editing, or deleting bank accounts'],

        ['name' => 'tour.query', 'display_name' => 'Query Tour', 'description' => 'Allow viewing tours'],
        ['name' => 'tour.mutation', 'display_name' => 'Mutate Tour', 'description' => 'Allow creating, editing, or deleting tours'],

        ['name' => 'tour-category.query', 'display_name' => 'Query Tour Category', 'description' => 'Allow viewing tour categories'],
        ['name' => 'tour-category.mutation', 'display_name' => 'Mutate Tour Category', 'description' => 'Allow creating, editing, or deleting tour categories'],

        ['name' => 'role.query', 'display_name' => 'Query Role', 'description' => 'Allow viewing roles'],
        ['name' => 'role.mutation', 'display_name' => 'Mutate Role', 'description' => 'Allow creating, editing, or deleting roles'],

        ['name' => 'app-configuration.query', 'display_name' => 'Query App Configuration', 'description' => 'Allow viewing app configuration'],
        ['name' => 'app-configuration.mutation', 'display_name' => 'Mutate App Configuration', 'description' => 'Allow creating, editing, or deleting app configuration'],
    ],
    'roles' => [
        // identity roles for identifying user types, these roles are not meant to be assigned permissions
        [
            'name' => 'user:admin',
            'display_name' => 'admin',
            'description' => 'Admin role with permissions to manage company and tours',
            'permissions' => [],
        ],
        [
            'name' => 'user:agent',
            'display_name' => 'Agent',
            'description' => 'Agent role with permissions to manage tours',
            'permissions' => [],
        ],
        [
            'name' => 'user:vendor',
            'display_name' => 'Vendor',
            'description' => 'Vendor role with permissions to manage tours',
            'permissions' => [],
        ],
        [
            'name' => 'user:customer',
            'display_name' => 'Customer',
            'description' => 'Customer role with permissions to view tours and manage their bookings',
            'permissions' => [],
        ],
        [
            'name' => 'user:affiliate',
            'display_name' => 'Affiliate',
            'description' => 'Affiliate role with permissions to view tours and manage their referrals',
            'permissions' => [],
        ],
        // admin roles
        [
            'name' => 'admin:superadmin',
            'display_name' => 'Superadmin',
            'description' => 'Main role with all permissions',
            'permissions' => [
                'user.query',
                'user.mutation',

                'company.query',
                'company.mutation',

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

                'app-configuration.query',
                'app-configuration.mutation',
            ],
        ],
        [
            'name' => 'admin:finance',
            'display_name' => 'Finance',
            'description' => 'Finance role with permissions to manage company and tours',
            'permissions' => [
                'wallet.query',
                'wallet.mutation',
            ],
        ],
    ],
    'company_usable_permissions' => [
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
    ],
    'company_default_roles' => [
        // these roles will be created as company:<id>:<role_name> for each company and can be assigned to users
        [
            'name' => 'superadmin',
            'display_name' => 'Superadmin',
            'description' => 'Main role with all permissions',
            'permissions' => [
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
            ],
        ],
        [
            'name' => 'admin',
            'display_name' => 'Admin',
            'description' => 'Admin role with permissions to manage company and tours',
            'permissions' => [
                'user.query',

                'company.query',
                'company.mutation',

                'tour.query',
                'tour.mutation',

                'tour-category.query',
                'tour-category.mutation',
            ],
        ],
    ],
    'company_default_settings' => [
        'chatbot_enabled' => true,
        'chatbot_response_style' => 'professional',
        'chatbot_default_language' => 'auto',
    ],
    'bank_account_providers' => [
        [
            'code' => 'bca',
            'name' => 'BCA',
        ],
        [
            'code' => 'bni',
            'name' => 'BNI',
        ],
        [
            'code' => 'mandiri',
            'name' => 'Mandiri',
        ],
        [
            'code' => 'ovo',
            'name' => 'OVO',
        ],
        [
            'code' => 'gopay',
            'name' => 'GoPay',
        ],
    ],
];
