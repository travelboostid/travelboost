<?php

namespace Database\Seeders\Common;

use App\Models\AffiliateProfile;
use App\Models\Domain;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AffiliateSeeder extends Seeder
{
    public function run(): void
    {
        $nums = [1 => 'satu', 2 => 'dua', 3 => 'tiga', 4 => 'empat', 5 => 'lima', 6 => 'enam', 7 => 'tujuh', 8 => 'delapan', 9 => 'sembilan', 10 => 'sepuluh', 11 => 'sebelas', 12 => 'duabelas', 13 => 'tigabelas', 14 => 'empatbelas', 15 => 'limabelas'];

        $travelboostPartner = $this->createAffiliateAccount(
            username: 'tb-partner',
            name: 'tb-partner',
            email: 'tb-partner@travelboost.co.id',
            tier: 'partner',
        );

        $travelboostMasterAffiliate = $this->createAffiliateAccount(
            username: 'tb-ma',
            name: 'tb-ma',
            email: 'tb-ma@travelboost.co.id',
            tier: 'master_affiliate',
            uplineId: $travelboostPartner->id,
        );

        $this->createAffiliateAccount(
            username: 'tb-affiliate',
            name: 'tb-affiliate',
            email: 'tb-affiliate@travelboost.co.id',
            tier: 'affiliate',
            uplineId: $travelboostMasterAffiliate->id,
        );

        $partners = [];
        for ($i = 1; $i <= 2; $i++) {
            $username = 'partner-'.$nums[$i];
            $partners[$i] = $this->createAffiliateAccount(
                username: $username,
                name: 'Partner '.ucfirst($nums[$i]),
                email: $i === 1 ? 'veelian31@gmail.com' : "partner{$i}@tb.com",
                tier: 'partner',
            )->id;
        }

        $mas = [];
        for ($i = 1; $i <= 3; $i++) {
            $username = 'ma-'.$nums[$i];
            $upline = ($i === 1 || $i === 2) ? $partners[1] : $partners[2];

            $mas[$i] = $this->createAffiliateAccount(
                username: $username,
                name: 'Master Affiliate '.ucfirst($nums[$i]),
                email: $i === 1 ? 'irvxxdhanty@gmail.com' : "ma{$i}@tb.com",
                tier: 'master_affiliate',
                uplineId: $upline,
            )->id;
        }

        for ($i = 1; $i <= 15; $i++) {
            $username = 'affiliate-'.$nums[$i];
            $userStatus = ($i % 4 === 0) ? 'inactive' : 'active';
            $profileStatus = ($i % 3 === 0) ? 'pending' : 'approved';
            $subdomainEnabled = ($profileStatus === 'approved' && $userStatus !== 'inactive');
            $uplineId = $mas[($i % count($mas)) + 1];

            $user = User::query()->updateOrCreate(
                ['username' => $username],
                [
                    'name' => 'Affiliate '.ucfirst($nums[$i]),
                    'email' => "affiliate{$i}@tb.com",
                    'password' => Hash::make($username),
                    'email_verified_at' => ($userStatus === 'active') ? now() : null,
                    'status' => $userStatus,
                ],
            );
            $user->syncRoles(['user:affiliate']);

            $profile = AffiliateProfile::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'upline_id' => $uplineId,
                    'tier' => 'affiliate',
                    'status' => $profileStatus,
                    'referral_code' => $username,
                    'approved_at' => ($profileStatus === 'approved') ? now() : null,
                ],
            );

            Domain::query()->updateOrCreate(
                [
                    'owner_id' => $profile->id,
                    'owner_type' => AffiliateProfile::class,
                ],
                [
                    'subdomain' => $username,
                    'domain_enabled' => true,
                    'subdomain_enabled' => $subdomainEnabled,
                ],
            );
        }
    }

    private function createAffiliateAccount(
        string $username,
        string $name,
        string $email,
        string $tier,
        ?int $uplineId = null
    ): User {
        $user = User::query()->updateOrCreate(
            ['username' => $username],
            [
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($username),
                'email_verified_at' => now(),
                'status' => 'active',
            ],
        );
        $user->syncRoles(['user:affiliate']);

        $profile = AffiliateProfile::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'upline_id' => $uplineId,
                'tier' => $tier,
                'status' => 'approved',
                'referral_code' => $username,
                'approved_at' => now(),
            ],
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
            ],
        );

        return $user;
    }
}
