<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Models\Company;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

trait QueriesAdminCompanies
{
    /**
     * @param  Builder<Company>  $query
     * @param  array<string, mixed>  $validated
     */
    protected function applyCompanyIndexFilters(Builder $query, array $validated): void
    {
        $query
            ->when($validated['name'] ?? null, fn (Builder $query, string $name) => $query->where('name', 'ilike', "%{$name}%"))
            ->when($validated['email'] ?? null, fn (Builder $query, string $email) => $query->where('email', 'ilike', "%{$email}%"))
            ->when($validated['username'] ?? null, fn (Builder $query, string $username) => $query->where('username', 'ilike', "%{$username}%"))
            ->when($validated['phone'] ?? null, fn (Builder $query, string $phone) => $query->where('phone', 'ilike', "%{$phone}%"))
            ->when($validated['address'] ?? null, fn (Builder $query, string $address) => $query->where('address', 'ilike', "%{$address}%"))
            ->when($validated['created_at'] ?? null, function (Builder $query, string $createdAt): void {
                $range = explode(',', $createdAt);

                if (count($range) === 2) {
                    $from = Carbon::createFromTimestamp(((int) $range[0]) / 1000);
                    $to = Carbon::createFromTimestamp(((int) $range[1]) / 1000);
                    $query->whereBetween('created_at', [$from, $to]);

                    return;
                }

                $date = Carbon::createFromTimestamp(((int) $range[0]) / 1000);
                $query->whereDate('created_at', $date);
            })
            ->when($validated['sort'] ?? null, function (Builder $query, string $sort): void {
                foreach (explode(',', $sort) as $item) {
                    $direction = str_starts_with($item, '-') ? 'desc' : 'asc';
                    $field = ltrim($item, '-');
                    $query->orderBy($field, $direction);
                }
            });
    }

    /**
     * @param  list<string>  $statuses
     * @param  Builder<Company>  $query
     */
    protected function applyAgentSubscriptionStatusFilter(Builder $query, array $statuses): void
    {
        $query->where(function (Builder $query) use ($statuses): void {
            foreach ($statuses as $status) {
                if ($status === 'active') {
                    $query->orWhereHas('agentSubscription', function (Builder $subscription): void {
                        $subscription
                            ->whereNotNull('started_at')
                            ->whereNotNull('ended_at')
                            ->where('ended_at', '>=', now());
                    });
                }

                if ($status === 'expired') {
                    $query->orWhereHas('agentSubscription', function (Builder $subscription): void {
                        $subscription
                            ->whereNotNull('ended_at')
                            ->where('ended_at', '<', now());
                    });
                }

                if ($status === 'inactive') {
                    $query->orWhereDoesntHave('agentSubscription')
                        ->orWhereHas('agentSubscription', function (Builder $subscription): void {
                            $subscription->where(function (Builder $subscription): void {
                                $subscription
                                    ->whereNull('started_at')
                                    ->orWhereNull('ended_at');
                            });
                        });
                }
            }
        });
    }

    /**
     * @return array<string, mixed>
     */
    protected function companyListItem(Company $company): array
    {
        $subscription = $company->relationLoaded('agentSubscription')
            ? $company->agentSubscription
            : null;

        return [
            'id' => $company->id,
            'name' => $company->name,
            'username' => $company->username,
            'email' => $company->email,
            'phone' => $company->phone,
            'customer_service_phone' => $company->customer_service_phone,
            'address' => $company->address,
            'note' => $company->note,
            'photo_id' => $company->photo_id,
            'photo_url' => $company->photo_url,
            'created_at' => $company->created_at,
            'subscription_status' => $subscription?->status?->value,
            'subscription_ends_at' => $subscription?->ended_at,
            'subscription_package' => $subscription?->package?->name,
        ];
    }

    protected function exportCompaniesCsv(Request $request, string $filename): StreamedResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'string'],
        ]);

        $companyIds = explode(',', $validated['ids']);

        return response()->streamDownload(
            function () use ($companyIds): void {
                $file = fopen('php://output', 'w');

                fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

                fputcsv($file, [
                    'ID',
                    'Name',
                    'Username',
                    'Email',
                    'Phone',
                    'Address',
                    'Created At',
                ]);

                Company::query()
                    ->whereIn('id', $companyIds)
                    ->orderBy('id')
                    ->cursor()
                    ->each(function (Company $company) use ($file): void {
                        fputcsv($file, [
                            $company->id,
                            $company->name,
                            $company->username,
                            $company->email,
                            $company->phone,
                            $company->address,
                            $company->created_at?->toDateTimeString(),
                        ]);
                    });

                fclose($file);
            },
            $filename,
            ['Content-Type' => 'text/csv'],
        );
    }
}
