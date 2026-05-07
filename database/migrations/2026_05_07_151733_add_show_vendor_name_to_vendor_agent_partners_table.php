<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::table('vendor_agent_partners', function (Blueprint $table) {
      $table->boolean('show_vendor_name')->default(false)->after('note');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('vendor_agent_partners', function (Blueprint $table) {
      $table->dropColumn('show_vendor_name');
    });
  }
};
