<?php

use App\Models\AffiliateProfile;
use App\Models\Media;
use App\Models\User;
use App\Notifications\AffiliatePartnerReviewStatusNotification;
use App\Notifications\AffiliateReferralRegistrationNotification;
use App\Notifications\AffiliateRegistrationWelcomeNotification;
use App\Notifications\AffiliateReviewStatusNotification;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
});

it('sends welcome and network notifications when an affiliate registers with a master affiliate referral code', function () {
    Notification::fake();
    Storage::fake('public');

    $partnerUser = User::factory()->create([
        'status' => 'active',
        'email_verified_at' => now(),
    ]);
    $partnerUser->addRole('user:affiliate');

    AffiliateProfile::create([
        'user_id' => $partnerUser->id,
        'tier' => 'partner',
        'status' => 'approved',
        'referral_code' => 'partner-satu',
        'phone' => '081100000001',
        'approved_at' => now(),
    ]);

    $maUser = User::factory()->create([
        'status' => 'active',
        'email_verified_at' => now(),
    ]);
    $maUser->addRole('user:affiliate');

    $maProfile = AffiliateProfile::create([
        'user_id' => $maUser->id,
        'upline_id' => $partnerUser->id,
        'tier' => 'master_affiliate',
        'status' => 'approved',
        'referral_code' => 'ma-satu',
        'phone' => '081100000002',
        'approved_at' => now(),
    ]);

    $media = new Media([
        'model_type' => 'App\Models\User',
        'model_id' => 1,
        'collection_name' => 'identity_card',
        'name' => 'ktp',
        'file_name' => 'ktp.jpg',
        'mime_type' => 'image/jpeg',
        'disk' => 'public',
        'size' => 1234,
        'manipulations' => [],
        'custom_properties' => [],
        'responsive_images' => [],
    ]);
    $media->save();

    $response = $this->post('/affiliate/register', [
        'name' => 'New Affiliate',
        'email' => 'affiliate@example.com',
        'phone' => '081234567890',
        'username' => 'affiliate-baru',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'referral_code' => $maProfile->referral_code,
        'identity_card_id' => $media->id,
        'ktp_number' => '1234567890123456',
    ]);

    $response->assertRedirect('/affiliate/dashboard');

    $affiliateUser = User::where('email', 'affiliate@example.com')->first();
    expect($affiliateUser)->not->toBeNull();
    expect($affiliateUser->phone)->toBe('081234567890');

    $affiliateProfile = AffiliateProfile::where('user_id', $affiliateUser->id)->first();
    expect($affiliateProfile)->not->toBeNull();
    expect($affiliateProfile->upline_id)->toBe($maUser->id);
    expect($affiliateProfile->phone)->toBe('081234567890');
    expect($affiliateProfile->status)->toBe('pending');

    Notification::assertSentTo(
        $affiliateUser,
        AffiliateRegistrationWelcomeNotification::class
    );

    Notification::assertSentTo(
        $maUser,
        AffiliateReferralRegistrationNotification::class,
        fn (AffiliateReferralRegistrationNotification $notification, array $channels) => $notification->recipientRole === 'ma'
            && in_array('mail', $channels, true)
            && in_array('database', $channels, true)
    );

    Notification::assertSentTo(
        $partnerUser,
        AffiliateReferralRegistrationNotification::class,
        fn (AffiliateReferralRegistrationNotification $notification, array $channels) => $notification->recipientRole === 'partner'
            && in_array('mail', $channels, true)
            && in_array('database', $channels, true)
    );
});

