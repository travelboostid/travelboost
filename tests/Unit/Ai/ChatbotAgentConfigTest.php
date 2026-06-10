<?php

use App\Support\NumericStringConfig;

test('numeric string config normalizes chatbot pricing values', function () {
    expect(NumericStringConfig::normalize(1800))->toBe('1800')
        ->and(NumericStringConfig::normalize('75'))->toBe('75')
        ->and(NumericStringConfig::normalize(400.5))->toBe('400.5')
        ->and(NumericStringConfig::normalize(null))->toBe('0')
        ->and(NumericStringConfig::normalize(''))->toBe('0')
        ->and(NumericStringConfig::normalize('not-a-number'))->toBe('0');
});
