<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\WalletIndexRequest;
use App\Http\Resources\WalletResource;
use App\Models\Wallet;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WalletController extends Controller
{
    /**
     * List wallets for the authenticated user or filtered owner.
     *
     * @operationId getWallets
     */
    public function index(WalletIndexRequest $request): AnonymousResourceCollection
    {
        $wallets = Wallet::query()
            ->when(
                $request->filled('user_id'),
                fn ($q) => $q->where('holder_id', $request->integer('user_id'))
                    ->where('holder_type', 'App\Models\User')
            )
            ->when(
                $request->filled('status'),
                fn ($q) => $q->where('status', $request->input('status'))
            )
            ->latest()
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return WalletResource::collection($wallets);
    }
}
