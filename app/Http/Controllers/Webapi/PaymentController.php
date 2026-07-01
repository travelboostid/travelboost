<?php

namespace App\Http\Controllers\Webapi;

use App\Enums\PaymentMethodStatus;
use App\Enums\PaymentMethodUsageScope;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentIndexRequest;
use App\Http\Resources\PaymentResource;
use App\Models\AgentSubscriptionPackage;
use App\Models\AgentSubscriptionPayment;
use App\Models\AiCreditTopupPayment;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\User;
use App\Models\WalletTopupPayment;
use App\Services\MidtransException;
use App\Services\MidtransService;
use App\Services\PaymentGatewayStatusSyncService;
use App\Services\PrismaLinkException;
use App\Services\PrismaLinkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PrismaLinkService $prismaLinkService,
        private readonly MidtransService $midtransService,
        private readonly PaymentGatewayStatusSyncService $paymentGatewayStatusSyncService,
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
     * Sync payment status from the gateway.
     *
     * @operationId syncPaymentStatus
     */
    public function syncStatus(Payment $payment): JsonResponse|PaymentResource
    {
        $user = Auth::user();

        if (! $user instanceof User) {
            abort(401);
        }

        $this->authorizePaymentAccess($user, $payment);

        try {
            $result = $this->paymentGatewayStatusSyncService->sync($payment);
        } catch (Throwable $exception) {
            Log::warning('Payment status sync failed', [
                'payment_id' => $payment->id,
                'message' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Payment status could not be checked right now. Please try again shortly.',
            ], 422);
        }

        return (new PaymentResource($result['payment']))->additional([
            'meta' => [
                'previous_status' => $result['previous_status'],
                'changed' => $result['changed'],
                'transaction_status' => $result['transaction_status'],
            ],
        ]);
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
        $paymentMethod = $this->resolvePlatformPaymentMethod((int) $validated['payment_method_id']);

        $owner = $validated['owner_type'] === 'company'
            ? Company::query()->findOrFail($validated['owner_id'])
            : $user;

        $existingPendingTopup = $this->findPendingWalletTopupPayment($owner, $user);

        if ($existingPendingTopup) {
            return response()->json([
                'message' => 'You already have a pending wallet top-up. Complete or cancel it before starting a new one.',
                'existing_payment' => (new PaymentResource($existingPendingTopup))->resolve($request),
            ], 409);
        }

        $payment = DB::transaction(function () use ($validated, $user, $paymentMethod): Payment {
            $topup = WalletTopupPayment::create([
                'user_id' => $user->id,
                'amount' => $validated['amount'],
            ]);

            return $topup->payment()->create([
                'owner_type' => $validated['owner_type'],
                'owner_id' => $validated['owner_id'],
                'provider' => $paymentMethod->provider,
                'payment_method' => $paymentMethod->method,
                'amount' => $topup->amount,
                'status' => 'unpaid',
            ]);
        });

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

        try {
            $this->initiateGatewayPayment($payment, $request, $user, $context);
        } catch (PrismaLinkException $exception) {
            Log::warning('PrismaLink payment initiation failed', [
                'payment_id' => $payment->id,
                'provider' => 'prismalink',
                'message' => $exception->getMessage(),
                'response_code' => $exception->responseCode,
            ]);

            $payment->loadMissing('payable');
            $payment->payable?->delete();
            $payment->delete();

            return response()->json([
                'message' => $exception->getMessage(),
                'response_code' => $exception->responseCode,
                'response_description' => data_get($exception->response, 'response_description'),
            ], 422);
        } catch (MidtransException $exception) {
            Log::warning('Midtrans payment initiation failed', [
                'payment_id' => $payment->id,
                'provider' => 'midtrans',
                'message' => $exception->getMessage(),
                'status_code' => $exception->statusCode,
            ]);

            $payment->loadMissing('payable');
            $payment->payable?->delete();
            $payment->delete();

            return response()->json([
                'message' => $exception->getMessage(),
                'status_code' => $exception->statusCode,
            ], 422);
        } catch (Throwable $exception) {
            Log::warning('Payment gateway initiation failed', [
                'payment_id' => $payment->id,
                'provider' => $paymentMethod->provider,
                'message' => $exception->getMessage(),
            ]);

            $payment->loadMissing('payable');
            $payment->payable?->delete();
            $payment->delete();

            return response()->json([
                'message' => 'Payment gateway is temporarily unavailable.',
            ], 422);
        }

        return new PaymentResource($payment->fresh());
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
            'payment_method_id' => ['required', 'exists:payment_methods,id'],
        ]);
        $user = Auth::user();
        $paymentMethod = $this->resolvePlatformPaymentMethod((int) $validated['payment_method_id']);

        $package = AgentSubscriptionPackage::findOrFail($validated['package_id']);

        $payment = DB::transaction(function () use ($validated, $paymentMethod, $package): Payment {
            $subscriptionPayment = AgentSubscriptionPayment::create([
                'package_id' => $validated['package_id'],
            ]);

            return $subscriptionPayment->payment()->create([
                'owner_id' => $validated['company_id'],
                'owner_type' => 'company',
                'provider' => $paymentMethod->provider,
                'payment_method' => $paymentMethod->method,
                'amount' => $package->price,
                'status' => 'unpaid',
            ]);
        });

        $context = [
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
        ];

        if ($paymentMethod->provider === 'midtrans') {
            $context['selected_payment_method'] = $paymentMethod;
        }

        try {
            $this->initiateGatewayPayment($payment, $request, $user, $context);
        } catch (PrismaLinkException $exception) {
            Log::warning('PrismaLink payment initiation failed', [
                'payment_id' => $payment->id,
                'provider' => 'prismalink',
                'message' => $exception->getMessage(),
                'response_code' => $exception->responseCode,
            ]);

            $payment->loadMissing('payable');
            $payment->payable?->delete();
            $payment->delete();

            return response()->json([
                'message' => $exception->getMessage(),
                'response_code' => $exception->responseCode,
                'response_description' => data_get($exception->response, 'response_description'),
            ], 422);
        } catch (MidtransException $exception) {
            Log::warning('Midtrans payment initiation failed', [
                'payment_id' => $payment->id,
                'provider' => 'midtrans',
                'message' => $exception->getMessage(),
                'status_code' => $exception->statusCode,
            ]);

            $payment->loadMissing('payable');
            $payment->payable?->delete();
            $payment->delete();

            return response()->json([
                'message' => $exception->getMessage(),
                'status_code' => $exception->statusCode,
            ], 422);
        } catch (Throwable $exception) {
            Log::warning('Payment gateway initiation failed', [
                'payment_id' => $payment->id,
                'provider' => $paymentMethod->provider,
                'message' => $exception->getMessage(),
            ]);

            $payment->loadMissing('payable');
            $payment->payable?->delete();
            $payment->delete();

            return response()->json([
                'message' => 'Payment gateway is temporarily unavailable.',
            ], 422);
        }

        return new PaymentResource($payment->fresh());
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
            'payment_method_id' => ['required', 'exists:payment_methods,id'],
        ]);

        $user = Auth::user();
        $paymentMethod = $this->resolvePlatformPaymentMethod((int) $validated['payment_method_id']);

        $payment = DB::transaction(function () use ($validated, $paymentMethod): Payment {
            $topup = AiCreditTopupPayment::create([
                'amount' => $validated['amount'],
            ]);

            return $topup->payment()->create([
                'owner_id' => $validated['company_id'],
                'owner_type' => 'company',
                'provider' => $paymentMethod->provider,
                'payment_method' => $paymentMethod->method,
                'amount' => $topup->amount,
                'status' => 'unpaid',
            ]);
        });

        $context = [
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
        ];

        if ($paymentMethod->provider === 'midtrans') {
            $context['selected_payment_method'] = $paymentMethod;
        }

        try {
            $this->initiateGatewayPayment($payment, $request, $user, $context);
        } catch (PrismaLinkException $exception) {
            Log::warning('PrismaLink payment initiation failed', [
                'payment_id' => $payment->id,
                'provider' => 'prismalink',
                'message' => $exception->getMessage(),
                'response_code' => $exception->responseCode,
            ]);

            $payment->loadMissing('payable');
            $payment->payable?->delete();
            $payment->delete();

            return response()->json([
                'message' => $exception->getMessage(),
                'response_code' => $exception->responseCode,
                'response_description' => data_get($exception->response, 'response_description'),
            ], 422);
        } catch (MidtransException $exception) {
            Log::warning('Midtrans payment initiation failed', [
                'payment_id' => $payment->id,
                'provider' => 'midtrans',
                'message' => $exception->getMessage(),
                'status_code' => $exception->statusCode,
            ]);

            $payment->loadMissing('payable');
            $payment->payable?->delete();
            $payment->delete();

            return response()->json([
                'message' => $exception->getMessage(),
                'status_code' => $exception->statusCode,
            ], 422);
        } catch (Throwable $exception) {
            Log::warning('Payment gateway initiation failed', [
                'payment_id' => $payment->id,
                'provider' => $paymentMethod->provider,
                'message' => $exception->getMessage(),
            ]);

            $payment->loadMissing('payable');
            $payment->payable?->delete();
            $payment->delete();

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
    private function initiateGatewayPayment(
        Payment $payment,
        Request $request,
        User $user,
        array $context,
    ): void {
        if ($payment->provider === 'prismalink') {
            $this->initiatePrismaLinkPayment($payment, $request, $user, $context);
        } else {
            $this->initiateMidtransPayment($payment, $user, $context);
        }
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
        $selectedPaymentMethod = $context['selected_payment_method'] ?? null;

        if (! $selectedPaymentMethod instanceof PaymentMethod) {
            throw new \RuntimeException('Midtrans payment method is required.');
        }

        $chargePayload = $this->midtransService->createSnapToken(
            $payment,
            $selectedPaymentMethod,
            $user,
            $context['finish_url'],
        );

        $payment->update([
            'status' => 'pending',
            'payload' => array_merge($payment->payload ?? [], $chargePayload),
            'expired_at' => $this->midtransService->newChargeExpiresAt(),
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
            'backend_callback_url' => $this->prismaLinkBackendCallbackUrl(),
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
            : $this->prismaLinkService->defaultValidityExpiresAt();

        $instructionPayload = $this->prismaLinkService->extractInstructions(
            $response,
            $payment->payment_method,
            $bankId,
        );

        $payment->update([
            'status' => 'pending',
            'payload' => array_merge([
                'merchant_ref_no' => $merchantRefNo,
                'plink_ref_no' => $response['plink_ref_no'] ?? null,
                'transaction_status' => $response['transaction_status'] ?? null,
                'validity' => $response['validity'] ?? null,
                'charge_expires_at' => $expiredAt->toISOString(),
            ], $instructionPayload),
            'expired_at' => $expiredAt,
        ]);
    }

    private function paymentFinishUrl(): string
    {
        return route('companies.show', absolute: true);
    }

    private function prismaLinkBackendCallbackUrl(): string
    {
        $configured = config('prismalink.backend_callback_url');

        if (is_string($configured) && $configured !== '') {
            return $configured;
        }

        return route('prismalink.backend-callback', absolute: true);
    }

    private function prismaLinkFrontendCallbackUrl(): string
    {
        $configured = config('prismalink.frontend_callback_url');

        if (is_string($configured) && $configured !== '') {
            return $configured;
        }

        return route('prismalink.frontend-callback', absolute: true);
    }

    private function prismaLinkPaymentMethodCode(?string $method): ?string
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

    private function authorizePaymentAccess(User $user, Payment $payment): void
    {
        if ($this->userOwnsPayment($user, $payment)) {
            return;
        }

        if ($this->userCanAccessBookingPayment($user, $payment)) {
            return;
        }

        abort(403);
    }

    private function userOwnsPayment(User $user, Payment $payment): bool
    {
        if (in_array($payment->owner_type, [User::class, 'user'], true)) {
            return (int) $payment->owner_id === $user->id;
        }

        if (! in_array($payment->owner_type, [Company::class, 'company'], true)) {
            return false;
        }

        $company = Company::query()->find($payment->owner_id);

        if (! $company) {
            return false;
        }

        return $company->teams()->where('user_id', $user->id)->exists();
    }

    private function userCanAccessBookingPayment(User $user, Payment $payment): bool
    {
        if ($payment->payable_type !== Booking::class) {
            return false;
        }

        $payment->loadMissing('payable');

        if (! $payment->payable instanceof Booking) {
            return false;
        }

        if ((int) $payment->payable->user_id === $user->id) {
            return true;
        }

        $booking = $payment->payable;

        if ($booking->vendor_id) {
            $vendor = Company::query()->find($booking->vendor_id);

            if ($vendor && $vendor->teams()->where('user_id', $user->id)->exists()) {
                return true;
            }
        }

        if ($booking->agent_id) {
            $agent = Company::query()->find($booking->agent_id);

            if ($agent && $agent->teams()->where('user_id', $user->id)->exists()) {
                return true;
            }
        }

        return false;
    }

    private function findPendingWalletTopupPayment(Company|User $owner, User $user): ?Payment
    {
        return Payment::query()
            ->whereMorphedTo('owner', $owner)
            ->whereMorphedTo('payable', WalletTopupPayment::class)
            ->whereIn('status', [PaymentStatus::PENDING, PaymentStatus::UNPAID])
            ->whereIn(
                'payable_id',
                WalletTopupPayment::query()
                    ->select('id')
                    ->where('user_id', $user->id)
            )
            ->latest()
            ->first();
    }

    private function resolvePlatformPaymentMethod(int $paymentMethodId): PaymentMethod
    {
        $paymentMethod = PaymentMethod::query()->find($paymentMethodId);

        if (! $paymentMethod instanceof PaymentMethod) {
            throw ValidationException::withMessages([
                'payment_method_id' => 'Selected payment method is not available.',
            ]);
        }

        if ($paymentMethod->status !== PaymentMethodStatus::ENABLED) {
            throw ValidationException::withMessages([
                'payment_method_id' => 'Selected payment method is not available.',
            ]);
        }

        if ($paymentMethod->usage_scope !== PaymentMethodUsageScope::Platform) {
            throw ValidationException::withMessages([
                'payment_method_id' => 'Selected payment method is not available for platform payments.',
            ]);
        }

        return $paymentMethod;
    }
}
