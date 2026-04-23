<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('invoice_number')->nullable();
            $table->string('payment_mode')->default('vendor');
            $table->bigInteger('ppn')->unsigned()->default(0);
            $table->string('contact_name')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->text('contact_notes')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn([
                'invoice_number',
                'payment_mode',
                'ppn',
                'contact_name',
                'contact_email',
                'contact_phone',
                'contact_notes',
            ]);
        });
    }
};
