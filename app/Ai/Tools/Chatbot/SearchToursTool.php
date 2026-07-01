<?php

namespace App\Ai\Tools\Chatbot;

use App\Ai\Agents\ChatbotAgent;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class SearchToursTool implements Tool
{
    public function __construct(private ChatbotAgent $agent) {}

    public function description(): Stringable|string
    {
        return 'Search active tours by keywords, destination, tour code, location, duration, or price. Use keywords for free-text search across name, code, destination, and description. Combine filters to narrow results.';
    }

    public function handle(Request $request): Stringable|string
    {
        return $this->agent->retrieveTourQueryContext($request->all());
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'tour_id' => $schema->integer(),
            'tour_code' => $schema->string(),
            'keywords' => $schema->string(),
            'destination' => $schema->string(),
            'continents' => $schema->array()->items($schema->string()),
            'countries' => $schema->array()->items($schema->string()),
            'regions' => $schema->array()->items($schema->string()),
            'duration_min' => $schema->integer(),
            'duration_max' => $schema->integer(),
            'price_min' => $schema->number(),
            'price_max' => $schema->number(),
        ];
    }
}
