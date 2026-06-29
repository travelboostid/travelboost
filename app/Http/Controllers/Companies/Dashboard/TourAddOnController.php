<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\TourAddOn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TourAddOnController extends Controller
{
    public function store(Request $request, Company $company)
    {
        $data = $request->validate([
            'add_ons' => ['present', 'array'],
            'add_ons.*.tour_id' => ['required', 'integer', 'exists:tours,id'],
            'add_ons.*.schedule_id' => ['required', 'integer', 'exists:tour_schedules,id'],
            'add_ons.*.description' => ['required', 'string', 'max:255'],
            'add_ons.*.price' => ['nullable', 'numeric'],
            'add_ons.*.edit_status' => ['boolean'],
            'add_ons.*.is_taxable' => ['boolean'],
            'schedule_ids' => ['nullable', 'array'],
            'schedule_ids.*' => ['integer', 'exists:tour_schedules,id'],
        ]);

        $companyId = $company->id;

        DB::transaction(function () use ($companyId, $data) {

            $incoming = collect($data['add_ons']);

            /*
            |--------------------------------------------------------------------------
            | DELETE MISSING ROWS
            |--------------------------------------------------------------------------
            */

            $scheduleIds = collect($data['schedule_ids'] ?? [])
                ->merge($incoming->pluck('schedule_id'))
                ->unique()
                ->values();

            foreach ($scheduleIds as $scheduleId) {
                $descriptions = $incoming
                    ->where('schedule_id', $scheduleId)
                    ->pluck('description')
                    ->filter()
                    ->values()
                    ->all();

                $query = TourAddOn::query()
                    ->where('company_id', $companyId)
                    ->where('schedule_id', $scheduleId);

                if ($descriptions === []) {
                    $query->delete();

                    continue;
                }

                $query->whereNotIn('description', $descriptions)->delete();
            }

            /*
            |--------------------------------------------------------------------------
            | UPSERT
            |--------------------------------------------------------------------------
            */

            foreach ($incoming as $item) {

                if (empty($item['description'])) {
                    continue;
                }

                TourAddOn::updateOrCreate(
                    [
                        'company_id' => $companyId,
                        'tour_id' => $item['tour_id'],
                        'schedule_id' => $item['schedule_id'],
                        'description' => $item['description'],
                    ],
                    [
                        'price' => $item['price'] ?? 0,
                        'edit_status' => $item['edit_status'] ?? false,
                        'is_taxable' => $item['is_taxable'] ?? false,
                    ]
                );
            }
        });

        return back()->with('success', 'Add Ons saved');
    }
}
