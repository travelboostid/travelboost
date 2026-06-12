<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\GoogleAnalyticsService;
use Google\ApiCore\ApiException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use RuntimeException;

class GoogleAnalyticsController extends Controller
{
    public function __construct(
        private GoogleAnalyticsService $analyticsService
    ) {}

    public function index(Request $request, Company $company)
    {
        $account = $company->googleAccount;
        $analytics = $account?->analyticsConnection;

        $props = [
            'account' => $account,
            'analytics' => $analytics,
        ];

        if ($account && $analytics) {
            $props['insights'] = Inertia::defer(
                fn () => Cache::remember(
                    $this->analyticsService->dashboardCacheKey($analytics),
                    now()->addHour(),
                    fn () => $this->analyticsService->getDashboardInsights($account, $analytics)
                ),
                'analytics-overview'
            );
            $props['realtimeInsights'] = Inertia::defer(
                fn () => Cache::remember(
                    $this->analyticsService->realtimeCacheKey($analytics),
                    now()->addSeconds(20),
                    fn () => $this->analyticsService->getRealtimeInsights($account, $analytics)
                ),
                'analytics-realtime'
            );
        }

        return Inertia::render(
            'companies/dashboard/analytics/index',
            $props
        );
    }

    public function showAccountSetupOrSelections(Request $request, Company $company)
    {
        $googleAccount = $company->googleAccount;

        if ($googleAccount?->analyticsConnection) {
            return redirect()->route('companies.dashboard.analytics.index', $company);
        }

        return Inertia::render('companies/dashboard/analytics/select-or-setup-account', [
            'googleAccount' => $googleAccount,
            'analyticAccounts' => Inertia::defer(
                fn () => Cache::remember(
                    $this->analyticsService->accountsCacheKey($company),
                    now()->addHour(),
                    fn () => $this->analyticsService->listAvailableAccounts($company)
                )
            ),
        ]);
    }

    public function selectAccount(Request $request, Company $company)
    {
        $googleAccount = $company->googleAccount;

        abort_unless($googleAccount !== null, 404);

        if ($request->input('website_url') === '-') {
            $request->merge(['website_url' => null]);
        }

        $validated = $request->validate([
            'company_google_account_id' => [
                'required',
                'integer',
                'exists:company_google_accounts,id',
            ],
            'ga_account_id' => [
                'required',
                'digits_between:1,20',
            ],
            'property_id' => [
                'required',
                'digits_between:1,20',
            ],
            'data_stream_id' => [
                'required',
                'digits_between:1,20',
            ],
            'measurement_id' => [
                'required',
                'string',
                'regex:/^G-[A-Z0-9]+$/',
                'max:20',
            ],
            'website_url' => [
                'nullable',
                'url:https',
                'max:2048',
            ],
            'timezone' => [
                'nullable',
                'string',
                'max:100',
            ],
            'currency' => [
                'nullable',
                'string',
                'size:3',
            ],
        ]);

        abort_unless(
            (int) $validated['company_google_account_id'] === (int) $googleAccount->id,
            403,
        );

        abort_if($googleAccount->analyticsConnection !== null, 422);

        $this->analyticsService->connectProperty($company, $googleAccount, $validated);

        return redirect()->route('companies.dashboard.analytics.index', $company);
    }

    public function unlinkConnection(Request $request, Company $company)
    {
        try {
            $this->analyticsService->unlinkProperty($company);
        } catch (RuntimeException) {
            abort(404);
        }

        return redirect()->route(
            'companies.dashboard.analytics.showAccountSetupOrSelections',
            $company
        );
    }

    public function setupAccount(Request $request, Company $company)
    {
        $googleAccount = $company->googleAccount;

        abort_unless($googleAccount !== null, 404);

        try {
            $onboardingUrl = $this->analyticsService->provisionAccountTicketUrl(
                $googleAccount,
                url()->current()
            );

            return redirect()->away($onboardingUrl);
        } catch (ApiException $e) {
            return response()->json(['error' => 'Google API Exception: '.$e->getMessage()], 400);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
