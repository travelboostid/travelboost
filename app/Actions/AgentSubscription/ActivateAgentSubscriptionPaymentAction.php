<?php

namespace App\Actions\AgentSubscription;

use App\Models\AffiliateProfile;
use App\Models\AgentSubscription;
use App\Models\AgentSubscriptionPackage;
use App\Models\AgentSubscriptionPayment;
use App\Models\AppConfig;
use App\Models\Company;
use App\Models\Domain;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\AffiliateAgentSubscriptionNotification;
use App\Notifications\AgentSubscriptionActivatedNotification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ActivateAgentSubscriptionPaymentAction
{
    public function execute(Payment $payment): ?AgentSubscription
    {
        return DB::transaction(function () use ($payment): ?AgentSubscription {
            $payment->loadMissing('owner', 'payable');

            $owner = $payment->owner;
            $payable = $payment->payable;

            if (! $owner instanceof Company || ! $payable instanceof AgentSubscriptionPayment) {
                return null;
            }

            $package = $payable->package()->first();

            if (! $package instanceof AgentSubscriptionPackage) {
                return null;
            }

            $subscription = $this->activateSubscription($owner, $package);
            $this->enableCompanyDomainAccess($owner);
            $this->grantAiCredits($owner);
            $this->distributeCommissions($owner, $subscription, $package, $payment);

            DB::afterCommit(function () use ($owner, $subscription, $package): void {
                $owner->notify(new AgentSubscriptionActivatedNotification($owner, $subscription, $package));
            });

            return $subscription;
        });
    }

    private function activateSubscription(Company $owner, AgentSubscriptionPackage $package): AgentSubscription
    {
        $existingSubscription = $owner->agentSubscription()->latest()->first();
        $now = Carbon::now();

        if (! $existingSubscription instanceof AgentSubscription) {
            return $owner->agentSubscription()->create([
                'package_id' => $package->id,
                'started_at' => $now,
                'ended_at' => $now->copy()->addMonths($package->duration_months),
            ]);
        }

        $isStillActive = $existingSubscription->ended_at !== null
            && $existingSubscription->ended_at->isFuture();

        $existingSubscription->update([
            'package_id' => $package->id,
            'started_at' => $isStillActive
                ? $existingSubscription->started_at
                : $now,
            'ended_at' => ($isStillActive
                ? $existingSubscription->ended_at->copy()
                : $now->copy())
                ->addMonths($package->duration_months),
        ]);

        return $existingSubscription->fresh();
    }

    private function enableCompanyDomainAccess(Company $owner): void
    {
        Domain::query()->updateOrCreate(
            [
                'owner_type' => $owner->getMorphClass(),
                'owner_id' => $owner->id,
            ],
            [
                'domain_enabled' => true,
                'subdomain_enabled' => true,
            ],
        );
    }

    private function grantAiCredits(Company $owner): void
    {
        $adminConfig = AppConfig::query()
            ->where('key', 'admin')
            ->value('value') ?? [];

        $freeAiAfterSubscription = (float) ($adminConfig['free_ai_after_subscription'] ?? 0);

        if ($freeAiAfterSubscription <= 0) {
            return;
        }

        $owner->aiCredit()->firstOrCreate(
            ['company_id' => $owner->id],
            ['balance' => 0],
        )->increment('balance', $freeAiAfterSubscription);
    }

    private function distributeCommissions(
        Company $owner,
        AgentSubscription $subscription,
        AgentSubscriptionPackage $package,
        Payment $payment,
    ): void {
        if (! $owner->referred_by) {
            return;
        }

        $affiliateUser = User::query()->find($owner->referred_by);

        if (! $affiliateUser instanceof User) {
            return;
        }

        $affiliateProfile = AffiliateProfile::query()->where('user_id', $affiliateUser->id)->first();

        if (! $affiliateProfile instanceof AffiliateProfile) {
            return;
        }

        $adminConfig = AppConfig::query()
            ->where('key', 'admin')
            ->value('value') ?? [];

        $commissionBasePrice = (float) $package->price - ((float) $package->price * 0.11);

        $this->payCommission(
            recipient: $affiliateUser,
            owner: $owner,
            subscription: $subscription,
            package: $package,
            payment: $payment,
            recipientTier: 'affiliate',
            commissionRate: (float) ($adminConfig['affiliate_commission'] ?? 0),
            commissionBasePrice: $commissionBasePrice,
            affiliateProfile: $affiliateProfile,
            masterAffiliateProfile: null,
        );

        if (! $affiliateProfile->upline_id) {
            return;
        }

        $masterAffiliateUser = User::query()->find($affiliateProfile->upline_id);
        $masterAffiliateProfile = $masterAffiliateUser instanceof User
            ? AffiliateProfile::query()->where('user_id', $masterAffiliateUser->id)->first()
            : null;

        if ($masterAffiliateUser instanceof User && $masterAffiliateProfile instanceof AffiliateProfile) {
            $this->payCommission(
                recipient: $masterAffiliateUser,
                owner: $owner,
                subscription: $subscription,
                package: $package,
                payment: $payment,
                recipientTier: 'master_affiliate',
                commissionRate: (float) ($adminConfig['ma_commission'] ?? 0),
                commissionBasePrice: $commissionBasePrice,
                affiliateProfile: $affiliateProfile,
                masterAffiliateProfile: $masterAffiliateProfile,
            );
        }

        if (! $masterAffiliateProfile instanceof AffiliateProfile || ! $masterAffiliateProfile->upline_id) {
            return;
        }

        $partnerUser = User::query()->find($masterAffiliateProfile->upline_id);
        $partnerProfile = $partnerUser instanceof User
            ? AffiliateProfile::query()->where('user_id', $partnerUser->id)->first()
            : null;

        if ($partnerUser instanceof User && $partnerProfile instanceof AffiliateProfile) {
            $this->payCommission(
                recipient: $partnerUser,
                owner: $owner,
                subscription: $subscription,
                package: $package,
                payment: $payment,
                recipientTier: 'partner',
                commissionRate: (float) ($adminConfig['partner_commission'] ?? 0),
                commissionBasePrice: $commissionBasePrice,
                affiliateProfile: $affiliateProfile,
                masterAffiliateProfile: $masterAffiliateProfile,
            );
        }
    }

    private function payCommission(
        User $recipient,
        Company $owner,
        AgentSubscription $subscription,
        AgentSubscriptionPackage $package,
        Payment $payment,
        string $recipientTier,
        float $commissionRate,
        float $commissionBasePrice,
        ?AffiliateProfile $affiliateProfile,
        ?AffiliateProfile $masterAffiliateProfile,
    ): void {
        if ($commissionRate <= 0) {
            return;
        }

        $commissionAmount = $commissionBasePrice * ($commissionRate / 100);

        if ($commissionAmount <= 0) {
            return;
        }

        $recipient->wallet->deposit($commissionAmount, [
            'type' => 'affiliate-commission',
            'description' => $this->commissionDescription($recipientTier, $owner),
            'payment_id' => $payment->id,
            'company_id' => $owner->id,
            'tier' => $recipientTier,
        ]);

        DB::table('affiliate_commission_histories')->insert([
            'company_id' => $owner->id,
            'payment_id' => $payment->id,
            'recipient_id' => $recipient->id,
            'tier' => $recipientTier,
            'base_amount' => $commissionBasePrice,
            'commission_rate' => $commissionRate,
            'commission_amount' => $commissionAmount,
            'status' => 'paid',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $recipientProfile = AffiliateProfile::query()->where('user_id', $recipient->id)->first();

        if (! $this->isActiveAffiliateProfile($recipientProfile)) {
            return;
        }

        DB::afterCommit(function () use (
            $recipient,
            $owner,
            $subscription,
            $package,
            $affiliateProfile,
            $masterAffiliateProfile,
            $recipientTier,
            $commissionAmount
        ): void {
            $recipient->notify(new AffiliateAgentSubscriptionNotification(
                $owner,
                $subscription,
                $package,
                $affiliateProfile,
                $masterAffiliateProfile,
                $recipientTier,
                $commissionAmount,
            ));
        });
    }

    private function commissionDescription(string $recipientTier, Company $owner): string
    {
        return match ($recipientTier) {
            'affiliate' => 'Income from affiliate commission for '.$owner->name.' subscription payment',
            'master_affiliate' => 'Income from master affiliate commission for '.$owner->name.' subscription payment',
            'partner' => 'Income from partner commission for '.$owner->name.' subscription payment',
            default => 'Income from agent subscription commission for '.$owner->name.' subscription payment',
        };
    }

    private function isActiveAffiliateProfile(?AffiliateProfile $profile): bool
    {
        if (! $profile?->user) {
            return false;
        }

        $profileStatus = $profile->status instanceof \BackedEnum ? $profile->status->value : $profile->status;
        $userStatus = $profile->user->status instanceof \BackedEnum ? $profile->user->status->value : $profile->user->status;

        return $profileStatus === 'approved' && $userStatus === 'active';
    }
}
