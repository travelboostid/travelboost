<?php

use App\Ai\Agents\ChatbotAgent;
use App\Models\AppConfig;
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\ChatRoomMember;
use App\Models\Company;
use App\Models\User;

function createStreamingChatbotMessage(Company $company, User $user, string $messageText): ChatMessage
{
    $room = ChatRoom::query()->create([
        'type' => 'private',
        'name' => null,
    ]);

    ChatRoomMember::query()->create([
        'room_id' => $room->id,
        'member_type' => 'user',
        'member_id' => $user->id,
        'role' => 'member',
        'joined_at' => now(),
    ]);

    ChatRoomMember::query()->create([
        'room_id' => $room->id,
        'member_type' => 'company',
        'member_id' => $company->id,
        'role' => 'member',
        'joined_at' => now(),
    ]);

    return ChatMessage::withoutEvents(fn (): ChatMessage => ChatMessage::query()->create([
        'room_id' => $room->id,
        'sender_type' => 'user',
        'sender_id' => $user->id,
        'user_id' => $user->id,
        'message' => $messageText,
        'is_bot' => false,
    ]));
}

test('chatbot agent reply finalizes a streaming bot message', function () {
    AppConfig::updateOrCreate(['key' => 'chatbot'], [
        'value' => [
            'chatbot_model_name' => 'deepseek/deepseek-v4-flash',
            'embedding_model_name' => 'openai/text-embedding-3-small',
            'chatbot_model_provider' => 'openrouter',
            'embedding_model_provider' => 'openrouter',
            'user_cost_per_interaction' => '75',
            'prompt_token_cost_per_million' => '1800',
            'embedding_token_cost_per_million' => '400',
            'completion_token_cost_per_million' => '2000',
        ],
    ]);

    ChatbotAgent::fake(['Hello streamed world']);

    $company = Company::factory()->create();
    $company->aiCredit()->update(['balance' => 10_000]);
    $user = User::factory()->create();

    $message = createStreamingChatbotMessage($company, $user, 'What tours do you have?');

    ChatbotAgent::make($message->fresh(['room.members']))->reply();

    $botMessage = ChatMessage::query()
        ->where('room_id', $message->room_id)
        ->where('is_bot', true)
        ->first();

    expect($botMessage)->not->toBeNull()
        ->and($botMessage->message)->toBe('Hello streamed world')
        ->and($botMessage->meta)->toMatchArray(['streaming' => false]);

    expect($message->room->fresh()->last_message_id)->toBe($botMessage->id);
});

test('chatbot placeholder message starts in streaming state', function () {
    AppConfig::updateOrCreate(['key' => 'chatbot'], [
        'value' => [
            'chatbot_model_name' => 'deepseek/deepseek-v4-flash',
            'embedding_model_name' => 'openai/text-embedding-3-small',
            'chatbot_model_provider' => 'openrouter',
            'embedding_model_provider' => 'openrouter',
            'user_cost_per_interaction' => '75',
            'prompt_token_cost_per_million' => '1800',
            'embedding_token_cost_per_million' => '400',
            'completion_token_cost_per_million' => '2000',
        ],
    ]);

    $company = Company::factory()->create();
    $company->aiCredit()->update(['balance' => 10_000]);
    $user = User::factory()->create();
    $message = createStreamingChatbotMessage($company, $user, 'Hello');

    $agent = ChatbotAgent::make($message->fresh(['room.members']));

    $method = new ReflectionMethod(ChatbotAgent::class, 'createBotPlaceholderMessage');
    $placeholder = $method->invoke($agent);

    expect($placeholder->message)->toBe('')
        ->and($placeholder->is_bot)->toBeTrue()
        ->and($placeholder->meta)->toMatchArray(['streaming' => true]);
});
