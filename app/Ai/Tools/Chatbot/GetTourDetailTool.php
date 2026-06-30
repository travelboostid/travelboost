<?php

namespace App\Ai\Tools\Chatbot;

use App\Ai\Agents\ChatbotAgent;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetTourDetailTool implements Tool
{
    public function __construct(private ChatbotAgent $agent) {}

    public function description(): Stringable|string
    {
        return 'Get detailed information about a specific tour by tour_id.';
    }

    public function handle(Request $request): Stringable|string
    {
        return $this->agent->retrieveTourDetailContext($request->all());
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'tour_id' => $schema->integer()->required(),
        ];
    }
}
