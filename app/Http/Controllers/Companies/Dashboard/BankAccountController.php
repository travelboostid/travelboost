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
  /**
   * Display a listing of the resource.
   */
  public function index(Company $company)
  {
    $bankAccounts = $company->bankAccounts()
      ->orderBy('is_default', 'desc')
      ->orderBy('created_at', 'desc')
      ->get();

    return Inertia::render('companies/dashboard/bank-accounts/index', [
      'bank_accounts' => $bankAccounts,
      'providers' => ['BCA', 'BNI', 'MANDIRI', 'OVO', 'GOPAY'],
    ]);
  }
  /**
   * Store a newly created resource in storage.
   */
  public function store(CreateBankAccountRequest $request, Company $company)
  {
    $company->bankAccounts()->create($request->validated());

    // If this account is marked as default, unset previous defaults
    if ($data['is_default'] ?? false) {
      BankAccount::where('user_id', Auth::id())
        ->where('is_default', true)
        ->update(['is_default' => false]);
    }

    return back();
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(UpdateBankAccountRequest $request, Company $company, BankAccount $bankAccount)
  {
    $bankAccount->update($request->validated());
    return back();
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(Company $company, BankAccount $bankAccount)
  {
    $company->bankAccounts()->where('id', $bankAccount->id)->delete();
    return back();
  }
}
