<?php

namespace App\Console\Commands;

use App\Models\TourAvailability;
use App\Notifications\ManualReservedAvailabilityExpiredNotification;
use App\Notifications\ManualReservedAvailabilityStartedNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExpireManualReservedAvailabilities extends Command
{
    protected $signature = 'tour-availabilities:expire-manual-reserved';

    protected $description = 'Process scheduled and expired manual reserved availability rows.';

    public function handle(): int
    {
        $now = now('UTC');

        TourAvailability::query()
            ->where('manual_reserved_pending_value', '>', 0)
            ->whereNotNull('manual_reserved_started_at')
            ->where('manual_reserved_started_at', '<=', $now)
            ->where('RS', '=', 0)
            ->orderBy('id')
            ->chunkById(100, function ($rows) use ($now): void {
                foreach ($rows as $availability) {
                    DB::transaction(function () use ($availability, $now): void {
                        $locked = TourAvailability::query()
                            ->whereKey($availability->id)
                            ->lockForUpdate()
                            ->first();

                        if (
                            ! $locked
                            || (int) $locked->manual_reserved_pending_value <= 0
                            || $locked->manual_reserved_started_at === null
                            || $locked->manual_reserved_started_at->gt($now)
                            || (int) $locked->RS > 0
                        ) {
                            return;
                        }

                        $reservedSeats = (int) $locked->manual_reserved_pending_value;
                        $originalAvailable = max(0, (int) $locked->available);

                        $locked->update([
                            'RS' => $reservedSeats,
                            'available' => max(0, $originalAvailable - $reservedSeats),
                            'manual_reserved_pending_value' => null,
                            'manual_reserved_original_available' => $originalAvailable,
                        ]);

                        $locked->loadMissing('tour.company');

                        if ($locked->tour?->company) {
                            $locked->tour->company->notify(
                                new ManualReservedAvailabilityStartedNotification(
                                    $locked->tour,
                                    $reservedSeats,
                                    $locked->schedule_id,
                                ),
                            );
                        }
                    });
                }
            });

        TourAvailability::query()
            ->whereNotNull('manual_reserved_expires_at')
            ->where('manual_reserved_expires_at', '<=', $now)
            ->where('RS', '>', 0)
            ->orderBy('id')
            ->chunkById(100, function ($rows) use ($now): void {
                foreach ($rows as $availability) {
                    DB::transaction(function () use ($availability, $now): void {
                        $locked = TourAvailability::query()
                            ->whereKey($availability->id)
                            ->lockForUpdate()
                            ->first();

                        if (! $locked || $locked->manual_reserved_expires_at === null || $locked->manual_reserved_expires_at->gt($now) || (int) $locked->RS <= 0) {
                            return;
                        }

                        $releasedReservedSeats = (int) $locked->RS;
                        $restoredAvailable = (int) ($locked->manual_reserved_original_available ?? ((int) $locked->available + $releasedReservedSeats));

                        $locked->update([
                            'available' => $restoredAvailable,
                            'RS' => 0,
                            'manual_reserved_pending_value' => null,
                            'manual_reserved_started_at' => null,
                            'manual_reserved_expires_at' => null,
                            'manual_reserved_original_available' => null,
                        ]);

                        $locked->loadMissing('tour.company');

                        if ($locked->tour?->company) {
                            $locked->tour->company->notify(
                                new ManualReservedAvailabilityExpiredNotification(
                                    $locked->tour,
                                    $releasedReservedSeats,
                                    $locked->schedule_id,
                                ),
                            );
                        }
                    });
                }
            });

        return self::SUCCESS;
    }
}
