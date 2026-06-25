<?php

use App\Models\Role;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->addRole('user:admin');
});

test('modifying the admin:superadmin role returns a validation error', function () {
    $superadminRole = Role::where('name', 'admin:superadmin')->firstOrFail();

    $response = $this->actingAs($this->admin)->put(
        "/admin/database/roles/{$superadminRole->id}",
        [
            'display_name' => 'Modified Superadmin',
        ]
    );

    $response->assertRedirect();
    $response->assertSessionHasErrors(['role']);
    expect($superadminRole->fresh()->display_name)->not->toBe('Modified Superadmin');
});

test('deleting the admin:superadmin role returns a validation error', function () {
    $superadminRole = Role::where('name', 'admin:superadmin')->firstOrFail();

    $response = $this->actingAs($this->admin)->delete(
        "/admin/database/roles/{$superadminRole->id}"
    );

    $response->assertRedirect();
    $response->assertSessionHasErrors(['role']);
    $this->assertDatabaseHas('roles', ['name' => 'admin:superadmin']);
});

test('an admin user cannot delete their own assigned role', function () {
    $customRole = Role::create([
        'name' => 'custom-admin-role',
        'display_name' => 'Custom Admin Role',
    ]);

    $this->admin->roles()->attach($customRole->id);

    $response = $this->actingAs($this->admin)->delete(
        "/admin/database/roles/{$customRole->id}"
    );

    $response->assertRedirect();
    $response->assertSessionHasErrors(['role']);
    $this->assertDatabaseHas('roles', ['id' => $customRole->id]);
});

test('an admin user cannot strip their own role of role.query or role.mutation permissions', function () {
    $customRole = Role::create([
        'name' => 'custom-admin-role',
        'display_name' => 'Custom Admin Role',
    ]);
    $customRole->syncPermissions(['role.query', 'role.mutation']);

    $this->admin->roles()->attach($customRole->id);

    $response = $this->actingAs($this->admin)->put(
        "/admin/database/roles/{$customRole->id}",
        [
            'display_name' => 'Custom Admin Role',
            'permissions' => [
                'role.query' => false,
                'role.mutation' => true,
            ],
        ]
    );

    $response->assertRedirect();
    $response->assertSessionHasErrors(['permissions']);

    $customRole->refresh();
    expect($customRole->hasPermission('role.query'))->toBeTrue();
    expect($customRole->hasPermission('role.mutation'))->toBeTrue();
});
