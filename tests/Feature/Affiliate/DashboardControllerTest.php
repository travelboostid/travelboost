<?php

use App\Models\AffiliateProfile;
use App\Models\AgentSubscription;
use App\Models\AgentSubscriptionPackage;
use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

test('affiliate dashboard returns subscribed agent conversion data for network performance', function () {
    $owner = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    AffiliateProfile::create([
        'user_id' => $owner->id,
        'tier' => 'master_affiliate',
        'status' => 'approved',
        'address' => 'Jakarta',
        'phone' => '08123456789',
    ]);

    $affiliate = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    AffiliateProfile::create([
        'user_id' => $affiliate->id,
        'upline_id' => $owner->id,
        'tier' => 'affiliate',
        'status' => 'approved',
        'approved_at' => now(),
        'address' => 'Bandung',
        'phone' => '08111111111',
    ]);

    Company::factory()->count(3)->create([
        'type' => 'agent',
        'referred_by' => $affiliate->id,
    ]);

    $paidPackage = AgentSubscriptionPackage::factory()->create();

    $subscribedAgent = Company::factory()->create([
        'type' => 'agent',
        'referred_by' => $affiliate->id,
    ]);

    AgentSubscription::create([
        'company_id' => $subscribedAgent->id,
        'package_id' => $paidPackage->id,
        'started_at' => now(),
        'ended_at' => now()->addMonth(),
    ]);

    $response = $this
        ->actingAs($owner)
        ->get(route('affiliate.panel.dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('affiliate/dashboard/index')
        ->has('networkPerformance', 1)
        ->where('networkPerformance.0.name', $affiliate->name.' (Affiliate)')
        ->where('networkPerformance.0.total_agents', 4)
        ->where('networkPerformance.0.subscribed_agents', 1)
        ->where('networkPerformance.0.conversion', 25.0)
        ->where('networkPerformance.0.status', 'Approved'));
});
