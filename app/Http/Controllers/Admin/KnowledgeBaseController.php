<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexKnowledgeBaseRequest;
use App\Models\KnowledgeBase;
use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

#[Authorize('access-admin')]
class KnowledgeBaseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(IndexKnowledgeBaseRequest $request)
    {
        $validated = $request->validated();

        $ownerTypes = [
            'media' => Media::class,
        ];

        $data = KnowledgeBase::query()
            ->with(['owner'])
            ->when($validated['owner'] ?? null, function ($query, $owners) use ($ownerTypes) {

                foreach ($owners as $owner) {
                    [$type, $id] = explode(':', $owner);

                    if (! isset($ownerTypes[$type])) {
                        continue;
                    }

                    $query->orWhere(
                        fn ($query) => $query
                            ->whereMorphedTo('owner', $ownerTypes[$type])
                            ->where('owner_id', $id)
                    );
                }
            })
            ->when($validated['status'] ?? null, function ($query, $status) {
                $query->whereIn('status', $status);
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

        return Inertia::render('admin/database/knowledge-base/index', [
            'data' => $data,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
