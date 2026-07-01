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

    private const SANDBOX_WEB_BASE_URL = 'https://secure2-staging.plink.co.id';

    private const PRODUCTION_WEB_BASE_URL = 'https://secure3.plink.co.id';

    private const SUBMIT_TRANSACTION_ENDPOINT = '/payment/integration/transaction/api/submit-trx';

    private const CHECK_STATUS_ENDPOINT = '/payment/integration/transaction/api/inquiry-transaction';

    private const INTEGRATION_TYPE_PAYMENT_PAGE = '01';

    private const INTEGRATION_TYPE_FULL_API = '02';

    private const SUCCESS_RESPONSE_CODE = 'PL000';

    private const MAX_MERCHANT_REF_NO_LENGTH = 24;

    private const MAX_INVOICE_NUMBER_LENGTH = 16;

    private const MAX_PRODUCT_DETAILS_LENGTH = 97;

    private const MAX_USER_IP_ADDRESS_LENGTH = 15;

    private const MAX_USER_NAME_LENGTH = 40;

    private const MAX_USER_EMAIL_LENGTH = 40;

    private const MAX_REMARKS_LENGTH = 100;

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
     *     bank_id?: string,
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
        $defaultValidity = $this->defaultValidityExpiresAt($now);

        $body = [
            'transmission_date_time' => $this->formatDateTime($now),
            'transaction_currency' => 'IDR',
            'merchant_key_id' => (string) config('prismalink.merchant_key_id', ''),
            'merchant_id' => (string) config('prismalink.merchant_id', ''),
            'merchant_ref_no' => $this->normalizeMerchantRefNo($params['merchant_ref_no']),
            'backend_callback_url' => $params['backend_callback_url'] ?? (string) config('prismalink.backend_callback_url', ''),
            'frontend_callback_url' => $params['frontend_callback_url'] ?? (string) config('prismalink.frontend_callback_url', ''),
            'user_id' => $this->truncateField((string) $params['user_id'], 40),
            'user_device_id' => $this->truncateField((string) $params['user_device_id'], 100),
            'user_ip_address' => $this->normalizeUserIpAddress($params['user_ip_address']),
            'product_details' => $this->encodeProductDetails($params['product_details']),
            'invoice_number' => $this->normalizeInvoiceNumber($params['invoice_number']),
            'transaction_amount' => (int) $params['transaction_amount'],
            'transaction_date_time' => $this->formatDateTime($now),
            'integration_type' => ($params['payment_method'] ?? null) === 'CC'
                ? self::INTEGRATION_TYPE_PAYMENT_PAGE
                : self::INTEGRATION_TYPE_FULL_API,
            'validity' => $params['validity'] ?? $this->formatDateTime($defaultValidity),
        ];

        if (isset($params['user_name'])) {
            $body['user_name'] = $this->truncateField((string) $params['user_name'], self::MAX_USER_NAME_LENGTH);
        }

        if (isset($params['user_email'])) {
            $body['user_email'] = $this->truncateField((string) $params['user_email'], self::MAX_USER_EMAIL_LENGTH);
        }

        if (isset($params['user_phone_number'])) {
            $body['user_phone_number'] = $params['user_phone_number'];
        }

        if (isset($params['remarks'])) {
            $body['remarks'] = $this->truncateField((string) $params['remarks'], self::MAX_REMARKS_LENGTH);
        }

        if (isset($params['payment_method'])) {
            $body['payment_method'] = $params['payment_method'];
        }

        if (isset($params['bank_id'])) {
            $body['bank_id'] = (string) $params['bank_id'];
        }

        if (isset($params['va_name'])) {
            $body['va_name'] = $params['va_name'];
        }

        $response = $this->request(self::SUBMIT_TRANSACTION_ENDPOINT, $body);

        if (! $this->isSuccessResponse($response)) {
            throw new PrismaLinkException(
                $this->formatErrorMessage($response, 'PrismaLink submit transaction failed'),
                $response['response_code'] ?? null,
                $response,
            );
        }

        return $response;
    }

    /**
     * @param  array<string, mixed>  $response
     * @return array<string, mixed>
     */
    public function extractInstructions(
        array $response,
        ?string $paymentMethod = null,
        ?string $bankId = null,
    ): array {
        $paymentMethodCode = $this->paymentMethodCode($paymentMethod);

        if ($paymentMethodCode === 'VA' || $this->hasVaNumberList($response)) {
            $vaInstructions = $this->extractVirtualAccountInstructions(
                $response,
                $paymentMethod,
                $bankId,
            );

            if ($vaInstructions !== []) {
                return $vaInstructions;
            }
        }

        if ($paymentMethodCode === 'QR' || filled($response['qris_data'] ?? null)) {
            $qrInstructions = $this->extractQrisInstructions($response);

            if ($qrInstructions !== []) {
                return $qrInstructions;
            }
        }

        if (
            $paymentMethodCode === 'CC'
            || filled($response['creditcard_form_url'] ?? null)
            || filled($response['payment_page_url'] ?? null)
            || filled($response['creditcard_session_token'] ?? null)
        ) {
            $cardFormUrl = $response['creditcard_form_url'] ?? null;

            if (is_string($cardFormUrl) && $cardFormUrl !== '') {
                return [
                    'instruction_type' => 'redirect',
                    'redirect_url' => $this->resolvePaymentPageUrl($cardFormUrl),
                ];
            }

            $paymentPageUrl = $response['payment_page_url'] ?? null;

            if (is_string($paymentPageUrl) && $paymentPageUrl !== '') {
                return [
                    'instruction_type' => 'redirect',
                    'redirect_url' => $this->resolvePaymentPageUrl($paymentPageUrl),
                ];
            }

            $sessionToken = $response['creditcard_session_token'] ?? null;

            if (is_string($sessionToken) && $sessionToken !== '') {
                return [
                    'instruction_type' => 'redirect',
                    'redirect_url' => $this->resolvePaymentPageUrl(
                        '/creditcard/landingpage?keyId='.$sessionToken,
                    ),
                ];
            }
        }

        return [
            'instruction_type' => 'unknown',
        ];
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
                $this->formatErrorMessage($response, 'PrismaLink check transaction status failed'),
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

    public function defaultValidityExpiresAt(?CarbonInterface $from = null): CarbonInterface
    {
        $from = $from ?? now();
        $validityMinutes = config('prismalink.default_validity_minutes');

        if ($validityMinutes !== null && $validityMinutes !== '') {
            return $from->copy()->addMinutes((int) $validityMinutes);
        }

        return $from->copy()->addHours((int) config('prismalink.default_validity_hours', 24));
    }

    public function formatDateTime(CarbonInterface $at): string
    {
        return $at->format('Y-m-d H:i:s.v O');
    }

    public function normalizeMerchantRefNo(string $merchantRefNo): string
    {
        $normalized = trim($merchantRefNo);

        if ($normalized === '') {
            throw new PrismaLinkException('PrismaLink merchant_ref_no is required');
        }

        return $this->truncateField($normalized, self::MAX_MERCHANT_REF_NO_LENGTH);
    }

    public function normalizeInvoiceNumber(string $invoiceNumber): string
    {
        $normalized = trim($invoiceNumber);

        if ($normalized === '') {
            throw new PrismaLinkException('PrismaLink invoice_number is required');
        }

        return $this->truncateField($normalized, self::MAX_INVOICE_NUMBER_LENGTH);
    }

    /**
     * @param  array<int, array<string, mixed>>  $productDetails
     */
    public function encodeProductDetails(array $productDetails): string
    {
        if ($productDetails === []) {
            throw new PrismaLinkException('PrismaLink product_details is required');
        }

        $item = $productDetails[0];
        $normalizedItem = [
            'item_code' => $this->truncateField((string) ($item['item_code'] ?? 'item'), 12),
            'item_title' => $this->truncateField((string) ($item['item_title'] ?? 'Item'), 24),
            'quantity' => (int) ($item['quantity'] ?? 1),
            'total' => (string) (int) ($item['total'] ?? 0),
            'currency' => $this->truncateField((string) ($item['currency'] ?? 'IDR'), 3),
        ];

        $encoded = json_encode([$normalizedItem], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        while (strlen((string) $encoded) > self::MAX_PRODUCT_DETAILS_LENGTH && strlen($normalizedItem['item_title']) > 1) {
            $normalizedItem['item_title'] = $this->truncateField(
                $normalizedItem['item_title'],
                strlen($normalizedItem['item_title']) - 1,
            );
            $encoded = json_encode([$normalizedItem], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        while (strlen((string) $encoded) > self::MAX_PRODUCT_DETAILS_LENGTH && strlen($normalizedItem['item_code']) > 1) {
            $normalizedItem['item_code'] = $this->truncateField(
                $normalizedItem['item_code'],
                strlen($normalizedItem['item_code']) - 1,
            );
            $encoded = json_encode([$normalizedItem], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        if (strlen((string) $encoded) > self::MAX_PRODUCT_DETAILS_LENGTH) {
            throw new PrismaLinkException('PrismaLink product_details exceeds maximum length of 97 characters');
        }

        return (string) $encoded;
    }

    public function normalizeUserIpAddress(?string $ip): string
    {
        $ip = trim((string) ($ip ?? '127.0.0.1'));

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false) {
            return $this->truncateField($ip, self::MAX_USER_IP_ADDRESS_LENGTH);
        }

        return '127.0.0.1';
    }

    public function buildMerchantRefNo(int $paymentId): string
    {
        return substr(
            'PL'.str_pad((string) $paymentId, 10, '0', STR_PAD_LEFT).substr(uniqid(), -12),
            0,
            self::MAX_MERCHANT_REF_NO_LENGTH,
        );
    }

    public function parsePaymentIdFromMerchantRefNo(string $merchantRefNo): ?int
    {
        $merchantRefNo = trim($merchantRefNo);

        if ($merchantRefNo === '') {
            return null;
        }

        if (str_starts_with($merchantRefNo, 'PL') && strlen($merchantRefNo) >= 12) {
            $paymentId = (int) ltrim(substr($merchantRefNo, 2, 10), '0');

            return $paymentId > 0 ? $paymentId : null;
        }

        if (str_contains($merchantRefNo, '-')) {
            $legacyPaymentId = strstr($merchantRefNo, '-', true);

            return is_numeric($legacyPaymentId) ? (int) $legacyPaymentId : null;
        }

        return is_numeric($merchantRefNo) ? (int) $merchantRefNo : null;
    }

    public function buildMac(string $body): string
    {
        return hash_hmac('sha256', $body, (string) config('prismalink.secret_key', ''));
    }

    /**
     * @param  array<string, mixed>  $response
     * @return array<int, array<string, mixed>>
     */
    private function parseVaNumberList(array $response): array
    {
        $raw = $response['va_number_list'] ?? null;

        if (! is_string($raw) || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * @param  array<string, mixed>  $response
     */
    private function hasVaNumberList(array $response): bool
    {
        return $this->parseVaNumberList($response) !== [];
    }

    /**
     * @param  array<string, mixed>  $response
     * @return array<string, mixed>
     */
    private function extractVirtualAccountInstructions(
        array $response,
        ?string $paymentMethod,
        ?string $bankId,
    ): array {
        $entries = $this->parseVaNumberList($response);

        if ($entries === []) {
            return [];
        }

        $preferredBankLabel = $this->bankLabelFromPaymentMethod($paymentMethod);
        $selected = null;

        foreach ($entries as $entry) {
            if (! is_array($entry)) {
                continue;
            }

            $bankName = trim((string) ($entry['bank'] ?? ''));
            $vaNumber = trim((string) ($entry['va'] ?? $entry['va_number'] ?? ''));

            if ($vaNumber === '') {
                continue;
            }

            if (
                $preferredBankLabel !== null
                && strcasecmp($bankName, $preferredBankLabel) === 0
            ) {
                $selected = [
                    'bank' => $this->normalizeBankSlug($bankName, $paymentMethod),
                    'va_number' => $vaNumber,
                ];

                break;
            }

            $selected ??= [
                'bank' => $this->normalizeBankSlug($bankName, $paymentMethod),
                'va_number' => $vaNumber,
            ];
        }

        if ($selected === null) {
            return [];
        }

        return [
            'instruction_type' => 'va',
            'bank' => $selected['bank'],
            'va_number' => $selected['va_number'],
            'bank_id' => $bankId,
        ];
    }

    /**
     * @param  array<string, mixed>  $response
     * @return array<string, mixed>
     */
    private function extractQrisInstructions(array $response): array
    {
        $qrisData = $response['qris_data'] ?? null;

        if (! is_string($qrisData) || trim($qrisData) === '') {
            return [];
        }

        $qrisData = trim($qrisData);

        if (
            str_starts_with($qrisData, 'http://')
            || str_starts_with($qrisData, 'https://')
        ) {
            return [
                'instruction_type' => 'qris',
                'qr_url' => $qrisData,
            ];
        }

        if (str_contains($qrisData, '000201')) {
            $normalized = str_replace(' ', '', $qrisData);
            $start = strpos($normalized, '000201');
            $emvPayload = substr($normalized, $start !== false ? $start : 0);

            if (preg_match('/^(000201.+?6304[0-9A-Fa-f]{4})/', $emvPayload, $matches) === 1) {
                $emvPayload = $matches[1];
            }

            return [
                'instruction_type' => 'qris',
                'qr_data' => $emvPayload,
            ];
        }

        if (str_starts_with($qrisData, 'data:')) {
            return [
                'instruction_type' => 'qris',
                'qr_url' => $qrisData,
            ];
        }

        return [
            'instruction_type' => 'qris',
            'qr_data' => $qrisData,
        ];
    }

    private function paymentMethodCode(?string $method): ?string
    {
        if ($method !== null && str_ends_with($method, '_va')) {
            return 'VA';
        }

        return match ($method) {
            'credit-card' => 'CC',
            'qr', 'qris' => 'QR',
            default => null,
        };
    }

    private function bankLabelFromPaymentMethod(?string $method): ?string
    {
        return match ($method) {
            'bca_va' => 'BCA',
            'mandiri_va' => 'Mandiri',
            'bni_va' => 'BNI',
            'bri_va' => 'BRI',
            'btn_va' => 'BTN',
            'permata_va' => 'Permata',
            'cimb_va' => 'Niaga',
            'danamon_va' => 'Danamon',
            default => null,
        };
    }

    private function normalizeBankSlug(string $bankName, ?string $paymentMethod): string
    {
        if (is_string($paymentMethod) && str_ends_with($paymentMethod, '_va')) {
            return str_replace('_va', '', $paymentMethod);
        }

        return strtolower(str_replace(' ', '_', $bankName));
    }

    public function resolvePaymentPageUrl(?string $paymentPageUrl): ?string
    {
        if (! is_string($paymentPageUrl) || trim($paymentPageUrl) === '') {
            return null;
        }

        $paymentPageUrl = trim($paymentPageUrl);
        $webBaseUrl = rtrim($this->webBaseUrl(), '/');

        if (str_starts_with($paymentPageUrl, 'http://') || str_starts_with($paymentPageUrl, 'https://')) {
            $parts = parse_url($paymentPageUrl);

            if (! is_array($parts) || ! isset($parts['host'])) {
                return $paymentPageUrl;
            }

            if (str_contains((string) $parts['host'], 'plink.co.id')) {
                return $paymentPageUrl;
            }

            $path = ($parts['path'] ?? '').(isset($parts['query']) ? '?'.$parts['query'] : '');

            if (
                $path === ''
                || (
                    ! str_contains($path, 'paymentpage')
                    && ! str_contains($path, 'directdebit')
                    && ! str_contains($path, 'creditcard')
                )
            ) {
                return $paymentPageUrl;
            }

            return $webBaseUrl.(str_starts_with($path, '/') ? $path : '/'.$path);
        }

        return $webBaseUrl.(str_starts_with($paymentPageUrl, '/') ? $paymentPageUrl : '/'.$paymentPageUrl);
    }

    private function baseUrl(): string
    {
        return config('prismalink.is_production')
            ? self::PRODUCTION_BASE_URL
            : self::SANDBOX_BASE_URL;
    }

    private function webBaseUrl(): string
    {
        $configured = config('prismalink.web_base_url');

        if (is_string($configured) && $configured !== '') {
            return $configured;
        }

        return config('prismalink.is_production')
            ? self::PRODUCTION_WEB_BASE_URL
            : self::SANDBOX_WEB_BASE_URL;
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

        if (($decoded['response_code'] ?? '') === 'PL001') {
            Log::warning('PrismaLink API returned INVALID_PARAMETER', [
                'endpoint' => $endpoint,
                'response' => $decoded,
                'request_lengths' => [
                    'merchant_ref_no' => strlen((string) ($body['merchant_ref_no'] ?? '')),
                    'invoice_number' => strlen((string) ($body['invoice_number'] ?? '')),
                    'product_details' => strlen((string) ($body['product_details'] ?? '')),
                    'user_ip_address' => strlen((string) ($body['user_ip_address'] ?? '')),
                ],
                'callback_urls' => [
                    'backend' => $body['backend_callback_url'] ?? null,
                    'frontend' => $body['frontend_callback_url'] ?? null,
                ],
            ]);
        }

        return $decoded;
    }

    /**
     * @param  array<string, mixed>  $response
     */
    private function formatErrorMessage(array $response, string $fallback): string
    {
        $message = trim((string) ($response['response_message'] ?? $fallback));

        if (filled($response['response_description'] ?? null)) {
            $message .= ': '.trim((string) $response['response_description']);
        }

        return $message;
    }

    private function truncateField(string $value, int $maxLength): string
    {
        if ($maxLength <= 0) {
            return '';
        }

        return mb_substr($value, 0, $maxLength);
    }
}
