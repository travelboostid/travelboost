<?php

use App\Services\PrismaLinkService;
use Illuminate\Support\Carbon;

test('prismalink default validity uses minutes override when configured', function () {
    config()->set('prismalink.default_validity_minutes', 5);
    config()->set('prismalink.default_validity_hours', 24);

    $from = Carbon::parse('2026-07-01 10:00:00');
    $expiresAt = app(PrismaLinkService::class)->defaultValidityExpiresAt($from);

    expect($expiresAt->equalTo($from->copy()->addMinutes(5)))->toBeTrue();
});

test('prismalink default validity falls back to hours when minutes not configured', function () {
    config()->set('prismalink.default_validity_minutes', null);
    config()->set('prismalink.default_validity_hours', 3);

    $from = Carbon::parse('2026-07-01 10:00:00');
    $expiresAt = app(PrismaLinkService::class)->defaultValidityExpiresAt($from);

    expect($expiresAt->equalTo($from->copy()->addHours(3)))->toBeTrue();
});
