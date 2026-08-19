<?php

/**
 * Rate Limiting Property-Based Tests
 *
 * Validates: Requirements 4.7, 5.7, 6.4, 7.5
 *
 * Run with:
 *   php vendor/bin/pest tests/Feature/AI/RateLimitPropertyTest.php --group=property-tests
 */

use App\Exceptions\RateLimitExceededException;
use App\Models\DailyAiUsage;
use App\Models\User;
use App\Services\RateLimitService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;

uses(LazilyRefreshDatabase::class);

/**
 * Property 11: A free user who has used 'summary' or 'experience_rewrite'
 * exactly 10 times today is blocked on the 11th attempt with a
 * RateLimitExceededException (HTTP 429 equivalent).
 *
 * Validates: Requirements 4.7, 5.7
 */
test('property 11: free user hits rate limit after 10 summary/experience_rewrite uses', function (string $type) {
    for ($iter = 0; $iter < 5; $iter++) {
        $user    = User::factory()->create(['plan' => 'free']);
        $service = new RateLimitService();
        $today   = now('UTC')->toDateString();

        // Pre-seed exactly 10 uses for today
        DailyAiUsage::create([
            'user_id'    => $user->id,
            'type'       => $type,
            'usage_date' => $today,
            'count'      => 10,
        ]);

        // 11th call must throw RateLimitExceededException
        expect(fn () => $service->checkOrFail($user, $type))
            ->toThrow(RateLimitExceededException::class);
    }
})->with(['summary', 'experience_rewrite'])->group('property-tests');

/**
 * Property 12: A free user who has used 'ats_score' or 'cover_letter'
 * exactly 3 times today is blocked on the 4th attempt with a
 * RateLimitExceededException (HTTP 429 equivalent).
 *
 * Validates: Requirements 6.4, 7.5
 */
test('property 12: free user hits rate limit after 3 ats_score/cover_letter uses', function (string $type) {
    for ($iter = 0; $iter < 5; $iter++) {
        $user    = User::factory()->create(['plan' => 'free']);
        $service = new RateLimitService();
        $today   = now('UTC')->toDateString();

        // Pre-seed exactly 3 uses for today
        DailyAiUsage::create([
            'user_id'    => $user->id,
            'type'       => $type,
            'usage_date' => $today,
            'count'      => 3,
        ]);

        // 4th call must throw RateLimitExceededException
        expect(fn () => $service->checkOrFail($user, $type))
            ->toThrow(RateLimitExceededException::class);
    }
})->with(['ats_score', 'cover_letter'])->group('property-tests');

/**
 * Complement: A pro user is never rate limited regardless of usage count.
 *
 * Validates: Requirements 4.7, 5.7, 6.4, 7.5
 */
test('pro user is never rate limited regardless of usage count', function (string $type) {
    for ($iter = 0; $iter < 5; $iter++) {
        $user    = User::factory()->create(['plan' => 'pro']);
        $service = new RateLimitService();
        $today   = now('UTC')->toDateString();

        // Pre-seed a very high usage count
        DailyAiUsage::create([
            'user_id'    => $user->id,
            'type'       => $type,
            'usage_date' => $today,
            'count'      => 9999,
        ]);

        // Pro users must never be blocked
        expect(fn () => $service->checkOrFail($user, $type))
            ->not->toThrow(RateLimitExceededException::class);
    }
})->with(['summary', 'experience_rewrite', 'ats_score', 'cover_letter'])->group('property-tests');

/**
 * Additional: Free user under the limit can call checkOrFail successfully
 * and each call increments the usage count by 1.
 *
 * Validates: Requirements 4.7, 5.7
 */
test('free user under the limit can use ai features and count is incremented', function (string $type) {
    $limit = RateLimitService::LIMITS[$type];

    $user    = User::factory()->create(['plan' => 'free']);
    $service = new RateLimitService();
    $today   = now('UTC')->toDateString();

    // Use the feature up to (limit - 1) times successfully
    for ($i = 0; $i < $limit; $i++) {
        expect(fn () => $service->checkOrFail($user, $type))->not->toThrow(RateLimitExceededException::class);
    }

    // Count in DB must equal limit
    $usage = DailyAiUsage::where([
        'user_id'    => $user->id,
        'type'       => $type,
        'usage_date' => $today,
    ])->first();

    expect($usage)->not->toBeNull();
    expect($usage->count)->toBe($limit);

    // Next call (limit + 1) must be blocked
    expect(fn () => $service->checkOrFail($user, $type))
        ->toThrow(RateLimitExceededException::class);
})->with(['summary', 'experience_rewrite', 'ats_score', 'cover_letter'])->group('property-tests');
