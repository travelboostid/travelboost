<?php

namespace App\Services;

use App\Enums\PaymentMethodStatus;
use App\Enums\PaymentMethodUsageScope;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Midtrans\CoreApi;
use Midtrans\Snap;
use RuntimeException;
use Throwable;

class MidtransService
{
    public const CHARGE_LIFETIME_MINUTES = 180;

    public function resolveEnabledPaymentMethod(int $paymentMethodId): PaymentMethod
    {
        $paymentMethod = PaymentMethod::query()->find($paymentMethodId);

        if (! $paymentMethod instanceof PaymentMethod) {
            throw ValidationException::withMessages([
                'payment_method_id' => 'Selected payment method is not available.',
            ]);
        }

        if ($paymentMethod->provider !== 'midtrans' || $paymentMethod->status !== PaymentMethodStatus::ENABLED) {
            throw ValidationException::withMessages([
                'payment_method_id' => 'Selected payment method is not available.',
            ]);
        }

        return $paymentMethod;
    }

    public function resolveEnabledPlatformPaymentMethod(int $paymentMethodId): PaymentMethod
    {
        $paymentMethod = $this->resolveEnabledPaymentMethod($paymentMethodId);

        if ($paymentMethod->usage_scope !== PaymentMethodUsageScope::Platform) {
            throw ValidationException::withMessages([
                'payment_method_id' => 'Selected payment method is not available for platform payments.',
            ]);
        }

        return $paymentMethod;
    }

    /**
     * @return array<string, mixed>
     */
    public function createSnapToken(
        Payment $payment,
        PaymentMethod $paymentMethod,
        User $user,
        ?string $finishUrl = null,
    ): array {
        $orderId = $payment->id.'-'.uniqid();
        $params = $this->buildSnapParams(
            $orderId,
            (int) $payment->amount,
            $paymentMethod,
            $user,
            $finishUrl,
        );

        try {
            $snapToken = Snap::getSnapToken($params);
        } catch (Throwable $exception) {
            throw MidtransException::fromThrowable($exception);
        }

        return [
            'order_id' => $orderId,
            'snap_token' => $snapToken,
            'instruction_type' => 'snap',
            'transaction_status' => 'pending',
            'snap_token_expires_at' => $this->newChargeExpiresAt()->toISOString(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function buildSnapParams(
        string $orderId,
        int $amount,
        PaymentMethod $paymentMethod,
        User $user,
        ?string $finishUrl = null,
    ): array {
        $params = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $amount,
            ],
            'customer_details' => [
                'first_name' => $user->name,
                'email' => $user->email,
            ],
            'expiry' => $this->snapExpiryPayload(),
            'enabled_payments' => $this->snapEnabledPayments($paymentMethod),
        ];

        if (filled($finishUrl)) {
            $params['callbacks'] = [
                'finish' => $finishUrl,
            ];
        }

        return $params;
    }

    /**
     * @return list<string>
     */
    public function snapEnabledPayments(PaymentMethod $paymentMethod): array
    {
        return match ($paymentMethod->method) {
            'bca_va' => ['bca_va'],
            'bni_va' => ['bni_va'],
            'bri_va' => ['bri_va'],
            'permata_va' => ['permata_va'],
            'cimb_va' => ['cimb_va'],
            'mandiri_va' => ['echannel'],
            'danamon_va' => ['danamon_online'],
            'cstore' => match ((string) data_get($paymentMethod->meta, 'store', 'alfamart')) {
                'indomaret' => ['indomaret'],
                default => ['alfamart'],
            },
            'qris' => ['gopay', 'shopeepay', 'qris'],
            'credit-card' => ['credit_card'],
            default => [$paymentMethod->method],
        };
    }

    /**
     * @return array<string, mixed>
     */
    public function charge(
        Payment $payment,
        PaymentMethod $paymentMethod,
        User $user,
        ?string $finishUrl = null,
    ): array {
        $orderId = $payment->id.'-'.uniqid();
        $params = $this->buildChargeParams(
            $orderId,
            (int) $payment->amount,
            $paymentMethod,
            $user,
            $finishUrl,
        );

        try {
            $response = $this->normalizeResponse(CoreApi::charge($params));
        } catch (Throwable $exception) {
            throw MidtransException::fromThrowable($exception);
        }

        return array_merge(
            [
                'order_id' => $orderId,
                'transaction_status' => $response['transaction_status'] ?? 'pending',
            ],
            $this->extractInstructions($response, $paymentMethod),
        );
    }

    /**
     * @return array{unit: string, duration: int}
     */
    public function snapExpiryPayload(): array
    {
        return [
            'unit' => 'minute',
            'duration' => self::CHARGE_LIFETIME_MINUTES,
        ];
    }

    /**
     * @return array{unit: string, expiry_duration: int}
     */
    public function chargeExpiryPayload(): array
    {
        return [
            'unit' => 'minute',
            'expiry_duration' => self::CHARGE_LIFETIME_MINUTES,
        ];
    }

    public function newChargeExpiresAt(): CarbonInterface
    {
        return now()->addMinutes(self::CHARGE_LIFETIME_MINUTES);
    }

    /**
     * @return array<string, mixed>
     */
    public function buildChargeParams(
        string $orderId,
        int $amount,
        PaymentMethod $paymentMethod,
        User $user,
        ?string $finishUrl = null,
    ): array {
        $paymentType = (string) data_get($paymentMethod->meta, 'payment_type', '');

        if ($paymentType === '') {
            throw new RuntimeException('Midtrans payment type is not configured for this payment method.');
        }

        $params = [
            'payment_type' => $paymentType,
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $amount,
            ],
            'customer_details' => [
                'first_name' => $user->name,
                'email' => $user->email,
            ],
            'custom_expiry' => $this->chargeExpiryPayload(),
        ];

        if (filled($finishUrl)) {
            $params['callbacks'] = [
                'finish' => $finishUrl,
            ];
        }

        $params = array_merge($params, $this->paymentTypeParams($paymentType, $paymentMethod));

        return $params;
    }

