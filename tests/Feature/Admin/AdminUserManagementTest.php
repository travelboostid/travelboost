<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->withoutVite();

    $this->admin = User::factory()->create();
    $this->admin->addRole('user:admin');
});

test('admin can update a user profile note and identity roles', function () {
    $user = User::factory()->create([
        'note' => null,
    ]);
    $user->addRole('user:customer');

    $response = $this->actingAs($this->admin)->put(
        "/admin/database/users/{$user->id}",
        [
            'note' => 'Needs follow-up from support.',
            'roles' => ['user:vendor'],
        ],
    );

    $response->assertRedirect();

    $user->refresh();

    expect($user->note)->toBe('Needs follow-up from support.')
        ->and($user->roles()->where('name', 'like', 'user:%')->pluck('name')->all())
        ->toBe(['user:vendor']);
});

test('admin can reset another user password', function () {
    $user = User::factory()->create([
        'password' => Hash::make('old-password-123'),
    ]);

    $response = $this->actingAs($this->admin)->put(
        "/admin/database/users/{$user->id}/password",
        [
            'password' => 'NewPassword1!',
            'password_confirmation' => 'NewPassword1!',
        ],
    );

    $response->assertRedirect();

    expect(Hash::check('NewPassword1!', $user->fresh()->password))->toBeTrue();
});

test('admin user edit page includes role options', function () {
    $user = User::factory()->create();

    Role::query()->firstOrCreate([
        'name' => 'user:customer',
    ], [
        'display_name' => 'Customer',
        'description' => 'Customer identity role',
    ]);

    $this->actingAs($this->admin)
        ->get("/admin/database/users/{$user->id}/edit")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/database/users/edit')
            ->has('userRoles'));
});
