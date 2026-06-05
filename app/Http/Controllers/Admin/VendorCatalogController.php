<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TourStatus;
use App\Http\Controllers\Controller;
use App\Models\Tour;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VendorCatalogController extends Controller
{
    /**
     * Display a grid/catalog view of all published (active) tours across all vendors.
     */
    public function index(Request $request)
    {
        $data = Tour::query()
            ->where('status', TourStatus::ACTIVE)
            ->with(['category', 'company', 'image'])
            ->when($request->input('search'), function ($query, $search) {
                $query->where('name', 'like', "%$search%");
            })
            ->latest()
            ->paginate(20);

        return Inertia::render('admin/tours/vendor-catalogs/index', [
            'data' => $data,
        ]);
    }
}
