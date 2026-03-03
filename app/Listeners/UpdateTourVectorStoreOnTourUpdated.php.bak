<?php

namespace App\Listeners;

use App\Events\TourUpdated;
use App\Services\ChatbotService;
use App\Services\Document;
use App\Services\DocumentSplitter;
use App\Services\FileDataReader;
use Illuminate\Container\Attributes\Log;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log as FacadesLog;
use Laravel\Ai\Embeddings;

class UpdateTourVectorStoreOnTourUpdated
{
  /**
   * Create the event listener.
   * 
   * @param ChatbotService $chatbotService Service for chatbot operations
   */
  public function __construct(private ChatbotService $chatbotService)
  {
    // Dependency injection of ChatbotService for vector store operations
  }

  /**
   * Handle the TourUpdated event.
   * Rebuilds the vector store when a tour is updated.
   * This ensures chatbot knowledge base stays current with tour changes.
   * 
   * @param TourUpdated $event Contains the updated tour instance
   */
  public function handle(TourUpdated $event): void
  {
    FacadesLog::info("tour updated event received for tour ID: {$event->tour->id}");
    // Delegate vector store update to the chatbot service
    $this->chatbotService->buildTourVectorStore($event->tour);
    // $reader = new FileDataReader("");
    // $documents = $reader->getDocuments();
    // $splittedDocuments = DocumentSplitter::splitDocuments($documents);
    // $stringDocs = Arr::map($splittedDocuments, function (Document $document) {
    //   return $document->content;
    // });
    // $response = Embeddings::for($stringDocs)->generate();
    // $response->
  }
}
