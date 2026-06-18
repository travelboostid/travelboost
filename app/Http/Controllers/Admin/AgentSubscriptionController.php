<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexAgentSubscriptionRequest;
use App\Models\AgentSubscription;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class AgentSubscriptionController extends Controller
{
    public function index(IndexAgentSubscriptionRequest $request): Response
    {
        $validated = $request->validated();

        $query = AgentSubscription::query()
            ->with(['company', 'package'])
            ->when($validated['company'] ?? null, function (Builder $query, array $companyIds): void {
                $query->whereIn('company_id', $companyIds);
            })
            ->when($validated['status'] ?? null, function (Builder $query, array $statuses): void {
                $this->applyStatusFilter($query, $statuses);
            })
            ->when($validated['started_at'] ?? null, function (Builder $query, string $startedAt): void {
                $this->applyDateFilter($query, 'started_at', $startedAt);
            })
            ->when($validated['ended_at'] ?? null, function (Builder $query, string $endedAt): void {
                $this->applyDateFilter($query, 'ended_at', $endedAt);
            })
            ->when($validated['sort'] ?? null, function (Builder $query, string $sort): void {
                foreach (explode(',', $sort) as $item) {
                    $direction = str_starts_with($item, '-') ? 'desc' : 'asc';
                    $field = ltrim($item, '-');
                    $query->orderBy($field, $direction);
                }
            });

        $data = $query->paginate($validated['per_page'] ?? 10);

        $data->through(fn (AgentSubscription $subscription): array => [
            'id' => $subscription->id,
            'status' => $subscription->status->value,
            'started_at' => $subscription->started_at,
            'ended_at' => $subscription->ended_at,
            'created_at' => $subscription->created_at,
            'company' => $subscription->company ? [
                'id' => $subscription->company->id,
                'name' => $subscription->company->name,
                'username' => $subscription->company->username,
            ] : null,
            'package' => $subscription->package ? [
                'id' => $subscription->package->id,
                'name' => $subscription->package->name,
                'price' => $subscription->package->price,
                'duration_months' => $subscription->package->duration_months,
            ] : null,
        ]);

        return Inertia::render('admin/database/subscriptions/index', [
            'data' => $data,
        ]);
    }

    /**
     * @param  list<string>  $statuses
     * @param  Builder<AgentSubscription>  $query
     */
    protected function applyStatusFilter(Builder $query, array $statuses): void
    {
        $query->where(function (Builder $query) use ($statuses): void {
            foreach ($statuses as $status) {
                if ($status === 'active') {
                    $query->orWhere(function (Builder $subscription): void {
                        $subscription
                            ->whereNotNull('started_at')
                            ->whereNotNull('ended_at')
                            ->where('ended_at', '>=', now());
                    });
                }

                if ($status === 'expired') {
                    $query->orWhere(function (Builder $subscription): void {
                        $subscription
                            ->whereNotNull('ended_at')
                            ->where('ended_at', '<', now());
                    });
                }

                if ($status === 'inactive') {
                    $query->orWhere(function (Builder $subscription): void {
                        $subscription
                            ->whereNull('started_at')
                            ->orWhereNull('ended_at');
                    });
                }
            }
        });
    }

    protected function applyDateFilter(Builder $query, string $column, string $value): void
    {
        $range = explode(',', $value);

        if (count($range) === 2) {
            $from = Carbon::createFromTimestamp(((int) $range[0]) / 1000);
            $to = Carbon::createFromTimestamp(((int) $range[1]) / 1000);
            $query->whereBetween($column, [$from, $to]);

            return;
        }

        $date = Carbon::createFromTimestamp(((int) $range[0]) / 1000);
        $query->whereDate($column, $date);
    }
}
