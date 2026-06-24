<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\MetaPixelConnectionSource;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\MetaAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use RuntimeException;

class MetaAnalyticsController extends Controller
{
    public function __construct(
        private MetaAnalyticsService $metaAnalyticsService
    ) {}

    public function index(Request $request, Company $company)
    {
        $account = $company->facebookAccount;
        $pixel = $company->metaPixelConnection;

        $props = [
            'metaAccount' => $account,
            'metaPixel' => $pixel,
        ];

        if ($account !== null && $pixel !== null && $pixel->connection_source === MetaPixelConnectionSource::Oauth) {
            $props['metaInsights'] = Inertia::defer(
                fn () => Cache::remember(
                    $this->metaAnalyticsService->dashboardCacheKey($pixel),
                    now()->addHour(),
                    fn () => $this->metaAnalyticsService->getDashboardInsights($account, $pixel)
                ),
                'meta-analytics-overview'
            );
        }

        return Inertia::render(
            'companies/dashboard/analytics/meta/index',
            $props
        );
    }

    public function showPixelSelection(Request $request, Company $company)
    {
        if ($company->metaPixelConnection !== null) {
            return redirect()->route('companies.dashboard.analytics.meta.index', $company);
        }

        $facebookAccount = $company->facebookAccount;

        return Inertia::render('companies/dashboard/analytics/meta/select-pixel', [
            'metaAccount' => $facebookAccount,
            'availablePixels' => $facebookAccount
                ? Inertia::defer(
                    fn () => Cache::remember(
                        $this->metaAnalyticsService->pixelsCacheKey($company),
                        now()->addHour(),
                        fn () => $this->metaAnalyticsService->listAvailablePixels($company)
                    )
                )
                : null,
        ]);
    }

    public function selectPixel(Request $request, Company $company)
    {
        if ($request->input('website_url') === '-') {
            $request->merge(['website_url' => null]);
        }

        $validated = $request->validate([
            'pixel_id' => [
                'required',
                'string',
                'regex:/^\d+$/',
                'max:32',
            ],
            'pixel_name' => [
                'nullable',
                'string',
                'max:255',
            ],
            'ad_account_id' => [
                'nullable',
                'string',
                'max:255',
            ],
            'website_url' => [
                'nullable',
                'url:https',
                'max:2048',
            ],
            'connection_source' => [
                'required',
                'in:oauth,manual',
            ],
            'company_facebook_account_id' => [
                'nullable',
                'integer',
                'exists:company_facebook_accounts,id',
            ],
        ]);

        abort_if($company->metaPixelConnection !== null, 422);

        $facebookAccount = $company->facebookAccount;
        $connectionSource = MetaPixelConnectionSource::from($validated['connection_source']);

        if ($connectionSource === MetaPixelConnectionSource::Oauth) {
            abort_unless($facebookAccount !== null, 404);

            if (isset($validated['company_facebook_account_id'])) {
                abort_unless(
                    (int) $validated['company_facebook_account_id'] === (int) $facebookAccount->id,
                    403,
                );
            }
        }

        $this->metaAnalyticsService->connectPixel($company, [
            'company_facebook_account_id' => $connectionSource === MetaPixelConnectionSource::Oauth
                ? $facebookAccount?->id
                : null,
            'pixel_id' => $validated['pixel_id'],
            'pixel_name' => $validated['pixel_name'] ?? null,
            'ad_account_id' => $validated['ad_account_id'] ?? null,
            'connection_source' => $connectionSource,
            'website_url' => $validated['website_url'] ?? null,
        ]);

        return redirect()->route('companies.dashboard.analytics.meta.index', $company);
    }

    public function unlinkConnection(Request $request, Company $company)
    {
        try {
            $this->metaAnalyticsService->unlinkPixel($company);
        } catch (RuntimeException) {
            abort(404);
        }

        return redirect()->route(
            'companies.dashboard.analytics.meta.selectPixel',
            $company
        );
    }
}
