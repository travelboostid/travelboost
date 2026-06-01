<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agent_tours', function (Blueprint $table): void {
            $table->foreignId('agent_document_id')
                ->nullable()
                ->after('tour_id')
                ->constrained('medias')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('agent_tours', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('agent_document_id');
        });
    }
};
