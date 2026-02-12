<?php

namespace App\Enums;

enum MediaType: string
{
  case Photo = 'photo';
  case Image = 'image';
  case Document = 'document';

  public function label(): string
  {
    return match ($this) {
      self::Photo => 'Photo',
      self::Image => 'Image',
      self::Document => 'Document',
    };
  }
}
