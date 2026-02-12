<?php

namespace Database\Seeders;

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
      // User permissions
      'view users',
      'create users',
      'edit users',
      'delete users',
      // TODO: Add more permissions as needed
    ];

    foreach ($permissions as $permission) {
      Permission::create(['name' => $permission]);
    }

    // Create roles and assign permissions
    $roleAdmin = Role::create(['name' => 'admin']);
    $roleAdmin->givePermissionTo(Permission::all());

    $roleGeneric = Role::create(['name' => 'generic']);
    $userPermissions = [
      'view users',
      'create users',
      'edit users',
      'delete users',
    ];
    $roleGeneric->givePermissionTo($userPermissions);

    // // Create super admin user
    // $admin = \App\Models\User::create([
    //     'name' => 'Super Admin',
    //     'email' => 'admin@example.com',
    //     'password' => bcrypt('password'),
    //     'email_verified_at' => now(),
    // ]);
    // $admin->assignRole('admin');

    // // Create editor user
    // $editor = \App\Models\User::create([
    //     'name' => 'Editor User',
    //     'email' => 'editor@example.com',
    //     'password' => bcrypt('password'),
    //     'email_verified_at' => now(),
    // ]);
    // $editor->assignRole('editor');

    // // Create regular user
    // $user = \App\Models\User::create([
    //     'name' => 'Regular User',
    //     'email' => 'user@example.com',
    //     'password' => bcrypt('password'),
    //     'email_verified_at' => now(),
    // ]);
    // $user->assignRole('user');
  }
}
