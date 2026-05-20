<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexMediaRequest;
use App\Models\Company;
use App\Models\Media;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Inertia;

class MediaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(IndexMediaRequest $request)
    {
        $validated = $request->validated();
        $ownerTypes = [
            'user' => User::class,
            'company' => Company::class,
        ];

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
}
