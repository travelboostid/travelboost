<?php

namespace Database\Seeders\Production;

use App\Enums\UserStatus;
use App\Models\AffiliateProfile;
use App\Models\Domain;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ProductionAffiliateSeeder extends Seeder
{
    public function run(): void
    {
        $tbPartner = $this->affiliateAccount(
            username: 'tb-partner',
            name: 'tb-partner',
            email: 'tb-partner@travelboost.co.id',
            tier: 'partner',
        );

        $tbMasterAffiliate = $this->affiliateAccount(
            username: 'tb-ma',
            name: 'tb-ma',
            email: 'tb-ma@travelboost.co.id',
            tier: 'master_affiliate',
            upline: $tbPartner,
        );

        $this->affiliateAccount(
            username: 'tb-affiliate',
            name: 'tb-affiliate',
            email: 'tb-affiliate@travelboost.co.id',
            tier: 'affiliate',
            upline: $tbMasterAffiliate,
        );

        $partnerSatu = $this->affiliateAccount(
            username: 'partner-satu',
            name: 'Partner Satu',
            email: 'partner-satu@travelboost.co.id',
            tier: 'partner',
        );

        $this->affiliateAccount(
            username: 'astindo',
            name: 'Astindo',
            email: 'astindo@travelboost.co.id',
            tier: 'master_affiliate',
            upline: $partnerSatu,
        );

        $partnerDua = $this->affiliateAccount(
            username: 'partner-dua',
            name: 'Partner Dua',
            email: 'partner-dua@travelboost.co.id',
            tier: 'partner',
        );

        $maSatu = $this->affiliateAccount(
            username: 'ma-satu',
            name: 'Master Affiliate Satu',
            email: 'ma-satu@travelboost.co.id',
            tier: 'master_affiliate',
            upline: $partnerDua,
        );

        $this->affiliateAccount(
            username: 'affiliate-satu',
            name: 'Affiliate Satu',
            email: 'affiliate-satu@travelboost.co.id',
            tier: 'affiliate',
            upline: $maSatu,
        );
    }

    private function affiliateAccount(
        string $username,
        string $name,
        string $email,
        string $tier,
        ?User $upline = null
    ): User {
        $user = User::query()->updateOrCreate(
            ['username' => $username],
            [
                'name' => $name,
                'email' => $email,
                'password' => Hash::make(env(strtoupper(str_replace('-', '_', $username)).'_PASSWORD', $username)),
                'email_verified_at' => now(),
                'status' => UserStatus::ACTIVE,
            ]
        );

        $user->syncRoles(['user:affiliate']);

        $profile = AffiliateProfile::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'upline_id' => $upline?->id,
                'tier' => $tier,
                'status' => 'approved',
                'referral_code' => $username,
                'approved_at' => now(),
            ]
        );

        Domain::query()->updateOrCreate(
            [
                'owner_id' => $profile->id,
                'owner_type' => AffiliateProfile::class,
            ],
            [
                'subdomain' => $username,
                'domain_enabled' => true,
                'subdomain_enabled' => true,
            ]
        );

        return $user;
    }
}
