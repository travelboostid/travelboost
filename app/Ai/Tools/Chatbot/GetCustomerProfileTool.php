<?php

namespace App\Ai\Tools\Chatbot;

use App\Ai\Agents\ChatbotAgent;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetCustomerProfileTool implements Tool
{
    public function __construct(private ChatbotAgent $agent) {}

    public function description(): Stringable|string
    {
        return 'Get the logged-in customer\'s profile (name, email, phone) for booking contact details. Returns a login prompt if the customer is not logged in.';
    }

    public function handle(Request $request): Stringable|string
    {
        return $this->agent->retrieveCustomerProfileContext();
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
