<?php

namespace Database\Seeders\Common;

use Illuminate\Database\Seeder;
use App\Models\Customer;
use App\Models\Company;
use Illuminate\Support\Facades\Hash;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $agentA = Company::where('type', 'agent')->first();
        $agentB = Company::where('type', 'agent')->skip(1)->first();

        if ($agentA && $agentB) {
            Customer::create([
                'company_id'        => $agentA->id,
                'name'              => 'Bintang Customer',
                'username'          => 'bintang123',         
                'email'             => 'bintang@mail.com',
                'email_verified_at' => now(),                
                'password'          => Hash::make('password123'),
                'status'            => 'active'
            ]);

            Customer::create([
                'company_id'        => $agentB->id,
                'name'              => 'Bintang Customer',
                'username'          => 'bintang123',         
                'email'             => 'bintang@mail.com',   
                'email_verified_at' => now(),
                'password'          => Hash::make('password123'),
                'status'            => 'active'
            ]);
        }
    }
}