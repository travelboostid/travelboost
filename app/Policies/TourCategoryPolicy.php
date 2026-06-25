<?php

namespace App\Policies;

use App\Models\TourCategory;
use App\Models\User;
use App\Support\CompanyPermissionMap;

class TourCategoryPolicy
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

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, TourCategory $tourCategory): bool
    {
        if ($user->hasRole('user:admin')) {
            return true;
        }

        if (! CompanyPermissionMap::userHasScopedPermission($user, $tourCategory->company_id, 'tour-management.query')) {
            return false;
        }

        return $this->belongsToCategoryCompanyTeam($user, $tourCategory);
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
    public function update(User $user, TourCategory $tourCategory): bool
    {
        if ($user->hasRole('user:admin')) {
            return true;
        }

        if (! CompanyPermissionMap::userHasScopedPermission($user, $tourCategory->company_id, 'tour-management.mutation')) {
            return false;
        }

        return $this->belongsToCategoryCompanyTeam($user, $tourCategory);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, TourCategory $tourCategory): bool
    {
        return $this->update($user, $tourCategory);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, TourCategory $tourCategory): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, TourCategory $tourCategory): bool
    {
        return false;
    }

    private function belongsToCategoryCompanyTeam(User $user, TourCategory $tourCategory): bool
    {
        return (bool) $tourCategory->company
            ?->teams()
            ->where('user_id', $user->id)
            ->exists();
    }
}
