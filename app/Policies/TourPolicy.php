<?php

namespace App\Policies;

use App\Models\Tour;
use App\Models\User;

class TourPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAbleTo('tour.query');
    }

    public function view(User $user, Tour $tour): bool
    {
        if (! $user->isAbleTo('tour.query')) {
            return false;
        }

        return $this->belongsToTourCompanyTeam($user, $tour) || $user->hasRole('user:admin');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->isAbleTo('tour.mutation');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Tour $tour): bool
    {
        if (! $user->isAbleTo('tour.mutation')) {
            return false;
        }

        return $this->belongsToTourCompanyTeam($user, $tour) || $user->hasRole('user:admin');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Tour $tour): bool
    {
        if (! $user->isAbleTo('tour.mutation')) {
            return false;
        }

        return $this->belongsToTourCompanyTeam($user, $tour) || $user->hasRole('user:admin');
    }

    private function belongsToTourCompanyTeam(User $user, Tour $tour): bool
    {
        return (bool) $tour->company
            ?->teams()
            ->where('user_id', $user->id)
            ->exists();
    }
}
