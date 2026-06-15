<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\MediaIndexRequest;
use App\Http\Requests\MediaUpdateRequest;
use App\Http\Requests\StoreMediaRequest;
use App\Http\Resources\MediaResource;
use App\Http\Resources\MessageResource;
use App\Models\Media;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;

class MediaController extends Controller
{
    private ImageManager $imageManager;

    public function __construct()
    {
        $this->imageManager = new ImageManager(new Driver);
    }

    /**
     * List media for an owner. Requires `owner_type` and `owner_id` unless platform admin.
     *
     * @operationId getMedias
     */
    public function index(MediaIndexRequest $request): AnonymousResourceCollection
    {
        $pageSize = (int) $request->query('page_size', 20);

        $medias = Media::query()
            ->when($request->input('owner_type'), function ($query, $ownerType) {
                $query->where('owner_type', $ownerType);
            })
            ->when($request->input('owner_id'), function ($query, $ownerId) {
                $query->where('owner_id', $ownerId);
            })
            ->when(
                $request->filled('type'),
                fn ($q) => $q->where('type', $request->query('type'))
            )
            ->when(
                $request->filled('subtype'),
                fn ($q) => $q->where('subtype', $request->query('subtype'))
            )
            ->latest()
            ->paginate($pageSize);

        return MediaResource::collection($medias);
    }

    /**
     * Upload a file and create a media record.
     *
     * @operationId createMedia
     *
     * @requestMediaType multipart/form-data
     */
    public function store(StoreMediaRequest $request): MediaResource
    {
        $validated = $request->validated();
        $file = $request->file('data');

        $this->authorize('createForOwner', [
            Media::class,
            $validated['owner_type'],
            (int) $validated['owner_id'],
        ]);

        $data = match ($validated['type']) {
            'image' => $this->createPhotoOrImage(
                $validated,
                $validated['subtype'] === 'photo' ? $this->photoVariants() : $this->imageVariants()
            ),
            'document' => $this->createDocument($validated),
            'raw' => $this->createRaw($validated),
            default => throw new \InvalidArgumentException("Type {$validated['type']} not implemented"),
        };

        $media = Media::create([
            'owner_type' => $validated['owner_type'],
            'owner_id' => $validated['owner_id'],
            'name' => $validated['name'] ?? $file->getClientOriginalName(),
            'description' => $validated['description'] ?? '',
            'type' => $validated['type'],
            'subtype' => $validated['subtype'],
            'data' => $data,
        ]);

        return new MediaResource($media);
    }

    /**
     * Get a single media item.
     *
     * @operationId getMedia
     */
    public function show(Media $media): MediaResource
    {
        $this->authorize('view', $media);

        return new MediaResource(
            $media->load('owner')
        );
    }

    /**
     * Update media metadata (name, description).
     *
     * @operationId updateMedia
     */
    public function update(MediaUpdateRequest $request, Media $media): MediaResource
    {
        $this->authorize('update', $media);

        $media->update($request->validated());

        return new MediaResource($media);
    }

    /**
     * Delete a media item and its stored files.
     *
     * @operationId deleteMedia
     */
    public function destroy(Media $media): MessageResource
    {
        $this->authorize('delete', $media);

        $media->delete();

        return new MessageResource([
            'message' => 'Media deleted',
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @param  list<array{code: string, width: int, height: int, always_resized: bool, quality: int}>  $variants
     * @return array{files: list<array<string, mixed>>}
     */
    private function createPhotoOrImage(array $validated, array $variants): array
    {
        $file = $validated['data'];
        $files = [];
        $image = $this->imageManager->decode($file->getRealPath() ?: $file->getPathname());

        foreach ($variants as $variant) {
            if (
                $variant['width'] > 0 &&
                $image->width() < $variant['width'] &&
                ! $variant['always_resized']
            ) {
                continue;
            }

            $clone = clone $image;

            if ($variant['width'] > 0 && $variant['height'] > 0) {
                $clone->cover($variant['width'], $variant['height']);
            } elseif ($variant['width'] > 0) {
                $clone->scale(width: $variant['width']);
            }

            $filename = uniqid()."_{$variant['code']}.webp";
            $path = "images/{$variant['code']}_{$filename}";

            Storage::disk('public')->put(
                $path,
                (string) $clone->encode(new WebpEncoder(quality: $variant['quality']))
            );

            $files[] = [
                'code' => $variant['code'],
                'width' => $clone->width(),
                'height' => $clone->height(),
                'path' => $path,
                'url' => Storage::disk('public')->url($path),
                'size' => Storage::disk('public')->size($path),
                'media_type' => 'image/webp',
            ];
        }

        return ['files' => $files];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function createDocument(array $validated): array
    {
        $file = $validated['data'];
        $filename = uniqid().'.'.$file->getClientOriginalExtension();
        $path = "media/documents/$filename";
        Storage::disk('public')->putFileAs('media/documents', $file, $filename);

        return [
            'path' => $path,
            'url' => Storage::disk('public')->url($path),
            'size' => Storage::disk('public')->size($path),
            'media_type' => $file->getClientMimeType(),
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function createRaw(array $validated): array
    {
        $file = $validated['data'];
        $filename = uniqid().'.'.$file->getClientOriginalExtension();
        $path = "media/raw/$filename";
        Storage::disk('public')->putFileAs('media/raw', $file, $filename);

        return [
            'path' => $path,
            'url' => Storage::disk('public')->url($path),
            'size' => Storage::disk('public')->size($path),
            'media_type' => $file->getClientMimeType(),
        ];
    }

    /**
     * @return list<array{code: string, width: int, height: int, always_resized: bool, quality: int}>
     */
    private function photoVariants(): array
    {
        return [
            ['code' => 'original', 'width' => 0, 'height' => 0, 'always_resized' => false, 'quality' => 85],
            ['code' => 'large', 'width' => 720, 'height' => 720, 'always_resized' => false, 'quality' => 85],
            ['code' => 'medium', 'width' => 480, 'height' => 480, 'always_resized' => false, 'quality' => 75],
            ['code' => 'small', 'width' => 320, 'height' => 320, 'always_resized' => true, 'quality' => 75],
            ['code' => 'thumb', 'width' => 240, 'height' => 240, 'always_resized' => true, 'quality' => 75],
        ];
    }

    /**
     * @return list<array{code: string, width: int, height: int, always_resized: bool, quality: int}>
     */
    private function imageVariants(): array
    {
        return [
            ['code' => 'original', 'width' => 0, 'height' => 0, 'always_resized' => false, 'quality' => 85],
            ['code' => 'large', 'width' => 1080, 'height' => 0, 'always_resized' => false, 'quality' => 85],
            ['code' => 'medium', 'width' => 720, 'height' => 0, 'always_resized' => false, 'quality' => 85],
            ['code' => 'small', 'width' => 480, 'height' => 0, 'always_resized' => true, 'quality' => 75],
            ['code' => 'thumb', 'width' => 320, 'height' => 0, 'always_resized' => true, 'quality' => 75],
        ];
    }
}
