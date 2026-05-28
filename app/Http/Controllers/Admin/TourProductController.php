<?php

namespace App\Http\Controllers\Admin;

use App\Events\TourUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexTourProductRequest;
use App\Http\Requests\UpdateTourRequest;
use App\Models\Tour;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

#[Authorize('access-admin')]
class TourProductController extends Controller
{
    /**
     * Display a listing of all tour products across all vendors.
     */
    public function index(IndexTourProductRequest $request)
    {
        $validated = $request->validated();
        $data = Tour::query()
            ->with(['category', 'company', 'image'])
            ->when($validated['code'] ?? null, function ($query, $code) {
                $query->where('code', 'ilike', "$code%");
            })
            ->when($validated['name'] ?? null, function ($query, $name) {
                $query->where('name', 'ilike', "%$name%");
            })
            ->when($validated['status'] ?? null, function ($query, $status) {
                $query->whereIn('status', $status);
            })
            ->when($validated['company'] ?? null, function ($query, $companyIds) {
                $query->whereIn('company_id', $companyIds);
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

        return Inertia::render('admin/tours/products/index', [
            'data' => $data,
        ]);
    }

    /**
     * Show the form for editing the specified tour.
     * Renders within the admin dashboard context.
     */
    public function edit(Tour $tour)
    {
        $tour->load(['category', 'company', 'image', 'document']);

        return Inertia::render('admin/tours/products/edit', [
            'tour' => $tour,
        ]);
    }

    /**
     * Update the specified tour in storage.
     */
    public function update(UpdateTourRequest $request, Tour $tour)
    {
        $tour->update($request->validated());
        TourUpdated::dispatch($tour);

        return back();
    }

    /**
     * Remove the specified tour from storage.
     */
    public function destroy(Tour $tour)
    {
        $tour->delete();

        return back();
    }
}
