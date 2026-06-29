<?php

use App\Models\PaymentMethod;
use App\Models\User;
use App\Models\WalletTopupPayment;
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

test('midtrans snap token payload includes order id and instruction type', function () {
    mockMidtransSnapGetToken('unit-snap-token');

    $user = User::factory()->create();
    $paymentMethod = createMidtransBcaPaymentMethod();
    $topup = WalletTopupPayment::create([
        'user_id' => $user->id,
        'amount' => 150_000,
    ]);
    $payment = $topup->payment()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'midtrans',
        'payment_method' => 'bca_va',
        'amount' => 150_000,
        'status' => 'unpaid',
    ]);

    $service = app(MidtransService::class);
    $payload = $service->createSnapToken($payment, $paymentMethod, $user, 'https://example.test/finish');

    expect($payload)->toMatchArray([
        'snap_token' => 'unit-snap-token',
        'instruction_type' => 'snap',
        'transaction_status' => 'pending',
    ])->and($payload['order_id'] ?? null)->toBeString()->not->toBeEmpty();
});

test('midtrans snap enabled payments map platform method codes', function () {
    $service = app(MidtransService::class);
    $paymentMethod = createMidtransBcaPaymentMethod();

    expect($service->snapEnabledPayments($paymentMethod))->toBe(['bca_va']);
});
