<?php

namespace App\Http\Controllers\Me;

use App\Actions\Booking\ExpireBookingReservationsAction;
use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\Tour;
use App\Models\TourAvailability;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
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

        app(ExpireBookingReservationsAction::class)->execute();

        $currentStatuses = [
            BookingStatus::AWAITING_PAYMENT->value,
            BookingStatus::WAITING_PAYMENT_APPROVAL->value,
            BookingStatus::DOWN_PAYMENT->value,
            BookingStatus::FULL_PAYMENT->value,
            BookingStatus::RESERVED->value,
            BookingStatus::BOOKING_RESERVED->value,
            BookingStatus::EXPIRED->value,
            BookingStatus::WAITING_LIST->value,
        ];

        $bookings = $activeTab !== 'favorites'
          ? $user->bookings()
              ->with(['tour.image', 'vendor'])
              ->when($activeTab === 'current', function ($query) use ($currentStatuses): void {
                  $query
                      ->whereIn('status', $currentStatuses)
                      ->where(function ($query): void {
                          $query
                              ->whereNotIn('status', [
                                  BookingStatus::AWAITING_PAYMENT->value,
                                  BookingStatus::FULL_PAYMENT->value,
                                  BookingStatus::EXPIRED->value,
                              ])
                              ->orWhereNull('departure_date')
                              ->orWhereDate('departure_date', '>=', now()->toDateString());
                      });
              })
              ->when($activeTab === 'history', function ($query): void {
                  $query->where(function ($query): void {
                      $query
                          ->where(function ($query): void {
                              $query
                                  ->where('status', BookingStatus::FULL_PAYMENT->value)
                                  ->whereDate('departure_date', '<', now()->toDateString());
                          })
                          ->orWhereIn('status', [
                              BookingStatus::CANCELLED->value,
                              BookingStatus::REFUNDED->value,
                          ]);
                  });
              })
              ->latest()
              ->paginate(10)
              ->withQueryString()
          : null;

        $favorites = $activeTab === 'favorites'
          ? $user->likedTours()
              ->with(['company.companySetting', 'image'])
              ->latest('tour_likes.created_at')
              ->paginate(10)
              ->withQueryString()
          : null;

        if ($favorites) {
            $this->appendSchedulePayload($favorites->getCollection());
        }

        return Inertia::render('me/bookings', [
            'bookings' => $bookings,
            'favorites' => $favorites,
            'activeTab' => $activeTab,
        ]);
    }

    /**
     * @param  \Illuminate\Support\Collection<int, \App\Models\Tour>  $tours
     */
    private function appendSchedulePayload(Collection $tours): void
    {
        if ($tours->isEmpty()) {
            return;
        }

        $tourCompanyMap = $tours->mapWithKeys(fn (Tour $tour): array => [
            $tour->id => $tour->company_id,
        ]);

        $availabilities = TourAvailability::query()
            ->whereIn('tour_id', $tourCompanyMap->keys())
            ->with('schedule')
            ->get()
            ->filter(fn (TourAvailability $availability): bool => $availability->schedule !== null
                && (int) $availability->company_id === (int) $tourCompanyMap->get($availability->tour_id))
            ->groupBy('tour_id');

        $tours->each(function (Tour $tour) use ($availabilities): void {
            $deadlineDays = (int) ($tour->company?->companySetting?->booking_deadline ?? 0);
            $cutoffDate = now()->addDays($deadlineDays)->toDateString();

            $tour->setAttribute(
                'schedules',
                $availabilities
                    ->get($tour->id, collect())
                    ->filter(fn (TourAvailability $availability): bool => $availability->schedule->departure_date >= $cutoffDate)
                    ->map(fn (TourAvailability $availability): array => [
                        'id' => $availability->schedule->id,
                        'tour_id' => $availability->schedule->tour_id,
                        'departure_date' => $availability->schedule->departure_date,
                        'return_date' => $availability->schedule->return_date,
                        'quota' => (int) $availability->available,
                        'price' => (float) ($tour->showprice ?? 0),
                        'agent_price' => 0,
                        'cutoff_date' => $availability->schedule->cutoff_date,
                        'is_active' => (bool) $availability->schedule->is_active,
                        'note' => $availability->schedule->note,
                        'booking_deadline_days' => $deadlineDays,
                        'availability' => [
                            'available' => (int) $availability->available,
                            'max_pax' => (int) $availability->max_pax,
                        ],
                    ])
                    ->values()
            );
        });
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
