<?php

namespace App\Support;

use App\Models\TourWaitingList;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class ResolveWaitingListBookingOwner
{
    public function execute(TourWaitingList $waitingList): User
    {
        if ($waitingList->customer_user_id !== null) {
            $customer = User::query()->find($waitingList->customer_user_id);

            if ($customer) {
                return $customer;
            }
        }

        $email = mb_strtolower(trim((string) $waitingList->contact_email));

        if ($email !== '') {
            $customer = User::query()->where('email', $email)->first();

            if ($customer) {
                return $customer;
            }
        }

        if ($waitingList->created_by_user_id !== null) {
            $creator = User::query()->find($waitingList->created_by_user_id);

            if ($creator) {
                return $creator;
            }
        }

        throw ValidationException::withMessages([
            'schedule' => 'A customer account could not be resolved for this waiting-list request.',
        ]);
    }

    public function resolveCustomerUserId(?string $email): ?int
    {
        $normalizedEmail = mb_strtolower(trim((string) $email));

        if ($normalizedEmail === '') {
            return null;
        }

        return User::query()
            ->where('email', $normalizedEmail)
            ->value('id');
    }

    public function isCustomerAccount(User $owner, TourWaitingList $waitingList): bool
    {
        if ($waitingList->customer_user_id !== null) {
            return (int) $waitingList->customer_user_id === (int) $owner->id;
        }

        $email = mb_strtolower(trim((string) $waitingList->contact_email));

        return $email !== '' && mb_strtolower(trim((string) $owner->email)) === $email;
    }
}
