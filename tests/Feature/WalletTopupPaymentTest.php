<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\PaymentMethodCategory;
use App\Enums\PaymentMethodStatus;
use App\Enums\PaymentStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\PaymentMethod;
use App\Models\User;
use App\Models\WalletTopupPayment;
use Illuminate\Support\Facades\Http;

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

test('prismalink wallet topup sends configured backend callback url', function () {
    config([
        'prismalink.merchant_id' => 'merchant',
        'prismalink.merchant_key_id' => 'key',
        'prismalink.secret_key' => 'secret',
        'prismalink.backend_callback_url' => 'https://tunnel-8000.travelboost.co.id/webhooks/prismalink/backend-callback',
        'prismalink.frontend_callback_url' => 'https://tunnel-8000.travelboost.co.id',
    ]);

    Http::fake([
        'api-staging.plink.co.id/*' => Http::response([
            'response_code' => 'PL000',
            'plink_ref_no' => 'PLINK-WALLET-1',
            'transaction_status' => 'PNDNG',
            'validity' => now()->addDay()->toDateTimeString(),
            'va_number_list' => json_encode([
                ['bank' => 'BRI', 'va' => '77788000123456'],
            ]),
        ]),
    ]);

    $user = User::factory()->create();
    $company = Company::factory()->create();

    $paymentMethod = PaymentMethod::query()->create([
        'provider' => 'prismalink',
        'method' => 'bri_va',
        'name' => 'PrismaLink BRI Virtual Account',
        'description' => 'Test PrismaLink BRI VA',
        'category' => PaymentMethodCategory::BANK_TRANSFER,
        'status' => PaymentMethodStatus::ENABLED,
        'meta' => [
            'bank_id' => '002',
        ],
    ]);

    $response = $this->actingAs($user)->postJson('/webapi/payments/create-topup-payment', [
        'owner_type' => 'company',
        'owner_id' => $company->id,
        'amount' => 200_000,
        'payment_method_id' => $paymentMethod->id,
    ]);

    $response->assertOk()
        ->assertJsonPath('data.provider', 'prismalink')
        ->assertJsonPath('data.payload.instruction_type', 'va');

    Http::assertSent(function ($request): bool {
        $payload = json_decode($request->body(), true);

        return is_array($payload)
            && ($payload['backend_callback_url'] ?? null) === 'https://tunnel-8000.travelboost.co.id/webhooks/prismalink/backend-callback'
            && ($payload['frontend_callback_url'] ?? null) === 'https://tunnel-8000.travelboost.co.id';
    });
});
