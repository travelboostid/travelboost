<?php

namespace App\Http\Controllers\Webapi;

use App\Enums\PaymentMethodStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentIndexRequest;
use App\Http\Resources\PaymentResource;
use App\Models\AgentSubscriptionPackage;
use App\Models\AgentSubscriptionPayment;
use App\Models\AiCreditTopupPayment;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\User;
use App\Models\WalletTopupPayment;
use App\Services\PrismaLinkException;
use App\Services\PrismaLinkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Midtrans\Snap;
use Throwable;

class PaymentController extends Controller
{
    private const SNAP_TOKEN_LIFETIME_MINUTES = 180;

    public function __construct(
        private readonly PrismaLinkService $prismaLinkService,
    ) {}

    /**
     * get payment list
     *
     * @operationId getPayments
     */
    public function index(PaymentIndexRequest $request)
    {
        $payments = Payment::query()
            ->when(
                $request->filled('owner_type'),
                fn ($q) => $q->where('owner_type', $request->owner_type)
            )
            ->when(
                $request->filled('owner_id'),
                fn ($q) => $q->where('owner_id', $request->owner_id)
            )
            ->when(
                $request->filled('payable_type'),
                fn ($q) => $q->where('payable_type', $request->payable_type)
            )
            ->when(
                $request->filled('status'),
                fn ($q) => $q->where('status', $request->status)
            )
            ->when(
                $request->filled('provider'),
                fn ($q) => $q->where('provider', $request->provider)
            )
            ->when(
                $request->filled('from'),
                fn ($q) => $q->whereDate('created_at', '>=', $request->from)
            )
            ->when(
                $request->filled('to'),
                fn ($q) => $q->whereDate('created_at', '<=', $request->to)
            )
            ->latest()
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return PaymentResource::collection($payments);
    }

    /**
     * Create wallet topup payment
     *
     * @operationId createTopupPayment
     */
    public function createTopupPayment(Request $request): PaymentResource|JsonResponse
    {
        $validated = $request->validate([
            'owner_type' => ['required', 'in:user,company'],
            'owner_id' => [
                'required',
                Rule::when(
                    $request->owner_type === 'user',
                    Rule::exists('users', 'id'),
                    Rule::exists('companies', 'id')
                ),
            ],
            'amount' => ['required', 'integer', 'min:100000'],
            'payment_method_id' => ['required', 'exists:payment_methods,id'],
        ]);

        $user = Auth::user();
        $paymentMethod = PaymentMethod::query()->findOrFail($validated['payment_method_id']);

        if ($paymentMethod->status !== PaymentMethodStatus::ENABLED) {
            return response()->json([
                'message' => 'Selected payment method is not available.',
            ], 422);
        }

        $topup = WalletTopupPayment::create([
            'user_id' => $user->id,
            'amount' => $validated['amount'],
        ]);

        $payment = $topup->payment()->create([
            'owner_type' => $validated['owner_type'],
            'owner_id' => $validated['owner_id'],
            'provider' => $paymentMethod->provider,
            'payment_method' => $paymentMethod->method,
            'amount' => $topup->amount,
            'status' => 'unpaid',
        ]);

        $context = [
            'finish_url' => $this->paymentFinishUrl(),
            'invoice_number' => 'WT'.$payment->id,
            'product_details' => [
                [
                    'item_code' => 'wt',
                    'item_title' => 'Topup',
                    'quantity' => 1,
                    'total' => (string) (int) $payment->amount,
                    'currency' => 'IDR',
                ],
            ],
            'remarks' => 'Wallet topup',
        ];

        if ($paymentMethod->provider === 'midtrans') {
            $context['selected_payment_method'] = $paymentMethod;
        }

        return $this->initiateGatewayPayment($payment, $request, $user, $context);
    }

    /**
     * Create payment for agent subscription
     *
     * @operationId createAgentSubscriptionPayment
     */
    public function createAgentSubscriptionPayment(Request $request): PaymentResource|JsonResponse
    {
        $validated = $request->validate([
            'company_id' => ['required', 'exists:companies,id'],
            'package_id' => ['required', 'exists:agent_subscription_packages,id'],
            'provider' => ['nullable', 'in:midtrans,prismalink'],
        ]);
        $user = Auth::user();
        $provider = $validated['provider'] ?? 'midtrans';

        $package = AgentSubscriptionPackage::findOrFail($validated['package_id']);
        $subscriptionPayment = AgentSubscriptionPayment::create([
            'package_id' => $validated['package_id'],
        ]);

        $payment = $subscriptionPayment->payment()->create([
            'owner_id' => $validated['company_id'],
            'owner_type' => 'company',
            'provider' => $provider,
            'payment_method' => $this->paymentMethodForProvider($provider),
            'amount' => $package->price,
            'status' => 'unpaid',
        ]);

        return $this->initiateGatewayPayment($payment, $request, $user, [
            'finish_url' => $this->paymentFinishUrl(),
            'invoice_number' => 'AS-'.$payment->id,
            'product_details' => [
                [
                    'item_code' => 'agent-subscription',
                    'item_title' => $package->name,
                    'quantity' => 1,
                    'total' => (string) (int) $payment->amount,
                    'currency' => 'IDR',
                ],
            ],
            'remarks' => 'Agent subscription: '.$package->name,
        ]);
    }

