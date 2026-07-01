<?php

namespace App\Ai\Tools\Chatbot;

use App\Ai\Agents\ChatbotAgent;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetTourSchedulesTool implements Tool
{
    public function __construct(private ChatbotAgent $agent) {}

    public function description(): Stringable|string
    {
        return 'Get departure schedules for a tour by tour_id, including departure/return dates, available seats, and starting price.';
    }

    public function handle(Request $request): Stringable|string
    {
        return $this->agent->retrieveTourSchedulesContext($request->all());
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'tour_id' => $schema->integer()->required(),
            'upcoming_only' => $schema->boolean(),
            'departure_from' => $schema->string(),
            'departure_to' => $schema->string(),
        ];
    }
}
