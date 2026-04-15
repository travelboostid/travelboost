<?php

namespace Database\Seeders\Common;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Team;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
  public function run(): void
  {
    $team = Team::firstOrCreate([
      'name' => 'company:0',
      'display_name' => 'Travelboost',
    ]);
    $permissions = [
      'user.create',
      'user.read',
      'user.update',
      'user.delete',

      'company.create',
      'company.read',
      'company.update',
      'company.delete',

      'company.setting.read',
      'company.setting.update',

      'company.team.create',
      'company.team.read',
      'company.team.update',
      'company.team.delete',

      'wallet.create',
      'wallet.read',
      'wallet.update',
      'wallet.delete',

      'tour.create',
      'tour.read',
      'tour.update',
      'tour.delete',

      'tour.category.create',
      'tour.category.read',
      'tour.category.update',
      'tour.category.delete',
    ];

    $superadmin = Role::firstOrCreate([
      'name' => 'company:0:superadmin',
      'display_name' => 'Superadmin',
    ]);
    foreach ($permissions as $permission) {
      Permission::firstOrCreate([
        'name' => $permission,
      ]);
    }
    $superadmin->syncPermissions($permissions);
  }
}
