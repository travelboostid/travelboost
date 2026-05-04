<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BankAccountController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $bankAccounts = BankAccount::where('owner_type', get_class($user))
            ->where('owner_id', $user->id)
            ->orderByDesc('is_default')
            ->latest()
            ->get();

        return Inertia::render('affiliate/dashboard/fund/bank-accounts/index', [
            'bank_accounts' => $bankAccounts,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'provider' => 'required|string',
            'account_number' => 'required|string|max:50',
            'account_name' => 'required|string|max:100',
            'branch' => 'nullable|string|max:100',
            'is_default' => 'boolean',
        ]);

        if ($validated['is_default'] ?? false) {
            BankAccount::where('owner_type', get_class($user))
                ->where('owner_id', $user->id)
                ->update(['is_default' => false]);
        }

        BankAccount::create(array_merge($validated, [
            'owner_type' => get_class($user),
            'owner_id' => $user->id,
            'status' => 'pending',
        ]));

        return back();
    }

    public function update(Request $request, BankAccount $bankAccount)
    {
        $user = $request->user();
        if ($bankAccount->owner_id !== $user->id) {
            abort(403);
        }

        $validated = $request->validate([
            'provider' => 'required|string',
            'account_number' => 'required|string|max:50',
            'account_name' => 'required|string|max:100',
            'branch' => 'nullable|string|max:100',
            'is_default' => 'boolean',
        ]);

        if ($validated['is_default'] ?? false) {
            BankAccount::where('owner_type', get_class($user))
                ->where('owner_id', $user->id)
                ->where('id', '!=', $bankAccount->id)
                ->update(['is_default' => false]);
        }

        $bankAccount->update($validated);

        return back();
    }

    public function destroy(Request $request, BankAccount $bankAccount)
    {
        if ($bankAccount->owner_id !== $request->user()->id) {
            abort(403);
        }
        $bankAccount->delete();

        return back();
    }
}
