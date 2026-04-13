<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\AffiliateProfile;
use Illuminate\Support\Facades\Hash;

class DummyAffiliateSeeder extends Seeder
{
  public function run(): void
  {
    $password = Hash::make('pw123');

    // 1. Buat 2 Partner (Status User Active)
    $partner1 = User::create(['name' => 'Partner Satu', 'username' => 'partner-satu', 'email' => 'partner1@tb.com', 'password' => $password, 'email_verified_at' => now(), 'status' => 'active']);
    AffiliateProfile::create(['user_id' => $partner1->id, 'upline_id' => null, 'tier' => 'partner', 'status' => 'approved', 'referral_code' => 'partner-satu', 'approved_at' => now()]);

    $partner2 = User::create(['name' => 'Partner Dua', 'username' => 'partner-dua', 'email' => 'partner2@tb.com', 'password' => $password, 'email_verified_at' => now(), 'status' => 'active']);
    AffiliateProfile::create(['user_id' => $partner2->id, 'upline_id' => null, 'tier' => 'partner', 'status' => 'approved', 'referral_code' => 'partner-dua', 'approved_at' => now()]);

    // 2. Buat 2 MA (Bawahannya Partner 1, Status User Active)
    $ma1 = User::create(['name' => 'Master Satu', 'username' => 'ma-satu', 'email' => 'ma1@tb.com', 'password' => $password, 'email_verified_at' => now(), 'status' => 'active']);
    AffiliateProfile::create(['user_id' => $ma1->id, 'upline_id' => $partner1->id, 'tier' => 'master_affiliate', 'status' => 'approved', 'referral_code' => 'ma-satu', 'approved_at' => now()]);

    $ma2 = User::create(['name' => 'Master Dua', 'username' => 'ma-dua', 'email' => 'ma2@tb.com', 'password' => $password, 'email_verified_at' => now(), 'status' => 'active']);
    AffiliateProfile::create(['user_id' => $ma2->id, 'upline_id' => $partner1->id, 'tier' => 'master_affiliate', 'status' => 'approved', 'referral_code' => 'ma-dua', 'approved_at' => now()]);

    // 3. Buat 2 Affiliate (Bawahannya MA 1, Status User Active)
    // Affiliate 1: Sudah di-Approve (Untuk ngetes tampilan normal)
    $affiliate1 = User::create(['name' => 'Affiliate Approved', 'username' => 'affiliate-satu', 'email' => 'affiliate1@tb.com', 'password' => $password, 'email_verified_at' => now(), 'status' => 'active']);
    AffiliateProfile::create(['user_id' => $affiliate1->id, 'upline_id' => $ma1->id, 'tier' => 'affiliate', 'status' => 'approved', 'referral_code' => 'affiliate-satu', 'approved_at' => now()]);

    // Affiliate 2: Masih Pending (Untuk ngetes efek BLUR dashboard)
    $affiliate2 = User::create(['name' => 'Affiliate Pending', 'username' => 'affiliate-dua', 'email' => 'affiliate2@tb.com', 'password' => $password, 'email_verified_at' => now(), 'status' => 'active']);
    AffiliateProfile::create(['user_id' => $affiliate2->id, 'upline_id' => $ma1->id, 'tier' => 'affiliate', 'status' => 'pending', 'referral_code' => 'affiliate-dua', 'approved_at' => null]);
  }
}
