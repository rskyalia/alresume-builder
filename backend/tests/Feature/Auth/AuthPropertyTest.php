<?php

/**
 * Auth Property-Based Tests
 *
 * Validates: Requirements 1.1, 1.6, 1.7, 10.1
 *
 * NOTE: These tests require a working database connection (SQLite is configured
 * by default). The LazilyRefreshDatabase trait handles migrations automatically.
 * Ensure the APP_KEY is set and database.sqlite exists before running:
 *   touch database/database.sqlite
 *   php artisan key:generate
 *   php artisan migrate
 *
 * Run with:
 *   php vendor/bin/pest tests/Feature/Auth/AuthPropertyTest.php --group=property-tests
 */

use Illuminate\Foundation\Testing\LazilyRefreshDatabase;

uses(LazilyRefreshDatabase::class);

/**
 * Property 1: For all combinations of name, unique email, and valid password (≥8 chars),
 * registration must always produce a user with plan='free' and resume_credits=5.
 *
 * Validates: Requirements 1.1, 1.6, 1.7
 */
test('property 1: registration always creates free user with 5 credits', function () {
    // Run 20 iterations with random valid inputs to verify the property holds universally
    for ($i = 0; $i < 20; $i++) {
        $data = [
            'name'     => fake()->name(),
            'email'    => fake()->unique()->safeEmail(),
            'password' => fake()->password(minLength: 8),
        ];

        $response = $this->postJson('/api/auth/register', $data);

        $response->assertStatus(201);
        $response->assertJsonPath('data.user.plan', 'free');
        $response->assertJsonPath('data.user.resume_credits', 5);

        // Verify persisted values in the database
        $this->assertDatabaseHas('users', [
            'email'          => $data['email'],
            'plan'           => 'free',
            'resume_credits' => 5,
        ]);
    }
})->group('property-tests');

/**
 * Property 2: For all protected endpoints, requests without a valid token must
 * always receive a 401 Unauthorized response.
 *
 * Validates: Requirements 10.1
 */
test('property 2: protected endpoints always return 401 without auth', function (string $method, string $url) {
    $response = $this->json($method, $url);
    $response->assertStatus(401);
})->with([
    ['POST', '/api/auth/logout'],
    ['GET', '/api/auth/me'],
    // Additional protected endpoints should be added here as they are implemented
])->group('property-tests');
