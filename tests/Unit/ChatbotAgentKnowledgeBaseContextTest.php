<?php

use App\Ai\Agents\ChatbotAgent;
use App\Models\AppConfig;
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\ChatRoomMember;
use App\Models\Company;
use App\Models\KnowledgeBase;
use App\Models\Media;
use App\Models\Tour;
use App\Models\User;
use Laravel\Ai\Embeddings;
use Laravel\Ai\Responses\Data\Meta;
use Laravel\Ai\Responses\EmbeddingsResponse;

function createChatbotAgentForKnowledgeBase(Company $company, User $user, ChatMessage $message): ChatbotAgent
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

function createPrivateChatMessageForKnowledgeBase(
    Company $company,
    User $user,
    string $messageText,
    ?int $attachedTourId = null,
): ChatMessage {
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
        'attachment_type' => $attachedTourId ? 'tour' : null,
        'attachment_data' => $attachedTourId ? (string) $attachedTourId : null,
        'is_bot' => false,
    ]));
}

function fakeKnowledgeBaseEmbedding(): array
{
    $embedding = Embeddings::fakeEmbedding(1536);

    Embeddings::fake([
        new EmbeddingsResponse([$embedding], 1, new Meta('openrouter', 'openai/text-embedding-3-small')),
    ]);

    return $embedding;
}

test('chatbot knowledge base context searches general documents', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create();
    $embedding = fakeKnowledgeBaseEmbedding();

    $media = Media::withoutEvents(fn () => Media::query()->create([
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'name' => 'general-travel-guide.pdf',
        'type' => 'document',
        'subtype' => 'general-knowledge-base-document',
        'data' => ['url' => '/storage/media/documents/general-travel-guide.pdf'],
    ]));

    KnowledgeBase::query()->create([
        'owner_type' => Media::class,
        'owner_id' => $media->id,
        'content' => 'Passport must be valid for at least six months.',
        'embedding' => $embedding,
    ]);

    $message = createPrivateChatMessageForKnowledgeBase($company, $user, 'berapa lama paspor harus berlaku?');
    $agent = createChatbotAgentForKnowledgeBase($company, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveGeneralContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, ['query' => 'passport validity requirement']);

    expect($context)->toContain('Passport must be valid for at least six months.');
});

test('chatbot knowledge base context searches tour document when tour_id is provided', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create();
    $embedding = fakeKnowledgeBaseEmbedding();

    $tourDocument = Media::withoutEvents(fn () => Media::query()->create([
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'name' => 'tokyo-itinerary.pdf',
        'type' => 'document',
        'subtype' => 'tour-document',
        'data' => ['url' => '/storage/media/documents/tokyo-itinerary.pdf'],
    ]));

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'document_id' => $tourDocument->id,
    ]);

    KnowledgeBase::query()->create([
        'owner_type' => Media::class,
        'owner_id' => $tourDocument->id,
        'content' => 'Day 3 includes a visit to Mount Fuji.',
        'embedding' => $embedding,
    ]);

    $message = createPrivateChatMessageForKnowledgeBase($company, $user, 'apa itinerary hari ke-3?');
    $agent = createChatbotAgentForKnowledgeBase($company, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveGeneralContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, [
        'query' => 'day 3 itinerary',
        'tour_id' => $tour->id,
    ]);

    expect($context)->toContain('Day 3 includes a visit to Mount Fuji.');
});

test('chatbot knowledge base context uses attached tour when tour_id is omitted', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create();
    $embedding = fakeKnowledgeBaseEmbedding();

    $tourDocument = Media::withoutEvents(fn () => Media::query()->create([
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'name' => 'bali-itinerary.pdf',
        'type' => 'document',
        'subtype' => 'tour-document',
        'data' => ['url' => '/storage/media/documents/bali-itinerary.pdf'],
    ]));

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'document_id' => $tourDocument->id,
    ]);

    KnowledgeBase::query()->create([
        'owner_type' => Media::class,
        'owner_id' => $tourDocument->id,
        'content' => 'Includes a traditional Balinese cooking class.',
        'embedding' => $embedding,
    ]);

    $message = createPrivateChatMessageForKnowledgeBase($company, $user, 'ada kelas memasak?', $tour->id);
    $agent = createChatbotAgentForKnowledgeBase($company, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveGeneralContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, ['query' => 'cooking class']);

    expect($context)->toContain('Includes a traditional Balinese cooking class.');
});

test('chatbot knowledge base context reports when no documents are available', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create();

    $message = createPrivateChatMessageForKnowledgeBase($company, $user, 'ada visa requirement?');
    $agent = createChatbotAgentForKnowledgeBase($company, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveGeneralContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, ['query' => 'visa requirement']);

    expect($context)->toBe('No knowledge base documents available.');
});

test('chatbot knowledge base context reports when no entries match the query', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create();

    Embeddings::fake([
        new EmbeddingsResponse(
            [Embeddings::fakeEmbedding(1536)],
            1,
            new Meta('openrouter', 'openai/text-embedding-3-small'),
        ),
    ]);

    $media = Media::withoutEvents(fn () => Media::query()->create([
        'owner_type' => Company::class,
        'owner_id' => $company->id,
        'name' => 'general-travel-guide.pdf',
        'type' => 'document',
        'subtype' => 'general-knowledge-base-document',
        'data' => ['url' => '/storage/media/documents/general-travel-guide.pdf'],
    ]));

    KnowledgeBase::query()->create([
        'owner_type' => Media::class,
        'owner_id' => $media->id,
        'content' => 'Unrelated travel tip about luggage weight.',
        'embedding' => Embeddings::fakeEmbedding(1536),
    ]);

    $message = createPrivateChatMessageForKnowledgeBase($company, $user, 'berapa biaya visa?');
    $agent = createChatbotAgentForKnowledgeBase($company, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveGeneralContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, ['query' => 'visa fee']);

    expect($context)->toBe('No knowledge base entries matched.');
});
