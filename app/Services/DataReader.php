<?php

namespace App\Services;

use LLPhant\Embeddings\Document;

interface DataReader
{
  /**
   * @return Document[]
   */
  public function getDocuments(): array;
}
