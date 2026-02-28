<?php

namespace Database\Seeders\Local;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
  public function run(): void
  {
    // Reset cached roles and permissions
    app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

    // Create permissions
    $permissions = [
      // telescope
      'access telescope',

      // User permissions
      'view users',
      'create users',
      'edit users',
      'delete users',

      // Tours
      'view tours',
      'create tours',
      'edit tours',
      'delete tours',

      // Funds
      'create wallet',
      'view wallet',
      'create transactions',
      'view transactions',
    ];

    foreach ($permissions as $permission) {
      Permission::create(['name' => $permission]);
    }

    // Create roles and assign permissions
    $superadmin = Role::create(['name' => 'superadmin']);
    $admin = Role::create(['name' => 'admin']);
    $generic = Role::create(['name' => 'generic']);

    $superadmin->givePermissionTo(Permission::all());
    $admin->givePermissionTo(Permission::all());
    $generic->givePermissionTo(Permission::all());

    $userPermissions = [
      'view users',
      'create users',
      'edit users',
      'delete users',
    ];
    $generic->givePermissionTo($userPermissions);
  }
}
