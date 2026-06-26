<?php

namespace App\Policies;

use App\Models\Tour;
use App\Models\User;
use App\Support\CompanyPermissionMap;

class TourPolicy
{
    /**
     * Determine whether the user has a scoped company permission on any company.
     */
    private function hasAnyScopedPermission(User $user, string $permission): bool
    {
        if ($user->roles()->where('name', 'like', 'company:%:superadmin')->exists()) {
            return true;
        }

        return $user->roles()
            ->where('name', 'like', 'company:%')
            ->whereHas('permissions', function ($query) use ($permission) {
                $query->whereIn('name', CompanyPermissionMap::candidates($permission));
            })
            ->exists();
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole('user:admin')
            || $this->hasAnyScopedPermission($user, 'tour-management.query');
    }

    public function view(User $user, Tour $tour): bool
    {
        if ($user->hasRole('user:admin')) {
            return true;
        }

        if (! CompanyPermissionMap::userHasScopedPermission($user, $tour->company_id, 'tour-management.query')) {
            return false;
        }

        return $this->belongsToTourCompanyTeam($user, $tour);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('user:admin')
            || $this->hasAnyScopedPermission($user, 'tour-management.mutation');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Tour $tour): bool
    {
        if ($user->hasRole('user:admin')) {
            return true;
        }

        if (! CompanyPermissionMap::userHasScopedPermission($user, $tour->company_id, 'tour-management.mutation')) {
            return false;
        }

        return $this->belongsToTourCompanyTeam($user, $tour);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Tour $tour): bool
    {
        if ($user->hasRole('user:admin')) {
            return true;
        }

        if (! CompanyPermissionMap::userHasScopedPermission($user, $tour->company_id, 'tour-management.mutation')) {
            return false;
        }

        return $this->belongsToTourCompanyTeam($user, $tour);
    }

    private function belongsToTourCompanyTeam(User $user, Tour $tour): bool
    {
        return (bool) $tour->company
            ?->teams()
            ->where('user_id', $user->id)
            ->exists();
    }
}
