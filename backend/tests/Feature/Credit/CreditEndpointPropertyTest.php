<?php

/**
 * Credit Endpoint Property-Based Tests
 *
 * Validates: Requirements 10.8
 *
 * Run with:
 *   php vendor/bin/pest tests/Feature/Credit/CreditEndpointPropertyTest.php --group=property-tests
 */

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;

uses(LazilyRefreshDatabase::class);

/**
 * Property 20: For all authenticated users, the /api/credits response must always
 * contain the fields: plan, resume_credits, active_subscription.
 *
 * Validates: Requirements 10.8
 */
test('property 20: credits endpoint always returns plan, resume_credits, active_subscription', function (string $plan, int $credits, bool $hasSub) {
    $user = User::factory()->create([
        'plan'           => $plan,
        'resume_credits' => $credits,
    ]);

    // Optionally create an active subscription for more realistic coverage
    if ($hasSub) {
        $sub = Subscription::create([
            'user_id'    => $user->id,
            'plan_name'  => 'Pro Monthly',
            'price'      => 99000,
            'payment_ref' => fake()->uuid(),
            'started_at' => now()->subDays(5),
            'expires_at' => now()->addDays(25),
            'status'     => 'active',
        ]);
        $user->update(['plan' => 'pro']);
    }

    $this->actingAs($user);

    $response = $this->getJson('/api/credits');

    $response->assertStatus(200);
    $response->assertJsonStructure([
        'success',
        'data' => [
            'plan',
            'resume_credits',
            'active_subscription',
        ],
    ]);

    // Explicitly assert each required field is present
    $data = $response->json('data');
    expect($data)->toHaveKey('plan');
    expect($data)->toHaveKey('resume_credits');
    expect($data)->toHaveKey('active_subscription');

    // Verify field values make sense
    expect($data['plan'])->toBeIn(['free', 'pro']);
    expect($data['resume_credits'])->toBeInt();
    expect($data['resume_credits'])->toBeGreaterThanOrEqual(0);

})->with([
    'free user without subscription'  => ['free', 5, false],
    'free user with 0 credits'        => ['free', 0, false],
    'free user with many credits'     => ['free', 10, false],
    'pro user with subscription'      => ['pro', 0, true],
    'pro user no subscription record' => ['pro', 5, false],
])->group('property-tests');

/**
 * Additional coverage: iterating over random authenticated users
 * to confirm the structural guarantee holds universally.
 */
test('property 20: credits endpoint structure holds for random user states', function () {
    for ($i = 0; $i < 15; $i++) {
        $plan    = fake()->randomElement(['free', 'pro']);
        $credits = fake()->numberBetween(0, 20);

        $user = User::factory()->create([
            'plan'           => $plan,
            'resume_credits' => $credits,
        ]);

        $this->actingAs($user);

        $response = $this->getJson('/api/credits');

        $response->assertStatus(200);

        $data = $response->json('data');
        expect($data)->toHaveKey('plan');
        expect($data)->toHaveKey('resume_credits');
        expect($data)->toHaveKey('active_subscription');
    }
})->group('property-tests');
