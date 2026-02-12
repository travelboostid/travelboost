<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\OpenChatRequest;
use App\Http\Requests\StoreChatRoomRequest;
use App\Http\Requests\UpdateChatRoomRequest;
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
    $request->validate([
      'cursor' => 'nullable|string', // Laravel cursor is always a string
      'per_page' => 'nullable|integer|min:1|max:100',
    ]);
    $perPage = $request->input('per_page', 10);

    $chatRooms = ChatRoom::whereHas('members', function ($query) use ($request) {
      $query->where('user_id', $request->user()->id);
    })
      ->with(['creator', 'lastMessage', 'members.user'])
      ->orderBy('created_at', 'desc')
      ->cursorPaginate($perPage)
      ->withQueryString();

    return ChatRoomResource::collection($chatRooms);
  }

  /**
   * Store a new chat room.
   * @operationId createChatRoom
   */
  public function store(StoreChatRoomRequest $request)
  {
    $chatRoom = ChatRoom::create([
      'name' => $request->name,
      'created_by' => $request->user()->id,
      'type' => $request->type ?? 'group',
    ]);

    return new ChatRoomResource(
      $chatRoom->load(['creator', 'lastMessage', 'members.user'])
    );
  }

  /**
   * Show a single chat room by model.
   * @operationId getChatRoom
   */
  public function show(ChatRoom $room)
  {
    return new ChatRoomResource(
      $room->load(['creator', 'lastMessage', 'members.user'])
    );
  }

  /**
   * Update a chat room.
   * @operationId updateChatRoom
   */
  public function update(UpdateChatRoomRequest $request, ChatRoom $room)
  {
    $room->update($request->only(['name', 'type']));

    return new ChatRoomResource(
      $room->load(['creator', 'lastMessage', 'members.user'])
    );
  }

  /**
   * Delete a chat room.
   * @operationId deleteChatRoom
   */
  public function destroy(ChatRoom $room)
  {
    $room->delete();

    return response()->json([
      'message' => 'Chat room deleted',
    ]);
  }

  /**
   * Open a private chat with another user.
   * @operationId openChatRoom
   */
  public function open(OpenChatRequest $request)
  {
    $authUserId = Auth::id();
    $otherUserId = (int) $request->user_id;

    if ($authUserId === $otherUserId) {
      abort(400, 'Cannot chat with yourself');
    }

    // Find existing private room with exactly 2 members
    $room = ChatRoom::where('type', 'private')
      ->whereHas('members', fn($q) => $q->where('user_id', $authUserId))
      ->whereHas('members', fn($q) => $q->where('user_id', $otherUserId))
      ->first();

    // If not exists, create new room
    if (! $room) {
      DB::transaction(function () use (&$room, $authUserId, $otherUserId) {
        $room = ChatRoom::create([
          'type' => 'private',
          'created_by' => $authUserId,
        ]);

        ChatRoomMember::insert([
          [
            'room_id' => $room->id,
            'user_id' => $authUserId,
            'role' => 'owner',
            'joined_at' => now(),
          ],
          [
            'room_id' => $room->id,
            'user_id' => $otherUserId,
            'role' => 'member',
            'joined_at' => now(),
          ],
        ]);
      });
    }

    return new ChatRoomResource(
      $room->load(['creator', 'lastMessage', 'members.user'])
    );
  }
}
