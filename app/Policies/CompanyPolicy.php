<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\User;

class CompanyPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAbleTo('company.query');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Company $company): bool
    {
        if (! $user->isAbleTo('company.query')) {
            return false;
        }

        return $this->belongsToCompanyTeam($user, $company) || $user->hasRole('user:admin');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->isAbleTo('company.mutation');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Company $company): bool
    {
        if (! $user->isAbleTo('company.mutation')) {
            return false;
        }

        return $this->belongsToCompanyTeam($user, $company) || $user->hasRole('user:admin');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Company $company): bool
    {
        if (! $user->isAbleTo('company.mutation')) {
            return false;
        }

        return $this->belongsToCompanyTeam($user, $company) || $user->hasRole('user:admin');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Company $company): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Company $company): bool
    {
        return false;
    }

    private function belongsToCompanyTeam(User $user, Company $company): bool
    {
        return $company
            ->teams
            ->contains('user_id', $user->id);
    }
}
