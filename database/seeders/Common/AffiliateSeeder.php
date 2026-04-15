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
    $payloads = [
      [
        'user' => [
          'name' => 'Partner Satu',
          'username' => 'partner-satu',
          'email' => 'partner1@tb.com'
        ],
        'affiliate_profile' => [
          'upline_id' => null,
          'tier' => 'partner',
          'status' => 'approved',
          'referral_code' => 'partner-satu',
          'approved_at' => now()
        ],
        'domain' => [
          'subdomain' => 'partner-satu',
        ]
      ],
      [
        'user' => [
          'name' => 'Partner Dua',
          'username' => 'partner-dua',
          'email' => 'partner2@tb.com'
        ],
        'affiliate_profile' => [
          'upline_id' => null,
          'tier' => 'partner',
          'status' => 'approved',
          'referral_code' => 'partner-dua',
          'approved_at' => now()
        ],
        'domain' => [
          'subdomain' => 'partner-dua',
        ]
      ],
      [
        'user' => [
          'name' => 'Master Satu',
          'username' => 'ma-satu',
          'email' => 'ma1@tb.com'
        ],
        'affiliate_profile' => [
          'upline_id' => null,
          'tier' => 'master_affiliate',
          'status' => 'approved',
          'referral_code' => 'ma-satu',
          'approved_at' => now()
        ],
        'domain' => [
          'subdomain' => 'ma-satu',
        ]
      ],
      [
        'user' => [
          'name' => 'Master Dua',
          'username' => 'ma-dua',
          'email' => 'ma2@tb.com'
        ],
        'affiliate_profile' => [
          'upline_id' => null,
          'tier' => 'master_affiliate',
          'status' => 'approved',
          'referral_code' => 'ma-dua',
          'approved_at' => now()
        ],
        'domain' => [
          'subdomain' => 'ma-dua',
        ]
      ],
      [
        'user' => [
          'name' => 'Affiliate Approved',
          'username' => 'affiliate-satu',
          'email' => 'affiliate1@tb.com'
        ],
        'affiliate_profile' => [
          'upline_id' => null,
          'tier' => 'affiliate',
          'status' => 'approved',
          'referral_code' => 'affiliate-satu',
          'approved_at' => now()
        ],
        'domain' => [
          'subdomain' => 'affiliate-satu',
        ]
      ],
      [
        'user' => [
          'name' => 'Affiliate Pending',
          'username' => 'affiliate-dua',
          'email' => 'affiliate2@tb.com'
        ],
        'affiliate_profile' => [
          'upline_id' => null,
          'tier' => 'affiliate',
          'status' => 'pending',
          'referral_code' => 'affiliate-dua',
          'approved_at' => null
        ],
        'domain' => [
          'subdomain' => 'affiliate-dua',
        ]
      ]
    ];

    foreach ($payloads as $payload) {
      $user = User::create([
        'name' => $payload['user']['name'],
        'username' => $payload['user']['username'],
        'email' => $payload['user']['email'],
        'password' => Hash::make($payload['user']['username']),
        'email_verified_at' => now(),
        'status' => 'active'
      ]);

      $affiliate = AffiliateProfile::create([
        'user_id' => $user->id,
        'upline_id' => $payload['affiliate_profile']['upline_id'],
        'tier' => $payload['affiliate_profile']['tier'],
        'status' => $payload['affiliate_profile']['status'],
        'referral_code' => $payload['affiliate_profile']['referral_code'],
        'approved_at' => $payload['affiliate_profile']['approved_at']
      ]);
      Domain::create([
        'owner_id' => $affiliate->id,
        'owner_type' => AffiliateProfile::class,
        'subdomain' => $payload['domain']['subdomain'],
      ]);
    }
  }
}
