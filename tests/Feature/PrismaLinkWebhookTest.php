<?php

use App\Enums\PaymentStatus;
use App\Models\Company;
use App\Models\WalletTopupPayment;
use App\Services\PrismaLinkService;

test('prismalink service parses payment id from pl merchant ref format', function () {
    $service = app(PrismaLinkService::class);

    expect($service->parsePaymentIdFromMerchantRefNo('PL0000000042abcdef01234'))->toBe(42)
        ->and($service->parsePaymentIdFromMerchantRefNo('42-67890abcdef'))->toBe(42)
        ->and($service->parsePaymentIdFromMerchantRefNo('99'))->toBe(99)
        ->and($service->parsePaymentIdFromMerchantRefNo('invalid'))->toBeNull();
});

test('prismalink webhook settles wallet topup using pl merchant ref format', function () {
    $company = Company::factory()->create();
    $topup = WalletTopupPayment::create(['amount' => 100_000]);
    $service = app(PrismaLinkService::class);

    $payment = $topup->payment()->create([
        'owner_id' => $company->id,
        'owner_type' => 'company',
        'provider' => 'prismalink',
        'payment_method' => 'bca_va',
        'amount' => 100_000,
        'status' => PaymentStatus::PENDING,
        'payload' => [],
    ]);

    $merchantRefNo = $service->buildMerchantRefNo($payment->id);

    $payment->update([
        'payload' => [
            'merchant_ref_no' => $merchantRefNo,
        ],
    ]);

    $initialBalance = (int) $company->wallet->balance;

    $response = $this->postJson('/webhooks/prismalink/backend-callback', [
        'merchant_ref_no' => $merchantRefNo,
        'transaction_status' => 'SETLD',
    ]);

    $response->assertOk()
        ->assertJsonPath('ack', true);

    expect($payment->fresh()->status)->toBe(PaymentStatus::PAID)
        ->and((int) $company->wallet->fresh()->balance)->toBe($initialBalance + 100_000)
        ->and(data_get($payment->fresh()->payload, 'transaction_status'))->toBe('SETLD')
        ->and(data_get($payment->fresh()->payload, 'prismalink_notification'))->toBeNull();
});

test('prismalink frontend callback redirects to companies index', function () {
    $response = $this->get('/webhooks/prismalink/frontend-callback');

    $response->assertRedirect(route('companies.show'));
});

test('prismalink webhook finds payment by stored payload merchant ref', function () {
    $company = Company::factory()->create();
    $topup = WalletTopupPayment::create(['amount' => 50_000]);

    $payment = $topup->payment()->create([
        'owner_id' => $company->id,
        'owner_type' => 'company',
        'provider' => 'prismalink',
        'payment_method' => 'bca_va',
        'amount' => 50_000,
        'status' => PaymentStatus::PENDING,
        'payload' => [
            'merchant_ref_no' => 'PL0000000099legacySuffix',
        ],
    ]);

    $response = $this->postJson('/webhooks/prismalink/backend-callback', [
        'merchant_ref_no' => 'PL0000000099legacySuffix',
        'transaction_status' => 'SETLD',
    ]);

    $response->assertOk()
        ->assertJsonPath('ack', true);

    expect($payment->fresh()->status)->toBe(PaymentStatus::PAID);
});
