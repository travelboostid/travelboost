<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateBankAccountRequest;
use App\Http\Requests\UpdateBankAccountRequest;
use App\Models\BankAccount;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BankAccountController extends Controller
{
  // Display a list of bank accounts for the specified company
  public function index(Company $company)
  {
    $bankAccounts = $company->bankAccounts()
      ->orderBy('is_default', 'desc') // Prioritize default accounts
      ->orderBy('created_at', 'desc') // Sort by creation date
      ->get();

    return Inertia::render('companies/dashboard/bank-accounts/index', [
      'bank_accounts' => $bankAccounts,
      'providers' => ['BCA', 'BNI', 'MANDIRI', 'OVO', 'GOPAY'], // List of bank providers
    ]);
  }

  // Store a new bank account for the specified company
  public function store(CreateBankAccountRequest $request, Company $company)
  {
    $company->bankAccounts()->create($request->validated());

    // If this account is marked as default, unset previous defaults
    if ($request->validated()['is_default'] ?? false) {
      BankAccount::where('user_id', Auth::id())
        ->where('is_default', true)
        ->update(['is_default' => false]);
    }

    return back(); // Redirect back after storing
  }

  // Update an existing bank account
  public function update(UpdateBankAccountRequest $request, Company $company, BankAccount $bankAccount)
  {
    $bankAccount->update($request->validated());
    return back(); // Redirect back after updating
  }

  // Delete a bank account for the specified company
  public function destroy(Company $company, BankAccount $bankAccount)
  {
    $company->bankAccounts()->where('id', $bankAccount->id)->delete();
    return back(); // Redirect back after deletion
  }
}
