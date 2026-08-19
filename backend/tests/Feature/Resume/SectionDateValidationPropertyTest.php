<?php

/**
 * Section Date Validation Property-Based Tests
 *
 * Validates: Requirements 3.11
 *
 * Run with:
 *   php vendor/bin/pest tests/Feature/Resume/SectionDateValidationPropertyTest.php --group=property-tests
 */

use App\Models\Resume;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;

uses(LazilyRefreshDatabase::class);

/**
 * Property 9: For all pasangan (start_date, end_date) di mana end_date < start_date,
 * request POST ke /api/resumes/{resume}/education dan /api/resumes/{resume}/experience
 * harus selalu mendapatkan respons 422.
 *
 * Validates: Requirements 3.11
 */
test('property 9: invalid date ranges always return 422 for education and experience', function () {
    $user = User::factory()->create([
        'plan'           => 'pro',
        'resume_credits' => 0,
    ]);

    $resume = Resume::create([
        'user_id'  => $user->id,
        'title'    => 'Test Resume',
        'template' => 'default',
    ]);

    $this->actingAs($user);

    // Generate 10 random invalid date pairs
    for ($i = 0; $i < 10; $i++) {
        // Generate a start date
        $startDate = fake()->dateTimeBetween('-5 years', 'now')->format('Y-m-d');

        // Generate an end date that's before the start date
        $endDate = fake()->dateTimeBetween('-6 years', $startDate)->format('Y-m-d');

        // Ensure end_date is actually before start_date
        expect($endDate)->toBeLessThan($startDate);

        // Test education endpoint
        $educationPayload = [
            'institution' => fake()->company(),
            'degree'      => 'S.Kom',
            'start_date'  => $startDate,
            'end_date'    => $endDate,
        ];

        $response = $this->postJson("/api/resumes/{$resume->id}/education", $educationPayload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('end_date');

        // Test experience endpoint
        $experiencePayload = [
            'company'    => fake()->company(),
            'position'   => fake()->jobTitle(),
            'start_date' => $startDate,
            'end_date'   => $endDate,
            'is_current' => false,
        ];

        $response = $this->postJson("/api/resumes/{$resume->id}/experience", $experiencePayload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('end_date');
    }
})->group('property-tests');

/**
 * Additional test: Valid date ranges should pass for education and experience
 */
test('property 9 complement: valid date ranges are accepted for education and experience', function () {
    $user = User::factory()->create([
        'plan'           => 'pro',
        'resume_credits' => 0,
    ]);

    $resume = Resume::create([
        'user_id'  => $user->id,
        'title'    => 'Test Resume',
        'template' => 'default',
    ]);

    $this->actingAs($user);

    // Generate 5 random valid date pairs
    for ($i = 0; $i < 5; $i++) {
        $startDate = fake()->dateTimeBetween('-5 years', '-1 year')->format('Y-m-d');
        $endDate   = fake()->dateTimeBetween($startDate, 'now')->format('Y-m-d');

        // Ensure end_date is after or equal to start_date
        expect($endDate)->toBeGreaterThanOrEqual($startDate);

        // Test education endpoint - should succeed
        $educationPayload = [
            'institution' => fake()->company(),
            'degree'      => 'S.Kom',
            'start_date'  => $startDate,
            'end_date'    => $endDate,
        ];

        $response = $this->postJson("/api/resumes/{$resume->id}/education", $educationPayload);
        $response->assertStatus(201);
        
        // Dates are returned in ISO format, so extract just the date part for comparison
        $returnedStartDate = substr($response->json('data.education.start_date'), 0, 10);
        $returnedEndDate = substr($response->json('data.education.end_date'), 0, 10);
        expect($returnedStartDate)->toBe($startDate);
        expect($returnedEndDate)->toBe($endDate);

        // Test experience endpoint - should succeed
        $experiencePayload = [
            'company'    => fake()->company(),
            'position'   => fake()->jobTitle(),
            'start_date' => $startDate,
            'end_date'   => $endDate,
            'is_current' => false,
        ];

        $response = $this->postJson("/api/resumes/{$resume->id}/experience", $experiencePayload);
        $response->assertStatus(201);
        
        // Dates are returned in ISO format
        $returnedStartDate = substr($response->json('data.experience.start_date'), 0, 10);
        $returnedEndDate = substr($response->json('data.experience.end_date'), 0, 10);
        expect($returnedStartDate)->toBe($startDate);
        expect($returnedEndDate)->toBe($endDate);
    }
})->group('property-tests');
