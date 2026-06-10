<?php

use App\Models\PaymentMethod;
use App\Services\MidtransException;
use App\Services\MidtransService;
use Illuminate\Support\Facades\Http;

test('midtrans exception parses api status message from sdk error', function () {
    $exception = MidtransException::fromThrowable(new RuntimeException(
        'Midtrans API is returning API error. HTTP status code: 402 API response: {"status_code":"402","status_message":"Payment channel is not activated.","id":"test-id"}',
    ));

    expect($exception->getMessage())->toBe('Payment channel is not activated.')
        ->and($exception->statusCode)->toBe('402')
        ->and($exception->response)->toMatchArray([
            'status_code' => '402',
            'status_message' => 'Payment channel is not activated.',
        ]);
});

test('midtrans extract qris instructions materializes authenticated qr image url', function () {
    Http::fake([
        'https://api.sandbox.midtrans.com/v2/qris/*' => Http::response(
            'png-bytes',
            200,
            ['Content-Type' => 'image/png'],
        ),
    ]);

    $paymentMethod = new PaymentMethod([
        'meta' => ['payment_type' => 'qris', 'acquirer' => 'gopay'],
    ]);

    $service = app(MidtransService::class);
    $instructions = $service->extractInstructions([
        'actions' => [
            [
                'name' => 'generate-qr-code',
                'method' => 'GET',
                'url' => 'https://api.sandbox.midtrans.com/v2/qris/abc/qr-code',
            ],
        ],
    ], $paymentMethod);

    expect($instructions)->toMatchArray([
        'instruction_type' => 'qris',
        'qr_url' => 'data:image/png;base64,'.base64_encode('png-bytes'),
    ]);
});

test('midtrans extract qris instructions prefers qr string when present', function () {
    $paymentMethod = new PaymentMethod([
        'meta' => ['payment_type' => 'qris', 'acquirer' => 'gopay'],
    ]);

    $service = app(MidtransService::class);
    $instructions = $service->extractInstructions([
        'qr_string' => '00020101021126550014ID.CO.QRIS.WWW',
        'actions' => [
            [
                'name' => 'generate-qr-code',
                'method' => 'GET',
                'url' => 'https://api.sandbox.midtrans.com/v2/qris/abc/qr-code',
            ],
        ],
    ], $paymentMethod);

    expect($instructions)->toMatchArray([
        'instruction_type' => 'qris',
        'qr_data' => '00020101021126550014ID.CO.QRIS.WWW',
    ])->and($instructions)->toHaveKey('qr_url');
});
