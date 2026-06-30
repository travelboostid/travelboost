<?php

namespace App\Ai\Tools\Chatbot;

use App\Ai\Agents\ChatbotAgent;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class ReleaseBookingHoldTool implements Tool
{
    public function __construct(private ChatbotAgent $agent) {}

    public function description(): Stringable|string
    {
        return 'Release an active booking reserved hold for the logged-in customer, freeing seats. Only works for booking reserved status with a system hold (not waiting-list offers). Requires booking_id or booking_number. Ask for confirmation before releasing.';
    }

    public function handle(Request $request): Stringable|string
    {
        return $this->agent->releaseBookingHoldContext($request->all());
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'booking_id' => $schema->integer(),
            'booking_number' => $schema->string(),
        ];
    }
}
