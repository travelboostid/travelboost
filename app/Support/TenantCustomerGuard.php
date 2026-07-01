<?php

namespace App\Support;

use App\Enums\CompanyType;
use App\Models\Booking;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class TenantCustomerGuard
{
    public static function assertCustomerOfCompany(User $user, Company $company): void
    {
        if ((int) $user->company_id !== (int) $company->id) {
            throw ValidationException::withMessages([
                'customer' => 'This account is not registered with this travel agent.',
            ]);
        }

        if (! $user->hasRole('user:customer')) {
            throw ValidationException::withMessages([
                'customer' => 'Only customer accounts can perform this action.',
            ]);
        }
    }

    public static function assertBookingAccessible(User $user, Booking $booking, Company $company): void
    {
        self::assertCustomerOfCompany($user, $company);

        if ((int) $booking->user_id !== (int) $user->id) {
            throw ValidationException::withMessages([
                'booking' => 'You are not allowed to access this booking.',
            ]);
        }

        if (! self::bookingBelongsToCompany($booking, $company)) {
            throw ValidationException::withMessages([
                'booking' => 'This booking does not belong to this travel agent.',
            ]);
        }
    }

    public static function bookingBelongsToCompany(Booking $booking, Company $company): bool
    {
        if ($company->type === CompanyType::AGENT) {
            return (int) $booking->agent_id === (int) $company->id;
        }

        return (int) $booking->vendor_id === (int) $company->id;
    }

    /**
     * @param  Builder<Booking>  $query
     * @return Builder<Booking>
     */
    public static function scopeBookingsForCompany(Builder $query, Company $company): Builder
    {
        if ($company->type === CompanyType::AGENT) {
            return $query->where('agent_id', $company->id);
        }

        return $query->where('vendor_id', $company->id);
    }
}
