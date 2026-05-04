<?php

namespace App\Jobs;

use App\Actions\Booking\SyncAvailabilityAction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncTourAvailabilityJob implements ShouldBeUnique, ShouldQueueAfterCommit
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [2, 5, 10];

    public function __construct(
        public int $tourId,
        public string $departureDate,
        public int $companyId,
    ) {
        $this->onQueue('availability-sync');
    }

    /**
     * Burst updates within 30 seconds collapse into a single execution.
     * Safe because the action performs a full recompute, not a delta.
     */
    public function uniqueId(): string
    {
        return "{$this->companyId}_{$this->tourId}_{$this->departureDate}";
    }

    public function uniqueFor(): int
    {
        return 30;
    }

    public function handle(SyncAvailabilityAction $action): void
    {
        $action->execute($this->tourId, $this->departureDate, $this->companyId);
    }
}
