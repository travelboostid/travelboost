<?php

namespace App\Services;

use App\Models\Booking;

class BookingNumberService
{
    /**
     * Ambiguous characters removed (0/O, 1/I/L) for readability.
     */
    private const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    private const MAX_RETRY = 5;

    private const RANDOM_LEN = 6;

    /**
     * Generate a unique booking number.
     *
     * Format: [AGENT_CODE]-[TOUR_CODE]-[YYYYMM]-[RANDOM6]
     * Example: JHN-CHG-202605-X7K2M9
     *
     * Generated at booking creation (before payment).
     * UNIQUE constraint in DB is the final safety net.
     */
    public function generate(string $agentCode, string $tourCode): string
    {
        $datePart = now()->format('Ym');
        $prefix = strtoupper("{$agentCode}-{$tourCode}-{$datePart}");

        for ($attempt = 0; $attempt < self::MAX_RETRY; $attempt++) {
            $candidate = $prefix.'-'.$this->randomString(self::RANDOM_LEN);

            if (! Booking::where('booking_number', $candidate)->exists()) {
                return $candidate;
            }
        }

        throw new \RuntimeException(
            'Failed to generate a unique booking number after '.self::MAX_RETRY.' attempts.'
        );
    }

    private function randomString(int $length): string
    {
        $chars = str_split(self::CHARSET);
        $result = '';
        for ($i = 0; $i < $length; $i++) {
            $result .= $chars[array_rand($chars)];
        }

        return $result;
    }
}
