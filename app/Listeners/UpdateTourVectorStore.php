<?php

namespace App\Listeners;

use App\Events\TourCreated;
use App\Events\TourUpdated;
use App\Models\TourDocumentKnowledgeBase;
use Illuminate\Support\Facades\Storage;
use Laravel\Ai\Embeddings;

class UpdateTourVectorStore
{
  /**
   * Create the event listener.
   * 
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
   * @param TourCreated|TourUpdated $event Contains the tour instance
   */
  public function handle(TourCreated|TourUpdated $event): void
  {
    $tour = $event->tour;
    if (! $tour?->document?->data['url']) {
      return;
    }

    // Resolve absolute file path
    $relativePath = ltrim($tour->document->data['url'], '/storage/');
    $absolutePath = Storage::disk('public')->path($relativePath);

    if (! file_exists($absolutePath)) {
      return;
    }

    $text = $this->readPdfAsPlainText($absolutePath);
    $chunks = $this->splitText($text, 2000, '.', 50);
    $embeddings = Embeddings::for($chunks)->cache(3600)->generate();

    // Clear existing knowledge base entries for the tour
    TourDocumentKnowledgeBase::where('tour_id', $tour->id)->delete();

    // Store new chunks and their embeddings in the knowledge base
    foreach ($chunks as $index => $chunk) {
      TourDocumentKnowledgeBase::create([
        'tour_id' => $tour->id,
        'content' => $chunk,
        'embedding' => $embeddings->embeddings[$index] ?? null,
      ]);
    }
  }

  private function readPdfAsPlainText(string $filePath): string
  {
    $parser = new \Smalot\PdfParser\Parser();
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
      // This method is not really necessary anymore.
      // The new `createChunksWithOverlap` method handles this too.
      // But to prevent possible bugs when introducing the new method,
      // We will handle this case with the old method for now.
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
        // Add the chunk with overlap
        $chunkText = implode($separator, $currentChunk);
        $chunks[] = $keepSeparator ? $chunkText . $separator : $chunkText;

        // Calculate overlap words
        $calculatedOverlap = min($wordOverlap, count($currentChunk) - 1);
        $overlapWords = $calculatedOverlap > 0 ? array_slice($currentChunk, -$calculatedOverlap) : [];

        // Start a new chunk with overlap words
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
