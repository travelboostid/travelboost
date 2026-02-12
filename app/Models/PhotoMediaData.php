<?php

namespace App\Models;

class PhotoMediaData extends MediaData
{
  public string $provider = '';
  /** @var ImageFileInfo[] */
  public array $files = [];

  protected function getType(): string
  {
    return 'photo';
  }

  protected function fill(array $data): void
  {
    $this->provider = $data['provider'] ?? '';

    $this->files = array_map(function ($fileData) {
      return new ImageFileInfo($fileData);
    }, $data['files'] ?? []);
  }

  public function toArray(): array
  {
    return [
      'type' => $this->getType(),
      'provider' => $this->provider,
      'files' => array_map(fn($file) => $file->toArray(), $this->files),
    ];
  }
}
