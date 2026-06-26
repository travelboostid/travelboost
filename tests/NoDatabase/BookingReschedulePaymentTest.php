<?php

use App\Support\BookingReschedulePayment;

test('is price adjustment waived returns true only when payload explicitly disables it', function () {
    $support = new BookingReschedulePayment;

    expect($support->isPriceAdjustmentWaived(null))->toBeFalse()
        ->and($support->isPriceAdjustmentWaived(['apply_customer_price_adjustment' => true]))->toBeFalse()
        ->and($support->isPriceAdjustmentWaived(['apply_customer_price_adjustment' => false]))->toBeTrue();
});

test('normalize money always returns a rounded non-negative float', function () {
    $support = new BookingReschedulePayment;

    expect($support->normalizeMoney(8_925_000))->toBe(8_925_000.0)
        ->and($support->normalizeMoney(8_925_000.126))->toBe(8_925_000.13)
        ->and($support->normalizeMoney(-100))->toBe(0.0);
});