    /**
     * Create payment for AI credit topup
     *
     * @operationId createAiCreditTopupPayment
     */
    public function createAiCreditTopupPayment(Request $request): PaymentResource|JsonResponse
    {
        $validated = $request->validate([
            'company_id' => ['required', 'exists:companies,id'],
            'amount' => ['required', 'integer', 'min:1000'],
            'provider' => ['nullable', 'in:midtrans,prismalink'],
        ]);

        $user = Auth::user();
        $provider = $validated['provider'] ?? 'midtrans';

        $topup = AiCreditTopupPayment::create([
            'amount' => $validated['amount'],
        ]);

        $payment = $topup->payment()->create([
            'owner_id' => $validated['company_id'],
            'owner_type' => 'company',
            'provider' => $provider,
            'payment_method' => $this->paymentMethodForProvider($provider),
            'amount' => $topup->amount,
            'status' => 'unpaid',
        ]);

        return $this->initiateGatewayPayment($payment, $request, $user, [
            'finish_url' => $this->paymentFinishUrl(),
            'invoice_number' => 'AI-'.$payment->id,
            'product_details' => [
                [
                    'item_code' => 'ai-credit-topup',
                    'item_title' => 'AI Credit Topup',
                    'quantity' => 1,
                    'total' => (string) (int) $payment->amount,
                    'currency' => 'IDR',
                ],
            ],
            'remarks' => 'AI credit topup',
        ]);
    }

    /**
     * @param  array{
     *     finish_url: string,
     *     invoice_number: string,
     *     product_details: array<int, array<string, mixed>>,
     *     remarks?: string,
     *     selected_payment_method?: PaymentMethod,
     * }  $context
     */
    private function initiateGatewayPayment(
        Payment $payment,
        Request $request,
        User $user,
        array $context,
    ): PaymentResource|JsonResponse {
        try {
            if ($payment->provider === 'prismalink') {
                $this->initiatePrismaLinkPayment($payment, $request, $user, $context);
            } else {
                $this->initiateMidtransPayment($payment, $user, $context);
            }
        } catch (PrismaLinkException $exception) {
            Log::warning('PrismaLink payment initiation failed', [
                'payment_id' => $payment->id,
                'provider' => $payment->provider,
                'message' => $exception->getMessage(),
                'response_code' => $exception->responseCode,
            ]);

            return response()->json([
                'message' => $exception->getMessage(),
                'response_code' => $exception->responseCode,
                'response_description' => data_get($exception->response, 'response_description'),
            ], 422);
        } catch (Throwable $exception) {
            Log::warning('Payment gateway initiation failed', [
                'payment_id' => $payment->id,
                'provider' => $payment->provider,
                'message' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Payment gateway is temporarily unavailable.',
            ], 422);
        }

        return new PaymentResource($payment->fresh());
    }

    /**
     * @param  array{
     *     finish_url: string,
     *     invoice_number: string,
     *     product_details: array<int, array<string, mixed>>,
     *     remarks?: string,
     *     selected_payment_method?: PaymentMethod,
     * }  $context
     */
    private function initiateMidtransPayment(Payment $payment, User $user, array $context): void
    {
        $params = [
            'transaction_details' => [
                'order_id' => $payment->id.'-'.uniqid(),
                'gross_amount' => (int) $payment->amount,
            ],
            'customer_details' => [
                'first_name' => $user->name,
                'email' => $user->email,
            ],
            'callbacks' => [
                'finish' => $context['finish_url'],
            ],
            'expiry' => [
                'unit' => 'minutes',
                'duration' => self::SNAP_TOKEN_LIFETIME_MINUTES,
            ],
        ];

        $selectedPaymentMethod = $context['selected_payment_method'] ?? null;
        $enabledPayments = $selectedPaymentMethod instanceof PaymentMethod
            ? $this->midtransEnabledPaymentsFromMeta($selectedPaymentMethod->meta)
            : $this->midtransEnabledPayments($payment->payment_method);

        if ($enabledPayments !== null) {
            $params['enabled_payments'] = $enabledPayments;
        }

        $snapToken = Snap::getSnapToken($params);

        $payment->update([
            'status' => 'pending',
            'payload' => [
                'order_id' => $params['transaction_details']['order_id'],
                'snap_token' => $snapToken,
                'request' => $params,
            ],
            'expired_at' => now()->addMinutes(self::SNAP_TOKEN_LIFETIME_MINUTES),
        ]);
    }

