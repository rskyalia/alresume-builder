<?php

use App\Models\Experience;
use App\Models\Resume;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;

uses(LazilyRefreshDatabase::class);

/**
 * Property 15: For all valid text sent to confirmation endpoints, after confirmation,
 * the model must persist the exact same value.
 *
 * Validates: Requirements 4.5, 4.6, 5.5, 5.6
 */
test('property 15: confirmed summary persists exactly', function () {
    for ($iter = 0; $iter < 10; $iter++) {
        $user = User::factory()->create(['plan' => 'pro']);
        $resume = Resume::create([
            'user_id'   => $user->id,
            'title'     => fake()->sentence(3),
            'full_name' => fake()->name(),
        ]);

        $summaryText = fake()->paragraph(3);

        $this->actingAs($user);
        $response = $this->postJson("/api/resumes/{$resume->id}/ai/summary/confirm", [
            'summary_text' => $summaryText,
        ]);

        $response->assertStatus(200);

        // Reload from DB and verify the exact same value is stored
        $resume->refresh();
        expect($resume->summary)->toBe($summaryText);
    }
})->group('property-tests');

test('property 15: confirmed experience rewrite persists exactly', function () {
    for ($iter = 0; $iter < 10; $iter++) {
        $user = User::factory()->create(['plan' => 'pro']);
        $resume = Resume::create([
            'user_id'   => $user->id,
            'title'     => fake()->sentence(3),
            'full_name' => fake()->name(),
        ]);

        $experience = Experience::create([
            'resume_id'  => $resume->id,
            'company'    => fake()->company(),
            'position'   => fake()->jobTitle(),
            'start_date' => '2020-01-01',
            'end_date'   => '2022-01-01',
        ]);

        $descriptionText = fake()->paragraph(4);

        $this->actingAs($user);
        $response = $this->postJson(
            "/api/resumes/{$resume->id}/experiences/{$experience->id}/ai/rewrite/confirm",
            ['description_text' => $descriptionText]
        );

        $response->assertStatus(200);

        // Reload from DB and verify the exact same value is stored
        $experience->refresh();
        expect($experience->description)->toBe($descriptionText);
    }
})->group('property-tests');
