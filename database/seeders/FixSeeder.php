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
        Schema::drop('withdrawals');
        Schema::create('withdrawals', function (Blueprint $table) {
            $table->id();
            $table->morphs('owner'); // creates owner_id + owner_type
            $table->foreignId('bank_account_id')->constrained('bank_accounts')->restrictOnDelete();
            $table->integer('wallet_id')->nullable();
            $table->decimal('amount', 18, 2);
            $table->enum('method', ['auto', 'manual-trigger', 'manual-transfer'])->default('manual-trigger');
            $table->enum('status', ['pending', 'processing', 'rejected', 'cancelled', 'paid'])->default('pending');
            $table->text('note')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->index(['bank_account_id']);
            $table->index(['wallet_id']);
        });
    }
}
