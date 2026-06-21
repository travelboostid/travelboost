<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Tour;
use App\Models\TourAddOn;
use App\Models\TourSchedule;

class BookingAddOnOptionsService
{
    /**
     * @return array<int, array{key: string, label: string, unitPrice: float, qty: int, hasQty: bool, isTaxable: bool}>
     */
    public function forSchedule(Tour $tour, TourSchedule $schedule, ?Booking $booking = null): array
    {
        $booking?->loadMissing('addons');

        $bookingAddOns = $booking
            ? $booking->addons->keyBy(fn ($addon): string => strtolower((string) $addon->name))
            : collect();

        $addOns = TourAddOn::query()
            ->where('schedule_id', $schedule->id)
            ->where('tour_id', $tour->id)
            ->get()
            ->map(function (TourAddOn $addon) use ($bookingAddOns, $booking): array {
                $savedAddon = $bookingAddOns->get(strtolower((string) $addon->description));
                $unitPrice = (float) $addon->price;

                return [
                    'key' => 'addon_'.$addon->id,
                    'label' => $addon->description,
                    'unitPrice' => $unitPrice,
                    'qty' => $savedAddon
                        ? (int) max(1, round((float) $savedAddon->price / max($unitPrice, 1)))
                        : ($booking !== null ? 0 : ($addon->edit_status ? 0 : 1)),
                    'hasQty' => (bool) $addon->edit_status,
                    'isTaxable' => (bool) ($savedAddon?->is_taxable ?? $addon->is_taxable),
                ];
            })
            ->values()
            ->toArray();

        $knownAddOnLabels = collect($addOns)
            ->pluck('label')
            ->map(fn ($label): string => strtolower((string) $label))
            ->all();

        foreach ($booking?->addons ?? [] as $bookingAddon) {
            if (in_array(strtolower((string) $bookingAddon->name), $knownAddOnLabels, true)) {
                continue;
            }

            $addOns[] = [
                'key' => 'booking_addon_'.$bookingAddon->id,
                'label' => $bookingAddon->name,
                'unitPrice' => (float) $bookingAddon->price,
                'qty' => 1,
                'hasQty' => true,
                'isTaxable' => (bool) $bookingAddon->is_taxable,
            ];
        }

        return $addOns;
    }
}
