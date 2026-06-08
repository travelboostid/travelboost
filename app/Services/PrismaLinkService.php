<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class PrismaLinkException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly ?string $responseCode = null,
        public readonly ?array $response = null,
    ) {
        parent::__construct($message);
    }
}

class PrismaLinkService
{
    private const SANDBOX_BASE_URL = 'https://api-staging.plink.co.id/gateway/v2';

    private const PRODUCTION_BASE_URL = 'https://api3.plink.co.id/gateway/v2';

    private const SUBMIT_TRANSACTION_ENDPOINT = '/payment/integration/transaction/api/submit-trx';

    private const CHECK_STATUS_ENDPOINT = '/payment/integration/transaction/api/inquiry-transaction';

    private const INTEGRATION_TYPE_PAYMENT_PAGE = '01';

    private const SUCCESS_RESPONSE_CODE = 'PL000';

    /**
     * @param  array{
     *     merchant_ref_no: string,
     *     user_id: string,
     *     user_device_id: string,
     *     user_ip_address: string,
     *     product_details: array<int, array<string, mixed>>,
     *     invoice_number: string,
     *     transaction_amount: int|float,
     *     user_name?: string,
     *     user_email?: string,
     *     user_phone_number?: string,
     *     remarks?: string,
     *     payment_method?: string,
     *     validity?: string,
     *     va_name?: string,
     *     backend_callback_url?: string,
     *     frontend_callback_url?: string,
     * }  $params
     * @return array<string, mixed>
     */
    public function submitPaymentPageTransaction(array $params): array
    {
        $now = now();
        $validityHours = (int) config('prismalink.default_validity_hours', 24);

        $body = [
            'transmission_date_time' => $this->formatDateTime($now),
            'transaction_currency' => 'IDR',
            'merchant_key_id' => (string) config('prismalink.merchant_key_id', ''),
            'merchant_id' => (string) config('prismalink.merchant_id', ''),
            'merchant_ref_no' => $params['merchant_ref_no'],
            'backend_callback_url' => $params['backend_callback_url'] ?? (string) config('prismalink.backend_callback_url', ''),
            'frontend_callback_url' => $params['frontend_callback_url'] ?? (string) config('prismalink.frontend_callback_url', ''),
            'user_id' => $params['user_id'],
            'user_device_id' => $params['user_device_id'],
            'user_ip_address' => $params['user_ip_address'],
            'product_details' => json_encode($params['product_details'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'invoice_number' => $params['invoice_number'],
            'transaction_amount' => (int) $params['transaction_amount'],
            'transaction_date_time' => $this->formatDateTime($now),
            'integration_type' => self::INTEGRATION_TYPE_PAYMENT_PAGE,
            'validity' => $params['validity'] ?? $this->formatDateTime($now->copy()->addHours($validityHours)),
        ];

        if (isset($params['user_name'])) {
            $body['user_name'] = $params['user_name'];
        }

        if (isset($params['user_email'])) {
            $body['user_email'] = $params['user_email'];
        }

        if (isset($params['user_phone_number'])) {
            $body['user_phone_number'] = $params['user_phone_number'];
        }

        if (isset($params['remarks'])) {
            $body['remarks'] = $params['remarks'];
        }

        if (isset($params['payment_method'])) {
            $body['payment_method'] = $params['payment_method'];
        }

        if (isset($params['va_name'])) {
            $body['va_name'] = $params['va_name'];
        }

        $response = $this->request(self::SUBMIT_TRANSACTION_ENDPOINT, $body);

        if (! $this->isSuccessResponse($response)) {
            throw new PrismaLinkException(
                $response['response_message'] ?? 'PrismaLink submit transaction failed',
                $response['response_code'] ?? null,
                $response,
            );
        }

        return $response;
    }

    /**
     * @return array<string, mixed>
     */
    public function checkTransactionStatus(string $merchantRefNo, string $plinkRefNo): array
    {
        $body = [
            'merchant_ref_no' => $merchantRefNo,
            'plink_ref_no' => $plinkRefNo,
            'merchant_id' => (string) config('prismalink.merchant_id', ''),
            'merchant_key_id' => (string) config('prismalink.merchant_key_id', ''),
            'transmission_date_time' => $this->formatDateTime(now()),
        ];

        $response = $this->request(self::CHECK_STATUS_ENDPOINT, $body);

        if (! $this->isSuccessResponse($response)) {
            throw new PrismaLinkException(
                $response['response_message'] ?? 'PrismaLink check transaction status failed',
                $response['response_code'] ?? null,
                $response,
            );
        }

        return $response;
    }

    public function verifyNotificationMac(string $rawBody, string $mac): bool
    {
        if (app()->environment('local', 'development', 'testing')) {
            return true;
        }

        if ($mac === '' || $rawBody === '') {
            return false;
        }

        return hash_equals($this->buildMac($rawBody), $mac);
    }

    public function mapPaymentStatus(?string $status): PaymentStatus
    {
        $normalized = strtoupper(trim((string) $status));

        return match ($normalized) {
            'SETLD' => PaymentStatus::PAID,
            'PNDNG', 'PENDG' => PaymentStatus::PENDING,
            'REJEC' => PaymentStatus::FAILED,
            default => PaymentStatus::PENDING,
        };
    }

    /**
     * @param  array<string, mixed>  $response
     */
    public function isSuccessResponse(array $response): bool
    {
        return ($response['response_code'] ?? '') === self::SUCCESS_RESPONSE_CODE;
    }

    public function formatDateTime(CarbonInterface $at): string
    {
        return $at->format('Y-m-d H:i:s.v O');
    }

    public function buildMac(string $body): string
    {
        return hash_hmac('sha256', $body, (string) config('prismalink.secret_key', ''));
    }

    private function baseUrl(): string
    {
        return config('prismalink.is_production')
            ? self::PRODUCTION_BASE_URL
            : self::SANDBOX_BASE_URL;
    }

    /**
     * @param  array<string, mixed>  $body
     * @return array<string, mixed>
     */
    private function request(string $endpoint, array $body): array
    {
        $jsonBody = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if ($jsonBody === false) {
            throw new PrismaLinkException('Failed to encode PrismaLink request body');
        }

        $response = Http::baseUrl($this->baseUrl())
            ->withBasicAuth(
                (string) config('prismalink.merchant_id', ''),
                (string) config('prismalink.secret_key', ''),
            )
            ->withHeaders([
                'mac' => $this->buildMac($jsonBody),
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])
            ->withBody($jsonBody, 'application/json')
            ->post($endpoint);

        if ($response->failed()) {
            Log::warning('PrismaLink API request failed', [
                'endpoint' => $endpoint,
                'status' => $response->status(),
                'body' => $response->json() ?? $response->body(),
            ]);

            throw new PrismaLinkException(
                'PrismaLink API request failed with HTTP '.$response->status(),
                null,
                is_array($response->json()) ? $response->json() : null,
            );
        }

        $decoded = $response->json();

        if (! is_array($decoded)) {
            throw new PrismaLinkException('PrismaLink API returned an invalid response');
        }

        return $decoded;
    }
}
