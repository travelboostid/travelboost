<?php

use App\Ai\Agents\ChatbotAgent;
use App\Enums\TourStatus;
use App\Models\AppConfig;
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\ChatRoomMember;
use App\Models\Company;
use App\Models\Tour;
use App\Models\TourAvailability;
use App\Models\TourSchedule;
use App\Models\User;

function createTourSchedulesChatMessage(Company $company, User $user, string $messageText, ?int $attachedTourId = null): ChatMessage
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
        'attachment_type' => $attachedTourId ? 'tour' : null,
        'attachment_data' => $attachedTourId ? (string) $attachedTourId : null,
        'is_bot' => false,
    ]));
}

function createTourSchedulesChatbotAgent(Company $company, User $user, ChatMessage $message): ChatbotAgent
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

test('chatbot tour schedules context returns upcoming active schedules for a tour', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create();

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'code' => 'BALI-01',
        'name' => 'Bali Explorer',
        'status' => TourStatus::ACTIVE,
        'showprice' => 5_000_000,
    ]);

    $upcomingSchedule = TourSchedule::query()->create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(14)->toDateString(),
        'return_date' => now()->addDays(18)->toDateString(),
        'is_active' => true,
    ]);

    TourAvailability::query()->create([
        'company_id' => $company->id,
        'tour_id' => $tour->id,
        'schedule_id' => $upcomingSchedule->id,
        'max_pax' => 20,
        'available' => 8,
    ]);

    TourSchedule::query()->create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->subDays(3)->toDateString(),
        'return_date' => now()->subDay()->toDateString(),
        'is_active' => true,
    ]);

    TourSchedule::query()->create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(30)->toDateString(),
        'return_date' => now()->addDays(34)->toDateString(),
        'is_active' => false,
    ]);

    $message = createTourSchedulesChatMessage($company, $user, 'When does Bali Explorer depart?');

    $agent = createTourSchedulesChatbotAgent($company, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveTourSchedulesContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, ['tour_id' => $tour->id]);

    expect($context)
        ->toContain('tour:'.$tour->id.'|BALI-01|Bali Explorer')
        ->toContain('schedules:id|departure|return|available|price')
        ->toContain((string) $upcomingSchedule->id)
        ->toContain(now()->addDays(14)->toDateString())
        ->toContain('|8|')
        ->not->toContain(now()->subDays(3)->toDateString())
        ->not->toContain(now()->addDays(30)->toDateString());
});

test('chatbot tour schedules context returns explicit message when no schedules exist', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create();

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'status' => TourStatus::ACTIVE,
    ]);

    $message = createTourSchedulesChatMessage($company, $user, 'Any departures?');

    $agent = createTourSchedulesChatbotAgent($company, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveTourSchedulesContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, ['tour_id' => $tour->id]);

    expect($context)->toBe('No schedules matched.');
});

test('chatbot tour schedules context uses attached tour when tour_id is omitted', function () {
    $company = Company::factory()->create();
    $user = User::factory()->create();

    $tour = Tour::factory()->create([
        'company_id' => $company->id,
        'code' => 'SG-01',
        'name' => 'Singapore Stopover',
        'status' => TourStatus::ACTIVE,
    ]);

    $schedule = TourSchedule::query()->create([
        'tour_id' => $tour->id,
        'tour_code' => $tour->code,
        'company_id' => $company->id,
        'departure_date' => now()->addDays(7)->toDateString(),
        'return_date' => now()->addDays(9)->toDateString(),
        'is_active' => true,
    ]);

    $message = createTourSchedulesChatMessage($company, $user, 'When can I go?', $tour->id);

    $agent = createTourSchedulesChatbotAgent($company, $user, $message);

    $method = new ReflectionMethod(ChatbotAgent::class, 'retrieveTourSchedulesContext');
    $method->setAccessible(true);

    $context = $method->invoke($agent, []);

    expect($context)
        ->toContain('Singapore Stopover')
        ->toContain((string) $schedule->id);
});
