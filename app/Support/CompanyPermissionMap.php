<?php

namespace App\Support;

use App\Enums\CompanyType;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\User;

class CompanyPermissionMap
{
    /**
     * @return array<string, list<string>>
     */
    public static function grants(): array
    {
        /** @var array<string, list<string>> $grants */
        $grants = config('travelboost.company_permission_grants', []);

        return $grants;
    }

    /**
     * @return list<string>
     */
    public static function userFacingPermissions(): array
    {
        /** @var list<string> $permissions */
        $permissions = config('travelboost.company_usable_permissions', []);

        return $permissions;
    }

    /**
     * @return list<string>
     */
    public static function userFacingPermissionsForCompany(Company $company): array
    {
        if ($company->type === CompanyType::VENDOR) {
            return [
                'agents.query',
                'agents.mutation',
                'customers.query',
                'customers.mutation',
                'tour-management.query',
                'tour-management.mutation',
                'booking.query',
                'booking.mutation',
                'funds.query',
                'funds.mutation',
                'reports.query',
                'reports.mutation',
                'booking-list.query',
                'booking-list.mutation',
                'room-listings.query',
                'room-listings.mutation',
                'seat-availability.query',
                'seat-availability.mutation',
                'settings.query',
                'settings.mutation',
                'parameter.query',
                'parameter.mutation',
                'chat-ai.query',
                'chat-ai.mutation',
                'commission.query',
                'commission.mutation',
            ];
        }

        return [
            'customers.query',
            'customers.mutation',
            'tour-management.query',
            'tour-management.mutation',
            'booking.query',
            'booking.mutation',
            'funds.query',
            'funds.mutation',
            'reports.query',
            'reports.mutation',
            'booking-list.query',
            'booking-list.mutation',
            'seat-availability.query',
            'seat-availability.mutation',
            'settings.query',
            'settings.mutation',
            'parameter.query',
            'parameter.mutation',
            'vendor-config.query',
            'vendor-config.mutation',
            'marketings.query',
            'marketings.mutation',
            'subscription-ai.query',
            'subscription-ai.mutation',
        ];
    }

    /**
     * @param  list<string>  $permissions
     * @return list<string>
     */
    public static function expand(array $permissions): array
    {
        $expanded = [];

        foreach ($permissions as $permission) {
            self::expandInto($permission, $expanded);
        }

        return array_values(array_unique($expanded));
    }

    /**
     * @return list<string>
     */
    public static function candidates(string $permission): array
    {
        return self::expand([$permission]);
    }

    public static function userHasScopedPermission(
        User $user,
        Company|int $company,
        string $permission,
    ): bool {
        $companyId = $company instanceof Company ? $company->id : $company;
        $scope = "company:{$companyId}";

        if ($user->roles()->where('name', "company:{$companyId}:superadmin")->exists()) {
            return true;
        }

        $isActiveOwner = CompanyTeam::query()
            ->where('company_id', $companyId)
            ->where('user_id', $user->id)
            ->where('is_owner', true)
            ->whereNotNull('accepted_at')
            ->exists();

        if ($isActiveOwner) {
            return true;
        }

        $candidates = in_array($permission, self::userFacingPermissions(), true)
            ? [$permission]
            : self::candidates($permission);

        foreach ($candidates as $candidate) {
            if ($user->isAbleTo($candidate, $scope)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  list<string>  $selectedPermissions
     * @return list<string>
     */
    public static function visibleSelection(array $selectedPermissions, ?Company $company = null): array
    {
        $availablePermissions = $company
            ? self::userFacingPermissionsForCompany($company)
            : self::userFacingPermissions();

        $visiblePermissions = array_flip($availablePermissions);

        return array_values(array_filter(
            array_unique($selectedPermissions),
            fn (string $permission): bool => isset($visiblePermissions[$permission]),
        ));
    }

    /**
     * @param  array<int, string>  $expanded
     */
    private static function expandInto(string $permission, array &$expanded): void
    {
        if (in_array($permission, $expanded, true)) {
            return;
        }

        $expanded[] = $permission;

        foreach (self::grants()[$permission] ?? [] as $grantedPermission) {
            self::expandInto($grantedPermission, $expanded);
        }
    }
}
