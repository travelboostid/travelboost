<?php

namespace App\Ai\Agents\Concerns;

use App\Models\ChatMessage;
use Illuminate\Support\Str;

trait SummarizesChatbotConversation
{
    protected ?string $conversationSummary = null;

    protected function refreshConversationSummaryIfNeeded(): void
    {
        $room = $this->message->room()->first();

        if ($room === null) {
            return;
        }

        $this->conversationSummary = data_get($room->meta, 'conversation_summary');

        $summaryThroughMessageId = (int) data_get($room->meta, 'summary_through_message_id', 0);

        $recentMessageIds = ChatMessage::query()
            ->where('room_id', $room->id)
            ->where('id', '<=', $this->message->id)
            ->orderByDesc('id')
            ->limit(self::RECENT_MESSAGE_LIMIT)
            ->pluck('id');

        if ($recentMessageIds->isEmpty()) {
            return;
        }

        $oldestRecentMessageId = (int) $recentMessageIds->min();

        $messagesToSummarize = ChatMessage::query()
            ->where('room_id', $room->id)
            ->where('id', '<', $oldestRecentMessageId)
            ->when($summaryThroughMessageId > 0, fn ($query) => $query->where('id', '>', $summaryThroughMessageId))
            ->orderBy('id')
            ->get()
            ->filter(fn (ChatMessage $message): bool => ! $message->is_bot || trim((string) $message->message) !== '');

        if ($messagesToSummarize->count() < self::SUMMARIZE_BATCH_MIN_MESSAGES) {
            return;
        }

        if (! $this->hasConfiguredModels()) {
            return;
        }

        $transcript = $messagesToSummarize
            ->map(function (ChatMessage $message): string {
                $role = $message->is_bot ? 'Assistant' : 'User';
                $text = Str::limit(trim((string) $message->message), self::SUMMARY_TRANSCRIPT_CHAR_LIMIT, '…');

                return "{$role}: {$text}";
            })
            ->implode("\n");

        $existingSummary = trim((string) ($this->conversationSummary ?? ''));

        $prompt = $existingSummary === ''
            ? "Summarize this chat in at most 4 short sentences for a travel support assistant. Keep tour names, booking numbers, and dates if mentioned.\n\n{$transcript}"
            : "Update this travel chat summary in at most 4 short sentences. Keep tour names, booking numbers, and dates if mentioned.\n\nExisting summary:\n{$existingSummary}\n\nNew messages:\n{$transcript}";

        $response = $this->prompt(
            $prompt,
            provider: $this->chatbotModelProvider,
            model: $this->chatbotModelName,
        );

        $this->trackTokenUsage($response);

        $summary = trim($response->text);

        if ($summary === '') {
            return;
        }

        $room->update([
            'meta' => array_merge($room->meta ?? [], [
                'conversation_summary' => $summary,
                'summary_through_message_id' => (int) $messagesToSummarize->last()->id,
            ]),
        ]);

        $this->conversationSummary = $summary;
    }
}
