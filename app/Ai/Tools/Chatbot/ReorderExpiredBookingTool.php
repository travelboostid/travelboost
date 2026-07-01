<?php

namespace App\Ai\Tools\Chatbot;

use App\Ai\Agents\ChatbotAgent;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class ReorderExpiredBookingTool implements Tool
{
    public function __construct(private ChatbotAgent $agent) {}

    public function description(): Stringable|string
    {
        return 'Reactivate an expired booking so the customer can continue checkout. Also redirects awaiting payment or booking reserved bookings to continue. Requires booking_id or booking_number. Use search_bookings with status expired to find eligible bookings first.';
    }

    public function handle(Request $request): Stringable|string
    {
        return $this->agent->reorderExpiredBookingContext($request->all());
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'booking_id' => $schema->integer(),
            'booking_number' => $schema->string(),
        ];
    }
}
