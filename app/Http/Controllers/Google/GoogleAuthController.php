<?php

namespace App\Http\Controllers\Google;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyGoogleAccount;
use Illuminate\Http\Request;
use Laravel\Socialite\Socialite;

class GoogleAuthController extends Controller
{
    public function callback(Request $request)
    {
        $googleUser = Socialite::driver('google')
            ->stateless()
            ->user();

        $state = json_decode($request->input('state'), true);

        $intent = $state['intent'] ?? null;

        // TODO: match more intent
        return match ($intent) {
            'connect-analytics' => $this->continueToConnectAnalytics($state, $googleUser),

            default => abort(400, 'Invalid OAuth intent'),
        };
    }

    private function continueToConnectAnalytics(mixed $state, mixed $googleUser)
    {
        $company = Company::findOrFail($state['company_id']);

        CompanyGoogleAccount::updateOrCreate(
            [
                'company_id' => $company->id,
            ],
            [
                'google_id' => $googleUser->id,
                'email' => $googleUser->email,
                'name' => $googleUser->name,
                'access_token' => $googleUser->token,
                'refresh_token' => $googleUser->refreshToken,
                'scopes' => $googleUser->approvedScopes,
            ]
        );

        return redirect()
            ->route('companies.dashboard.analytics.index', [
                'company' => $company->username,
            ]);
    }
}
