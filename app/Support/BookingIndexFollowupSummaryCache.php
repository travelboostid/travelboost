<?php

namespace App\Support;

use App\Models\Booking;
use App\Models\Company;
use Illuminate\Support\Facades\Cache;

class BookingIndexFollowupSummaryCache
{
    public static function versionKey(int $companyId): string
    {
        return "bookings.followup-summary.version.{$companyId}";
    }

    public static function versionForCompany(Company|int $company): int
    {
        $companyId = $company instanceof Company ? $company->id : $company;

        return (int) Cache::get(self::versionKey($companyId), 0);
    }

    public static function bumpForCompany(Company|int|null $company): void
    {
        if ($company === null) {
            return;
        }

        $companyId = $company instanceof Company ? $company->id : $company;

        if ($companyId <= 0) {
            return;
        }

        if (! Cache::has(self::versionKey($companyId))) {
            Cache::put(self::versionKey($companyId), 1, now()->addDay());

            return;
        }

        Cache::increment(self::versionKey($companyId));
    }

    public static function bumpForBooking(Booking $booking): void
    {
        self::bumpForCompany($booking->vendor_id);
        self::bumpForCompany($booking->agent_id);
    }
}
