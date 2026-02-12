<?php

namespace App\Providers;

use App\Models\WalletTopup;
use App\Services\ChatbotService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;
use LLPhant\Chat\ChatInterface;
use LLPhant\Chat\OpenAIChat;
use LLPhant\Embeddings\EmbeddingGenerator\EmbeddingGeneratorInterface;
use LLPhant\Embeddings\EmbeddingGenerator\OpenAI\OpenAI3SmallEmbeddingGenerator;
use LLPhant\OpenAIConfig;

class AppServiceProvider extends ServiceProvider
{
  /**
   * Register any application services.
   */
  public function register(): void
  {
    $this->app->singleton(ImageManager::class, function () {
      return new ImageManager(new Driver());
    });
    $this->app->singleton(ChatbotService::class, function ($app) {
      $embeddingGenerator = $app->make(EmbeddingGeneratorInterface::class);
      $chatInterface = $app->make(ChatInterface::class);
      return new ChatbotService($chatInterface, $embeddingGenerator);
    });
    $this->app->singleton(OpenAIConfig::class, function () {
      $config = new OpenAIConfig();
      $config->apiKey = env('OPENAI_API_KEY'); // read from .env
      return $config;
    });
    $this->app->singleton(ChatInterface::class, function ($app) {
      $config = $app->make(OpenAIConfig::class);
      $chat = new OpenAIChat($config);
      return $chat;
    });
    $this->app->singleton(EmbeddingGeneratorInterface::class, function ($app) {
      $config = $app->make(OpenAIConfig::class);
      $chat = new OpenAI3SmallEmbeddingGenerator($config);
      return $chat;
    });
  }


  /**
   * Bootstrap any application services.
   */
  public function boot(): void
  {
    Relation::morphMap([
      'wallet-topup' => WalletTopup::class,
    ]);

    $this->configureDefaults();
  }

  /**
   * Configure default behaviors for production-ready applications.
   */
  protected function configureDefaults(): void
  {
    Date::use(CarbonImmutable::class);

    DB::prohibitDestructiveCommands(
      app()->isProduction(),
    );

    Password::defaults(
      fn(): ?Password => app()->isProduction()
        ? Password::min(12)
        ->mixedCase()
        ->letters()
        ->numbers()
        ->symbols()
        ->uncompromised()
        : null
    );
  }
}
