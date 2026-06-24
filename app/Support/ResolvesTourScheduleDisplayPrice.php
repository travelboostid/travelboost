<?php

namespace App\Support;

trait ResolvesTourScheduleDisplayPrice
{
    protected function scheduleDisplayPrice($prices, mixed $masterPrice): float
    {
        $priority = [
            'adult double',
            'adult twin',
            'adult extra bed',
            'adult single',
        ];

        foreach ($priority as $categoryName) {
            $matchingPrice = $prices->first(function ($price) use ($categoryName): bool {
                $name = strtolower(trim((string) ($price->priceCategory?->name ?? '')));
                $normalized = preg_replace('/[^a-z0-9]+/', ' ', $name) ?? '';
                $normalized = trim($normalized);

                return $normalized === $categoryName;
            });

            if ($matchingPrice !== null) {
                $discounted = $this->lowestDiscountedSchedulePrice(collect([$matchingPrice]));

                if ($discounted > 0) {
                    return $discounted;
                }
            }
        }

        $fallback = $this->lowestDiscountedSchedulePrice($prices);

        if ($fallback > 0) {
            return $fallback;
        }

        return (float) ($masterPrice ?? 0);
    }

    protected function lowestDiscountedSchedulePrice($prices): float
    {
        return (float) ($prices
            ->map(function ($price): float {
                $basePrice = (float) $price->price;
                $promotionRate = (float) ($price->promotion_rate ?? 0);
                $promotion = (float) ($price->promotion ?? 0);

                if ($promotionRate > 0) {
                    return max(0.0, (float) round($basePrice - (($basePrice * $promotionRate) / 100)));
                }

                if ($promotion > 0) {
                    return max(0.0, (float) round($basePrice - $promotion));
                }

                return $basePrice;
            })
            ->filter(fn (float $price): bool => $price > 0)
            ->min() ?? 0);
    }

    /**
     * @return array<string, \Closure>
     */
    protected function catalogScheduleRelations(): array
    {
        $minCutoffDate = now()->toDateString();

        return [
            'schedules' => function ($query) use ($minCutoffDate) {
                $query->where('departure_date', '>=', $minCutoffDate)
                    ->where('is_active', true)
                    ->with(['availability', 'prices.priceCategory']);
            },
        ];
    }

    protected function prepareCatalogSchedules($tour, int $bookingDeadlineDays, bool $retainSchedulePrices = false): void
    {
        $cutoffDate = now()->addDays($bookingDeadlineDays)->toDateString();

        $schedules = $tour->schedules
            ?->filter(fn ($schedule) => $schedule->departure_date >= $cutoffDate)
            ->values()
            ->each(function ($schedule) use ($bookingDeadlineDays, $tour, $retainSchedulePrices): void {
                $schedule->setAttribute(
                    'price',
                    $this->scheduleDisplayPrice($schedule->prices, $tour->showprice ?? null),
                );
                $schedule->setAttribute('booking_deadline_days', $bookingDeadlineDays);

                if (! $retainSchedulePrices) {
                    $schedule->unsetRelation('prices');
                }
            });

        $tour->setRelation('schedules', $schedules);
    }
}
