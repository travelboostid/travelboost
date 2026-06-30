<?php

namespace App\Ai\Tools\Chatbot;

use App\Ai\Agents\ChatbotAgent;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetBookingQuoteTool implements Tool
{
    public function __construct(private ChatbotAgent $agent) {}

    public function description(): Stringable|string
    {
        return 'Get price categories, add-ons, and a pricing quote for a tour departure. Without passengers_json, returns available price categories and add-ons. With passengers_json (JSON array), returns subtotal, tax, fees, and grand total. Ask the customer for passenger names, price categories, and contact details before reserving.';
    }

    public function handle(Request $request): Stringable|string
    {
        return $this->agent->retrieveBookingQuoteContext($request->all());
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'tour_id' => $schema->integer()->required(),
            'departure_date' => $schema->string()->required(),
            'passengers_json' => $schema->string(),
            'addons_json' => $schema->string(),
        ];
    }
}
