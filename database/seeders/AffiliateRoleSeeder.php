<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class AffiliateRoleSeeder extends Seeder
{
  public function run(): void
  {
    $roles = [
      [
        'name' => 'partner',
        'display_name' => 'Partner',
        'description' => 'Top Tier Affiliate Partner'
      ],
      [
        'name' => 'master_affiliate',
        'display_name' => 'Master Affiliate',
        'description' => 'Master Affiliator'
      ],
      [
        'name' => 'affiliate',
        'display_name' => 'Affiliate',
        'description' => 'Standard Affiliator'
      ]
    ];

    foreach ($roles as $role) {
      Role::firstOrCreate(
        ['name' => $role['name']],
        $role
      );
    }
  }
}
