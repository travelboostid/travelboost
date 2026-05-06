<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\TourAddOn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Company;

class TourAddOnController extends Controller
{
    public function store(Request $request, Company $company)
    {
        $data = $request->validate([
            'add_ons' => ['required', 'array'],
            'add_ons.*.tour_id' => ['required', 'integer', 'exists:tours,id'],
            'add_ons.*.schedule_id' => ['required', 'integer', 'exists:tour_schedules,id'],
            'add_ons.*.description' => ['required', 'string', 'max:255'],
            'add_ons.*.price' => ['nullable', 'numeric'],
            'add_ons.*.edit_status' => ['boolean'],
        ]);

        $companyId = $company->id;

        $items = collect($data['add_ons'])
            ->map(function ($item) use ($companyId) {
                return [
                    'company_id'  => $companyId,
                    'tour_id'     => $item['tour_id'],
                    'schedule_id' => $item['schedule_id'],
                    'description' => $item['description'],
                    'price'       => $item['price'] ?? 0,
                    'edit_status' => $item['edit_status'] ?? false,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ];
            })
            ->values()
            ->all();

        DB::transaction(function () use ($companyId, $data) {

            $incomingIds = collect($data['add_ons'])
                ->pluck('id')
                ->filter()
                ->values();

            $tourIds = collect($data['add_ons'])
                ->pluck('tour_id')
                ->unique();

            $query = TourAddOn::where('company_id', $companyId)
                ->whereIn('tour_id', $tourIds);

            if ($incomingIds->isNotEmpty()) {
                $query->whereNotIn('id', $incomingIds);
            }

            $query->delete();

            foreach ($data['add_ons'] as $item) {
                TourAddOn::updateOrCreate(
                    ['id' => $item['id'] ?? null],
                    [
                        'company_id'  => $companyId,
                        'tour_id'     => $item['tour_id'],
                        'schedule_id' => $item['schedule_id'],
                        'description' => $item['description'],
                        'price'       => $item['price'] ?? 0,
                        'edit_status' => $item['edit_status'] ?? false,
                    ]
                );
            }
        });

        return back()->with('success', 'Add Ons saved');
    }
}