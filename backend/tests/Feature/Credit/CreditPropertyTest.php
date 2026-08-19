<?php

/**
 * Credit System Property-Based Tests
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 10.2, 10.3
 *
 * Run with:
 *   php vendor/bin/pest tests/Feature/Credit/CreditPropertyTest.php --group=property-tests
 */

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;

uses(LazilyRefreshDatabase::class);

/**
 * Property 5: A free user with credits=N, after creating one resume (POST /api/resumes),
 * must have credits equal to N-1.
 *
 * Validates: Requirements 3.1, 10.2
 */
test('property 5: free user credits decrement by 1 after creating a resume', function () {
    // Run multiple iterations with random starting credit values (1..10)
    for ($i = 0; $i < 10; $i++) {
        $initialCredits = fake()->numberBetween(1, 10);

        $user = User::factory()->create([
            'plan'           => 'free',
            'resume_credits' => $initialCredits,
        ]);

        $this->actingAs($user);

        $response = $this->postJson('/api/resumes', [
            'title'    => fake()->sentence(3),
            'template' => 'default',
        ]);

        $response->assertStatus(201);

        // Credits must have decremented by exactly 1
        $user->refresh();
        expect($user->resume_credits)->toBe($initialCredits - 1);
    }
})->group('property-tests');

/**
 * Property 6: A Pro user with credits=N, after creating N new resumes,
 * must still have credits=N (pro users are not charged credits).
 *
 * Validates: Requirements 3.2, 10.3
 */
test('property 6: pro user credits remain unchanged after creating resumes', function () {
    // Run multiple iterations with different credit values
    for ($i = 0; $i < 5; $i++) {
        $initialCredits = fake()->numberBetween(0, 5);
        $resumeCount    = fake()->numberBetween(1, 5);

        $user = User::factory()->create([
            'plan'           => 'pro',
            'resume_credits' => $initialCredits,
        ]);

        $this->actingAs($user);

        for ($j = 0; $j < $resumeCount; $j++) {
            $response = $this->postJson('/api/resumes', [
                'title'    => fake()->sentence(3),
                'template' => 'default',
            ]);

            $response->assertStatus(201);
        }

        // Credits must remain unchanged for pro users
        $user->refresh();
        expect($user->resume_credits)->toBe($initialCredits);
    }
})->group('property-tests');

/**
 * Property 7: For all sequences of operations, resume_credits must never go below 0.
 *
 * Validates: Requirements 3.3, 10.2
 */
test('property 7: resume_credits never goes below zero', function () {
    // Test free users with exactly 1 credit, then try to create more resumes
    for ($i = 0; $i < 10; $i++) {
        $initialCredits = fake()->numberBetween(1, 3);

        $user = User::factory()->create([
            'plan'           => 'free',
            'resume_credits' => $initialCredits,
        ]);

        $this->actingAs($user);

        // Create exactly as many resumes as credits available
        for ($j = 0; $j < $initialCredits; $j++) {
            $response = $this->postJson('/api/resumes', [
                'title'    => fake()->sentence(3),
                'template' => 'default',
            ]);

            $response->assertStatus(201);
        }

        // Verify credits are exactly 0, not negative
        $user->refresh();
        expect($user->resume_credits)->toBe(0);
        expect($user->resume_credits)->toBeGreaterThanOrEqual(0);

        // Additional attempt should return 403 (not decrement below 0)
        $response = $this->postJson('/api/resumes', [
            'title'    => fake()->sentence(3),
            'template' => 'default',
        ]);
        $response->assertStatus(403);

        // Credits must still be 0, not -1
        $user->refresh();
        expect($user->resume_credits)->toBe(0);
        expect($user->resume_credits)->toBeGreaterThanOrEqual(0);
    }
})->group('property-tests');
