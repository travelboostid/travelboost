<?php

namespace App\Services;

use App\Models\Tour;
use App\Models\TourPrice;
use App\Models\TourSchedule;
use Illuminate\Support\Str;

class TourScheduleDisplayPriceService
{
    private const CATEGORY_PRIORITY = [
        'adult double',
        'adult twin',
        'adult extra bed',
        'adult single',
    ];

    public function resolve(TourSchedule $schedule, Tour $tour): float
    {
        $schedule->loadMissing('prices.priceCategory');

        foreach (self::CATEGORY_PRIORITY as $categoryName) {
            $price = $schedule->prices->first(function (TourPrice $price) use ($categoryName): bool {
                return $this->normalizeCategoryName($price->priceCategory?->name) === $categoryName;
            });

            if ($price !== null && (float) $price->price > 0) {
                return $this->discountedPrice($price);
            }
        }

        return max(0, (float) $tour->showprice);
    }

    private function discountedPrice(TourPrice $price): float
    {
        $basePrice = (float) $price->price;
        $promotionRate = (float) $price->promotion_rate;
        $fixedPromotion = (float) $price->promotion;

        if ($promotionRate > 0) {
            return max(0, round($basePrice - (($basePrice * $promotionRate) / 100)));
        }

        if ($fixedPromotion > 0) {
            return max(0, round($basePrice - $fixedPromotion));
        }

        return $basePrice;
    }

    private function normalizeCategoryName(?string $name): string
    {
        return Str::of($name ?? '')
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', ' ')
            ->trim()
            ->toString();
    }
}
