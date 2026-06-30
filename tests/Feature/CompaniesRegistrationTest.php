<?php

use App\Models\AffiliateProfile;
use App\Models\Domain;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('company registration page hides the default affiliate referral on the main host', function () {
    $defaultAffiliateOwner = User::factory()->create();
    $defaultAffiliateOwner->affiliateProfile()->create([
        'referral_code' => 'tb-affiliate',
        'status' => 'approved',
        'tier' => 'affiliate',
    ]);

    $this->get('/companies/register')
        ->assertInertia(fn (Assert $page) => $page
            ->component('companies/auth/register')
            ->where('affiliate', null));
});

test('company registration page shows the matched affiliate on affiliate subdomains', function () {
    $affiliateOwner = User::factory()->create([
        'name' => 'Affiliate Satu',
    ]);

    $affiliateProfile = $affiliateOwner->affiliateProfile()->create([
        'referral_code' => 'affiliate-satu',
        'status' => 'approved',
        'tier' => 'affiliate',
    ]);

    Domain::create([
        'owner_type' => AffiliateProfile::class,
        'owner_id' => $affiliateProfile->id,
        'subdomain' => 'affiliate-satu',
        'subdomain_enabled' => true,
    ]);

    $appHost = env('APP_HOST', 'localhost');

    $this->get("http://affiliate-satu.{$appHost}/companies/register")
        ->assertInertia(fn (Assert $page) => $page
            ->component('companies/auth/register')
            ->where('affiliate.name', 'Affiliate Satu')
            ->where('affiliate.username', 'affiliate-satu'));
});

test('company registration still redirects when verification email dispatch fails', function () {
    app('events')->listen(Registered::class, function (): void {
        throw new RuntimeException('SMTP down');
    });

    $response = $this->post('/companies/register', [
        'name' => 'Test Agent',
        'username' => 'test_agent',
        'email' => 'test-agent@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect('/me');
})->tap(function () {
    //
});
