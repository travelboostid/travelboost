<?php

namespace Database\Seeders\Common;

use App\Models\AiModel;
use Illuminate\Database\Seeder;

class AiModelSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    $models = [
      [
        'code' => 'gpt-5.4',
        'input_token_rate' => 45000,
        'output_token_rate' => 260000,
        'flat_rate' => 300,
      ],
      [
        'code' => 'gpt-5.4-mini',
        'input_token_rate' => 15000,
        'output_token_rate' => 80000,
        'flat_rate' => 60,
      ],
      [
        'code' => 'gpt-5.4-nano',
        'input_token_rate' => 5000,
        'output_token_rate' => 25000,
        'flat_rate' => 30,
      ],
      [
        'code' => 'gpt-4.1',
        'input_token_rate' => 40000,
        'output_token_rate' => 150000,
        'flat_rate' => 150,
      ],
      [
        'code' => 'gpt-4.1-mini',
        'input_token_rate' => 10000,
        'output_token_rate' => 30000,
        'flat_rate' => 45,
      ],
      [
        'code' => 'gpt-4.1-nano',
        'input_token_rate' => 4000,
        'output_token_rate' => 10000,
        'flat_rate' => 15,
      ],
      [
        'code' => 'gpt-4o',
        'input_token_rate' => 45000,
        'output_token_rate' => 200000,
        'flat_rate' => 90,
      ],
      [
        'code' => 'gpt-4o-mini',
        'input_token_rate' => 4000,
        'output_token_rate' => 14000,
        'flat_rate' => 30,
      ],
      [
        'code' => 'gpt-3.5-turbo',
        'input_token_rate' => 12000,
        'output_token_rate' => 25000,
        'flat_rate' => 15,
      ]
    ];

    foreach ($models as $data) {
      AiModel::create($data);
    }
  }
}
