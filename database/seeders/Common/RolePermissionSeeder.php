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
    $permissions = config('travelboost.permissions');

    $superadmin = Role::firstOrCreate([
      'name' => 'company:0:superadmin',
      'display_name' => 'Superadmin',
    ]);
    foreach ($permissions as $permission) {
      Permission::firstOrCreate([
        'name' => $permission['name'],
        'display_name' => $permission['display_name'],
        'description' => $permission['description'],
      ]);
    }
    $superadmin->syncPermissions(Permission::all());
  }
}
