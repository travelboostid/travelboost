<?php

use App\Actions\Booking\ReconcileBookingPaymentAfterRepriceAction;
use App\Enums\BookingStatus;

test('resolve target status returns down payment when amount is still due', function () {
    $action = new ReconcileBookingPaymentAfterRepriceAction;

    expect($action->resolveTargetStatus(10_000_000, 18_900_000))
        ->toBe(BookingStatus::DOWN_PAYMENT);
});

test('resolve target status returns full payment when booking is fully paid', function () {
    $action = new ReconcileBookingPaymentAfterRepriceAction;

    expect($action->resolveTargetStatus(10_000_000, 10_000_000))
        ->toBe(BookingStatus::FULL_PAYMENT);
});

test('resolve target status returns full payment when customer overpaid', function () {
    $action = new ReconcileBookingPaymentAfterRepriceAction;

    expect($action->resolveTargetStatus(10_500_000, 10_000_000))
        ->toBe(BookingStatus::FULL_PAYMENT);
});

test('resolve target status returns down payment when nothing has been paid yet', function () {
    $action = new ReconcileBookingPaymentAfterRepriceAction;

    expect($action->resolveTargetStatus(0, 10_000_000))
        ->toBe(BookingStatus::DOWN_PAYMENT);
});

test('resolve target status uses epsilon when comparing due amount', function () {
    $action = new ReconcileBookingPaymentAfterRepriceAction;

    expect($action->resolveTargetStatus(9_999_999.995, 10_000_000))
        ->toBe(BookingStatus::FULL_PAYMENT)
        ->and($action->resolveTargetStatus(9_999_999.98, 10_000_000))
        ->toBe(BookingStatus::DOWN_PAYMENT);
});
