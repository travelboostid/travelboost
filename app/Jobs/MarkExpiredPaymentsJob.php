<?php

namespace App\Jobs;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class MarkExpiredPaymentsJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Payment::query()
            ->whereIn('status', [PaymentStatus::UNPAID, PaymentStatus::PENDING])
            ->whereNotNull('expired_at')
            ->where('expired_at', '<=', now())
            ->update(['status' => PaymentStatus::EXPIRED]);
    }
}
