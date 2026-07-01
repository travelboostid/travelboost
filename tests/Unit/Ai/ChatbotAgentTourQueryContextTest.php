<?php

use App\Ai\Agents\ChatbotAgent;
use App\Enums\CompanyType;
use App\Enums\TourStatus;
use App\Models\AgentTour;
use App\Models\AppConfig;
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\ChatRoomMember;
use App\Models\Company;
use App\Models\Tour;
use App\Models\User;

function createChatbotAgentForTourQuery(Company $company, User $user, ChatMessage $message): ChatbotAgent
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

    $company->aiCredit()->update(['balance' => 10_000]);

    return ChatbotAgent::make($message->fresh(['room.members']));
}

function createPrivateChatMessage(Company $company, User $user, string $messageText): ChatMessage
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

test('chatbot tour query context filters tours by keywords across searchable columns', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create();

    Tour::factory()->create([
        'company_id' => $company->id,
        'code' => 'HK-001',
        'name' => 'Hong Kong City Escape',
        'destination' => 'Hong Kong',
        'country_name' => 'China',
        'status' => TourStatus::ACTIVE,
    ]);

    Tour::factory()->create([
        'company_id' => $company->id,
        'code' => 'JP-001',
        'name' => 'Tokyo Highlights',
        'destination' => 'Tokyo',
        'country_name' => 'Japan',
        'status' => TourStatus::ACTIVE,
    ]);

    $message = createPrivateChatMessage($company, $user, 'ada tour ke Hong Kong?');
    $agent = createChatbotAgentForTourQuery($company, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveTourQueryContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, ['keywords' => 'Hong Kong']);

    expect($context)
        ->toContain('Hong Kong City Escape')
        ->not->toContain('Tokyo Highlights');
});

test('chatbot tour query context includes vendor tours linked via agent catalog', function () {
    $vendor = Company::factory()->create(['type' => CompanyType::VENDOR]);
    $agent = Company::factory()->create(['type' => CompanyType::AGENT]);
    $user = User::factory()->create();

    $vendorTour = Tour::factory()->create([
        'company_id' => $vendor->id,
        'code' => 'HK-001',
        'name' => 'Hong Kong City Escape',
        'destination' => 'Hong Kong',
        'country_name' => 'China',
        'status' => TourStatus::ACTIVE,
    ]);

    Tour::factory()->create([
        'company_id' => $vendor->id,
        'code' => 'JP-001',
        'name' => 'Tokyo Highlights',
        'destination' => 'Tokyo',
        'country_name' => 'Japan',
        'status' => TourStatus::ACTIVE,
    ]);

    AgentTour::query()->create([
        'tour_id' => $vendorTour->id,
        'company_id' => $agent->id,
        'status' => TourStatus::ACTIVE,
    ]);

    $message = createPrivateChatMessage($agent, $user, 'carikan aku tur hong kong');
    $agentInstance = createChatbotAgentForTourQuery($agent, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveTourQueryContext');
    $method->setAccessible(true);

    $context = $method->invoke($agentInstance, ['keywords' => 'Hong Kong']);

    expect($context)
        ->toContain('Hong Kong City Escape')
        ->not->toContain('Tokyo Highlights');
});

test('chatbot tour query context returns explicit message when keywords match nothing', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create();

    Tour::factory()->create([
        'company_id' => $company->id,
        'name' => 'Bali Getaway',
        'destination' => 'Bali',
        'status' => TourStatus::ACTIVE,
    ]);

    $message = createPrivateChatMessage($company, $user, 'ada tour ke Antarctica?');
    $agent = createChatbotAgentForTourQuery($company, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveTourQueryContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, ['keywords' => 'Antarctica']);

    expect($context)->toBe('No tours matched.');
});

test('chatbot tour query context excludes inactive tours', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create();

    Tour::factory()->create([
        'company_id' => $company->id,
        'name' => 'Hidden Hong Kong Tour',
        'destination' => 'Hong Kong',
        'status' => TourStatus::INACTIVE,
    ]);

    $message = createPrivateChatMessage($company, $user, 'ada tour ke Hong Kong?');
    $agent = createChatbotAgentForTourQuery($company, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveTourQueryContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, ['keywords' => 'Hong Kong']);

    expect($context)->toBe('No tours matched.');
});

test('chatbot tour query context requires all keyword tokens to match', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create();

    Tour::factory()->create([
        'company_id' => $company->id,
        'name' => 'Hong Kong City Escape',
        'destination' => 'Hong Kong',
        'status' => TourStatus::ACTIVE,
    ]);

    Tour::factory()->create([
        'company_id' => $company->id,
        'name' => 'Hong Kong Food Walk',
        'destination' => 'Hong Kong',
        'status' => TourStatus::ACTIVE,
    ]);

    Tour::factory()->create([
        'company_id' => $company->id,
        'name' => 'Tokyo Highlights',
        'destination' => 'Tokyo',
        'status' => TourStatus::ACTIVE,
    ]);

    $message = createPrivateChatMessage($company, $user, 'tour hong kong city');
    $agent = createChatbotAgentForTourQuery($company, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveTourQueryContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, ['keywords' => 'Hong Kong City']);

    expect($context)
        ->toContain('Hong Kong City Escape')
        ->not->toContain('Hong Kong Food Walk')
        ->not->toContain('Tokyo Highlights');
});

test('chatbot tour query context matches countries with partial ilike values', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create();

    $japanTour = Tour::factory()->create([
        'company_id' => $company->id,
        'name' => 'Japan Discovery',
        'status' => TourStatus::ACTIVE,
    ]);
    $japanTour->forceFill(['country_name' => 'Japan'])->save();

    $baliTour = Tour::factory()->create([
        'company_id' => $company->id,
        'name' => 'Bali Getaway',
        'status' => TourStatus::ACTIVE,
    ]);
    $baliTour->forceFill(['country_name' => 'Indonesia'])->save();

    $message = createPrivateChatMessage($company, $user, 'tour japan');
    $agent = createChatbotAgentForTourQuery($company, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveTourQueryContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, ['countries' => ['japan']]);

    expect($context)
        ->toContain('Japan Discovery')
        ->not->toContain('Bali Getaway');
});

test('chatbot tour query context uses compact pipe-delimited output', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create();

    Tour::factory()->create([
        'company_id' => $company->id,
        'code' => 'HK-001',
        'name' => 'Hong Kong City Escape',
        'destination' => 'Hong Kong',
        'status' => TourStatus::ACTIVE,
    ]);

    $message = createPrivateChatMessage($company, $user, 'tour hk');
    $agent = createChatbotAgentForTourQuery($company, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveTourQueryContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, ['keywords' => 'Hong Kong']);

    expect($context)
        ->toStartWith('tours:id|code|name|days|dest|country|price')
        ->not->toContain('|----|');
});
