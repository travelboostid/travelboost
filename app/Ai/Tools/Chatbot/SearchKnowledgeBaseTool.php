<?php

namespace App\Ai\Tools\Chatbot;

use App\Ai\Agents\ChatbotAgent;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class SearchKnowledgeBaseTool implements Tool
{
    public function __construct(private ChatbotAgent $agent) {}

    public function description(): Stringable|string
    {
        return 'Search the knowledge base for general travel information or tour-specific details such as itinerary, inclusions, visa requirements, and policies. Use when other tools do not answer the question. Pass tour_id for tour-specific questions.';
    }

    public function handle(Request $request): Stringable|string
    {
        return $this->agent->retrieveGeneralContext($request->all());
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'query' => $schema->string()->required(),
            'tour_id' => $schema->integer(),
        ];
    }
}
