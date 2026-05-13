<?php

namespace Database\Seeders;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class FixSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    Schema::table('tour_availabilities', function (Blueprint $table) {
      $table->unsignedInteger('WA')->default(0);
    });
  }
}
