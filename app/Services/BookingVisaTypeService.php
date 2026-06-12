<?php

namespace App\Services;

use App\Models\Tour;
use Illuminate\Support\Collection;

class BookingVisaTypeService
{
    /**
     * @param  array<int, array<string, mixed>>  $passengers
     * @return array<string, string>
     */
    public function validationErrorsForPassengers(Tour $tour, array $passengers): array
    {
        $validItemIds = $this->validItemIdsForTour($tour);

        if ($validItemIds->isEmpty()) {
            return collect($passengers)
                ->filter(fn (array $passenger): bool => filled(data_get($passenger, 'visa_category_item_id')))
                ->mapWithKeys(fn (array $passenger, int $index): array => [
                    "passengers.{$index}.visa_category_item_id" => 'The selected visa type is not available for this tour.',
                ])
                ->all();
        }

        $errors = [];

        foreach ($passengers as $index => $passenger) {
            $field = "passengers.{$index}.visa_category_item_id";
            $selectedItemId = data_get($passenger, 'visa_category_item_id');

            if (blank($selectedItemId)) {
                $errors[$field] = 'Visa type is required for this tour.';

                continue;
            }

            if (! $validItemIds->contains((int) $selectedItemId)) {
                $errors[$field] = 'The selected visa type is not available for this tour.';
            }
        }

        return $errors;
    }

    /**
     * @return Collection<int, int>
     */
    private function validItemIdsForTour(Tour $tour): Collection
    {
        if (! $tour->visa_category_id) {
            return collect();
        }

        $tour->loadMissing('visaCategory.items');

        return $tour->visaCategory?->items
            ->pluck('id')
            ->map(fn ($id): int => (int) $id)
            ->values() ?? collect();
    }
}
