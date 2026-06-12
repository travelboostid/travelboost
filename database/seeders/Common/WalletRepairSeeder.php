<?php

namespace Database\Seeders\Common;

use App\Models\User;
use Illuminate\Database\Seeder;

class WalletRepairSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->each(function (User $user): void {
            $user->wallet()->firstOrCreate(
                [],
                [
                    'name' => config('wallet.wallet.default.name'),
                    'slug' => config('wallet.wallet.default.slug'),
                    'description' => 'Primary wallet for user transactions',
                ],
            );
        });
    }
}
