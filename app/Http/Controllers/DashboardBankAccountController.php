<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateBankAccountRequest;
use App\Http\Requests\UpdateBankAccountRequest;
use App\Models\BankAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardBankAccountController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  public function index()
  {
    $bankAccounts = BankAccount::where('user_id', Auth::id())
      ->orderBy('is_default', 'desc')
      ->orderBy('created_at', 'desc')
      ->get();

    return Inertia::render('dashboard/bank-accounts/index', [
      'bank_accounts' => $bankAccounts,
      'providers' => ['BCA', 'BNI', 'MANDIRI', 'OVO', 'GOPAY'],
    ]);
  }

  /**
   * Store a newly created resource in storage.
   */
  public function store(CreateBankAccountRequest $request)
  {
    BankAccount::create([
      ...$request->validated(),
      'user_id' => Auth::id(),
    ]);

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
  public function update(UpdateBankAccountRequest $request, BankAccount $bankAccount)
  {
    $bankAccount->update($request->validated());
    return back();
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(BankAccount $bankAccount)
  {
    $bankAccount->delete();
    return back();
  }
}
