<?php

namespace App\Support;

use App\Enums\CompanyType;
use App\Models\Company;

class VendorTourCatalog
{
    /**
     * @return array{
     *     is_own_catalog: bool,
     *     is_agent_viewing_vendor: bool,
     *     needs_agent_metadata: bool,
     * }
     */
    public static function context(Company $company, string $vendorUsername): array
    {
        $isOwnCatalog = $company->username === $vendorUsername;

        return [
            'is_own_catalog' => $isOwnCatalog,
            'is_agent_viewing_vendor' => $company->type === CompanyType::AGENT && ! $isOwnCatalog,
            'needs_agent_metadata' => $company->type === CompanyType::AGENT,
        ];
    }

    /**
     * @param  array{
     *     is_own_catalog: bool,
     *     is_agent_viewing_vendor: bool,
     *     needs_agent_metadata: bool,
     * }  $context
     * @param  callable(): array<string, mixed>  $scheduleRelations
     * @return list<string|array<string, mixed>>
     */
    public static function catalogRelations(array $context, callable $scheduleRelations): array
    {
        $relations = [
            'company:id,username,name',
            'company.companySetting:company_id,booking_deadline',
            'category:id,name,company_id,position_no',
            'image',
            'document',
        ];

        return array_merge($relations, $scheduleRelations());
    }

    /**
     * @param  array{
     *     is_own_catalog: bool,
     *     is_agent_viewing_vendor: bool,
     *     needs_agent_metadata: bool,
     * }  $context
     */
    public static function shouldLazyLoadTourDetails(array $context): bool
    {
        return $context['is_agent_viewing_vendor'];
    }

    /**
     * @param  array{
     *     is_own_catalog: bool,
     *     is_agent_viewing_vendor: bool,
     *     needs_agent_metadata: bool,
     * }  $context
     */
    public static function shouldAttachCommissionData(array $context): bool
    {
        return false;
    }
}
