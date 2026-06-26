<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tour_waiting_lists', function (Blueprint $table): void {
            $table->foreignId('agent_company_id')
                ->nullable()
                ->after('customer_user_id')
                ->constrained('companies')
                ->nullOnDelete();
            $table->foreignId('booking_id')
                ->nullable()
                ->after('agent_company_id')
                ->constrained('bookings')
                ->nullOnDelete();
            $table->timestamp('fulfilled_at')->nullable()->after('status');
            $table->timestamp('cancelled_at')->nullable()->after('fulfilled_at');
            $table->text('status_note')->nullable()->after('cancelled_at');

            $table->index('agent_company_id');
        });

        Schema::table('tour_waiting_list_schedules', function (Blueprint $table): void {
            $table->string('status', 30)->default('queued')->after('tour_schedule_id');
            $table->unsignedInteger('manual_queue_position')->nullable()->after('status');
            $table->timestamp('offered_at')->nullable()->after('manual_queue_position');
            $table->timestamp('offer_expires_at')->nullable()->after('offered_at');
            $table->unsignedSmallInteger('offered_seats')->nullable()->after('offer_expires_at');
            $table->foreignId('booking_id')
                ->nullable()
                ->after('offered_seats')
                ->constrained('bookings')
                ->nullOnDelete();

            $table->index(['tour_schedule_id', 'status', 'manual_queue_position'], 'twl_schedules_queue_idx');
        });
    }

    public function down(): void
    {
        Schema::table('tour_waiting_list_schedules', function (Blueprint $table): void {
            $table->dropIndex('twl_schedules_queue_idx');
            $table->dropConstrainedForeignId('booking_id');
            $table->dropColumn([
                'status',
                'manual_queue_position',
                'offered_at',
                'offer_expires_at',
                'offered_seats',
            ]);
        });

        Schema::table('tour_waiting_lists', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('booking_id');
            $table->dropConstrainedForeignId('agent_company_id');
            $table->dropColumn(['fulfilled_at', 'cancelled_at', 'status_note']);
        });
    }
};
