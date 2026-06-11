<?php

use App\Models\Payment;

test('merge midtrans payload stores gateway fields flat and strips legacy keys', function () {
    $merged = Payment::mergeMidtransPayload([
        'booking_payment_type' => 'down_payment',
        'payment_type' => 'down_payment',
        'order_id' => '42-abc',
        'instruction_type' => 'va',
        'va_number' => '80777100123456',
        'request' => ['transaction_details' => ['order_id' => '42-abc']],
        'midtrans' => [
            'transaction_status' => 'pending',
        ],
    ], [
        'transaction_status' => 'settlement',
        'transaction_id' => 'mid-123',
        'payment_type' => 'bank_transfer',
        'order_id' => '42-abc',
    ]);

    expect($merged)->toMatchArray([
        'booking_payment_type' => 'down_payment',
        'payment_type' => 'down_payment',
        'order_id' => '42-abc',
        'instruction_type' => 'va',
        'va_number' => '80777100123456',
        'transaction_status' => 'settlement',
        'transaction_id' => 'mid-123',
    ])
        ->and($merged)->not->toHaveKey('midtrans')
        ->and($merged)->not->toHaveKey('request');
});

test('merge prismalink payload stores gateway fields flat and strips legacy keys', function () {
    $merged = Payment::mergePrismaLinkPayload([
        'merchant_ref_no' => 'PL0000000012suffix',
        'plink_ref_no' => 'old-ref',
        'prismalink' => ['response_code' => 'PL000'],
        'prismalink_notification' => [
            'transaction_status' => 'PNDNG',
        ],
    ], [
        'payment_status' => 'SETLD',
        'transaction_status' => 'SETLD',
        'payment_date' => '2026-06-10 10:00:00.000 +0700',
        'bank_ref_no' => 'BR123',
    ]);

    expect($merged)->toMatchArray([
        'merchant_ref_no' => 'PL0000000012suffix',
        'plink_ref_no' => 'old-ref',
        'payment_status' => 'SETLD',
        'transaction_status' => 'SETLD',
        'payment_date' => '2026-06-10 10:00:00.000 +0700',
        'bank_ref_no' => 'BR123',
    ])
        ->and($merged)->not->toHaveKey('prismalink')
        ->and($merged)->not->toHaveKey('prismalink_notification');
});

test('gateway notification data falls back to legacy nested midtrans payload', function () {
    $gateway = Payment::gatewayNotificationData([
        'payment_type' => 'full_payment',
        'midtrans' => [
            'payment_type' => 'bank_transfer',
            'order_id' => 'full-order-123',
            'transaction_id' => 'midtrans-transaction-123',
            'transaction_status' => 'settlement',
        ],
    ]);

    expect($gateway)->toMatchArray([
        'payment_type' => 'bank_transfer',
        'order_id' => 'full-order-123',
        'transaction_id' => 'midtrans-transaction-123',
        'transaction_status' => 'settlement',
    ]);
});
