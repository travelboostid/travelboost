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
        $googleUser = Socialite::driver('google')->stateless()->user();

        // decode state
        // TODO: check intent (connect-for-company, connect-for-user)
        $state = json_decode($request->input('state'), true);
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
            ->route('companies.dashboard.index', [
                'company' => $company->username,
            ]);
    }
}
