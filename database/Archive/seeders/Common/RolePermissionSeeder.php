<?php

namespace Database\Seeders\Common;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
  public function run(): void
  {
    $permissions = [
      'user.create',
      'user.read',
      'user.update',
      'user.delete',

      'company.create',
      'company.read',
      'company.update',
      'company.delete',

      'wallet.create',
      'wallet.read',
      'wallet.update',
      'wallet.delete',

      'tour.create',
      'tour.read',
      'tour.update',
      'tour.delete',
    ];

    foreach ($permissions as $permission) {
      Permission::firstOrCreate([
        'name' => $permission,
      ]);
      $superadmin = Role::firstOrCreate([
        'name' => 'company:0:superadmin',
        'display_name' => 'Superadmin',
      ]);
    }
  }
}
