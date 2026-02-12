<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\TourResource;
use App\Models\Tour;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DashboardVendorController extends Controller
{
  /**
   * Display vendor tours for agent
   */
  public function tours(string $username)
  {
    $currentUser = Auth::user();

    $tours = Tour::whereRelation('user', 'username', $username)
      ->withExists([
        'copies as has_copied' => fn($q) =>
        $q->where('user_id', $currentUser->id),
      ])
      ->get();

    return Inertia::render('dashboard/vendors/tours', [
      'username' => $username,
      'data' => TourResource::collection($tours),
    ]);
  }

  /**
   * Copy vendor tour to current agent
   */
  public function copy(string $username, Tour $tour)
  {
    $userId = Auth::user()->id;
    // safety check (optional)
    if ($tour->user->username !== $username) {
      abort(404);
    }

    if ($tour->user_id === $userId) {
      abort(403);
    }

    $data = collect($tour->getAttributes())
      ->except([
        'id',
        'category_id',   // ❌ exclude kategori
        'user_id',
        'parent_id',
        'created_at',
        'updated_at',
      ])
      ->toArray();

    Tour::firstOrCreate(
      [
        'parent_id' => $tour->id,
        'user_id'   => $userId,
      ],
      $data
    );

    return redirect()->back()->with('success', 'Tour copied');
  }

  public function brochure(string $username, Tour $tour)
  {
    return Inertia::render('dashboard/vendors/view-brochure', [
      'username' => $username,
      'tour' => $tour,
    ]);
  }
}
