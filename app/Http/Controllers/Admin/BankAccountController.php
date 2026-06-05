<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexBankAccountRequest;
use App\Http\Requests\Admin\UpdateBankAccountRequest;
use App\Models\BankAccount;
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class BankAccountController extends Controller
{
    public function index(IndexBankAccountRequest $request)
    {
        $validated = $request->validated();

        $ownerTypes = [
            'user' => User::class,
            'company' => Company::class,
        ];

        $data = BankAccount::query()
            ->with(['owner'])
            ->when($validated['provider'] ?? null, function ($query, $provider) {
                $query->whereIn('provider', $provider);
            })
            ->when($validated['owner'] ?? null, function ($query, $owners) use ($ownerTypes) {

                foreach ($owners as $owner) {
                    [$type, $id] = explode(':', $owner);

                    if (! isset($ownerTypes[$type])) {
                        continue;
                    }

                    $query->orWhere(
                        fn ($query) => $query
                            ->whereMorphedTo('owner', $ownerTypes[$type])
                            ->where('owner_id', $id)
                    );
                }
            })
            ->when($validated['status'] ?? null, function ($query, $status) {
                $query->whereIn('status', $status);
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
            'bankAccountProviders' => config('travelboost.bank_account_providers'),
        ]);
    }

    public function update(UpdateBankAccountRequest $request, BankAccount $bankAccount)
    {
        $validated = $request->validated();
        $bankAccount->update($validated);

        return redirect()->back()->with('success', 'Bank account updated successfully.');
    }
}
