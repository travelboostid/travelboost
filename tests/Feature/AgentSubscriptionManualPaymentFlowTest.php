<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\PaymentStatus;
use App\Enums\UserStatus;
use App\Models\AgentSubscription;
use App\Models\AgentSubscriptionPackage;
use App\Models\AgentSubscriptionPayment;
use App\Models\AppConfig;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Domain;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\AffiliateAgentSubscriptionNotification;
use App\Notifications\AgentSubscriptionActivatedNotification;
use App\Notifications\ManualTopupValidated;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->withoutVite();
    Notification::fake();

    $this->package = AgentSubscriptionPackage::factory()->create([
        'name' => 'Growth',
        'duration_months' => 3,
        'price' => 900000,
        'is_active' => true,
    ]);

    AppConfig::query()->updateOrCreate(
        ['key' => 'admin'],
        ['value' => [
            'free_ai_after_subscription' => 2500,
            'affiliate_commission' => 10,
            'ma_commission' => 5,
            'partner_commission' => 2,
        ]],
    );
});

test('agent manual subscription submission stays pending until admin approval', function () {
    Storage::fake('public');

    $owner = User::factory()->create([
        'status' => UserStatus::ACTIVE,
    ]);

    $company = Company::factory()->create([
        'type' => CompanyType::AGENT,
        'username' => 'manual-subscription-agent',
    ]);

    CompanyTeam::query()->create([
        'company_id' => $company->id,
        'user_id' => $owner->id,
        'invite_email' => $owner->email,
        'invite_role' => "company:{$company->id}:superadmin",
        'invited_at' => now(),
        'accepted_at' => now(),
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
    ]);

    $owner->addRoles([
        'user:agent',
        "company:{$company->id}:superadmin",
    ]);

    $this->actingAs($owner)
        ->post("/companies/{$company->username}/dashboard/agent-subscriptions/manual-payment", [
            'package_id' => $this->package->id,
            'transfer_amount' => 900000,
            'payment_date' => now()->toDateString(),
            'sender_bank_name' => 'BCA',
            'sender_account_number' => '1234567890',
            'proof' => UploadedFile::fake()->image('proof.png'),
        ])
        ->assertRedirect();

    $payment = Payment::query()
        ->whereMorphedTo('owner', $company)
        ->where('provider', 'manual')
        ->latest()
        ->first();

    expect($payment)->not->toBeNull()
        ->and($payment?->status)->toBe(PaymentStatus::PENDING)
        ->and(data_get($payment?->payload, 'description'))->toBe('Manual Subscription Extension')
        ->and(AgentSubscription::query()->where('company_id', $company->id)->doesntExist())->toBeTrue();
});

test('admin approval uses the unified agent subscription activation pipeline', function () {
    $admin = User::factory()->create();
    $admin->addRole('user:admin');

    $affiliate = User::factory()->create([
        'status' => UserStatus::ACTIVE,
    ]);
    $masterAffiliate = User::factory()->create([
        'status' => UserStatus::ACTIVE,
    ]);
    $partner = User::factory()->create([
        'status' => UserStatus::ACTIVE,
    ]);

    $affiliate->affiliateProfile()->create([
        'tier' => 'affiliate',
        'status' => 'approved',
        'upline_id' => $masterAffiliate->id,
    ]);
    $masterAffiliate->affiliateProfile()->create([
        'tier' => 'master_affiliate',
        'status' => 'approved',
        'upline_id' => $partner->id,
    ]);
    $partner->affiliateProfile()->create([
        'tier' => 'partner',
        'status' => 'approved',
    ]);

    $company = Company::factory()->create([
        'type' => CompanyType::AGENT,
    ]);
    $company->forceFill([
        'referred_by' => $affiliate->id,
    ])->save();

    Domain::query()->create([
        'owner_type' => $company->getMorphClass(),
        'owner_id' => $company->id,
        'domain_enabled' => false,
        'subdomain_enabled' => false,
    ]);

    $existingSubscription = AgentSubscription::factory()->active()->create([
        'company_id' => $company->id,
        'package_id' => $this->package->id,
        'started_at' => now()->subMonth(),
        'ended_at' => now()->addDays(12),
    ]);
    $previousEndedAt = $existingSubscription->ended_at->copy();

    $subscriptionPayment = AgentSubscriptionPayment::query()->create([
        'package_id' => $this->package->id,
    ]);

    $payment = $subscriptionPayment->payment()->create([
        'owner_type' => $company->getMorphClass(),
        'owner_id' => $company->id,
        'provider' => 'manual',
        'amount' => $this->package->price,
        'status' => PaymentStatus::PENDING,
        'payload' => [
            'description' => 'Manual Subscription Extension',
        ],
    ]);

    $initialAiBalance = (float) $company->aiCredit()->firstOrFail()->balance;
    $initialAffiliateBalance = (float) $affiliate->wallet->balance;
    $initialMasterAffiliateBalance = (float) $masterAffiliate->wallet->balance;
    $initialPartnerBalance = (float) $partner->wallet->balance;

    $this->actingAs($admin)
        ->post("/admin/funds/wallet-transactions/{$payment->id}/approve")
        ->assertRedirect();

    $payment->refresh();
    $subscription = $company->agentSubscription()->firstOrFail();
    $domain = $company->domain()->firstOrFail();
    $company->load('aiCredit');
    $affiliate->refresh();
    $masterAffiliate->refresh();
    $partner->refresh();

    expect($payment->status)->toBe(PaymentStatus::PAID)
        ->and($payment->paid_at)->not->toBeNull()
        ->and($subscription->package_id)->toBe($this->package->id)
        ->and($subscription->started_at?->toDateTimeString())->toBe($existingSubscription->started_at?->toDateTimeString())
        ->and($subscription->ended_at?->toDateTimeString())->toBe($previousEndedAt->copy()->addMonths($this->package->duration_months)->toDateTimeString())
        ->and($domain->domain_enabled)->toBeTrue()
        ->and($domain->subdomain_enabled)->toBeTrue()
        ->and((float) $company->aiCredit->balance)->toBe($initialAiBalance + 2500.0)
        ->and((float) $affiliate->wallet->balance)->toBeGreaterThan($initialAffiliateBalance)
        ->and((float) $masterAffiliate->wallet->balance)->toBeGreaterThan($initialMasterAffiliateBalance)
        ->and((float) $partner->wallet->balance)->toBeGreaterThan($initialPartnerBalance);

    $this->assertDatabaseCount('affiliate_commission_histories', 3);

    Notification::assertSentTo($company, ManualTopupValidated::class);
    Notification::assertSentTo($company, AgentSubscriptionActivatedNotification::class);
    Notification::assertSentTo($affiliate, AffiliateAgentSubscriptionNotification::class);
    Notification::assertSentTo($masterAffiliate, AffiliateAgentSubscriptionNotification::class);
    Notification::assertSentTo($partner, AffiliateAgentSubscriptionNotification::class);
});
