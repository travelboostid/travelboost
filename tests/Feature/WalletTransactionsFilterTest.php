<?php

use App\Enums\CompanyTeamStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;

test('wallet transactions page filters income on the backend', function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    $user = User::factory()->create();
    $company = Company::factory()->create();

    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $user->addRoles([
        'user:vendor',
        "company:{$company->id}:superadmin",
    ], "company:{$company->id}");

    $company->wallet->deposit(250_000, [
        'type' => 'wallet-topup',
        'description' => 'Test income',
    ]);

    $company->wallet->withdraw(50_000, [
        'type' => 'wallet-withdrawal',
        'description' => 'Test expense',
    ]);

    $response = $this->actingAs($user)
        ->get("/companies/{$company->username}/dashboard/wallet-transactions?type=income");

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/wallet-transactions/index')
            ->where('filters.type', 'income')
            ->where('filters.wallet', 'main')
            ->has('transactions', 1)
            ->where('transactions.0.type', 'income')
            ->where('transaction_count', 2)
            ->where('income_amount', 250_000)
            ->where('expense_amount', 50_000));
});
