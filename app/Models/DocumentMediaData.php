<?php

namespace App\Models;

class DocumentMediaData extends MediaData
{
  public string $provider = '';
  public string $url = '';
  public string $mediaType = '';

  protected function getType(): string
  {
    return 'document';
  }

  protected function fill(array $data): void
  {
    $this->provider = $data['provider'] ?? '';
    $this->url = $data['url'] ?? '';
    $this->mediaType = $data['mediaType'] ?? '';
  }

  public function toArray(): array
  {
    return [
      'type' => $this->getType(),
      'provider' => $this->provider,
      'url' => $this->url,
      'mediaType' => $this->mediaType,
    ];
  }
}
