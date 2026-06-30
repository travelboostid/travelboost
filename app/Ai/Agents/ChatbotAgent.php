<?php

namespace App\Ai\Agents;

use App\Ai\Agents\Concerns\ProvidesChatbotContext;
use App\Ai\Agents\Concerns\SummarizesChatbotConversation;
use App\Ai\Tools\Chatbot\GetBookingDetailTool;
use App\Ai\Tools\Chatbot\GetBookingQuoteTool;
use App\Ai\Tools\Chatbot\GetCompanyContactTool;
use App\Ai\Tools\Chatbot\GetCustomerProfileTool;
use App\Ai\Tools\Chatbot\GetTourDetailTool;
use App\Ai\Tools\Chatbot\GetTourSchedulesTool;
use App\Ai\Tools\Chatbot\ReleaseBookingHoldTool;
use App\Ai\Tools\Chatbot\ReorderExpiredBookingTool;
use App\Ai\Tools\Chatbot\ReserveBookingTool;
use App\Ai\Tools\Chatbot\SearchBookingsTool;
use App\Ai\Tools\Chatbot\SearchKnowledgeBaseTool;
use App\Ai\Tools\Chatbot\SearchToursTool;
use App\Models\ChatMessage;
use App\Support\StreamingMessageText;
use Laravel\Ai\Attributes\MaxSteps;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;
use Laravel\Ai\Responses\Data\ToolResult;
use Laravel\Ai\Responses\StreamedAgentResponse;
use Laravel\Ai\Streaming\Events\TextDelta;
use Laravel\Ai\Streaming\Events\TextStart;
use Stringable;
use Throwable;

#[MaxSteps(10)]
class ChatbotAgent implements Agent, Conversational, HasTools
{
    use Promptable, ProvidesChatbotContext, SummarizesChatbotConversation;

    public function __construct(protected ChatMessage $message)
    {
        $this->chatMessages = collect();
        $this->setupChatbotContext();
    }

    public function instructions(): Stringable|string
    {
        $attachedTourId = $this->message->attachment_type === 'tour'
            ? (int) $this->message->attachment_data
            : null;

        $prompt = <<<'PROMPT'
        You are a helpful travel agent chatbot. Use tools before answering and rely only on tool results.
        Reply in short plain prose (no markdown tables). Keep answers concise. Ask clarifying questions when needed.
        Do not guess or mention internal systems. Use at most 4 tool calls when possible.
        Reply in the same language as the user.
        When a customer wants to book: (1) confirm they are logged in with an account registered for this agent via get_customer_profile, (2) pick a tour and departure via get_tour_schedules, (3) show price categories and quote via get_booking_quote, (4) collect passenger names, price categories, and contact details, (5) reserve via reserve_booking only after explicit confirmation.
        Only logged-in customers registered with this agent (company_id match) may use booking tools.
        After a successful reserve, tell the customer their booking is held and they can open My Bookings to continue payment.
        When a customer has an expired booking, use search_bookings with status expired to find it, then reorder_expired_booking to reactivate it and provide continue links.
        When a customer wants to cancel an active booking hold (booking reserved with timer), confirm first then use release_booking_hold.
        PROMPT;

        if ($this->conversationSummary) {
            $prompt .= "\n\nEarlier conversation summary: {$this->conversationSummary}";
        }

        if ($attachedTourId) {
            $prompt .= "\n\nThe current message has an attached tour_id: {$attachedTourId}.";
        }

        return $prompt;
    }

    public function messages(): array
    {
        return $this->chatMessages
            ->map(fn (ChatMessage $chatMessage): Message => $this->toAiMessage($chatMessage))
            ->all();
    }

    public function tools(): iterable
    {
        return [
            new SearchToursTool($this),
            new GetTourDetailTool($this),
            new GetTourSchedulesTool($this),
            new SearchBookingsTool($this),
            new GetBookingDetailTool($this),
            new GetCustomerProfileTool($this),
            new GetBookingQuoteTool($this),
            new ReserveBookingTool($this),
            new ReorderExpiredBookingTool($this),
            new ReleaseBookingHoldTool($this),
            new SearchKnowledgeBaseTool($this),
            new GetCompanyContactTool($this),
        ];
    }

    public function reply(): void
    {
        if (! $this->shouldRespond || ! $this->hasConfiguredModels()) {
            return;
        }

        $botMessage = $this->createBotPlaceholderMessage();
        $this->broadcastBotMessageUpdate($botMessage);

        $streamedText = new StreamingMessageText;
        $lastBroadcastAt = microtime(true);

        try {
            $stream = $this->stream(
                prompt: 'Reply helpfully using tool results.',
                provider: $this->chatbotModelProvider,
                model: $this->chatbotModelName,
            );

            $stream->then(function (StreamedAgentResponse $response) use ($botMessage, $streamedText): void {
                $this->trackTokenUsage($response);

                $context = $response->toolResults
                    ->map(fn (ToolResult $result): string => is_string($result->result) ? $result->result : '')
                    ->filter()
                    ->implode("\n\n---\n\n");

                $finalText = ! $streamedText->isEmpty()
                    ? $streamedText->toString()
                    : $response->text;

                if (! $this->saveUsageLog()) {
                    $this->finalizeStreamingBotMessage(
                        $botMessage,
                        'Sorry, AI credits are insufficient to complete this reply.',
                    );

                    return;
                }

                $this->finalizeStreamingBotMessage(
                    $botMessage,
                    $finalText,
                    $context !== '' ? $context : null,
                );
            });

            $stream->each(function ($event) use ($botMessage, $streamedText, &$lastBroadcastAt): bool {
                if ($event instanceof TextStart) {
                    $streamedText->onTextSegmentStart();

                    return true;
                }

                if (! $event instanceof TextDelta) {
                    return true;
                }

                $streamedText->appendDelta($event->delta);

                if (microtime(true) - $lastBroadcastAt < self::STREAM_BROADCAST_INTERVAL_SECONDS) {
                    return true;
                }

                $updated = $this->updateStreamingBotMessage(
                    $botMessage,
                    $streamedText->toString(),
                    streaming: true,
                );
                $this->broadcastBotMessageUpdate($updated);
                $lastBroadcastAt = microtime(true);

                return true;
            });
        } catch (Throwable $exception) {
            $this->finalizeStreamingBotMessage(
                $botMessage,
                $streamedText->isEmpty()
                    ? 'Sorry, something went wrong while generating a reply.'
                    : $streamedText->toString(),
            );

            throw $exception;
        }
    }
}
