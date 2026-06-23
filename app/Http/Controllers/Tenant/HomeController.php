<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        $domain = Context::get('domain');
        $company = $domain?->owner;

        if (! $company || $company instanceof AffiliateProfile) {
            abort(404);
        }

        $company->load('settings');

        View::share([
            'tenantLandingPageData' => $company->settings?->landing_page_data,
        ]);

        return Inertia::render('companies/landing-page', [
            'company' => $company,
        ]);
    }
}
