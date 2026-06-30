<?php

use App\Ai\Agents\ChatbotAgent;
use App\Models\AiUsageLog;
use App\Models\AppConfig;
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\ChatRoomMember;
use App\Models\Company;
use App\Models\User;
use Laravel\Ai\Responses\AgentResponse;
use Laravel\Ai\Responses\Data\Meta;
use Laravel\Ai\Responses\Data\Usage;
use Laravel\Ai\Responses\EmbeddingsResponse;

function seedChatbotConfigForUsageLogTests(): void
{
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
}

function createUsageLogChatMessage(Company $company, User $user, string $messageText): ChatMessage
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

test('chatbot reply creates usage log and decrements ai credit', function () {
    seedChatbotConfigForUsageLogTests();

    ChatbotAgent::fake(['Hello streamed world']);

    $company = Company::factory()->create();
    $company->aiCredit()->update(['balance' => 10_000]);
    $user = User::factory()->create();

    $message = createUsageLogChatMessage($company, $user, 'Hello');

    ChatbotAgent::make($message->fresh(['room.members']))->reply();

    $log = AiUsageLog::query()->first();

    expect($log)->not->toBeNull()
        ->and($log->company_id)->toBe($company->id)
        ->and($log->feature)->toBe('chatbot')
        ->and((string) $log->user_cost)->toBe('75.00000000')
        ->and($log->meta)->toMatchArray([
            'chat_message_id' => $message->id,
            'room_id' => $message->room_id,
        ])
        ->and((string) $company->fresh()->aiCredit->balance)->toBe('9925.00000000');
});

test('chatbot reply is skipped when ai credit is insufficient before streaming', function () {
    seedChatbotConfigForUsageLogTests();

    ChatbotAgent::fake(['Hello streamed world']);

    $company = Company::factory()->create();
    $company->aiCredit()->update(['balance' => 50]);
    $user = User::factory()->create();

    $message = createUsageLogChatMessage($company, $user, 'Hello');

    ChatbotAgent::make($message->fresh(['room.members']))->reply();

    expect(AiUsageLog::query()->count())->toBe(0)
        ->and((string) $company->fresh()->aiCredit->balance)->toBe('50.00000000')
        ->and(
            ChatMessage::query()
                ->where('room_id', $message->room_id)
                ->where('is_bot', true)
                ->exists()
        )->toBeFalse();
});

test('chatbot reply does not create usage log when credit is exhausted during billing', function () {
    seedChatbotConfigForUsageLogTests();

    ChatbotAgent::fake(['Hello streamed world']);

    $company = Company::factory()->create();
    $company->aiCredit()->update(['balance' => 75]);
    $user = User::factory()->create();

    $message = createUsageLogChatMessage($company, $user, 'Hello');

    $agent = ChatbotAgent::make($message->fresh(['room.members']));

    $company->aiCredit()->update(['balance' => 0]);

    $agent->reply();

    expect(AiUsageLog::query()->count())->toBe(0)
        ->and((string) $company->fresh()->aiCredit->balance)->toBe('0.00000000');

    $botMessage = ChatMessage::query()
        ->where('room_id', $message->room_id)
        ->where('is_bot', true)
        ->first();

    expect($botMessage)->not->toBeNull()
        ->and($botMessage->message)->toContain('AI credits are insufficient');
});

test('chatbot usage log aggregates prompt completion embedding and reasoning tokens', function () {
    seedChatbotConfigForUsageLogTests();

    $company = Company::factory()->create();
    $company->aiCredit()->update(['balance' => 10_000]);
    $user = User::factory()->create();
    $message = createUsageLogChatMessage($company, $user, 'Hello');

    $agent = ChatbotAgent::make($message->fresh(['room.members']));

    $trackTokenUsage = new ReflectionMethod(ChatbotAgent::class, 'trackTokenUsage');
    $trackTokenUsage->setAccessible(true);

    $trackTokenUsage->invoke($agent, new AgentResponse(
        'test',
        'Summary text',
        new Usage(
            promptTokens: 1_000,
            completionTokens: 500,
            cacheWriteInputTokens: 100,
            cacheReadInputTokens: 200,
            reasoningTokens: 300,
        ),
        new Meta('openrouter', 'deepseek/deepseek-v4-flash'),
    ));

    $trackTokenUsage->invoke($agent, new AgentResponse(
        'test',
        'Reply text',
        new Usage(promptTokens: 2_000, completionTokens: 1_000),
        new Meta('openrouter', 'deepseek/deepseek-v4-flash'),
    ));

    $trackTokenUsage->invoke($agent, new EmbeddingsResponse(
        embeddings: [[0.1, 0.2]],
        tokens: 250,
        meta: new Meta('openrouter', 'openai/text-embedding-3-small'),
    ));

    $getUsageCost = new ReflectionMethod(ChatbotAgent::class, 'getUsageCost');
    $getUsageCost->setAccessible(true);

    expect($getUsageCost->invoke($agent))->toBe('9.6600000000000000');

    $saveUsageLog = new ReflectionMethod(ChatbotAgent::class, 'saveUsageLog');
    $saveUsageLog->setAccessible(true);

    expect($saveUsageLog->invoke($agent))->toBeTrue();

    $log = AiUsageLog::query()->first();

    expect($log->prompt_tokens)->toBe(3_200)
        ->and($log->completion_tokens)->toBe(1_900)
        ->and($log->embedding_tokens)->toBe(250)
        ->and((string) $log->usage_cost)->toBe('9.66000000');
});
