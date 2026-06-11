<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexMediaRequest;
use App\Http\Requests\Admin\UpdateMediaRequest;
use App\Models\Media;
use App\Services\KnowledgeBaseService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MediaController extends Controller
{
    public function __construct(private KnowledgeBaseService $knowledgeBaseService) {}

    public function index(IndexMediaRequest $request): Response
    {
        $validated = $request->validated();

        $data = Media::query()
            ->with(['owner'])
            ->when($validated['name'] ?? null, function ($query, $name) {
                $query->where('name', 'ilike', "%$name%");
            })
            ->when($validated['type'] ?? null, function ($query, $status) {
                $query->whereIn('type', $status);
            })
            ->when($validated['subtype'] ?? null, function ($query, $status) {
                $query->whereIn('subtype', $status);
            })
            ->when($validated['owner'] ?? null, function ($query, $owners) {
                $owners = collect($owners)
                    ->map(function ($owner) {
                        [$type, $id] = explode(':', $owner, 2);

                        return [$type, (int) $id];
                    })
                    ->all();

                $query->whereOwnerIn($owners);
            })
            ->when($validated['created_at'] ?? null, function ($query, $created_at) {
                $range = explode(',', $created_at);

                if (count($range) === 2) {
                    $from = Carbon::createFromTimestamp($range[0] / 1000);
                    $to = Carbon::createFromTimestamp($range[1] / 1000);
                    $query->whereBetween('created_at', [$from, $to]);
                } else {
                    $date = Carbon::createFromTimestamp($range[0] / 1000);
                    $query->whereDate('created_at', $date);
                }
            })
            ->when($validated['sort'] ?? null, function ($query, $sort) {
                $sorts = explode(',', $sort);
                foreach ($sorts as $item) {
                    $dir = str_starts_with($item, '-') ? 'desc' : 'asc';
                    $field = ltrim($item, '-');
                    $query->orderBy($field, $dir);
                }
            })
            ->paginate($validated['per_page'] ?? 10);

        return Inertia::render('admin/database/medias/index', [
            'data' => $data,
        ]);
    }

    public function edit(Media $media): Response
    {
        $media->load(['owner']);

        return Inertia::render('admin/database/medias/edit', [
            'media' => $media,
        ]);
    }

    public function update(UpdateMediaRequest $request, Media $media)
    {
        $media->update($request->validated());

        return back()->with('success', 'Media updated successfully.');
    }

    public function destroy(Media $media)
    {
        $media->delete();

        return redirect()->back()->with('success', 'Media deleted successfully.');
    }

    public function triggerGenerateKnowledgeBase(Media $media)
    {
        $success = $this->knowledgeBaseService->generateMediaKnowledgeBase($media);
        if (! $success) {
            return redirect()->back()->with('error', 'Failed to generate knowledge base');
        }

        return redirect()->back()->with('success', 'Knowledge base generated successfully');
    }

    public function exportAsCsv(Request $request): StreamedResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'string'],
        ]);

        $mediaIds = explode(',', $validated['ids']);

        return response()->streamDownload(
            function () use ($mediaIds): void {
                $file = fopen('php://output', 'w');

                fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

                fputcsv($file, [
                    'ID',
                    'Name',
                    'Type',
                    'Subtype',
                    'Owner',
                    'Created At',
                ]);

                Media::query()
                    ->with('owner')
                    ->whereIn('id', $mediaIds)
                    ->orderBy('id')
                    ->cursor()
                    ->each(function (Media $media) use ($file): void {
                        fputcsv($file, [
                            $media->id,
                            $media->name,
                            $media->type?->value ?? $media->type,
                            $media->subtype,
                            $media->owner?->name,
                            $media->created_at?->toDateTimeString(),
                        ]);
                    });

                fclose($file);
            },
            'medias.csv',
            ['Content-Type' => 'text/csv'],
        );
    }
}
