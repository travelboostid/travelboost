<?php

use App\Support\BookingIndexFollowupSummaryCache;
use Illuminate\Support\Facades\Cache;

test('followup summary cache version increments for a company', function () {
    $companyId = 42;

    expect(BookingIndexFollowupSummaryCache::versionForCompany($companyId))->toBe(0);

    BookingIndexFollowupSummaryCache::bumpForCompany($companyId);

    expect(BookingIndexFollowupSummaryCache::versionForCompany($companyId))->toBe(1);

    BookingIndexFollowupSummaryCache::bumpForCompany($companyId);

    expect(BookingIndexFollowupSummaryCache::versionForCompany($companyId))->toBe(2);

    Cache::forget(BookingIndexFollowupSummaryCache::versionKey($companyId));
});
