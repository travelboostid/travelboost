<?php
// database/factories/ChatMessageFactory.php
namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ChatMessageFactory extends Factory
{
  private static $messageIds = [];

  public function definition(): array
  {
    $hasAttachment = fake()->boolean(25);
    $attachmentType = $hasAttachment ? fake()->randomElement(['image', 'video', 'file', 'audio']) : null;

    return [
      'message' => $this->generateMessage($hasAttachment, $attachmentType),
      'attachment' => $hasAttachment ? $this->generateAttachment($attachmentType) : null,
      'attachment_type' => $attachmentType,
      'reply_to' => fake()->optional(0.3)->randomElement(self::$messageIds ?? []),
      'created_at' => fake()->dateTimeBetween('-6 months', 'now'),
      'updated_at' => fake()->dateTimeBetween('-6 months', 'now'),
    ];
  }

  private function generateMessage(bool $hasAttachment, ?string $attachmentType): string
  {
    if ($hasAttachment) {
      $messages = [
        'image' => ['Check out this photo!', 'Look at this image', 'Here\'s a picture'],
        'video' => ['Watch this video', 'Check this out', 'Video attachment'],
        'file' => ['Here\'s the document', 'File for you', 'Document attached'],
        'audio' => ['Voice message', 'Audio recording', 'Listen to this'],
      ];

      return fake()->randomElement($messages[$attachmentType]) . (fake()->boolean(70) ? ' ' . fake()->sentence() : '');
    }

    return fake()->randomElement([
      fake()->sentence(),
      fake()->paragraph(),
      fake()->text(200),
      'Hello! 👋',
      'How are you?',
      'Can we schedule a meeting?',
      'Did you see the latest update?',
      'Thanks for your help!',
      'I\'ll send you the file shortly.',
      'Let me know what you think.',
      'When are you available?',
      'That sounds great!',
      'I agree with you.',
      'Can you help me with this?',
      'Good morning! ☀️',
      'Good night! 🌙',
      'LOL 😂',
      'OMG!',
      'BRB',
      'TTYL',
    ]);
  }

  private function generateAttachment(string $type): string
  {
    $paths = [
      'image' => 'attachments/images/' . fake()->uuid() . '.jpg',
      'video' => 'attachments/videos/' . fake()->uuid() . '.mp4',
      'file' => 'attachments/files/' . fake()->word() . '.pdf',
      'audio' => 'attachments/audio/' . fake()->uuid() . '.mp3',
    ];

    return $paths[$type];
  }

  public function configure(): static
  {
    return $this->afterMaking(function ($message) {
      self::$messageIds[] = $message->id;
    });
  }

  public function withAttachment(string $type = 'image'): static
  {
    return $this->state(fn(array $attributes) => [
      'attachment_type' => $type,
      'attachment' => $this->generateAttachment($type),
      'message' => $this->generateMessage(true, $type),
    ]);
  }

  public function textOnly(): static
  {
    return $this->state(fn(array $attributes) => [
      'attachment' => null,
      'attachment_type' => null,
      'message' => fake()->paragraph(),
    ]);
  }
}
