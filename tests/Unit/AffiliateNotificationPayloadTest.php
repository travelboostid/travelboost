<?php

use App\Models\AffiliateProfile;
use App\Models\User;
use App\Notifications\AffiliatePartnerReviewStatusNotification;
use App\Notifications\AffiliateReferralRegistrationNotification;
use App\Notifications\AffiliateRegistrationWelcomeNotification;
use App\Notifications\AffiliateReviewStatusNotification;
use Illuminate\Notifications\Messages\MailMessage;

it('builds the expected referral registration payloads', function () {
    $partnerUser = new User(['name' => 'Partner One', 'email' => 'partner@example.com']);
    $maUser = new User(['name' => 'Master One', 'email' => 'ma@example.com']);
    $affiliateUser = new User([
        'name' => 'Affiliate One',
        'email' => 'affiliate@example.com',
        'phone' => '08123456789',
    ]);

    $maProfile = new AffiliateProfile(['tier' => 'master_affiliate']);
    $maProfile->setRelation('user', $maUser);

    $partnerProfile = new AffiliateProfile(['tier' => 'partner']);
    $partnerProfile->setRelation('user', $partnerUser);

    $affiliateProfile = new AffiliateProfile(['phone' => '08123456789']);
    $affiliateProfile->setRelation('user', $affiliateUser);

    $maNotification = new AffiliateReferralRegistrationNotification($affiliateProfile, $maProfile, 'ma');
    $partnerNotification = new AffiliateReferralRegistrationNotification($affiliateProfile, $maProfile, 'partner');

    expect($maNotification->via($maUser))->toBe(['mail', 'database']);
    expect($partnerNotification->via($partnerUser))->toBe(['mail', 'database']);
    expect($maNotification->toArray($maUser)['title'])->toBe('New affiliate pending your review');
    expect($partnerNotification->toArray($partnerUser)['title'])->toBe('New affiliate joined your network');
});

it('builds the expected partner review status payload', function () {
    $partnerUser = new User(['name' => 'Partner One', 'email' => 'partner@example.com']);
    $maUser = new User(['name' => 'Master One', 'email' => 'ma@example.com']);
    $affiliateUser = new User(['name' => 'Affiliate One', 'email' => 'affiliate@example.com']);

    $maProfile = new AffiliateProfile(['tier' => 'master_affiliate']);
    $maProfile->setRelation('user', $maUser);

    $affiliateProfile = new AffiliateProfile(['phone' => '08123456789']);
    $affiliateProfile->setRelation('user', $affiliateUser);

    $notification = new AffiliatePartnerReviewStatusNotification($affiliateProfile, $maProfile, 'approved');
    $payload = $notification->toArray($partnerUser);

    expect($notification->via($partnerUser))->toBe(['mail', 'database']);
    expect($payload['title'])->toBe('Affiliate approved in your network');
    expect($payload['message'])->toContain('Master One');
});

it('builds mail messages for affiliate welcome and review status emails', function () {
    $maUser = new User(['name' => 'Master One', 'email' => 'ma@example.com']);
    $affiliateUser = new User([
        'name' => 'Affiliate One',
        'email' => 'affiliate@example.com',
        'phone' => '08123456789',
    ]);

    $maProfile = new AffiliateProfile(['tier' => 'master_affiliate']);
    $maProfile->setRelation('user', $maUser);

    $affiliateProfile = new AffiliateProfile(['phone' => '08123456789']);
    $affiliateProfile->setRelation('user', $affiliateUser);

    $welcomeNotification = new AffiliateRegistrationWelcomeNotification($affiliateUser, $maProfile);
    $reviewNotification = new AffiliateReviewStatusNotification($affiliateProfile, 'approved');

    expect($welcomeNotification->toMail($affiliateUser))->toBeInstanceOf(MailMessage::class);
    expect($reviewNotification->toMail($affiliateUser))->toBeInstanceOf(MailMessage::class);
});
