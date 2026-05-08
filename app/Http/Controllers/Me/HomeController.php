<?php

namespace App\Http\Controllers\Me;

use App\Http\Controllers\Controller;
use App\Models\Tour;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function show()
    {
        return Inertia::render('me/home');
    }

    public function bookings(Request $request): Response
    {
        $user = $request->user();
        $tab = $request->string('tab')->toString();
        $activeTab = in_array($tab, ['favorites', 'current', 'history'], true)
          ? $tab
          : 'current';

        if (! $user) {
            return Inertia::render('me/bookings', [
                'bookings' => null,
                'favorites' => null,
                'activeTab' => $activeTab,
            ]);
        }

        $activeStatuses = ['reserved', 'awaiting payment', 'down payment', 'full payment', 'waiting list'];
        $historyStatuses = ['cancelled', 'refunded', 'expired', 'completed'];

        $bookings = $activeTab !== 'favorites'
          ? $user->bookings()
              ->with(['tour', 'vendor'])
              ->when($activeTab === 'current', function ($query) use ($activeStatuses): void {
                  $query->whereIn('status', $activeStatuses);
              })
              ->when($activeTab === 'history', function ($query) use ($historyStatuses): void {
                  $query->whereIn('status', $historyStatuses);
              })
              ->latest()
              ->paginate(10)
              ->withQueryString()
          : null;

        $favorites = $activeTab === 'favorites'
          ? $user->likedTours()->with('company')->latest('tour_likes.created_at')->paginate(10)->withQueryString()
          : null;

        return Inertia::render('me/bookings', [
            'bookings' => $bookings,
            'favorites' => $favorites,
            'activeTab' => $activeTab,
        ]);
    }

    public function toggleTourLike(Request $request, Tour $tour): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 403);

        $existing = $user->tourLikes()->where('tour_id', $tour->id)->first();

        if ($existing) {
            $existing->delete();

            return response()->json(['liked' => false]);
        }

        $user->tourLikes()->create(['tour_id' => $tour->id]);

        return response()->json(['liked' => true]);
    }
}
