<?php

namespace App\Ai\Tools\Chatbot;

use App\Ai\Agents\ChatbotAgent;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetCompanyContactTool implements Tool
{
    public function __construct(private ChatbotAgent $agent) {}

    public function description(): Stringable|string
    {
        return 'Get the travel company contact details: name, email, address, and customer service phone.';
    }

    public function handle(Request $request): Stringable|string
    {
        return $this->agent->retrieveCompanyContactContext();
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
