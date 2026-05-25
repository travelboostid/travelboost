<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('affiliate_commission_histories', function (Blueprint $table) {
            $table->id();

            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');

            $table->foreignId('payment_id')->constrained('payments')->onDelete('cascade');

            $table->foreignId('recipient_id')->constrained('users')->onDelete('cascade');

            // Data Komisi
            $table->string('tier'); // 'affiliate', 'master_affiliate', 'partner'
            $table->decimal('base_amount', 18, 2); // Harga setelah dipotong PPN
            $table->decimal('commission_rate', 5, 2); // Persentase saat transaksi
            $table->decimal('commission_amount', 18, 2); // Uang yang cair
            $table->string('status')->default('paid'); // Misal: paid, pending

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('affiliate_commission_histories');
    }
};
