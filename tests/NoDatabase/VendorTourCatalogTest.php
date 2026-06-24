<?php

use App\Enums\CompanyType;
use App\Models\Company;
use App\Support\VendorTourCatalog;

it('detects vendor own catalog context', function () {
    $vendor = new Company([
        'username' => 'grandchina',
        'type' => CompanyType::VENDOR,
    ]);

    expect(VendorTourCatalog::context($vendor, 'grandchina'))
        ->toMatchArray([
            'is_own_catalog' => true,
            'is_agent_viewing_vendor' => false,
            'needs_agent_metadata' => false,
        ]);
});

it('detects agent viewing vendor catalog context', function () {
    $agent = new Company([
        'username' => 'agent-a',
        'type' => CompanyType::AGENT,
    ]);

    expect(VendorTourCatalog::context($agent, 'grandchina'))
        ->toMatchArray([
            'is_own_catalog' => false,
            'is_agent_viewing_vendor' => true,
            'needs_agent_metadata' => true,
        ]);
});

it('does not eager load commission category on vendor catalog index', function () {
    $vendor = new Company([
        'username' => 'grandchina',
        'type' => CompanyType::VENDOR,
    ]);

    $context = VendorTourCatalog::context($vendor, 'grandchina');
    $relations = VendorTourCatalog::catalogRelations($context, fn (): array => []);

    expect($relations)->not->toContain('productCommissionCategory:id,category_name');
});

it('lazy loads tour details for agent vendor catalog', function () {
    $agent = new Company([
        'username' => 'agent-a',
        'type' => CompanyType::AGENT,
    ]);

    $context = VendorTourCatalog::context($agent, 'grandchina');

    expect(VendorTourCatalog::shouldLazyLoadTourDetails($context))->toBeTrue();
});

it('does not lazy load tour details for vendor own catalog', function () {
    $vendor = new Company([
        'username' => 'grandchina',
        'type' => CompanyType::VENDOR,
    ]);

    $context = VendorTourCatalog::context($vendor, 'grandchina');

    expect(VendorTourCatalog::shouldLazyLoadTourDetails($context))->toBeFalse();
});

it('does not attach commission data on vendor catalog index', function () {
    $agent = new Company([
        'username' => 'agent-a',
        'type' => CompanyType::AGENT,
    ]);

    $context = VendorTourCatalog::context($agent, 'grandchina');

    expect(VendorTourCatalog::shouldAttachCommissionData($context))->toBeFalse();
});

it('exposes tuned webp quality settings for tour image variants', function () {
    expect(config('media.image_variants.image'))
        ->toBeArray()
        ->and(collect(config('media.image_variants.image'))->firstWhere('code', 'large')['quality'])
        ->toBeLessThan(85);
});
