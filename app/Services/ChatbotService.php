<?php

namespace App\Services;

use App\Events\ChatMessageCreated;
use App\Models\ChatMessage;
use App\Models\ChatRoomMember;
use App\Models\Tour;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use LLPhant\Chat\ChatInterface;
use LLPhant\Chat\Message;
use LLPhant\Embeddings\DataReader\FileDataReader;
use LLPhant\Embeddings\DocumentSplitter\DocumentSplitter;
use LLPhant\Embeddings\EmbeddingGenerator\EmbeddingGeneratorInterface;
use LLPhant\Embeddings\VectorStores\FileSystem\FileSystemVectorStore;
use LLPhant\Embeddings\VectorStores\Memory\MemoryVectorStore;
use LLPhant\Embeddings\VectorStores\VectorStoreBase;
use LLPhant\Query\SemanticSearch\QuestionAnswering;

class ChatbotService
{
  private VectorStoreBase $defaultVectorStore;
  public function __construct(private ChatInterface $openai, private EmbeddingGeneratorInterface $embeddingGenerator)
  {
    $this->defaultVectorStore = new MemoryVectorStore();
  }

  public function buildTourVectorStore(Tour $tour)
  {
    Log::info("buildTourVectorStore", ["tour" => $tour]);
    // 1️⃣ Guard: no document
    if (! $tour->document || empty($tour->document->data['url'])) return;

    // 2️⃣ Resolve absolute file path
    $relativePath = ltrim($tour->document->data['url'], '/storage/');
    $absolutePath = Storage::disk('public')->path($relativePath);

    if (! file_exists($absolutePath)) return;

    // 3️⃣ Read PDF
    $dataReader = new FileDataReader($absolutePath);
    $documents = $dataReader->getDocuments();

    if (empty($documents)) return;

    // 4️⃣ Chunking & embedding
    $splitDocuments = DocumentSplitter::splitDocuments(
      $documents,
      2000
    );

    $embeddedDocuments = $this->embeddingGenerator
      ->embedDocuments($splitDocuments);

    // 1️⃣ Define FILE path
    $relativeVectorStoreFilePath = "vector-stores/tours/{$tour->id}.json";
    $vectorStoreFilePath =  Storage::disk('local')->path($relativeVectorStoreFilePath);
    if (file_exists($vectorStoreFilePath)) {
      unlink($vectorStoreFilePath);
    }
    // 2️⃣ Ensure PARENT DIRECTORY exists
    $directory = dirname($vectorStoreFilePath);
    if (! is_dir($directory)) {
      mkdir($directory, 0755, true);
    }

    // 6️⃣ Store vectors
    $vectorStore = new FileSystemVectorStore($vectorStoreFilePath);
    $vectorStore->addDocuments($embeddedDocuments);
  }

  private function getRelevantVectorStore(ChatMessage $message)
  {
    $tourContext = ChatMessage::query()
      ->where('room_id', $message->room_id)
      ->where('attachment_type', 'tour')
      ->latest('created_at') // or just ->latest()
      ->first();

    Log::info('tourCtx', ['ctx' => $tourContext]);
    if (! $tourContext) return $this->defaultVectorStore;

    $relativeVectorStoreFilePath = "vector-stores/tours/$tourContext->attachment.json";
    $vectorStoreFilePath =  Storage::disk('local')->path($relativeVectorStoreFilePath);
    if (! file_exists($vectorStoreFilePath)) return $this->defaultVectorStore;
    $vectorStore = new FileSystemVectorStore($vectorStoreFilePath);
    return $vectorStore;
  }

  private function getRecentMessagesForContext(ChatMessage $currentMessage): array
  {
    // Get last 10 messages in this room (chronological order)
    $recentMessages = ChatMessage::query()
      ->where('room_id', $currentMessage->room_id)
      ->latest('id')
      ->take(10)
      ->get()
      ->reverse();

    return $recentMessages
      ->map(fn(ChatMessage $msg) => $this->toLlmMessage($msg))
      ->values()
      ->all();
  }

  private function toLlmMessage(ChatMessage $msg): Message
  {
    $content = $msg->message;

    if ($msg->attachment_type === 'tour') {
      if ($tour = Tour::find($msg->attachment)) {
        $content .= "\n\n---\nAdditional context:\nAsking about tour package: {$tour->name}";
      }
    }

    return $msg->is_bot
      ? Message::assistant($content)
      : Message::user($content);
  }


  public function answer(ChatMessage $message, ChatRoomMember $as)
  {
    $vectorStore = $this->getRelevantVectorStore($message);

    $qa = new QuestionAnswering(
      $vectorStore,
      $this->embeddingGenerator,
      $this->openai,
    );

    $qa->systemMessageTemplate = <<<PROMPT
You are an AI chatbot assisting users in a private chat.

Rules:
- Use the provided knowledge base when relevant.
- If the answer is not in the knowledge base, respond based on chat context.
- If you are unsure, say you are unsure and ask for clarification.
- Keep answers short, clear, and friendly.
- Do not mention embeddings, vectors, or internal systems.

{context}
PROMPT;

    // 2️⃣ Convert to LLM messages
    $chatContext = $this->getRecentMessagesForContext($message);
    Log::info("Chat context", ["ctx" => $chatContext]);
    $answerStream = $qa->answerQuestionFromChat($chatContext);
    $answer = $answerStream->getContents();
    $reply = ChatMessage::create([
      'room_id' => $message->room_id,
      'sender_id' => $as->user_id,
      'message' => $answer,
      'attachment' => null,
      'attachment_type' => null,
      'reply_to' => null,
      'is_bot' => true
    ]);
    $reply->load(['sender', 'room', 'replyTo']);
    $reply->room()->update([
      'last_message_id' => $message->id,
    ]);
    ChatMessageCreated::dispatch($reply);
  }
}
