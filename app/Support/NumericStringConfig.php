<?php

namespace App\Support;

class NumericStringConfig
{
    public static function normalize(mixed $value, string $default = '0'): string
    {
        if ($value === null || $value === '') {
            return $default;
        }

        if (! is_numeric($value)) {
            return $default;
        }

        return (string) $value;
    }
}
