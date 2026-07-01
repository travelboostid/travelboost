<?php

use App\Enums\CompanyType;
use App\Models\Company;
use App\Models\User;

beforeEach(function () {
    $this->withoutVite();

    $this->admin = User::factory()->create();
    $this->admin->addRole('user:admin');
});

test('admin can update vendor package one agent access setting', function () {
    $vendor = Company::factory()->create([
        'type' => CompanyType::VENDOR,
        'allow_package_one_agents' => false,
    ]);

    $response = $this->actingAs($this->admin)->put(
        "/admin/database/vendors/{$vendor->id}",
        [
            'allow_package_one_agents' => true,
        ],
    );

    $response->assertRedirect();

    expect($vendor->fresh()->allow_package_one_agents)->toBeTrue();
});
