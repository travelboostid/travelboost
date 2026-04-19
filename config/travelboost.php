<?php

return [
  'permissions' => [
    ['name' => 'user.query', 'display_name' => 'Query User', 'description' => 'Allow viewing users'],
    ['name' => 'user.mutation', 'display_name' => 'Mutate User', 'description' => 'Allow creating, editing, or deleting users'],

    ['name' => 'company.query', 'display_name' => 'Query Company', 'description' => 'Allow viewing companies'],
    ['name' => 'company.mutation', 'display_name' => 'Mutate Company', 'description' => 'Allow creating, editing, or deleting companies'],

    ['name' => 'company.team.query', 'display_name' => 'Query Company Team', 'description' => 'Allow viewing company teams'],
    ['name' => 'company.team.mutation', 'display_name' => 'Mutate Company Team', 'description' => 'Allow creating, editing, or deleting company teams'],

    ['name' => 'fund.query', 'display_name' => 'Query Fund', 'description' => 'Allow viewing funds'],
    ['name' => 'fund.mutation', 'display_name' => 'Mutate Fund', 'description' => 'Allow changes to money related features'],

    ['name' => 'tour.query', 'display_name' => 'Query Tour', 'description' => 'Allow viewing tours'],
    ['name' => 'tour.mutation', 'display_name' => 'Mutate Tour', 'description' => 'Allow creating, editing, or deleting tours'],

    ['name' => 'role.query', 'display_name' => 'Query Role', 'description' => 'Allow viewing roles'],
    ['name' => 'role.mutation', 'display_name' => 'Mutate Role', 'description' => 'Allow creating, editing, or deleting roles'],
  ],
  'company_default_roles' => [
    [
      'name' => 'superadmin',
      'display_name' => 'Superadmin',
      'description' => 'Main role with all permissions',
      'permissions' => [
        'user.query',
        'user.mutation',

        'company.query',
        'company.mutation',

        'company.team.query',
        'company.team.mutation',

        'fund.query',
        'fund.mutation',

        'tour.query',
        'tour.mutation',

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
      ],
    ],
  ],
];
