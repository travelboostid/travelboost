<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Inertia\Inertia;

class PageController extends Controller
{
    public function edit(Company $company)
    {
        $company->load('settings');

        if (! $company->settings) {
            $company->setRelation(
                'settings',
                $company->settings()->create(config('travelboost.company_default_settings'))
            );
        }

        return Inertia::render('companies/edit-landing-page', [
            'company' => $company,
        ]);
    }
}
