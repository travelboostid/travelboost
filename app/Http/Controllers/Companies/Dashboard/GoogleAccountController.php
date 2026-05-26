<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Laravel\Socialite\Socialite;

class GoogleAccountController extends Controller
{
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
                    'intent' => 'connect-for-company',
                    'company_id' => $company->id,
                ]),
            ])
            ->redirect();
    }
}
