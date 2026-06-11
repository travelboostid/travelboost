<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Standard message payload for simple API responses.
 *
 * @property-read string $message
 */
class MessageResource extends JsonResource
{
    /**
     * @param  array{message: string}|object{message: string}  $resource
     */
    public function __construct($resource)
    {
        parent::__construct($resource);
    }

    /**
     * @return array{message: string}
     */
    public function toArray(Request $request): array
    {
        return [
            'message' => (string) data_get($this->resource, 'message'),
        ];
    }
}
