<?php

use App\Enums\CompanyTeamStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    $this->user = User::factory()->create();
    $this->company = Company::factory()->create([
        'username' => 'wallet-access-company',
    ]);

    CompanyTeam::create([
        'company_id' => $this->company->id,
        'user_id' => $this->user->id,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $this->user->addRoles([
        'user:vendor',
        "company:{$this->company->id}:superadmin",
    ], "company:{$this->company->id}");
});

test('wallet page defaults to the main wallet', function () {
    $this->company->wallet->deposit(100_000, [
        'description' => 'Main wallet deposit',
    ]);

    $secondaryWallet = $this->company->createWallet([
        'name' => 'Commission Wallet',
        'slug' => 'commission',
        'description' => 'Commission earnings',
    ]);

    $secondaryWallet->deposit(50_000, [
        'description' => 'Commission deposit',
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$this->company->username}/dashboard/wallets");

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/wallet/index')
            ->where('balance', 100_000)
            ->where('wallet.slug', 'main')
            ->has('wallets', 2));
});

test('wallet page resolves a selected wallet from the query string', function () {
    $this->company->wallet->deposit(100_000);

    $secondaryWallet = $this->company->createWallet([
        'name' => 'Commission Wallet',
        'slug' => 'commission',
        'description' => 'Commission earnings',
    ]);

    $secondaryWallet->deposit(75_000);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$this->company->username}/dashboard/wallets?wallet=commission");

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/wallet/index')
            ->where('balance', 75_000)
            ->where('wallet.slug', 'commission'));
});

test('wallet transactions page scopes activity to the selected wallet', function () {
    $this->company->wallet->deposit(250_000, [
        'description' => 'Main wallet income',
    ]);

    $secondaryWallet = $this->company->createWallet([
        'name' => 'Commission Wallet',
        'slug' => 'commission',
        'description' => 'Commission earnings',
    ]);

    $secondaryWallet->deposit(40_000, [
        'description' => 'Commission income',
    ]);

    $response = $this->actingAs($this->user)
        ->get("/companies/{$this->company->username}/dashboard/wallet-transactions?wallet=commission&type=income");

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/wallet-transactions/index')
            ->where('filters.wallet', 'commission')
            ->where('wallet.slug', 'commission')
            ->has('transactions', 1)
            ->where('transactions.0.type', 'income')
            ->where('transaction_count', 1)
            ->where('income_amount', 40_000)
            ->where('expense_amount', 0));
});

test('wallet page rejects users without funds query permission', function () {
    $limitedUser = User::factory()->create();
    $restrictedRole = Role::create([
        'name' => "company:{$this->company->id}:restricted-funds",
        'display_name' => 'Restricted Funds',
        'description' => 'Cannot access funds pages',
    ]);

    CompanyTeam::create([
        'company_id' => $this->company->id,
        'user_id' => $limitedUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $limitedUser->addRoles([
        'user:vendor',
        $restrictedRole->name,
    ], "company:{$this->company->id}");

    $this->actingAs($limitedUser)
        ->get("/companies/{$this->company->username}/dashboard/wallets")
        ->assertForbidden();
});

test('wallet transactions page rejects users without funds query permission', function () {
    $limitedUser = User::factory()->create();
    $restrictedRole = Role::create([
        'name' => "company:{$this->company->id}:restricted-wallet-transactions",
        'display_name' => 'Restricted Wallet Transactions',
        'description' => 'Cannot access funds pages',
    ]);

    CompanyTeam::create([
        'company_id' => $this->company->id,
        'user_id' => $limitedUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $limitedUser->addRoles([
        'user:vendor',
        $restrictedRole->name,
    ], "company:{$this->company->id}");

    $this->actingAs($limitedUser)
        ->get("/companies/{$this->company->username}/dashboard/wallet-transactions")
        ->assertForbidden();
});

test('wallet page returns not found for wallets outside the company', function () {
    $this->actingAs($this->user)
        ->get("/companies/{$this->company->username}/dashboard/wallets?wallet=missing-wallet")
        ->assertNotFound();
});
