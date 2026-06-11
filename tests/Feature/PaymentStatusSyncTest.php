<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\PaymentStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\User;
use App\Models\WalletTopupPayment;

test('payment status sync reconciles wallet topup for already paid payment', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();

    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $topup = WalletTopupPayment::create(['amount' => 100_000]);

    $payment = $topup->payment()->create([
        'owner_id' => $company->id,
        'owner_type' => 'company',
        'provider' => 'midtrans',
        'payment_method' => 'bca_va',
        'amount' => 100_000,
        'status' => PaymentStatus::PAID,
        'payload' => [
            'order_id' => '55-test-order',
            'transaction_status' => 'settlement',
        ],
        'paid_at' => now(),
    ]);

    $initialBalance = (int) $company->wallet->balance;

    $response = $this->actingAs($user)
        ->postJson("/webapi/payments/{$payment->id}/sync-status");

    $response->assertOk()
        ->assertJsonPath('data.status', PaymentStatus::PAID->value)
        ->assertJsonPath('meta.changed', false)
        ->assertJsonPath('meta.previous_status', PaymentStatus::PAID->value);

    expect((int) $company->wallet->fresh()->balance)->toBe($initialBalance + 100_000);
});

test('payment status sync does not double credit already settled wallet topup', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();

    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $topup = WalletTopupPayment::create(['amount' => 100_000]);

    $payment = $topup->payment()->create([
        'owner_id' => $company->id,
        'owner_type' => 'company',
        'provider' => 'midtrans',
        'payment_method' => 'bca_va',
        'amount' => 100_000,
        'status' => PaymentStatus::PAID,
        'payload' => [
            'order_id' => '55-test-order',
            'transaction_status' => 'settlement',
        ],
        'paid_at' => now(),
    ]);

    $company->wallet->deposit(100_000, [
        'type' => 'wallet-topup',
        'payment_id' => $payment->id,
    ]);

    $balanceAfterDeposit = (int) $company->wallet->fresh()->balance;

    $response = $this->actingAs($user)
        ->postJson("/webapi/payments/{$payment->id}/sync-status");

    $response->assertOk()
        ->assertJsonPath('data.status', PaymentStatus::PAID->value)
        ->assertJsonPath('meta.changed', false)
        ->assertJsonPath('meta.previous_status', PaymentStatus::PAID->value);

    expect((int) $company->wallet->fresh()->balance)->toBe($balanceAfterDeposit);
});

test('payment status sync is forbidden for unrelated users', function () {
    $owner = User::factory()->create();
    $stranger = User::factory()->create();
    $company = Company::factory()->create();

    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $owner->id,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $topup = WalletTopupPayment::create(['amount' => 100_000]);

    $payment = $topup->payment()->create([
        'owner_id' => $company->id,
        'owner_type' => 'company',
        'provider' => 'midtrans',
        'payment_method' => 'bca_va',
        'amount' => 100_000,
        'status' => PaymentStatus::PENDING,
        'payload' => [
            'order_id' => '99-test-order',
            'transaction_status' => 'pending',
        ],
    ]);

    $this->actingAs($stranger)
        ->postJson("/webapi/payments/{$payment->id}/sync-status")
        ->assertForbidden();
});

test('payment status sync updates pending midtrans payment from gateway', function () {
    Mockery::mock('alias:Midtrans\Transaction')
        ->shouldReceive('status')
        ->once()
        ->with('42-test-order')
        ->andReturn([
            'transaction_status' => 'settlement',
            'order_id' => '42-test-order',
        ]);

    $user = User::factory()->create();
    $company = Company::factory()->create();

    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $topup = WalletTopupPayment::create(['amount' => 100_000]);

    $payment = $topup->payment()->create([
        'owner_id' => $company->id,
        'owner_type' => 'company',
        'provider' => 'midtrans',
        'payment_method' => 'bca_va',
        'amount' => 100_000,
        'status' => PaymentStatus::PENDING,
        'payload' => [
            'order_id' => '42-test-order',
            'transaction_status' => 'pending',
        ],
    ]);

    $initialBalance = (int) $company->wallet->balance;

    $response = $this->actingAs($user)
        ->postJson("/webapi/payments/{$payment->id}/sync-status");

    $response->assertOk()
        ->assertJsonPath('data.status', PaymentStatus::PAID->value)
        ->assertJsonPath('meta.changed', true)
        ->assertJsonPath('meta.previous_status', PaymentStatus::PENDING->value);

    expect($payment->fresh()->status)->toBe(PaymentStatus::PAID)
        ->and((int) $company->wallet->fresh()->balance)->toBe($initialBalance + 100_000);
});
