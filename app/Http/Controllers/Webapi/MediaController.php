<?php

namespace App\Http\Controllers\Webapi;

use App\Enums\MediaType;
use App\Http\Requests\StoreMediaRequest;
use App\Models\Media;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Requests\MediaIndexRequest;
use App\Http\Requests\MediaUpdateRequest;
use App\Http\Resources\MediaResource;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Encoders\JpegEncoder;
use Intervention\Image\ImageManager;

class MediaController extends Controller
{
  public function __construct(
    private ImageManager $imageManager
  ) {}
  /**
   * Get medias
   * @param Request $request
   * @throws \Exception
   * @return JsonResource
   * @operationId getMedias
   * */
  public function index(MediaIndexRequest $request)
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
        fn($q) => $q->where('type', $request->query('type'))
      )
      ->latest()
      ->paginate($pageSize);

    return MediaResource::collection($medias);
  }

  /**
   * Create media
   * @operationId createMedia
   * @requestMediaType multipart/form-data
   */
  public function store(StoreMediaRequest $request)
  {
    // Validasi request
    $validated = $request->validated();
    $file = $request->file('data');
    // Dispatch to correct private method
    switch ($validated['type']) {
      case 'photo':
        $data = $this->createPhotoOrImage($validated, $this->photoVariants());
        break;
      case 'image':
        $data = $this->createPhotoOrImage($validated, $this->imageVariants());
        break;
      case 'document':
        $data = $this->createDocument($validated);
        break;
      default:
        throw new \Exception("Type {$validated['type']} not implemented");
    }

    // Save media
    $media = Media::create([
      'owner_type' => $validated['owner_type'],
      'owner_id' => $validated['owner_id'],
      'name' => $validated['name'] ?? $file->getClientOriginalName(),
      'description' => $validated['description'] ?? "",
      'type' => $validated['type'],
      'data' => $data,
    ]);

    return new MediaResource($media);
  }

  public function show(Media $media)
  {
    $this->authorizeMedia($media);

    return new MediaResource(
      $media->load('user')
    );
  }

  public function update(MediaUpdateRequest $request, Media $media)
  {
    $this->authorizeMedia($media);

    $validated = $request->validated();
    $media->update($validated);

    return new MediaResource($media);
  }

  public function destroy(Media $media)
  {
    $this->authorizeMedia($media);

    $media->delete();

    return response()->json([
      'message' => 'Media deleted',
    ]);
  }

  protected function authorizeMedia(Media $media): void
  {
    abort_if(
      $media->user_id !== Auth::id(),
      403,
      'Unauthorized'
    );
  }

  private function createPhotoOrImage(array $validated, array $variants)
  {
    $file = $validated['data'];

    $files = [];

    $image = $this->imageManager->read($file);

    foreach ($variants as $variant) {
      // Skip if width > original and not always resized
      if (
        $variant['width'] > 0 &&
        $image->width() < $variant['width'] &&
        !$variant['always_resized']
      ) {
        continue;
      }

      // ✅ clone FIRST
      $clone = clone $image;

      if ($variant['width'] > 0 && $variant['height'] > 0) {
        // exact crop
        $clone->cover($variant['width'], $variant['height']);
      } elseif ($variant['width'] > 0) {
        // aspect ratio resize
        $clone->scale(width: $variant['width']);
      }

      $filename = uniqid() . "_{$variant['code']}.jpg";
      $path = "images/{$variant['code']}_{$filename}";

      Storage::disk('public')->put(
        $path,
        (string) $clone->encode(
          new JpegEncoder(quality: $variant['quality'])
        )
      );

      $files[] = [
        'code' => $variant['code'],
        'width' => $clone->width(),
        'height' => $clone->height(),
        'url' => Storage::url($path),
        'size' => Storage::disk('public')->size($path),
        'media_type' => 'image/jpeg',
      ];
    }

    return [
      'files' => $files,
    ];
  }


  private function createDocument(array $validated)
  {
    $file = $validated['data'];

    $filename = uniqid() . '.' . $file->getClientOriginalExtension();
    $path = "media/documents/$filename";
    Storage::disk('public')->putFileAs('media/documents', $file, $filename);

    return [
      'url' => Storage::url($path),
      'size' => Storage::disk('public')->size($path),
      'media_type' => $file->getClientMimeType(),
    ];
  }

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