    /**
     * @param  array<string, mixed>  $response
     * @return array<string, mixed>
     */
    public function extractInstructions(array $response, PaymentMethod $paymentMethod): array
    {
        $paymentType = (string) data_get($paymentMethod->meta, 'payment_type', '');

        return match ($paymentType) {
            'bank_transfer' => $this->extractBankTransferInstructions($response, $paymentMethod),
            'echannel' => [
                'instruction_type' => 'mandiri_bill',
                'biller_code' => data_get($response, 'biller_code'),
                'bill_key' => data_get($response, 'bill_key'),
            ],
            'qris' => $this->extractQrisInstructions($response),
            'cstore' => [
                'instruction_type' => 'cstore',
                'payment_code' => data_get($response, 'payment_code'),
                'store' => data_get($response, 'store'),
            ],
            'credit_card' => [
                'instruction_type' => 'redirect',
                'redirect_url' => $this->actionUrl($response, 'redirect-customer'),
            ],
            default => [
                'instruction_type' => 'unknown',
            ],
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function paymentTypeParams(string $paymentType, PaymentMethod $paymentMethod): array
    {
        return match ($paymentType) {
            'bank_transfer' => [
                'bank_transfer' => [
                    'bank' => (string) data_get($paymentMethod->meta, 'bank', ''),
                ],
            ],
            'echannel' => [
                'echannel' => [
                    'bill_info1' => 'Payment',
                    'bill_info2' => (string) config('app.name', 'Travelboost'),
                ],
            ],
            'qris' => [
                'qris' => [
                    'acquirer' => (string) (data_get($paymentMethod->meta, 'acquirer') ?: 'gopay'),
                ],
            ],
            'cstore' => [
                'cstore' => [
                    'store' => (string) data_get($paymentMethod->meta, 'store', 'alfamart'),
                    'message' => 'Payment',
                ],
            ],
            'credit_card' => [
                'credit_card' => [
                    'secure' => true,
                    'bank' => 'bca',
                ],
            ],
            default => throw new RuntimeException('Unsupported Midtrans payment type: '.$paymentType),
        };
    }

    /**
     * @param  array<string, mixed>  $response
     * @return array<string, mixed>
     */
    private function extractBankTransferInstructions(array $response, PaymentMethod $paymentMethod): array
    {
        $bank = (string) data_get($paymentMethod->meta, 'bank', '');
        $vaNumbers = data_get($response, 'va_numbers', []);

        if (! is_array($vaNumbers)) {
            $vaNumbers = [];
        }

        $vaNumber = null;

        foreach ($vaNumbers as $entry) {
            if (! is_array($entry)) {
                continue;
            }

            if ($bank === '' || (string) data_get($entry, 'bank') === $bank) {
                $vaNumber = data_get($entry, 'va_number');
                $bank = (string) (data_get($entry, 'bank') ?: $bank);
                break;
            }
        }

        return [
            'instruction_type' => 'va',
            'bank' => $bank !== '' ? $bank : null,
            'va_number' => $vaNumber,
        ];
    }

    /**
     * @param  array<string, mixed>  $response
     * @return array<string, mixed>
     */
    private function extractQrisInstructions(array $response): array
    {
        $instructions = [
            'instruction_type' => 'qris',
        ];

        $qrString = data_get($response, 'qr_string');

        if (is_string($qrString) && trim($qrString) !== '') {
            $instructions['qr_data'] = trim($qrString);
        }

        $qrImageUrl = $this->actionUrl($response, 'generate-qr-code-v2')
            ?? $this->actionUrl($response, 'generate-qr-code');

        if ($qrImageUrl !== null) {
            $materializedQrUrl = $this->fetchQrisQrImageDataUrl($qrImageUrl);

            if ($materializedQrUrl !== null) {
                $instructions['qr_url'] = $materializedQrUrl;
            } else {
                $instructions['qr_url'] = $qrImageUrl;
            }
        }

        return $instructions;
    }

    private function fetchQrisQrImageDataUrl(string $qrCodeUrl): ?string
    {
        $serverKey = (string) config('midtrans.server_key', '');

        $request = Http::accept('image/png');

        if ($serverKey !== '') {
            $request = $request->withBasicAuth($serverKey, '');
        }

        $response = $request->get($qrCodeUrl);

        if (! $response->successful()) {
            Log::warning('Midtrans QRIS image fetch failed', [
                'status' => $response->status(),
                'url' => $qrCodeUrl,
            ]);

            return null;
        }

        $contentType = $response->header('Content-Type') ?? 'image/png';

        return 'data:'.$contentType.';base64,'.base64_encode($response->body());
    }

    /**
     * @param  array<string, mixed>  $response
     */
    private function actionUrl(array $response, string $name): ?string
    {
        $actions = data_get($response, 'actions', []);

        if (! is_array($actions)) {
            return null;
        }

        foreach ($actions as $action) {
            if (! is_array($action)) {
                continue;
            }

            if (($action['name'] ?? null) === $name && filled($action['url'] ?? null)) {
                return (string) $action['url'];
            }
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function normalizeResponse(mixed $response): array
    {
        if (is_array($response)) {
            return $response;
        }

        $decoded = json_decode(json_encode($response), true);

        return is_array($decoded) ? $decoded : [];
    }
}
