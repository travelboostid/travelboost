<?php

namespace App\Ai\Tools\Chatbot;

use App\Ai\Agents\ChatbotAgent;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class SearchBookingsTool implements Tool
{
    public function __construct(private ChatbotAgent $agent) {}

    public function description(): Stringable|string
    {
        return 'Search the current customer\'s bookings with this agent. Filter by tour, booking number, status, departure date range, upcoming trips, or keywords matching booking number or tour name.';
    }

    public function handle(Request $request): Stringable|string
    {
        return $this->agent->retrieveBookingQueryContext($request->all());
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'tour_id' => $schema->integer(),
            'booking_number' => $schema->string(),
            'keywords' => $schema->string(),
            'statuses' => $schema->array()->items($schema->string()),
            'departure_from' => $schema->string(),
            'departure_to' => $schema->string(),
            'upcoming_only' => $schema->boolean(),
        ];
    }
}
