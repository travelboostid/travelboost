<?php

namespace App\Http\Controllers\Webapi;

use App\Events\ChatMessageCreated;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreChatMessageRequest;
use App\Http\Requests\UpdateChatMessageRequest;
use App\Http\Resources\ChatMessageResource;
use App\Models\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ChatMessageController extends Controller
{
  /**
   * List messages in a chat room with cursor pagination.
   * @operationId getChatMessages
   */
  public function index(Request $request, $roomId)
  {
    $request->validate([
      'cursor' => 'nullable|string', // Laravel cursor is always a string
      'per_page' => 'nullable|integer|min:1|max:100',
    ]);

    $perPage = $request->input('per_page', 10);

    $messages = ChatMessage::where('room_id', $roomId)
      ->with(['sender', 'room', 'replyTo'])
      ->orderBy('created_at', 'desc') // oldest first
      ->cursorPaginate($perPage)
      ->withQueryString();

    return ChatMessageResource::collection($messages);
  }

  /**
   * Store a new message in a chat room.
   * @operationId createChatMessage
   */
  public function store(StoreChatMessageRequest $request, $roomId)
  {
    $validated = $request->validated();
    $validated['room_id'] = $roomId;
    $message = ChatMessage::create($validated);
    // ✅ update last_message_id on room
    $message->room()->update([
      'last_message_id' => $message->id,
    ]);
    $message->load(['sender', 'room', 'replyTo']);
    Log::info('ChatMessage created', [
      'message_id' => $message->id,
      'room_id' => $roomId,
    ]);
    ChatMessageCreated::dispatch($message);
    return new ChatMessageResource($message);
  }

  /**
   * Show a single message (shallow route).
   * @operationId getChatMessage
   */
  public function show(ChatMessage $message)
  {
    return new ChatMessageResource($message->load(['sender', 'room', 'replyTo']));
  }

  /**
   * Update a message.
   * @operationId updateChatMessage
   */
  public function update(UpdateChatMessageRequest $request, ChatMessage $message)
  {
    $message->update($request->only(['message', 'attachment', 'attachment_type']));

    return new ChatMessageResource($message->load(['sender', 'room', 'replyTo']));
  }

  /**
   * Delete a message.
   * @operationId deleteChatMessage
   */
  public function destroy(ChatMessage $message)
  {
    $message->delete();

    return response()->json(['message' => 'Message deleted']);
  }
}
