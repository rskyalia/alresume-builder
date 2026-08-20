<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Admin / developer account
        // plan=pro ? unlimited resume creation (no credit deduction)
        // resume_credits=999999 ? fallback buffer
        User::updateOrCreate(
            ['email' => 'dev@alresume.internal'],
            [
                'name'                => 'Admin Developer',
                'password'            => Hash::make('Alr3sum3@Dev!2026'),
                'plan'                => 'pro',
                'resume_credits'      => 999999,
                'email_verified_at'   => now(),
            ]
        );
    }
}
