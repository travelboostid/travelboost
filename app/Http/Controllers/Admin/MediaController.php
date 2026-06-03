<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexMediaRequest;
use App\Models\Media;
use App\Services\KnowledgeBaseService;
use Carbon\Carbon;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Inertia\Inertia;

#[Authorize('access-admin')]
class MediaController extends Controller
{
    public function __construct(private KnowledgeBaseService $knowledgeBaseService) {}

    /**
     * Display a listing of the resource.
     */
    public function index(IndexMediaRequest $request)
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

    public function destroy(Media $media)
    {
        $media->delete();

        return redirect()->back()->with('success', 'Role deleted successfully');
    }

    public function triggerGenerateKnowledgeBase(Media $media)
    {
        $success = $this->knowledgeBaseService->generateMediaKnowledgeBase($media);
        if (! $success) {
            return redirect()->back()->with('error', 'Failed to generate knowledge base');
        }

        return redirect()->back()->with('success', 'Knowledge base generated successfully');
    }
}