    /**
     * @param  array{
     *     finish_url: string,
     *     invoice_number: string,
     *     product_details: array<int, array<string, mixed>>,
     *     remarks?: string,
     * }  $context
     */
    private function initiatePrismaLinkPayment(
        Payment $payment,
        Request $request,
        User $user,
        array $context,
    ): void {
        $merchantRefNo = $this->prismaLinkService->buildMerchantRefNo($payment->id);
        $validityHours = (int) config('prismalink.default_validity_hours', 24);
        $paymentMethod = PaymentMethod::query()
            ->where('provider', 'prismalink')
            ->where('method', $payment->payment_method)
            ->first();

        $plinkParams = [
            'merchant_ref_no' => $merchantRefNo,
            'user_id' => (string) $user->id,
            'user_device_id' => (string) $request->header('X-Device-Id', $user->id),
            'user_ip_address' => $request->ip() ?? '127.0.0.1',
            'product_details' => $context['product_details'],
            'invoice_number' => $context['invoice_number'],
            'transaction_amount' => (int) $payment->amount,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'remarks' => $context['remarks'] ?? null,
            'frontend_callback_url' => $this->prismaLinkFrontendCallbackUrl(),
        ];

        $plinkPaymentMethod = $this->prismaLinkPaymentMethodCode($payment->payment_method);
        if ($plinkPaymentMethod !== null) {
            $plinkParams['payment_method'] = $plinkPaymentMethod;
        }

        $bankId = $this->prismaLinkBankIdFromMeta($paymentMethod?->meta);
        if ($plinkPaymentMethod === 'VA') {
            if ($bankId === null) {
                throw new PrismaLinkException('PrismaLink bank_id is required for virtual account payments.');
            }

            $plinkParams['bank_id'] = $bankId;
        }

        $response = $this->prismaLinkService->submitPaymentPageTransaction($plinkParams);

        $expiredAt = filled($response['validity'] ?? null)
            ? Carbon::parse((string) $response['validity'])
            : now()->addHours($validityHours);

        $payment->update([
            'status' => 'pending',
            'payload' => [
                'merchant_ref_no' => $merchantRefNo,
                'plink_ref_no' => $response['plink_ref_no'] ?? null,
                'payment_page_url' => $this->prismaLinkService->resolvePaymentPageUrl(
                    isset($response['payment_page_url']) ? (string) $response['payment_page_url'] : null,
                ),
                'transaction_status' => $response['transaction_status'] ?? null,
                'validity' => $response['validity'] ?? null,
                'prismalink' => $response,
            ],
            'expired_at' => $expiredAt,
        ]);
    }

    private function paymentFinishUrl(): string
    {
        return route('companies.show', absolute: true);
    }

    private function prismaLinkFrontendCallbackUrl(): string
    {
        $configured = config('prismalink.frontend_callback_url');

        if (is_string($configured) && $configured !== '') {
            return $configured;
        }

        return route('prismalink.frontend-callback', absolute: true);
    }

    private function paymentMethodForProvider(string $provider): string
    {
        return match ($provider) {
            'prismalink' => 'payment_page',
            default => 'snap',
        };
    }

    /**
     * @return list<string>|null
     */
    private function midtransEnabledPayments(?string $method): ?array
    {
        if ($method === null) {
            return null;
        }

        $paymentMethod = PaymentMethod::query()
            ->where('provider', 'midtrans')
            ->where('method', $method)
            ->first();

        return $this->midtransEnabledPaymentsFromMeta($paymentMethod?->meta);
    }

    /**
     * @param  array<string, mixed>|null  $meta
     * @return list<string>|null
     */
    private function midtransEnabledPaymentsFromMeta(?array $meta): ?array
    {
        $enabledPayments = data_get($meta, 'enabled_payments');

        if (! is_array($enabledPayments) || $enabledPayments === []) {
            return null;
        }

        return array_values(array_map(strval(...), $enabledPayments));
    }

    private function prismaLinkPaymentMethodCode(?string $method): ?string
    {
        if ($method !== null && str_ends_with($method, '_va')) {
            return 'VA';
        }

        return match ($method) {
            'credit-card' => 'CC',
            default => null,
        };
    }

    /**
     * @param  array<string, mixed>|null  $meta
     */
    private function prismaLinkBankIdFromMeta(?array $meta): ?string
    {
        $bankId = data_get($meta, 'bank_id');

        if (! is_string($bankId) && ! is_int($bankId)) {
            return null;
        }

        $bankId = trim((string) $bankId);

        return $bankId !== '' ? $bankId : null;
    }
}
