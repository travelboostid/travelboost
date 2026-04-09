<?php

namespace App\Http\Controllers\Admin;

use App\Events\TourUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateTourRequest;
use App\Models\Tour;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TourProductController extends Controller
{
    /**
     * Display a listing of all tour products across all vendors.
     */
    public function index(Request $request)
    {
        $data = Tour::query()
            ->with(['category', 'company', 'image'])
            ->when($request->input('name'), function ($query, $name) {
                $query->where('name', 'like', "%$name%");
            })
            ->when($request->input('status'), function ($query, $status) {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate();

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
