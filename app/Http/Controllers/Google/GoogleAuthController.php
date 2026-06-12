<?php

namespace App\Http\Controllers\Google;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\GoogleAnalyticsService;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function __construct(
        private GoogleAnalyticsService $analyticsService
    ) {}

    public function callback(Request $request)
    {
        $googleUser = Socialite::driver('google')
            ->stateless()
            ->user();

        $state = json_decode($request->input('state'), true);

        $intent = $state['intent'] ?? null;

        return match ($intent) {
            'connect-analytics' => $this->continueToConnectAnalytics($state, $googleUser),

            default => abort(400, 'Invalid OAuth intent'),
        };
    }

    private function continueToConnectAnalytics(mixed $state, mixed $googleUser)
    {
        $company = Company::findOrFail($state['company_id']);

        $this->analyticsService->upsertGoogleAccount($company, $googleUser);

        return redirect()
            ->route('companies.dashboard.analytics.index', [
                'company' => $company->username,
            ]);
    }
}
