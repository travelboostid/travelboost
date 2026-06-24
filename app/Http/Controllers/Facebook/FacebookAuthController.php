<?php

namespace App\Http\Controllers\Facebook;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\MetaAnalyticsService;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class FacebookAuthController extends Controller
{
    public function __construct(
        private MetaAnalyticsService $metaAnalyticsService
    ) {}

    public function callback(Request $request)
    {
        $facebookUser = Socialite::driver('facebook')
            ->stateless()
            ->user();

        $state = json_decode($request->input('state'), true);

        $intent = $state['intent'] ?? null;

        return match ($intent) {
            'connect-meta-analytics' => $this->continueToConnectMetaAnalytics($state, $facebookUser),

            default => abort(400, 'Invalid OAuth intent'),
        };
    }

    /**
     * @param  array<string, mixed>  $state
     */
    private function continueToConnectMetaAnalytics(array $state, mixed $facebookUser)
    {
        $company = Company::findOrFail($state['company_id']);

        $this->metaAnalyticsService->upsertFacebookAccount($company, $facebookUser);

        return redirect()
            ->route('companies.dashboard.analytics.meta.selectPixel', [
                'company' => $company->username,
            ]);
    }
}
