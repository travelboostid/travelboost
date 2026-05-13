<?php

namespace Database\Seeders;

use App\Events\MediaCreated;
use App\Models\Media;
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
    $medias = Media::where('subtype', 'tour-document')->get();

    foreach ($medias as $media) {
      MediaCreated::dispatch($media);
    }
  }
}
