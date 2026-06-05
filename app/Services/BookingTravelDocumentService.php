<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Facades\Storage;

class BookingTravelDocumentService
{
    public function bookingNeedsTravelDocuments(Booking $booking): bool
    {
        return $this->missingPassengerCount($booking) > 0;
    }

    public function missingPassengerCount(Booking $booking): int
    {
        $booking->loadMissing('passengers');

        if ($booking->passengers->isEmpty()) {
            return 0;
        }

        return $booking->passengers
            ->filter(fn (mixed $passenger): bool => $this->passengerNeedsTravelDocuments($passenger))
            ->count();
    }

    public function passengerNeedsTravelDocuments(mixed $passenger): bool
    {
        $category = strtolower((string) $passenger->price_category);

        if (str_contains($category, 'infant')) {
            return false;
        }

        return blank($passenger->passport_number)
            || blank($passenger->passport_issue_date)
            || blank($passenger->passport_expiry_date)
            || blank($passenger->passport_file_path)
            || blank($passenger->visa_number)
            || blank($passenger->visa_file_path);
    }

    /**
     * @return array<int, array{
     *     passenger_name: string,
     *     passport_file_url: string|null,
     *     visa_file_url: string|null,
     *     passport_file_name: string|null,
     *     visa_file_name: string|null
     * }>
     */
    public function documentDetails(Booking $booking): array
    {
        $booking->loadMissing('passengers');

        return $booking->passengers
            ->reject(function (mixed $passenger): bool {
                $category = strtolower((string) $passenger->price_category);

                return str_contains($category, 'infant');
            })
            ->map(fn (mixed $passenger): array => [
                'passenger_name' => $this->passengerName($passenger),
                'passport_file_url' => $this->fileUrl($passenger->passport_file_path),
                'visa_file_url' => $this->fileUrl($passenger->visa_file_path),
                'passport_file_name' => $this->fileNameFromPath($passenger->passport_file_path),
                'visa_file_name' => $this->fileNameFromPath($passenger->visa_file_path),
            ])
            ->values()
            ->all();
    }

    public function fileUrl(?string $path): ?string
    {
        return filled($path) ? Storage::disk('public')->url((string) $path) : null;
    }

    public function fileNameFromPath(?string $path): ?string
    {
        if (blank($path)) {
            return null;
        }

        return basename((string) $path);
    }

    private function passengerName(mixed $passenger): string
    {
        $name = trim(implode(' ', array_filter([
            $passenger->first_name ?? null,
            $passenger->last_name ?? null,
        ])));

        return $name !== '' ? $name : 'Passenger';
    }
}
