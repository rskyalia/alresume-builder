<?php

use App\Models\AiJob;
use App\Models\Resume;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;

uses(LazilyRefreshDatabase::class);

/**
 * Property 13: For all valid AI jobs belonging to a user, the polling response
 * must always contain job_id, type, status.
 * If status=completed: result must not be empty.
 * If status=failed: error_message must not be empty.
 *
 * Validates: Requirements 4.9, 11.1, 11.2, 11.4
 */
test('property 13: polling response structure is consistent', function (string $status) {
    for ($iter = 0; $iter < 5; $iter++) {
        $user = User::factory()->create(['plan' => 'free']);
        $resume = Resume::create([
            'user_id' => $user->id,
            'title'   => fake()->sentence(3),
        ]);

        $aiJob = AiJob::create([
            'user_id'       => $user->id,
            'resume_id'     => $resume->id,
            'type'          => fake()->randomElement(['summary', 'experience_rewrite', 'ats_score', 'cover_letter']),
            'status'        => $status,
            'result'        => $status === 'completed' ? 'Test result text' : null,
            'error_message' => $status === 'failed'    ? 'Test error message' : null,
        ]);

        $this->actingAs($user);
        $response = $this->getJson("/api/ai/jobs/{$aiJob->id}");

        $response->assertStatus(200);
        $data = $response->json('data');

        // Required fields always present
        expect($data)->toHaveKey('job_id');
        expect($data)->toHaveKey('type');
        expect($data)->toHaveKey('status');

        // Conditional fields
        if ($status === 'completed') {
            expect($data)->toHaveKey('result');
            expect($data['result'])->not->toBeEmpty();
        }

        if ($status === 'failed') {
            expect($data)->toHaveKey('error_message');
            expect($data['error_message'])->not->toBeEmpty();
        }
    }
})->with(['pending', 'processing', 'completed', 'failed'])->group('property-tests');

/**
 * Property 14: For all pairs of users A and B (A≠B), user A polling a job
 * belonging to user B must always return 403.
 *
 * Validates: Requirements 4.9, 11.1, 11.2, 11.4
 */
test('property 14: user cannot poll another users ai job', function () {
    for ($iter = 0; $iter < 10; $iter++) {
        $userA = User::factory()->create(['plan' => 'free']);
        $userB = User::factory()->create(['plan' => 'free']);

        $resumeB = Resume::create([
            'user_id' => $userB->id,
            'title'   => fake()->sentence(3),
        ]);

        $aiJobB = AiJob::create([
            'user_id'   => $userB->id,
            'resume_id' => $resumeB->id,
            'type'      => 'summary',
            'status'    => 'completed',
            'result'    => 'Result text',
        ]);

        // User A tries to poll user B's job — must always return 403
        $this->actingAs($userA);
        $response = $this->getJson("/api/ai/jobs/{$aiJobB->id}");

        $response->assertStatus(403);
    }
})->group('property-tests');
