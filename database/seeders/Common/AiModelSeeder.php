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
        'code' => 'gpt-3.5-turbo',
        'input_token_rate' => 0.00000150,
        'output_token_rate' => 0.00000600,
      ],
      [
        'code' => 'gpt-4',
        'input_token_rate' => 0.00000300,
        'output_token_rate' => 0.00001200,
      ],
      [
        'code' => 'gpt-5',
        'input_token_rate' => 0.00000075,
        'output_token_rate' => 0.00000300,
      ],
    ];

    foreach ($models as $data) {
      AiModel::create($data);
    }
  }
}
