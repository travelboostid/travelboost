<?php

use App\Models\AffiliateProfile;
use App\Models\AgentSubscription;
use App\Models\AgentSubscriptionPackage;
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutVite();
});

test('master affiliate network list counts affiliate downlines and direct agent referrals only', function () {
    $masterAffiliate = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    AffiliateProfile::create([
        'user_id' => $masterAffiliate->id,
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
        'upline_id' => $masterAffiliate->id,
        'tier' => 'affiliate',
        'status' => 'approved',
        'approved_at' => now(),
        'address' => 'Bandung',
        'phone' => '08111111111',
    ]);

    foreach (range(1, 2) as $index) {
        $downlineAffiliate = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        AffiliateProfile::create([
            'user_id' => $downlineAffiliate->id,
            'upline_id' => $affiliate->id,
            'tier' => 'affiliate',
            'status' => 'approved',
            'approved_at' => now(),
            'address' => "Downline {$index}",
            'phone' => "0812222222{$index}",
        ]);

        Company::factory()->create([
            'type' => 'agent',
            'referred_by' => $downlineAffiliate->id,
        ]);
    }

    Company::factory()->count(2)->create([
        'type' => 'agent',
        'referred_by' => $affiliate->id,
    ]);

    AgentSubscriptionPackage::factory()->create([
        'name' => 'Free Trial',
        'price' => 0,
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
        ->actingAs($masterAffiliate)
        ->get(route('affiliate.panel.network.list'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('affiliate/dashboard/network/list')
        ->has('networks', 1)
        ->where('networks.0.id', $affiliate->id)
        ->where('networks.0.total_affiliators', 2)
        ->where('networks.0.total_agents', 3)
        ->where('networks.0.subscribed_agents', 1));
});

test('partner master affiliate list rolls up agents referred by downline affiliates', function () {
    $partner = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    AffiliateProfile::create([
        'user_id' => $partner->id,
        'tier' => 'partner',
        'status' => 'approved',
        'address' => 'Jakarta',
        'phone' => '081200000001',
    ]);

    $masterAffiliate = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    AffiliateProfile::create([
        'user_id' => $masterAffiliate->id,
        'upline_id' => $partner->id,
        'tier' => 'master_affiliate',
        'status' => 'approved',
        'address' => 'Surabaya',
        'phone' => '081200000002',
    ]);

    $firstAffiliate = User::factory()->create([
        'email_verified_at' => now(),
    ]);
    $secondAffiliate = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    AffiliateProfile::create([
        'user_id' => $firstAffiliate->id,
        'upline_id' => $masterAffiliate->id,
        'tier' => 'affiliate',
        'status' => 'approved',
        'approved_at' => now(),
        'address' => 'Affiliate One',
        'phone' => '081300000001',
    ]);

    AffiliateProfile::create([
        'user_id' => $secondAffiliate->id,
        'upline_id' => $masterAffiliate->id,
        'tier' => 'affiliate',
        'status' => 'approved',
        'approved_at' => now(),
        'address' => 'Affiliate Two',
        'phone' => '081300000002',
    ]);

    Company::factory()->create([
        'type' => 'agent',
        'referred_by' => $masterAffiliate->id,
    ]);

    Company::factory()->count(2)->create([
        'type' => 'agent',
        'referred_by' => $firstAffiliate->id,
    ]);

    AgentSubscriptionPackage::factory()->create([
        'name' => 'Free Trial',
        'price' => 0,
    ]);
    $paidPackage = AgentSubscriptionPackage::factory()->create();

    $subscribedAgent = Company::factory()->create([
        'type' => 'agent',
        'referred_by' => $secondAffiliate->id,
    ]);

    AgentSubscription::create([
        'company_id' => $subscribedAgent->id,
        'package_id' => $paidPackage->id,
        'started_at' => now(),
        'ended_at' => now()->addMonth(),
    ]);

    $response = $this
        ->actingAs($partner)
        ->get(route('affiliate.panel.network.list', ['tier' => 'ma']));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('affiliate/dashboard/network/list')
        ->has('networks', 1)
        ->where('networks.0.id', $masterAffiliate->id)
        ->where('networks.0.total_affiliators', 2)
        ->where('networks.0.total_agents', 4)
        ->where('networks.0.subscribed_agents', 1));
});

test('network list uses a fixed number of aggregate queries regardless of row count', function () {
    $masterAffiliate = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    AffiliateProfile::create([
        'user_id' => $masterAffiliate->id,
        'tier' => 'master_affiliate',
        'status' => 'approved',
        'address' => 'Jakarta',
        'phone' => '08123456789',
    ]);

    foreach (range(1, 5) as $index) {
        $affiliate = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        AffiliateProfile::create([
            'user_id' => $affiliate->id,
            'upline_id' => $masterAffiliate->id,
            'tier' => 'affiliate',
            'status' => 'approved',
            'approved_at' => now(),
            'address' => "Affiliate {$index}",
            'phone' => "08140000000{$index}",
        ]);

        Company::factory()->create([
            'type' => 'agent',
            'referred_by' => $affiliate->id,
        ]);
    }

    $queryCount = 0;
    DB::listen(function () use (&$queryCount): void {
        $queryCount++;
    });

    $response = $this
        ->actingAs($masterAffiliate)
        ->get(route('affiliate.panel.network.list'));

    $response->assertOk();

    expect($queryCount)->toBeLessThan(25);
});
