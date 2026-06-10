<?php

namespace App\Http\Controllers\Admin;

use App\Events\TourUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminUpdateTourRequest;
use App\Http\Requests\Admin\BulkUpdateTourProductRequest;
use App\Http\Requests\Admin\IndexTourProductRequest;
use App\Models\Currency;
use App\Models\PriceCategory;
use App\Models\Tour;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TourProductController extends Controller
{
    public function index(IndexTourProductRequest $request): Response
    {
        $validated = $request->validated();

        $data = Tour::query()
            ->with(['category', 'company', 'image', 'continent', 'region', 'country'])
            ->withCount('schedules')
            ->when($validated['code'] ?? null, fn ($query, $code) => $query->where('code', 'ilike', "{$code}%"))
            ->when($validated['name'] ?? null, fn ($query, $name) => $query->where('name', 'ilike', "%{$name}%"))
            ->when($validated['status'] ?? null, fn ($query, $status) => $query->whereIn('status', $status))
            ->when($validated['company'] ?? null, fn ($query, $companyIds) => $query->whereIn('company_id', $companyIds))
            ->when($validated['created_at'] ?? null, function ($query, $createdAt): void {
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
            ->when($validated['sort'] ?? null, function ($query, $sort): void {
                foreach (explode(',', $sort) as $item) {
                    $direction = str_starts_with($item, '-') ? 'desc' : 'asc';
                    $field = ltrim($item, '-');
                    $query->orderBy($field, $direction);
                }
            })
            ->paginate($validated['per_page'] ?? 10);

        $data->through(fn (Tour $tour): array => $this->tourListItem($tour));

        return Inertia::render('admin/tours/products/index', [
            'data' => $data,
        ]);
    }

    public function edit(Tour $tour): Response
    {
        $tour->load([
            'user',
            'category',
            'company',
            'image',
            'document',
            'continent',
            'region',
            'country',
            'productCommissionCategory',
            'schedules.prices.priceCategory',
            'schedules.availability',
            'schedules.addOns',
        ]);

        $company = $tour->company;
        abort_unless($company, 404);

        return Inertia::render('admin/tours/products/edit', [
            'tour' => $tour,
            'priceCategories' => PriceCategory::query()
                ->where('company_id', $company->id)
                ->orderBy('name')
                ->get(['id', 'name']),
            'productCommissionCategories' => $company->productCommissionCategories()
                ->where(function ($query) use ($tour): void {
                    $query->where('is_active', true)
                        ->orWhere('id', $tour->product_commission_category_id);
                })
                ->orderBy('sort_order')
                ->orderBy('category_name')
                ->get(['id', 'category_name']),
            'currencies' => Currency::query()
                ->select('code', 'name')
                ->orderBy('code')
                ->get(),
        ]);
    }

    public function update(AdminUpdateTourRequest $request, Tour $tour)
    {
        $data = $request->validated();

        $tour->update($data);
        TourUpdated::dispatch($tour);

        return back()->with('success', 'Tour updated successfully.');
    }

    public function bulkUpdate(BulkUpdateTourProductRequest $request)
    {
        $validated = $request->validated();

        Tour::query()
            ->whereIn('id', $validated['ids'])
            ->update(['status' => $validated['status']]);

        return back()->with('success', 'Tours updated successfully.');
    }

    public function exportAsCsv(Request $request): StreamedResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'string'],
        ]);

        $tourIds = explode(',', $validated['ids']);

        return response()->streamDownload(
            function () use ($tourIds): void {
                $file = fopen('php://output', 'w');

                fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

                fputcsv($file, [
                    'ID',
                    'Code',
                    'Name',
                    'Vendor',
                    'Status',
                    'Destination',
                    'Created At',
                ]);

                Tour::query()
                    ->with('company')
                    ->whereIn('id', $tourIds)
                    ->orderBy('id')
                    ->cursor()
                    ->each(function (Tour $tour) use ($file): void {
                        fputcsv($file, [
                            $tour->id,
                            $tour->code,
                            $tour->name,
                            $tour->company?->name,
                            $tour->status?->value ?? $tour->status,
                            $tour->destination,
                            $tour->created_at?->toDateTimeString(),
                        ]);
                    });

                fclose($file);
            },
            'tour-products.csv',
            ['Content-Type' => 'text/csv'],
        );
    }

    public function destroy(Tour $tour)
    {
        $tour->delete();

        return back()->with('success', 'Tour deleted successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function tourListItem(Tour $tour): array
    {
        return [
            'id' => $tour->id,
            'code' => $tour->code,
            'name' => $tour->name,
            'description' => $tour->description,
            'duration_days' => $tour->duration_days,
            'status' => $tour->status?->value ?? $tour->status,
            'destination' => $tour->destination,
            'showprice' => $tour->showprice,
            'promote_title' => $tour->promote_title,
            'promote_price' => $tour->promote_price,
            'promote_note' => $tour->promote_note,
            'earlybird' => $tour->earlybird,
            'earlybird_note' => $tour->earlybird_note,
            'currency' => $tour->currency,
            'company_id' => $tour->company_id,
            'category_id' => $tour->category_id,
            'continent_id' => $tour->continent_id,
            'region_id' => $tour->region_id,
            'country_id' => $tour->country_id,
            'continent_name' => $tour->continent_name ?? $tour->continent?->name,
            'region_name' => $tour->region_name ?? $tour->region?->name,
            'country_name' => $tour->country_name ?? $tour->country?->name,
            'schedules_count' => (int) ($tour->schedules_count ?? 0),
            'company' => $tour->company ? [
                'id' => $tour->company->id,
                'name' => $tour->company->name,
                'username' => $tour->company->username,
            ] : null,
            'category' => $tour->category ? [
                'id' => $tour->category->id,
                'name' => $tour->category->name,
            ] : null,
            'image' => $tour->image,
            'created_at' => $tour->created_at,
        ];
    }
}
