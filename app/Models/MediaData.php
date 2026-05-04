<?php

namespace App\Models;

abstract class MediaData
{
  protected string $type;

  public function __construct(array $data = [])
  {
    $this->type = $this->getType();
    $this->fill($data);
  }

  abstract protected function getType(): string;

  abstract protected function fill(array $data): void;

  abstract public function toArray(): array;

  public function getTypeName(): string
  {
    return $this->type;
  }
}
