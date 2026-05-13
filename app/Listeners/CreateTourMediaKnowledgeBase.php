<?php

namespace App\Listeners;

use App\Enums\MediaType;
use App\Events\MediaCreated;
use App\Models\AppConfig;
use App\Models\KnowledgeBase;
use App\Models\Media;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Storage;
use Laravel\Ai\Embeddings;

class CreateTourMediaKnowledgeBase implements ShouldQueue
{
  use InteractsWithQueue;

  /**
   * Create the event listener.
   */
  public function __construct()
  {
    //
  }

  /**
   * Handle the event.
   */
  public function handle(MediaCreated $event): void
  {
    $media = $event->media;
    if ($media->type !== MediaType::DOCUMENT || $media->subtype !== 'tour-document')
      return;

    $config = AppConfig::where('key', 'chatbot')->first()?->value;
    if ($config == null) return;

    if (! $media?->data['url']) {
      return;
    }

    $url = $media->data['url'];
    $relativePath = str_starts_with($url, '/storage/') ? substr($url, 9) : $url;
    $absolutePath = Storage::disk('public')->path($relativePath);

    if (! file_exists($absolutePath)) {
      return;
    }

    $text = $this->readPdfAsPlainText($absolutePath);
    $text = $this->cleanText($text);
    $chunks = collect(
      $this->splitText($text, 1200, '.', 150)
    );

    if ($chunks->isEmpty()) {
      return;
    }

    $allEmbeddings = [];

    $chunks
      ->chunk(10)
      ->each(function ($batch) use (&$allEmbeddings, $config) {
        $result = Embeddings::for($batch->values()->all())
          ->cache(3600)
          ->generate(
            provider: $config['embedding_model_provider'],
            model: $config['embedding_model_name'],
          );

        foreach ($result->embeddings as $embedding) {
          $allEmbeddings[] = $embedding;
        }

        sleep(1);
      });
    foreach ($chunks->values() as $index => $chunk) {
      KnowledgeBase::create([
        'owner_type' => Media::class,
        'owner_id' => $media->id,
        'content' => $chunk,
        'embedding' => $allEmbeddings[$index] ?? null,
      ]);
    }
  }

  private function readPdfAsPlainText(string $filePath): string
  {
    $parser = new \Smalot\PdfParser\Parser;
    $pdf = $parser->parseFile($filePath);
    $text = $pdf->getText();

    return $text;
  }

  private function splitText(string $text, int $maxLength = 1000, string $separator = ' ', int $wordOverlap = 0, bool $keepSeparator = false): array
  {
    if (empty($text)) {
      return [];
    }
    if ($maxLength <= 0) {
      return [];
    }

    if ($separator === '') {
      return [];
    }

    if (strlen($text) <= $maxLength) {
      return [$text];
    }

    $words = explode($separator, $text);
    if ($wordOverlap > 0) {
      $chunks = $this->createChunksWithOverlap($words, $maxLength, $separator, $wordOverlap, $keepSeparator);
    } else {
      $chunks = $this->createChunksWithoutOverlap($words, $maxLength, $separator, $keepSeparator);
    }

    return $chunks;
  }

  /**
   * @param  array<string>  $words
   * @return array<string>
   */
  private function createChunksWithoutOverlap(array $words, int $maxLength, string $separator, bool $keepSeparator = false): array
  {
    $chunks = [];
    $currentChunk = '';
    foreach ($words as $word) {
      if (strlen($currentChunk . $separator . $word) <= $maxLength || empty($currentChunk)) {
        if (empty($currentChunk)) {
          $currentChunk = $word;
        } else {
          $currentChunk .= $separator . $word;
        }
      } else {
        $chunks[] = $keepSeparator ? $currentChunk . $separator : trim($currentChunk);
        $currentChunk = $word;
      }
    }

    if (! empty($currentChunk)) {
      $chunks[] = trim($currentChunk);
    }

    return $chunks;
  }

  /**
   * @param  array<string>  $words
   * @return array<string>
   */
  private function createChunksWithOverlap(array $words, int $maxLength, string $separator, int $wordOverlap, bool $keepSeparator = false): array
  {
    $chunks = [];
    $currentChunk = [];
    $currentChunkLength = 0;
    foreach ($words as $word) {
      if ($word === '') {
        continue;
      }

      if ($currentChunkLength + strlen($separator . $word) <= $maxLength || $currentChunk === []) {
        $currentChunk[] = $word;
        $currentChunkLength = $this->calcChunkLength($currentChunk, $separator);
      } else {
        $chunkText = implode($separator, $currentChunk);
        $chunks[] = $keepSeparator ? $chunkText . $separator : $chunkText;

        $calculatedOverlap = min($wordOverlap, count($currentChunk) - 1);
        $overlapWords = $calculatedOverlap > 0 ? array_slice($currentChunk, -$calculatedOverlap) : [];

        $currentChunk = [...$overlapWords, $word];
        $currentChunk[0] = trim($currentChunk[0]);
        $currentChunkLength = $this->calcChunkLength($currentChunk, $separator);
      }
    }

    if ($currentChunk !== []) {
      $chunks[] = implode($separator, $currentChunk);
    }

    return $chunks;
  }

  /**
   * @param  array<string>  $currentChunk
   */
  private function calcChunkLength(array $currentChunk, string $separator): int
  {
    return array_sum(array_map('strlen', $currentChunk)) + count($currentChunk) * strlen($separator) - 1;
  }

  private function cleanText(string $text): string
  {
    // 1. Fix hyphenated line breaks
    $text = preg_replace('/(\w)-\s+(\w)/u', '$1$2', $text);
    // 2. Normalize all newlines to space
    $text = preg_replace("/\s*\n\s*/u", ' ', $text);
    // 3. Normalize whitespace
    $text = preg_replace('/\s+/u', ' ', $text);
    // 4. Fix multiple dots
    $text = preg_replace('/\.{2,}/', '.', $text);
    // 5. Remove invisible characters
    $text = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]/u', '', $text);

    return trim($text);
  }
}