it('sends approval notifications to the affiliate and partner', function () {
    Notification::fake();

    $partnerUser = User::factory()->create([
        'status' => 'active',
        'email_verified_at' => now(),
    ]);
    $partnerUser->addRole('user:affiliate');

    AffiliateProfile::create([
        'user_id' => $partnerUser->id,
        'tier' => 'partner',
        'status' => 'approved',
        'referral_code' => 'partner-dua',
        'phone' => '081100000011',
        'approved_at' => now(),
    ]);

    $maUser = User::factory()->create([
        'status' => 'active',
        'email_verified_at' => now(),
    ]);
    $maUser->addRole('user:affiliate');

    AffiliateProfile::create([
        'user_id' => $maUser->id,
        'upline_id' => $partnerUser->id,
        'tier' => 'master_affiliate',
        'status' => 'approved',
        'referral_code' => 'ma-dua',
        'phone' => '081100000012',
        'approved_at' => now(),
    ]);

    $affiliateUser = User::factory()->create([
        'status' => 'active',
        'email_verified_at' => now(),
        'phone' => '081200000099',
    ]);
    $affiliateUser->addRole('user:affiliate');

    $affiliateProfile = AffiliateProfile::create([
        'user_id' => $affiliateUser->id,
        'upline_id' => $maUser->id,
        'tier' => 'affiliate',
        'status' => 'pending',
        'referral_code' => 'affiliate-dua',
        'phone' => '081200000099',
    ]);

    $response = $this
        ->actingAs($maUser)
        ->post("/affiliate/dashboard/network/approvals/{$affiliateProfile->id}/approve");

    $response->assertRedirect();

    $affiliateProfile->refresh();
    expect($affiliateProfile->status)->toBe('approved');
    expect($affiliateProfile->approved_at)->not->toBeNull();

    Notification::assertSentTo(
        $affiliateUser,
        AffiliateReviewStatusNotification::class,
        fn (AffiliateReviewStatusNotification $notification) => $notification->status === 'approved'
    );

    Notification::assertSentTo(
        $partnerUser,
        AffiliatePartnerReviewStatusNotification::class,
        fn (AffiliatePartnerReviewStatusNotification $notification, array $channels) => $notification->status === 'approved'
            && in_array('mail', $channels, true)
            && in_array('database', $channels, true)
    );
});

it('sends rejection notifications to the affiliate and partner', function () {
    Notification::fake();

    $partnerUser = User::factory()->create([
        'status' => 'active',
        'email_verified_at' => now(),
    ]);
    $partnerUser->addRole('user:affiliate');

    AffiliateProfile::create([
        'user_id' => $partnerUser->id,
        'tier' => 'partner',
        'status' => 'approved',
        'referral_code' => 'partner-tiga',
        'phone' => '081100000021',
        'approved_at' => now(),
    ]);

    $maUser = User::factory()->create([
        'status' => 'active',
        'email_verified_at' => now(),
    ]);
    $maUser->addRole('user:affiliate');

    AffiliateProfile::create([
        'user_id' => $maUser->id,
        'upline_id' => $partnerUser->id,
        'tier' => 'master_affiliate',
        'status' => 'approved',
        'referral_code' => 'ma-tiga',
        'phone' => '081100000022',
        'approved_at' => now(),
    ]);

    $affiliateUser = User::factory()->create([
        'status' => 'active',
        'email_verified_at' => now(),
        'phone' => '081200000199',
    ]);
    $affiliateUser->addRole('user:affiliate');

    $affiliateProfile = AffiliateProfile::create([
        'user_id' => $affiliateUser->id,
        'upline_id' => $maUser->id,
        'tier' => 'affiliate',
        'status' => 'pending',
        'referral_code' => 'affiliate-tiga',
        'phone' => '081200000199',
    ]);

    $response = $this
        ->actingAs($maUser)
        ->post("/affiliate/dashboard/network/approvals/{$affiliateProfile->id}/reject");

    $response->assertRedirect();

    $affiliateProfile->refresh();
    expect($affiliateProfile->status)->toBe('rejected');

    Notification::assertSentTo(
        $affiliateUser,
        AffiliateReviewStatusNotification::class,
        fn (AffiliateReviewStatusNotification $notification) => $notification->status === 'rejected'
    );

    Notification::assertSentTo(
        $partnerUser,
        AffiliatePartnerReviewStatusNotification::class,
        fn (AffiliatePartnerReviewStatusNotification $notification, array $channels) => $notification->status === 'rejected'
            && in_array('mail', $channels, true)
            && in_array('database', $channels, true)
    );
});
