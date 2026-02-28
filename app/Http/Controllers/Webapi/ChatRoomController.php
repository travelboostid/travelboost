<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\OpenChatRequest;
use App\Http\Resources\ChatRoomResource;
use App\Models\ChatRoom;
use App\Models\ChatRoomMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ChatRoomController extends Controller
{
  /**
   * Display a paginated list of chat rooms using cursor pagination.
   * @operationId getChatRooms
   */
  public function index(Request $request)
  {
    $validated = $request->validate([
      'member_type' => 'nullable|in:user,company', // Make sure these match your actual types
      'member_id' => 'nullable|integer',
      'cursor' => 'nullable|string',
      'per_page' => 'nullable|integer|min:1|max:100',
    ]);

    // Merge defaults
    $validated = array_merge([
      'member_type' => 'user',
      'member_id' => Auth::id(),
      'per_page' => 10,
    ], $validated);

    $chatRooms = ChatRoom::whereHas('members', function ($query) use ($validated) {
      $query->where('member_id', $validated['member_id'])
        ->where('member_type', $validated['member_type']);
    })
      ->with(['members', 'lastMessage'])
      ->orderBy('created_at', 'desc')
      ->cursorPaginate()
      ->withQueryString();

    return ChatRoomResource::collection($chatRooms);
  }

  /**
   * Show a single chat room by model.
   * @operationId getChatRoom
   */
  public function show(ChatRoom $room)
  {
    return new ChatRoomResource(
      $room->load(['lastMessage', 'members'])
    );
  }

  /**
   * Open a private chat with another user.
   * @operationId openChatRoom
   */
  public function open(OpenChatRequest $request)
  {
    $validated = $request->validated();

    // Find existing private room with exactly 2 members
    $room = ChatRoom::where('type', 'private')
      ->whereHas('members', function ($query) use ($validated) {
        $query->where('member_id', $validated['sender_id'])
          ->where('member_type', $validated['sender_type']);
      })
      ->whereHas('members', function ($query) use ($validated) {
        $query->where('member_id', $validated['recipient_id'])
          ->where('member_type', $validated['recipient_type']);
      })
      ->withCount('members')
      ->get()
      ->filter(function ($chatRoom) {
        return $chatRoom->members_count === 2;
      })
      ->first();

    // If not exists, create new room
    if (!$room) {
      $room = DB::transaction(function () use ($validated) {
        $room = ChatRoom::create([
          'type' => 'private',
        ]);

        // Add both members
        ChatRoomMember::insert([
          [
            'room_id' => $room->id,
            'member_type' => $validated['sender_type'],
            'member_id' => $validated['sender_id'],
            'role' => 'owner',
            'joined_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
          ],
          [
            'room_id' => $room->id,
            'member_type' => $validated['recipient_type'],
            'member_id' => $validated['recipient_id'],
            'role' => 'member',
            'joined_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
          ],
        ]);

        return $room;
      });
    }

    // Load relationships for the resource
    $room->load(['members', 'lastMessage']);

    return new ChatRoomResource($room);
  }
}
