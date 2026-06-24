<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\MetaAnalyticsService;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use RuntimeException;

class FacebookAccountController extends Controller
{
    public function __construct(
        private MetaAnalyticsService $metaAnalyticsService
    ) {}

    public function connect(Request $request, Company $company)
    {
        return Socialite::driver('facebook')
            ->setScopes([
                'ads_read',
                'business_management',
            ])
            ->with([
                'state' => json_encode([
                    'intent' => 'connect-meta-analytics',
                    'company_id' => $company->id,
                ]),
            ])
            ->redirect();
    }

    public function disconnect(Request $request, Company $company)
    {
        try {
            $this->metaAnalyticsService->disconnectFacebookAccount($company);
        } catch (RuntimeException) {
            abort(404);
        }

        return redirect()
            ->back(fallback: route('companies.dashboard.settings.linked-accounts.index', $company))
            ->with('success', 'Facebook account disconnected.');
    }
}
