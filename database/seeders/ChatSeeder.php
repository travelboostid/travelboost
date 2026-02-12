<?php
// database/seeders/ChatSeeder.php
namespace Database\Seeders;

use App\Models\User;
use App\Models\ChatRoom;
use App\Models\ChatRoomMember;
use App\Models\ChatMessage;
use Illuminate\Database\Seeder;

class ChatSeeder extends Seeder
{
  public function run(): void
  {
    $users = User::all();

    if ($users->count() < 2) {
      $this->command->error('❌ Need at least 2 users in database.');
      return;
    }

    $this->command->info("👥 Found {$users->count()} users");

    // 1. Create ONE group chat for ALL users
    $this->command->info('👥 Creating group chat...');
    $groupRoom = $this->createGroupChat($users);

    // 2. Create private chats for ALL users
    $this->command->info('🔒 Creating private chats for all users...');
    $privateRooms = $this->createPrivateChatsForAllUsers($users);

    // 3. Add messages to all chats
    $this->command->info('💬 Adding messages...');

    // Add messages to group chat
    $this->addMessagesToRoom($groupRoom, $users, 10);

    // Add messages to each private chat
    foreach ($privateRooms as $privateRoom) {
      $roomUsers = User::whereIn('id', [$privateRoom->created_by, $privateRoom->id % $users->count() + 1])->get();
      $this->addMessagesToRoom($privateRoom, $roomUsers, rand(3, 6));
    }

    $this->command->info('✅ Done!');
    $this->command->info("   Group Room: 1 chat with {$users->count()} members");
    $this->command->info("   Private Rooms: {$privateRooms->count()} chats (2 members each)");
    $this->command->info("   Total Messages: " . ChatMessage::count());
  }

  private function createPrivateChatsForAllUsers($users)
  {
    $privateRooms = collect();

    // Each user gets a private chat with the next user
    $users->each(function ($user, $index) use ($users, $privateRooms) {
      // Get partner user (next user in list, or first if last)
      $partnerIndex = ($index + 1) % $users->count();
      $partner = $users->get($partnerIndex);

      // Check if this pair already has a chat
      $existingChat = ChatRoom::where('type', 'private')
        ->where('created_by', $user->id)
        ->whereHas('members', function ($query) use ($partner) {
          $query->where('user_id', $partner->id);
        })
        ->exists();

      if (!$existingChat) {
        $room = ChatRoom::create([
          'name' => null,
          'type' => 'private',
          'created_by' => $user->id,
          'created_at' => now()->subDays(rand(1, 7)),
        ]);

        // Add both users to private chat
        ChatRoomMember::create([
          'room_id' => $room->id,
          'user_id' => $user->id,
          'role' => 'member',
          'joined_at' => $room->created_at,
        ]);

        ChatRoomMember::create([
          'room_id' => $room->id,
          'user_id' => $partner->id,
          'role' => 'member',
          'joined_at' => $room->created_at,
        ]);

        $privateRooms->push($room);
      }
    });

    return $privateRooms;
  }

  private function createGroupChat($users)
  {
    $creator = $users->first();

    $room = ChatRoom::create([
      'name' => 'Everyone Group',
      'type' => 'group',
      'created_by' => $creator->id,
      'created_at' => now()->subDays(3),
    ]);

    // Add ALL users to group chat
    $users->each(function ($user, $index) use ($room) {
      $role = $index === 0 ? 'owner' : ($index === 1 ? 'admin' : 'member');

      ChatRoomMember::create([
        'room_id' => $room->id,
        'user_id' => $user->id,
        'role' => $role,
        'joined_at' => $room->created_at,
      ]);
    });

    return $room;
  }

  private function addMessagesToRoom($room, $users, $messageCount)
  {
    $messages = [];

    for ($i = 0; $i < $messageCount; $i++) {
      $sender = $users->random();
      $messageTime = $room->created_at->addMinutes($i * 30);

      $messages[] = [
        'room_id' => $room->id,
        'sender_id' => $sender->id,
        'message' => $this->getMessageForRoom($room, $i),
        'attachment' => rand(1, 5) === 1 ? 'files/attachment_' . rand(1, 5) . '.jpg' : null,
        'attachment_type' => rand(1, 5) === 1 ? 'image' : null,
        'created_at' => $messageTime,
        'updated_at' => $messageTime,
      ];
    }

    ChatMessage::insert($messages);

    // Update last message
    $lastMessage = ChatMessage::where('room_id', $room->id)->latest('created_at')->first();
    if ($lastMessage) {
      $room->update(['last_message_id' => $lastMessage->id]);
    }
  }

  private function getMessageForRoom($room, $index)
  {
    if ($room->type === 'private') {
      $messages = [
        'Hey! How are you?',
        'Can we talk?',
        'Check this out!',
        'Are you free later?',
        'Thanks for your help!',
        'Did you see my message?',
      ];
    } else {
      $messages = [
        'Hello everyone!',
        'Good morning team!',
        'Any updates?',
        'Great work everyone!',
        'Meeting at 3 PM',
        'Document uploaded',
        'Happy Friday!',
        'Reminder: Deadline tomorrow',
      ];
    }

    return $messages[$index % count($messages)];
  }
}
