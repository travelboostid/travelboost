<?php

namespace Database\Seeders\Common;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $roles = config('travelboost.roles');
        $permissions = config('travelboost.permissions');

        foreach ($permissions as $permission) {
            Permission::query()->updateOrCreate(
                ['name' => $permission['name']],
                [
                    'display_name' => $permission['display_name'],
                    'description' => $permission['description'],
                ],
            );
        }

        foreach ($roles as $role) {
            $r = Role::query()->updateOrCreate(
                ['name' => $role['name']],
                [
                    'display_name' => $role['display_name'],
                    'description' => $role['description'],
                ],
            );
            $r->syncPermissions($role['permissions']);
        }
    }
}
