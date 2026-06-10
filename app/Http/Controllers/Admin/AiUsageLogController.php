<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexAiUsageLogRequest;
use App\Models\AiUsageLog;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class AiUsageLogController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(IndexAiUsageLogRequest $request)
    {
        $validated = $request->validated();

        $query = AiUsageLog::query()
            ->with(['company'])
            ->when($validated['company'] ?? null, function ($query, $companies) {
                $query->whereIn('company_id', $companies);
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
            });

        $summary = (clone $query)
            ->selectRaw('
            COALESCE(SUM(user_cost), 0) as total_user_cost,
            COALESCE(SUM(usage_cost), 0) as total_usage_cost,
            COALESCE(SUM(user_cost - usage_cost), 0) as total_profit
        ')
            ->first();

        $data = $query
            ->when($validated['sort'] ?? null, function ($query, $sort) {
                foreach (explode(',', $sort) as $item) {
                    $dir = str_starts_with($item, '-') ? 'desc' : 'asc';
                    $field = ltrim($item, '-');

                    $query->orderBy($field, $dir);
                }
            })
            ->paginate($validated['per_page'] ?? 10);

        return Inertia::render('admin/database/ai-usage-logs/index', [
            'data' => $data,
            'summary' => [
                'total_user_cost' => $summary->total_user_cost,
                'total_usage_cost' => $summary->total_usage_cost,
                'total_profit' => $summary->total_profit,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
