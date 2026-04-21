<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\TourAddOn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TourAddOnController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'add_ons' => ['required', 'array'],
            'add_ons.*.tour_id' => ['required', 'integer', 'exists:tours,id'],
            'add_ons.*.schedule_id' => ['required', 'integer', 'exists:tour_schedules,id'],
            'add_ons.*.description' => ['required', 'string', 'max:255'],
            'add_ons.*.price' => ['nullable', 'numeric'],
            'add_ons.*.edit_status' => ['boolean'],
        ]);

        $companyId = auth()->user()->company_id;

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

        DB::transaction(function () use ($items) {
            TourAddOn::upsert(
                $items,
                ['schedule_id', 'description'],   // ⬅️ unique key
                ['price', 'edit_status', 'updated_at'] // ⬅️ fields to update
            );
        });

        return back()->with('success', 'Add Ons saved');
    }
}