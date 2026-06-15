<?php

use App\Models\Company;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->admin->addRole('user:admin');
});

test('admin can search resource owners with comma separated types', function () {
    $company = Company::factory()->create([
        'name' => 'Acme Travel',
    ]);

    $response = $this->actingAs($this->admin)->getJson(
        '/webapi/admin/misc/search-resource-owners?types=company&keyword=&include_ids=',
    );

    $response
        ->assertOk()
        ->assertJsonPath('data.companies.0.id', $company->id)
        ->assertJsonPath('data.companies.0.name', 'Acme Travel');
});

test('admin can search multiple resource owner types', function () {
    $company = Company::factory()->create(['name' => 'Beta Tours']);
    $user = User::factory()->create(['name' => 'Charlie Admin']);

    $response = $this->actingAs($this->admin)->getJson(
        '/webapi/admin/misc/search-resource-owners?types=company,user&keyword=&include_ids=',
    );

    $response->assertOk();

    expect(collect($response->json('data.companies'))->pluck('id')->all())
        ->toContain($company->id);
    expect(collect($response->json('data.users'))->pluck('id')->all())
        ->toContain($user->id);
});

test('admin can include selected resource owners by prefixed ids', function () {
    $company = Company::factory()->create(['name' => 'Hidden Company']);

    $response = $this->actingAs($this->admin)->getJson(
        '/webapi/admin/misc/search-resource-owners?types=company&keyword=nonexistent&include_ids=company:'.$company->id,
    );

    $response
        ->assertOk()
        ->assertJsonFragment(['id' => $company->id, 'name' => 'Hidden Company']);
});
