<?php

use App\Enums\MediaType;
use App\Models\Media;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('image uploads are stored as webp variants', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/webapi/medias', [
        'owner_id' => $user->id,
        'owner_type' => User::class,
        'name' => 'Profile photo',
        'type' => 'image',
        'subtype' => 'photo',
        'data' => UploadedFile::fake()->image('profile.jpg', 900, 900),
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.type', 'image')
        ->assertJsonPath('data.subtype', 'photo');

    $files = $response->json('data.data.files');

    expect($files)->not->toBeEmpty();

    foreach ($files as $file) {
        expect($file['url'])->toEndWith('.webp')
            ->and($file['media_type'])->toBe('image/webp');

        Storage::disk('public')->assertExists(str_replace('/storage/', '', $file['url']));
    }
});

test('document uploads keep original pdf media type', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/webapi/medias', [
        'owner_id' => $user->id,
        'owner_type' => User::class,
        'name' => 'Tour document',
        'type' => 'document',
        'subtype' => 'tour-document',
        'data' => UploadedFile::fake()->create('itinerary.pdf', 64, 'application/pdf'),
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('data.type', 'document')
        ->assertJsonPath('data.subtype', 'tour-document')
        ->assertJsonPath('data.data.media_type', 'application/pdf');

    expect($response->json('data.data.url'))->toEndWith('.pdf');
});

test('media index filters image uploads by subtype', function () {
    $user = User::factory()->create();

    $photo = Media::create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'name' => 'Profile photo',
        'type' => MediaType::IMAGE,
        'subtype' => 'photo',
        'data' => ['files' => []],
    ]);
    $tourImage = Media::create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'name' => 'Tour cover',
        'type' => MediaType::IMAGE,
        'subtype' => 'tour-image',
        'data' => ['files' => []],
    ]);

    $this->actingAs($user)
        ->getJson("/webapi/medias?owner_type=App%5CModels%5CUser&owner_id={$user->id}&type=image&subtype=photo")
        ->assertSuccessful()
        ->assertJsonPath('data.0.id', $photo->id)
        ->assertJsonMissingPath('data.1');

    $this->actingAs($user)
        ->getJson("/webapi/medias?owner_type=App%5CModels%5CUser&owner_id={$user->id}&type=image&subtype=tour-image")
        ->assertSuccessful()
        ->assertJsonPath('data.0.id', $tourImage->id)
        ->assertJsonMissingPath('data.1');
});
