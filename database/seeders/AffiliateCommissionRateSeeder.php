<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AffiliateCommissionRate;

class AffiliateCommissionRateSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    $rates = [
      ['tier' => 'partner', 'percentage' => 5.00],
      ['tier' => 'master_affiliate', 'percentage' => 10.00],
      ['tier' => 'affiliate', 'percentage' => 15.00],
    ];

    foreach ($rates as $rate) {
      AffiliateCommissionRate::updateOrCreate(
        ['tier' => $rate['tier']], 
        [
          'percentage' => $rate['percentage'],
          'is_active' => true
        ]
      );
    }
  }
}
