<?php

use App\Enums\PaymentMethodCategory;
use App\Enums\PaymentMethodStatus;
use App\Enums\PaymentMethodUsageScope;
use App\Models\PaymentMethod;
use App\Models\User;

test('payment methods can be filtered by booking usage scope', function () {
    $user = User::factory()->create();

    $bookingMethod = PaymentMethod::query()->create([
        'provider' => 'prismalink',
        'method' => 'bca_va',
        'name' => 'PrismaLink BCA',
        'description' => 'Booking VA',
        'category' => PaymentMethodCategory::BANK_TRANSFER,
        'usage_scope' => PaymentMethodUsageScope::Booking,
        'status' => PaymentMethodStatus::ENABLED,
        'meta' => ['bank_id' => '014'],
    ]);

    PaymentMethod::query()->create([
        'provider' => 'midtrans',
        'method' => 'bca_va',
        'name' => 'Midtrans BCA',
        'description' => 'Platform VA',
        'category' => PaymentMethodCategory::BANK_TRANSFER,
        'usage_scope' => PaymentMethodUsageScope::Platform,
        'status' => PaymentMethodStatus::ENABLED,
        'meta' => ['payment_type' => 'bank_transfer', 'bank' => 'bca'],
    ]);

    $response = $this->actingAs($user)
        ->getJson('/webapi/payment-methods?usage_scope=booking');

    $response->assertOk();

    $ids = collect($response->json('data'))->pluck('id')->all();

    expect($ids)->toBe([$bookingMethod->id]);
});
