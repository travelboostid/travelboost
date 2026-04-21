<?php

namespace App\Listeners;

use App\Events\TourCreated;
use App\Events\TourUpdated;
use App\Models\TourDocumentKnowledgeBase;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Storage;
use Laravel\Ai\Embeddings;

class UpdateTourVectorStore implements ShouldQueue
{
  /**
   * Create the event listener.
   */
  public function __construct()
  {
    // Dependency injection of ChatbotService for vector store operations
  }

  /**
   * Handle the TourCreated and TourUpdated events.
   * Rebuilds the vector store when a tour is created or updated.
   * This ensures chatbot knowledge base stays current with tour changes.
   *
   * @param  TourCreated|TourUpdated  $event  Contains the tour instance
   */
  public function handle(TourCreated|TourUpdated $event): void
  {
    $tour = $event->tour->fresh()->load('document');
    if (! $tour?->document?->data['url']) {
      return;
    }

    $url = $tour->document->data['url'];
    $relativePath = str_starts_with($url, '/storage/') ? substr($url, 9) : $url;
    $absolutePath = Storage::disk('public')->path($relativePath);

    if (! file_exists($absolutePath)) {
      return;
    }

    $text = $this->readPdfAsPlainText($absolutePath);
    $chunks = collect(
      $this->splitText($text, 2000, '.', 50)
    );

    if ($chunks->isEmpty()) {
      return;
    }

    $allEmbeddings = [];

    $chunks
      ->chunk(10)
      ->each(function ($batch) use (&$allEmbeddings) {
        $result = Embeddings::for($batch->values()->all())
          ->cache(3600)
          ->generate();

        foreach ($result->embeddings as $embedding) {
          $allEmbeddings[] = $embedding;
        }

        sleep(1);
      });

    TourDocumentKnowledgeBase::where('tour_id', $tour->id)->delete();

    foreach ($chunks->values() as $index => $chunk) {
      TourDocumentKnowledgeBase::create([
        'tour_id' => $tour->id,
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
}
