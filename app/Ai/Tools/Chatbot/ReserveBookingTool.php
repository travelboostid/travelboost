<?php

namespace App\Ai\Tools\Chatbot;

use App\Ai\Agents\ChatbotAgent;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class ReserveBookingTool implements Tool
{
    public function __construct(private ChatbotAgent $agent) {}

    public function description(): Stringable|string
    {
        return 'Reserve a booking hold for the logged-in customer. Requires tour_id, departure_date, pax counts, contact details, and passengers_json (JSON array with first_name, price_category, and optional title, last_name, dob, pob, room_type per passenger). Use get_booking_quote first to confirm pricing. Optional addons_json: JSON array of {name, price, qty, is_taxable}. Only call after the customer confirms details.';
    }

    public function handle(Request $request): Stringable|string
    {
        return $this->agent->reserveBookingContext($request->all());
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'tour_id' => $schema->integer()->required(),
            'departure_date' => $schema->string()->required(),
            'pax_adult' => $schema->integer(),
            'pax_child' => $schema->integer(),
            'pax_infant' => $schema->integer(),
            'contact_name' => $schema->string(),
            'contact_email' => $schema->string(),
            'contact_phone' => $schema->string(),
            'contact_notes' => $schema->string(),
            'passengers_json' => $schema->string()->required(),
            'addons_json' => $schema->string(),
        ];
    }
}
