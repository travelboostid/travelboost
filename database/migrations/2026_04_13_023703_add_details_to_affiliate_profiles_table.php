<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::table('affiliate_profiles', function (Blueprint $table) {
      $table->string('phone')->nullable()->after('tier');
      $table->text('address')->nullable()->after('phone');
      $table->string('province')->nullable()->after('address');
      $table->string('city')->nullable()->after('province');
      $table->string('district')->nullable()->after('city');
      $table->string('village')->nullable()->after('district');
      $table->string('postal_code')->nullable()->after('village');
      $table->string('identity_number')->nullable()->after('postal_code'); // KTP/SIM/Paspor
      $table->string('identity_photo_path')->nullable()->after('identity_number'); // Foto KTP
      // Photo profile utama, menggunakan kolom `photo_id` bawaan dari tabel `users`
    });
  }

  public function down(): void
  {
    Schema::table('affiliate_profiles', function (Blueprint $table) {
      $table->dropColumn([
        'phone',
        'address',
        'province',
        'city',
        'district',
        'village',
        'postal_code',
        'identity_number',
        'identity_photo_path',
      ]);
    });
  }
};
