<?php

namespace App\Services;

use RuntimeException;
use Throwable;

class MidtransException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly ?string $statusCode = null,
        public readonly ?array $response = null,
    ) {
        parent::__construct($message);
    }

    public static function fromThrowable(Throwable $exception): self
    {
        $message = $exception->getMessage();
        $response = null;
        $statusCode = null;

        if (preg_match('/API response:\s*(\{.*\})\s*$/s', $message, $matches) === 1) {
            $decoded = json_decode($matches[1], true);

            if (is_array($decoded)) {
                $response = $decoded;
                $statusCode = isset($decoded['status_code']) ? (string) $decoded['status_code'] : null;
                $statusMessage = isset($decoded['status_message']) ? (string) $decoded['status_message'] : null;

                if ($statusMessage !== null && $statusMessage !== '') {
                    $message = $statusMessage;
                }
            }
        }

        return new self($message, $statusCode, $response);
    }
}
