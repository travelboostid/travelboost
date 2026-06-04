<?php

namespace App\Services;

use Illuminate\Validation\ValidationException;

class BookingRoomArrangementValidator
{
    private const array ELIGIBLE_BASE_CATEGORIES = [
        'adult double',
        'double',
        'adult twin',
        'twin',
    ];

    private const array DEPENDENT_BED_CATEGORIES = [
        'adult extra bed',
        'child with bed',
    ];

    private const array ELIGIBLE_DEPENDENT_ROOM_TYPES = [
        'double_extra_bed',
        'twin_extra_bed',
    ];

    /**
     * @param  array<int, array<string, mixed>>  $passengers
     */
    public function validatePassengerMix(array $passengers): void
    {
        $baseCount = 0;
        $dependentBedCount = 0;

        foreach ($passengers as $passenger) {
            if ($this->isEligibleBasePassenger($passenger)) {
                $baseCount++;
            }

            if ($this->isDependentBedPassenger($passenger)) {
                $dependentBedCount++;
            }
        }

        if ($dependentBedCount === 0) {
            return;
        }

        if ($baseCount === 0 || $dependentBedCount > $baseCount) {
            $this->throwInvalidArrangement();
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $passengers
     * @param  array<int, array<string, mixed>>  $rooms
     */
    public function validateRooms(array $passengers, array $rooms): void
    {
        $this->validatePassengerMix($passengers);

        $dependentPassengerCount = collect($passengers)
            ->filter(fn (array $passenger): bool => $this->isDependentBedPassenger($passenger))
            ->count();

        if ($dependentPassengerCount === 0) {
            return;
        }

        if ($rooms === []) {
            $this->throwInvalidArrangement();
        }

        $passengersByGuestId = $this->passengersByGuestId($passengers);
        $assignedDependentGuestIds = [];

        foreach ($rooms as $room) {
            $roomType = $this->normalizeRoomType((string) data_get($room, 'room_type'));
            $bedLayout = data_get($room, 'bed_layout', []);

            if (! is_array($bedLayout)) {
                continue;
            }

            $roomPassengers = collect($bedLayout)
                ->map(fn (mixed $bed): ?array => $this->passengerForBed($bed, $passengersByGuestId))
                ->filter()
                ->values();

            $dependentBedPassengers = $roomPassengers
                ->filter(fn (array $passenger): bool => $this->isDependentBedPassenger($passenger))
                ->values();

            if ($dependentBedPassengers->isEmpty()) {
                continue;
            }

            if (! in_array($roomType, self::ELIGIBLE_DEPENDENT_ROOM_TYPES, true)) {
                $this->throwInvalidArrangement();
            }

            $hasEligibleBase = $roomPassengers
                ->contains(fn (array $passenger): bool => $this->isEligibleBasePassenger($passenger));

            if (! $hasEligibleBase || $dependentBedPassengers->count() > 1) {
                $this->throwInvalidArrangement();
            }

            foreach ($dependentBedPassengers as $passenger) {
                $assignedDependentGuestIds[] = $this->passengerIdentity($passenger);
            }
        }

        if (count(array_unique(array_filter($assignedDependentGuestIds))) < $dependentPassengerCount) {
            $this->throwInvalidArrangement();
        }
    }

    /**
     * @param  array<string, mixed>  $passenger
     */
    private function isEligibleBasePassenger(array $passenger): bool
    {
        $priceCategory = $this->normalizeCategory((string) data_get($passenger, 'price_category'));

        if (in_array($priceCategory, self::ELIGIBLE_BASE_CATEGORIES, true)) {
            return true;
        }

        if ($priceCategory !== '') {
            return false;
        }

        $roomType = $this->normalizeCategory((string) data_get($passenger, 'room_type'));

        return str_contains($roomType, 'double') || str_contains($roomType, 'twin');
    }

    /**
     * @param  array<string, mixed>  $passenger
     */
    private function isDependentBedPassenger(array $passenger): bool
    {
        $priceCategory = $this->normalizeCategory((string) data_get($passenger, 'price_category'));

        if (in_array($priceCategory, self::DEPENDENT_BED_CATEGORIES, true)) {
            return true;
        }

        if ($priceCategory !== '') {
            return str_contains($priceCategory, 'extra bed');
        }

        $roomType = $this->normalizeCategory((string) data_get($passenger, 'room_type'));

        return str_contains($roomType, 'extra bed') || $roomType === 'child with bed';
    }

    private function normalizeCategory(string $value): string
    {
        return str($value)->lower()->squish()->toString();
    }

    private function normalizeRoomType(string $value): string
    {
        return str($value)->lower()->replace('-', '_')->squish()->replace(' ', '_')->toString();
    }

    /**
     * @param  array<int, array<string, mixed>>  $passengers
     * @return array<string, array<string, mixed>>
     */
    private function passengersByGuestId(array $passengers): array
    {
        $passengersByGuestId = [];
        $typeCounters = [
            'adult' => 0,
            'child' => 0,
            'infant' => 0,
        ];

        foreach ($passengers as $passenger) {
            $type = $this->passengerType($passenger);
            $generatedGuestId = "{$type}-{$typeCounters[$type]}";
            $typeCounters[$type]++;

            foreach ([$generatedGuestId, data_get($passenger, 'client_guest_id'), data_get($passenger, 'id')] as $guestId) {
                if (filled($guestId)) {
                    $passengersByGuestId[(string) $guestId] = $passenger;
                }
            }
        }

        return $passengersByGuestId;
    }

    /**
     * @param  array<string, mixed>  $passenger
     */
    private function passengerType(array $passenger): string
    {
        $priceCategory = $this->normalizeCategory((string) data_get($passenger, 'price_category'));

        if (str_contains($priceCategory, 'infant')) {
            return 'infant';
        }

        if (str_contains($priceCategory, 'child')) {
            return 'child';
        }

        return 'adult';
    }

    /**
     * @param  array<string, array<string, mixed>>  $passengersByGuestId
     * @return array<string, mixed>|null
     */
    private function passengerForBed(mixed $bed, array $passengersByGuestId): ?array
    {
        if (! is_array($bed)) {
            return null;
        }

        $guestId = data_get($bed, 'guestId');

        if (! filled($guestId)) {
            return null;
        }

        return $passengersByGuestId[(string) $guestId] ?? null;
    }

    /**
     * @param  array<string, mixed>  $passenger
     */
    private function passengerIdentity(array $passenger): string
    {
        foreach ([data_get($passenger, 'client_guest_id'), data_get($passenger, 'id')] as $identity) {
            if (filled($identity)) {
                return (string) $identity;
            }
        }

        return implode('|', [
            data_get($passenger, 'first_name'),
            data_get($passenger, 'last_name'),
            data_get($passenger, 'price_category'),
        ]);
    }

    private function throwInvalidArrangement(): never
    {
        throw ValidationException::withMessages([
            'passengers' => 'Adult Extra Bed and Child With Bed guests must share an Adult Twin or Adult Double room, with only one extra-bed guest per room.',
        ]);
    }
}
