<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\AdPlatform;
use App\Enums\AdPlatformConnectionStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Company;
use App\Models\Payment;
use App\Models\PromotionBudgetTopupPayment;
use App\Models\PromotionBudgetTransaction;
use App\Services\GoogleAdsService;
use App\Services\MetaAdsService;
use App\Support\MarketingFeatures;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use RuntimeException;

class PromotionBudgetController extends Controller
{
    public function __construct(
        private GoogleAdsService $googleAdsService,
        private MetaAdsService $metaAdsService,
    ) {}

    public function show(Request $request, Company $company)
    {
        $budget = $company->promotionBudget()->first();
        $googleAccount = $company->googleAccount;
        $facebookAccount = $company->facebookAccount;
        $googleAdsConnection = $company->googleAdsConnection()->first();
        $metaAdsConnection = $company->metaAdsConnection()->first();

        $pendingTopup = Payment::query()
            ->whereMorphedTo('owner', $company)
            ->whereMorphedTo('payable', PromotionBudgetTopupPayment::class)
            ->whereIn('status', [PaymentStatus::PENDING, PaymentStatus::UNPAID])
            ->latest()
            ->first();

        $recentTransactions = PromotionBudgetTransaction::query()
            ->where('company_id', $company->id)
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (PromotionBudgetTransaction $transaction) => [
                'id' => $transaction->id,
                'type' => $transaction->type->value,
                'platform' => $transaction->platform,
                'amount' => (float) $transaction->amount,
                'description' => $transaction->description,
                'created_at' => $transaction->created_at?->toISOString(),
            ]);

        return Inertia::render('companies/dashboard/marketing/budget/index', [
            'budget' => $budget ? [
                'balance' => (float) $budget->balance,
            ] : [
                'balance' => 0,
            ],
            'pendingTopup' => $pendingTopup
                ? (new PaymentResource($pendingTopup))->resolve($request)
                : null,
            'recentTransactions' => $recentTransactions,
            'adPlatforms' => $this->adPlatformsPayload(
                $googleAccount,
                $facebookAccount,
                $googleAdsConnection,
                $metaAdsConnection,
            ),
            'googleAdsConfigured' => $this->googleAdsService->isConfigured(),
            'metaAdsConfigured' => $this->metaAdsService->isConfigured(),
        ]);
    }

    public function retryGoogleAdsProvisioning(Company $company): RedirectResponse
    {
        if (! MarketingFeatures::googleAdsEnabled()) {
            return $this->platformUnavailableRedirect($company);
        }

        $connection = $company->googleAdsConnection()->first();

        if ($connection === null) {
            return redirect()
                ->route('companies.dashboard.marketing.budget.show', $company)
                ->with('error', 'Connect Google Ads before retrying provisioning.');
        }

        if ($connection->status === AdPlatformConnectionStatus::Connected) {
            return redirect()
                ->route('companies.dashboard.marketing.budget.show', $company)
                ->with('success', 'Google Ads is already connected.');
        }

        try {
            $this->googleAdsService->provisionClientAccount($connection);
        } catch (RuntimeException $exception) {
            return redirect()
                ->route('companies.dashboard.marketing.budget.show', $company)
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('companies.dashboard.marketing.budget.show', $company)
            ->with('success', 'Google Ads provisioning retried.');
    }

    public function retryMetaAdsProvisioning(Company $company): RedirectResponse
    {
        if (! MarketingFeatures::metaAdsEnabled()) {
            return $this->platformUnavailableRedirect($company);
        }

        $connection = $company->metaAdsConnection()->first();

        if ($connection === null) {
            return redirect()
                ->route('companies.dashboard.marketing.budget.show', $company)
                ->with('error', 'Connect Meta Ads before retrying provisioning.');
        }

        if ($connection->status === AdPlatformConnectionStatus::Connected) {
            return redirect()
                ->route('companies.dashboard.marketing.budget.show', $company)
                ->with('success', 'Meta Ads is already connected.');
        }

        try {
            $this->metaAdsService->provisionAdAccount($connection);
        } catch (RuntimeException $exception) {
            return redirect()
                ->route('companies.dashboard.marketing.budget.show', $company)
                ->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('companies.dashboard.marketing.budget.show', $company)
            ->with('success', 'Meta Ads provisioning retried.');
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function adPlatformsPayload(
        mixed $googleAccount,
        mixed $facebookAccount,
        mixed $googleAdsConnection,
        mixed $metaAdsConnection,
    ): array {
        return [
            [
                'platform' => AdPlatform::Google->value,
                'label' => 'Google Ads',
                'has_oauth_account' => $googleAccount !== null,
                'oauth_has_ads_scope' => $googleAccount !== null
                    && $this->googleAdsService->googleAccountHasAdsScope($googleAccount),
                'connection' => $googleAdsConnection ? [
                    'status' => $googleAdsConnection->status->value,
                    'external_account_id' => $googleAdsConnection->external_account_id,
                    'external_account_name' => $googleAdsConnection->external_account_name,
                    'provisioned_at' => $googleAdsConnection->provisioned_at?->toISOString(),
                    'meta' => $googleAdsConnection->meta ?? [],
                ] : null,
                'coming_soon' => ! MarketingFeatures::googleAdsEnabled(),
            ],
            [
                'platform' => AdPlatform::Meta->value,
                'label' => 'Meta Ads',
                'has_oauth_account' => $facebookAccount !== null,
                'oauth_has_ads_scope' => $facebookAccount !== null
                    && $this->metaAdsService->facebookAccountHasAdsScope($facebookAccount),
                'connection' => $metaAdsConnection ? [
                    'status' => $metaAdsConnection->status->value,
                    'external_account_id' => $metaAdsConnection->external_account_id,
                    'external_account_name' => $metaAdsConnection->external_account_name,
                    'provisioned_at' => $metaAdsConnection->provisioned_at?->toISOString(),
                    'meta' => $metaAdsConnection->meta ?? [],
                ] : null,
                'coming_soon' => ! MarketingFeatures::metaAdsEnabled(),
            ],
            [
                'platform' => AdPlatform::TikTok->value,
                'label' => 'TikTok Ads',
                'has_oauth_account' => false,
                'oauth_has_ads_scope' => false,
                'connection' => null,
                'coming_soon' => true,
            ],
        ];
    }

    private function platformUnavailableRedirect(Company $company): RedirectResponse
    {
        return redirect()
            ->route('companies.dashboard.marketing.budget.show', $company)
            ->with('error', 'This ad platform is not available yet.');
    }
}
