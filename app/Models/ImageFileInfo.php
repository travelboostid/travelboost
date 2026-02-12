<?php

namespace App\Models;

class ImageFileInfo
{
  public string $code = '';
  public int $width = 0;
  public int $height = 0;
  public string $url = '';
  public int $size = 0;
  public string $mediaType = '';

  public function __construct(array $data = [])
  {
    $this->fill($data);
  }

  public function fill(array $data): void
  {
    $this->code = $data['code'] ?? '';
    $this->width = $data['width'] ?? 0;
    $this->height = $data['height'] ?? 0;
    $this->url = $data['url'] ?? '';
    $this->size = $data['size'] ?? 0;
    $this->mediaType = $data['mediaType'] ?? '';
  }

  public function toArray(): array
  {
    return [
      'code' => $this->code,
      'width' => $this->width,
      'height' => $this->height,
      'url' => $this->url,
      'size' => $this->size,
      'mediaType' => $this->mediaType,
    ];
  }
}
