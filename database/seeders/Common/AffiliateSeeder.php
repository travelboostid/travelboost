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

    $partners = [];
    for ($i = 1; $i <= 2; $i++) {
      $username = 'partner-' . $nums[$i];
      $user = User::create([
        'name' => 'Partner ' . ucfirst($nums[$i]),
        'username' => $username,
        'email' => "partner{$i}@tb.com",
        'password' => Hash::make($username),
        'email_verified_at' => now(),
        'status' => 'active'
      ]);
      $user->addRole('user:affiliate');

      $profile = AffiliateProfile::create([
        'user_id' => $user->id,
        'upline_id' => null,
        'tier' => 'partner',
        'status' => 'approved',
        'referral_code' => $username,
        'approved_at' => now()
      ]);

      Domain::create([
        'owner_id' => $profile->id,
        'owner_type' => AffiliateProfile::class,
        'subdomain' => $username,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
      ]);

      $partners[$i] = $user->id;
    }

    $mas = [];
    for ($i = 1; $i <= 3; $i++) {
      $username = 'ma-' . $nums[$i];
      $upline = ($i === 1 || $i === 2) ? $partners[1] : $partners[2];

      $user = User::create([
        'name' => 'Master Affiliate ' . ucfirst($nums[$i]),
        'username' => $username,
        'email' => "ma{$i}@tb.com",
        'password' => Hash::make($username),
        'email_verified_at' => now(),
        'status' => 'active'
      ]);
      $user->addRole('user:affiliate');

      $profile = AffiliateProfile::create([
        'user_id' => $user->id,
        'upline_id' => $upline,
        'tier' => 'master_affiliate',
        'status' => 'approved',
        'referral_code' => $username,
        'approved_at' => now()
      ]);

      Domain::create([
        'owner_id' => $profile->id,
        'owner_type' => AffiliateProfile::class,
        'subdomain' => $username,
        'domain_enabled' => true,
        'subdomain_enabled' => true,
      ]);

      $mas[$i] = $user->id;
    }

    for ($i = 1; $i <= 15; $i++) {
      $username = 'affiliate-' . $nums[$i];
      $userStatus = ($i % 4 === 0) ? 'inactive' : 'active';
      $profileStatus = ($i % 3 === 0) ? 'pending' : 'approved';

      $subdomainEnabled = ($profileStatus === 'approved' && $userStatus !== 'inactive');

      $user = User::create([
        'name' => 'Affiliate ' . ucfirst($nums[$i]),
        'username' => $username,
        'email' => "affiliate{$i}@tb.com",
        'password' => Hash::make($username),
        'email_verified_at' => ($userStatus === 'active') ? now() : null,
        'status' => $userStatus
      ]);
      $user->addRole('user:affiliate');

      $profile = AffiliateProfile::create([
        'user_id' => $user->id,
        'upline_id' => $mas[array_rand($mas)],
        'tier' => 'affiliate',
        'status' => $profileStatus,
        'referral_code' => $username,
        'approved_at' => ($profileStatus === 'approved') ? now() : null
      ]);

      Domain::create([
        'owner_id' => $profile->id,
        'owner_type' => AffiliateProfile::class,
        'subdomain' => $username,
        'domain_enabled' => true,
        'subdomain_enabled' => $subdomainEnabled,
      ]);
    }
  }
}
