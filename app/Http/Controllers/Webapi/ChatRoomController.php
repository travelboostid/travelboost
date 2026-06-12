<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChatRoomIndexRequest;
use App\Http\Requests\OpenChatRequest;
use App\Http\Resources\ChatRoomResource;
use App\Models\ChatRoom;
use App\Models\ChatRoomMember;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ChatRoomController extends Controller
{
    /**
     * List chat rooms for a member using cursor pagination.
     *
     * @operationId getChatRooms
     */
    public function index(ChatRoomIndexRequest $request): AnonymousResourceCollection
    {
        $validated = $request->validated();

        $chatRooms = ChatRoom::whereHas('members', function ($query) use ($validated) {
            $query->where('member_id', $validated['member_id'])
                ->where('member_type', $validated['member_type']);
        })
            ->with(['members', 'lastMessage'])
            ->orderBy('created_at', 'desc')
            ->cursorPaginate($validated['per_page'])
            ->withQueryString();

        return ChatRoomResource::collection($chatRooms);
    }

    /**
     * Get a single chat room.
     *
     * @operationId getChatRoom
     */
    public function show(ChatRoom $room): ChatRoomResource
    {
        return new ChatRoomResource(
            $room->load(['lastMessage', 'members'])
        );
    }

    /**
     * Open or reuse a private chat room between two members.
     *
     * @operationId openChatRoom
     */
    public function open(OpenChatRequest $request): ChatRoomResource
    {
        $validated = $request->validated();

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
            ->first(fn (ChatRoom $chatRoom) => $chatRoom->members_count === 2);

        if (! $room) {
            $room = DB::transaction(function () use ($validated) {
                $room = ChatRoom::create([
                    'type' => 'private',
                ]);

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

        $room->load(['members', 'lastMessage']);

        return new ChatRoomResource($room);
    }
}
