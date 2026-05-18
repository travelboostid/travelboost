<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\AgentTour;
use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ParameterAgentController extends Controller
{
    public function index(Request $request, Company $company)
    {
        $settings = $company->companySetting()->firstOrCreate(
            ['company_id' => $company->id],
            [
                'manual_bank_transfer' => '',
                'manual_bank_transfer_account_name' => '',
                'manual_bank_transfer_account_number' => '',
                'email_payment_gateway' => '',
                'password_payment_gateway' => '',
            ]
        );

        return Inertia::render('companies/dashboard/parameter-agent/index', [
            'settings' => $settings,
        ]);
    }

    public function update(
        Request $request,
        Company $company
    ) {
        $validated = $request->validate([
            'manual_bank_transfer' => [
              'nullable', 
              'string', 
              'max:255'
            ],
            'manual_bank_transfer_account_name' => [
                'nullable',
                'string',
                'max:255',
            ],
            'manual_bank_transfer_account_number' => [
                'nullable',
                'string',
                'max:255',
            ],
            'email_payment_gateway' => [
                'nullable',
                'string',
                'max:255',
            ],
            'password_payment_gateway' => [
                'nullable',
                'string',
                'max:255',
            ],
        ]);

        $company->companySetting()->updateOrCreate(
            ['company_id' => $company->id],
            $validated
        );

        return back()->with(
            'success',
            'Agent parameters updated successfully.'
        );
    }
}