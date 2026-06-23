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
        Schema::create('tour_waiting_lists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tour_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('created_by_user_id')->constrained('users');
            $table->foreignId('created_by_company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->foreignId('customer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedSmallInteger('pax_adult')->default(0);
            $table->unsignedSmallInteger('pax_child')->default(0);
            $table->unsignedSmallInteger('pax_infant')->default(0);
            $table->boolean('accepts_partial_fulfillment');
            $table->string('contact_name');
            $table->string('contact_phone', 50);
            $table->string('contact_email');
            $table->text('contact_address')->nullable();
            $table->string('status', 30)->default('pending');
            $table->timestamps();

            $table->index(['customer_user_id', 'status']);
            $table->index(['vendor_id', 'status']);
            $table->index(['created_by_company_id', 'status']);
            $table->index(['tour_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tour_waiting_lists');
    }
};
