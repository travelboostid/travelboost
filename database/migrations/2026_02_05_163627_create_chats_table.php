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
    Schema::create('chat_rooms', function (Blueprint $table) {
      $table->id();
      $table->enum('type', ['private', 'group'])->default('private');
      $table->string('name')->nullable(); // For group chats
      $table->timestamps();
    });


    Schema::create('chat_room_members', function (Blueprint $table) {
      $table->id();
      $table->foreignId('room_id')
        ->constrained('chat_rooms')
        ->cascadeOnDelete();

      // Polymorphic member (User, Vendor, or Agent)
      $table->morphs('member'); // member_id + member_type

      $table->enum('role', ['member', 'admin', 'owner'])->default('member');
      $table->timestamp('joined_at')->useCurrent();
      $table->timestamp('last_read_at')->nullable();
      $table->timestamps();

      $table->unique(['room_id', 'member_id', 'member_type']); // Prevent duplicate memberships
    });

    Schema::create('chat_messages', function (Blueprint $table) {
      $table->id();
      $table->boolean('is_bot')->default(false);
      $table->text('message')->default('');
      $table->string('attachment')->nullable(); // File/image/video path
      $table->string('attachment_type')->nullable(); // 'image', 'video', 'file', etc.
      $table->timestamps();
      $table->foreignId('room_id')
        ->constrained('chat_rooms')
        ->cascadeOnDelete();
      $table->foreignId('user_id')
        ->constrained('users')
        ->cascadeOnDelete();
      $table->nullableMorphs('sender'); // sender_type + sender_id

      $table->foreignId('reply_to')
        ->nullable()
        ->constrained('chat_messages')
        ->nullOnDelete();
      $table->index(['room_id', 'created_at']); // For faster room message queries
    });

    Schema::table('chat_rooms', function (Blueprint $table) {
      $table->foreignId('last_message_id')
        ->nullable()
        ->constrained('chat_messages')
        ->nullOnDelete();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('chat_rooms', function (Blueprint $table) {
      $table->dropConstrainedForeignId('last_message_id');
    });
    Schema::dropIfExists('chat_messages');
    Schema::dropIfExists('chat_room_members');
    Schema::dropIfExists('chat_rooms');
  }
};
