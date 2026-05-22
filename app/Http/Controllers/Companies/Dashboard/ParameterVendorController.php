<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ParameterVendorController extends Controller
{
    public function index(Request $request, Company $company)
    {
        $settings = $company->companySetting()->firstOrCreate(
            ['company_id' => $company->id],
            [
                'booking_deadline' => 0,
                'minimum_down_payment' => 0,
                'minimum_vat' => 0,
                'booking_entry_time_limit' => 0,
                'full_payment_deadline' => 0,
                'document_completed_deadline' => 0,
            ]
        );

        return Inertia::render('companies/dashboard/parameter-vendor/index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request, Company $company)
    {
        $validated = $request->validate([
            'booking_deadline' => ['required', 'integer', 'min:0'],
            'minimum_down_payment' => ['required', 'numeric', 'min:0'],
            'minimum_vat' => ['required', 'numeric', 'min:0'],
            'term_conditions' => ['nullable', 'string'],
            'booking_entry_time_limit' => ['required', 'integer', 'min:0'],
            'manual_bank_transfer' => ['nullable', 'string', 'max:255'],
            'manual_bank_transfer_account_name' => ['nullable', 'string', 'max:255'],
            'manual_bank_transfer_account_number' => ['nullable', 'string', 'max:255'],
            'email_payment_gateway' => ['nullable', 'string', 'max:255'],
            'password_payment_gateway' => ['nullable', 'string', 'max:255'],
            'full_payment_deadline' => ['required', 'numeric', 'min:0'],
            'document_completed_deadline' => ['required', 'numeric', 'min:0'],
        ]);

        $company->companySetting()->updateOrCreate(
            ['company_id' => $company->id],
            $validated
        );

        return back()->with('success', 'Vendor parameters updated successfully.');
    }
}
