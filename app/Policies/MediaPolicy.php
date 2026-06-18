<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\Media;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\Relation;

class MediaPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole('user:admin') || $user->isAbleTo('media.query');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Media $media): bool
    {
        if ($user->hasRole('user:admin')) {
            return true;
        }

        if ($this->ownsUserMedia($user, $media)) {
            return true;
        }

        if (! $user->isAbleTo('media.query')) {
            return false;
        }

        return $this->belongsToMediaCompanyTeam($user, $media);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('user:admin') || $user->isAbleTo('media.mutation');
    }

    /**
     * Determine whether the user can create media for a specific owner.
     */
    public function createForOwner(User $user, string $ownerType, int $ownerId): bool
    {
        return $this->canActOnOwner($user, $ownerType, $ownerId, 'mutation');
    }

    /**
     * Determine whether the user can list media for a specific owner.
     */
    public function viewOwnerMedia(User $user, string $ownerType, int $ownerId): bool
    {
        return $this->canActOnOwner($user, $ownerType, $ownerId, 'query');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Media $media): bool
    {
        if ($user->hasRole('user:admin')) {
            return true;
        }

        if ($this->ownsUserMedia($user, $media)) {
            return true;
        }

        if (! $user->isAbleTo('media.mutation')) {
            return false;
        }

        return $this->belongsToMediaCompanyTeam($user, $media);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Media $media): bool
    {
        return $this->update($user, $media);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Media $media): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Media $media): bool
    {
        return false;
    }

    private function canActOnOwner(User $user, string $ownerType, int $ownerId, string $action): bool
    {
        if ($user->hasRole('user:admin')) {
            return true;
        }

        if ($this->matchesUserOwner($ownerType, $ownerId, $user)) {
            return true;
        }

        $company = $this->resolveCompanyOwner($ownerType, $ownerId);

        if ($company === null) {
            return false;
        }

        if ($user->hasRole("company:{$company->id}:superadmin") ||
        $user->hasRole("company:{$company->id}:admin")) {
            return true;
        }

        $permission = $action === 'mutation' ? 'media.mutation' : 'media.query';

        if (! $user->isAbleTo($permission, "company:{$company->id}")) {
            return false;
        }

        return $company->teams()->where('user_id', $user->id)->exists();
    }

    private function ownsUserMedia(User $user, Media $media): bool
    {
        $owner = $media->relationLoaded('owner')
            ? $media->owner
            : $media->owner()->first();

        return $owner instanceof User && $owner->id === $user->id;
    }

    private function belongsToMediaCompanyTeam(User $user, Media $media): bool
    {
        $owner = $media->relationLoaded('owner')
            ? $media->owner
            : $media->owner()->first();

        if (! $owner instanceof Company) {
            return false;
        }

        if (! $user->isAbleTo('media.query', "company:{$owner->id}")) {
            return false;
        }

        return $owner->teams()->where('user_id', $user->id)->exists();
    }

    private function matchesUserOwner(string $ownerType, int $ownerId, User $user): bool
    {
        return $this->resolveOwnerClass($ownerType) === User::class && $ownerId === $user->id;
    }

    private function resolveCompanyOwner(string $ownerType, int $ownerId): ?Company
    {
        if ($this->resolveOwnerClass($ownerType) !== Company::class) {
            return null;
        }

        return Company::query()->find($ownerId);
    }

    private function resolveOwnerClass(string $ownerType): ?string
    {
        if (Relation::getMorphedModel($ownerType) !== null) {
            return Relation::getMorphedModel($ownerType);
        }

        return class_exists($ownerType) ? $ownerType : null;
    }
}
