<?php

namespace App\Support;

final class StreamingMessageText
{
    public function __construct(
        private string $text = '',
        private bool $needsParagraphBreak = false,
    ) {}

    public function onTextSegmentStart(): void
    {
        if ($this->text !== '') {
            $this->needsParagraphBreak = true;
        }
    }

    public function appendDelta(string $delta): void
    {
        if ($this->needsParagraphBreak) {
            if (! str_ends_with($this->text, "\n\n")) {
                $this->text .= str_ends_with($this->text, "\n") ? "\n" : "\n\n";
            }

            $this->needsParagraphBreak = false;
        }

        $this->text .= $delta;
    }

    public function toString(): string
    {
        return $this->text;
    }

    public function isEmpty(): bool
    {
        return $this->text === '';
    }
}
