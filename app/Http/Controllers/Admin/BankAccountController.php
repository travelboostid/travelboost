<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexBankAccountRequest;
use App\Http\Requests\Admin\UpdateBankAccountRequest;
use App\Models\BankAccount;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class BankAccountController extends Controller
{
  public function index(IndexBankAccountRequest $request)
  {
    $validated = $request->validated();

    $data = BankAccount::query()
      ->with(['owner'])
      ->when($validated['provider'] ?? null, function ($query, $provider) {
        $providers = explode(',', $provider);
        $query->whereIn('provider', $providers);
      })
      ->when($validated['status'] ?? null, function ($query, $status) {
        $statuses = explode(',', $status);
        $query->whereIn('status', $statuses);
      })
      ->when($validated['created_at'] ?? null, function ($query, $created_at) {
        $range = explode(',', $created_at);

        if (count($range) === 2) {
          $from = Carbon::createFromTimestamp($range[0] / 1000);
          $to = Carbon::createFromTimestamp($range[1] / 1000);
          $query->whereBetween('created_at', [$from, $to]);
        } else {
          $date = Carbon::createFromTimestamp($range[0] / 1000);
          $query->whereDate('created_at', $date);
        }
      })
      ->when($validated['sort'] ?? null, function ($query, $sort) {
        $sorts = explode(',', $sort);
        foreach ($sorts as $item) {
          $dir = str_starts_with($item, '-') ? 'desc' : 'asc';
          $field = ltrim($item, '-');
          $query->orderBy($field, $dir);
        }
      })
      ->paginate($validated['per_page'] ?? 10);
    return Inertia::render('admin/funds/bank-accounts/index', [
      'data' => $data,
    ]);
  }

  public function update(UpdateBankAccountRequest $request, BankAccount $bankAccount)
  {
    $validated = $request->validated();
    $bankAccount->update($validated);

    return redirect()->back()->with('success', 'Bank account updated successfully.');
  }
}
