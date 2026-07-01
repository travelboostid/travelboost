<?php

use App\Support\StreamingMessageText;

test('streaming message text inserts paragraph break between tool text segments', function () {
    $streamedText = new StreamingMessageText;

    $streamedText->appendDelta('Let me check.');
    $streamedText->onTextSegmentStart();
    $streamedText->appendDelta('Here are the tours.');

    expect($streamedText->toString())->toBe("Let me check.\n\nHere are the tours.");
});

test('streaming message text does not duplicate paragraph breaks', function () {
    $streamedText = new StreamingMessageText;

    $streamedText->appendDelta("First segment.\n\n");
    $streamedText->onTextSegmentStart();
    $streamedText->appendDelta('Second segment.');

    expect($streamedText->toString())->toBe("First segment.\n\nSecond segment.");
});

test('streaming message text preserves single trailing newline before next segment', function () {
    $streamedText = new StreamingMessageText;

    $streamedText->appendDelta("First segment.\n");
    $streamedText->onTextSegmentStart();
    $streamedText->appendDelta('Second segment.');

    expect($streamedText->toString())->toBe("First segment.\n\nSecond segment.");
});
