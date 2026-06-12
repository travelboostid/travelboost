<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\GoogleAnalyticsService;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use RuntimeException;

class GoogleAccountController extends Controller
{
    public function __construct(
        private GoogleAnalyticsService $analyticsService
    ) {}

    public function connect(Request $request, Company $company)
    {
        return Socialite::driver('google')
            ->scopes([
                'https://www.googleapis.com/auth/analytics.readonly',
                'https://www.googleapis.com/auth/analytics.edit',
            ])
            ->with([
                'access_type' => 'offline',
                'prompt' => 'consent',
                'state' => json_encode([
                    'intent' => 'connect-analytics',
                    'company_id' => $company->id,
                ]),
            ])
            ->redirect();
    }

    public function disconnect(Request $request, Company $company)
    {
        try {
            $this->analyticsService->disconnectGoogleAccount($company);
        } catch (RuntimeException) {
            abort(404);
        }

        return redirect()
            ->back(fallback: route('companies.dashboard.settings.linked-accounts.index', $company))
            ->with('success', 'Google account disconnected.');
    }
}
