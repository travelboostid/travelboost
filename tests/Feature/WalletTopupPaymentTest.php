<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\PaymentStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\User;
use App\Models\WalletTopupPayment;

test('create topup payment rejects when a pending topup already exists', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create();

    CompanyTeam::create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'status' => CompanyTeamStatus::ACTIVE,
    ]);

    $paymentMethod = createMidtransBcaPaymentMethod();

    $topup = WalletTopupPayment::create([
        'user_id' => $user->id,
        'amount' => 100_000,
    ]);

    $existingPayment = $topup->payment()->create([
        'owner_id' => $company->id,
        'owner_type' => 'company',
        'provider' => 'midtrans',
        'payment_method' => 'bca_va',
        'amount' => 100_000,
        'status' => PaymentStatus::PENDING,
        'payload' => [
            'order_id' => 'pending-topup-order',
        ],
    ]);

    $response = $this->actingAs($user)->postJson('/webapi/payments/create-topup-payment', [
        'owner_type' => 'company',
        'owner_id' => $company->id,
        'amount' => 200_000,
        'payment_method_id' => $paymentMethod->id,
    ]);

    $response->assertStatus(409)
        ->assertJsonPath('existing_payment.id', $existingPayment->id)
        ->assertJsonFragment([
            'message' => 'You already have a pending wallet top-up. Complete or cancel it before starting a new one.',
        ]);
});
