<?php

/**
 * Share URL Property-Based Tests
 *
 * Validates: Requirements 9.4, 9.5, 9.6
 *
 * Run with:
 *   php vendor/bin/pest tests/Feature/Share/ShareURLPropertyTest.php --group=property-tests
 */

use App\Models\Resume;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;

uses(LazilyRefreshDatabase::class);

// ---------------------------------------------------------------------------
// Property 17 — All public slugs must be globally unique and 8-char alphanum
// ---------------------------------------------------------------------------

/**
 * Property 17: For ALL resumes toggled to is_public=true, the generated
 * public_slug MUST be unique across the entire resumes table, and each
 * slug must be exactly 8 alphanumeric characters.
 *
 * Validates: Requirements 9.6
 */
test('property 17: all generated public slugs are unique and exactly 8 alphanumeric characters', function () {
    $n = 15; // create N users, each with one resume, toggle all public

    $slugs = [];

    for ($i = 0; $i < $n; $i++) {
        $user = User::factory()->create([
            'plan'           => 'pro', // pro so credits are not a concern
            'resume_credits' => 5,
        ]);

        $resume = Resume::create([
            'user_id'  => $user->id,
            'title'    => fake()->sentence(3),
            'template' => 'default',
        ]);

        $response = $this->actingAs($user)
            ->patchJson('/api/resumes/' . $resume->id . '/visibility', [
                'is_public' => true,
            ]);

        $response->assertStatus(200);

        $data = $response->json('data');

        expect($data)->toHaveKey('public_slug');
        expect($data['is_public'])->toBeTrue();

        $slug = $data['public_slug'];

        // Each slug must be exactly 8 characters and alphanumeric only
        expect($slug)->toBeString();
        expect(strlen($slug))->toBe(8);
        expect(preg_match('/^[a-zA-Z0-9]{8}$/', $slug))->toBe(1,
            "Slug '{$slug}' is not 8 alphanumeric characters.");

        // Must not have appeared before in this run (uniqueness)
        expect(in_array($slug, $slugs, true))->toBeFalse(
            "Duplicate slug detected: '{$slug}' already appeared in this run.");

        $slugs[] = $slug;
    }

    // Final uniqueness check: all slugs collected in DB must be distinct
    $allDbSlugs = Resume::whereNotNull('public_slug')
        ->pluck('public_slug')
        ->toArray();

    expect($allDbSlugs)->toHaveCount(count(array_unique($allDbSlugs)),
        'Duplicate public_slug values found in the resumes table.');
})->group('property-tests');

// ---------------------------------------------------------------------------
// Property 18 — Private resumes always return 404 on public endpoint
// ---------------------------------------------------------------------------

/**
 * Property 18: For ALL resumes with is_public=false, accessing
 * GET /api/r/{slug} MUST always return 404, regardless of whether a
 * public_slug is present in the database.
 *
 * Validates: Requirements 9.4
 */
test('property 18: private resumes always return 404 on the public endpoint', function () {
    for ($i = 0; $i < 10; $i++) {
        $user = User::factory()->create([
            'plan'           => 'pro',
            'resume_credits' => 5,
        ]);

        $resume = Resume::create([
            'user_id'   => $user->id,
            'title'     => fake()->sentence(3),
            'template'  => 'default',
            'is_public' => false,
        ]);

        // Scenario A: Resume was never made public — no slug at all
        // Refresh from DB so the boolean cast is applied correctly.
        $resume->refresh();
        expect($resume->is_public)->toBeFalse();

        // Accessing with a completely random slug → 404
        $randomSlug = fake()->regexify('[a-zA-Z0-9]{8}');
        $this->getJson('/api/r/' . $randomSlug)->assertStatus(404);

        // Scenario B: Resume was made public, then toggled back to private
        // Toggle to public first to generate a real slug
        $publicResponse = $this->actingAs($user)
            ->patchJson('/api/resumes/' . $resume->id . '/visibility', [
                'is_public' => true,
            ]);
        $publicResponse->assertStatus(200);

        $generatedSlug = $publicResponse->json('data.public_slug');
        expect($generatedSlug)->toBeString();

        // Confirm it is currently accessible
        $this->getJson('/api/r/' . $generatedSlug)->assertStatus(200);

        // Now toggle back to private
        $privateResponse = $this->actingAs($user)
            ->patchJson('/api/resumes/' . $resume->id . '/visibility', [
                'is_public' => false,
            ]);
        $privateResponse->assertStatus(200);
        expect($privateResponse->json('data.is_public'))->toBeFalse();

        // The known slug now must return 404 because resume is private
        $this->getJson('/api/r/' . $generatedSlug)->assertStatus(404);
    }
})->group('property-tests');

// ---------------------------------------------------------------------------
// Property 19 — public_slug is preserved when toggling public→private→public
// ---------------------------------------------------------------------------

/**
 * Property 19: For ALL resumes that have been toggled public then private,
 * the public_slug value in the database MUST remain unchanged (not null,
 * not regenerated). Re-toggling to public MUST reuse the same slug.
 *
 * Validates: Requirements 9.5
 */
test('property 19: public_slug is preserved when toggling from public to private and back', function () {
    for ($i = 0; $i < 10; $i++) {
        $user = User::factory()->create([
            'plan'           => 'pro',
            'resume_credits' => 5,
        ]);

        $resume = Resume::create([
            'user_id'  => $user->id,
            'title'    => fake()->sentence(3),
            'template' => 'default',
        ]);

        // Step 1: Toggle to public → slug is generated
        $firstPublicResponse = $this->actingAs($user)
            ->patchJson('/api/resumes/' . $resume->id . '/visibility', [
                'is_public' => true,
            ]);
        $firstPublicResponse->assertStatus(200);

        $originalSlug = $firstPublicResponse->json('data.public_slug');
        expect($originalSlug)->toBeString();
        expect(strlen($originalSlug))->toBe(8);

        // Step 2: Toggle to private
        $privateResponse = $this->actingAs($user)
            ->patchJson('/api/resumes/' . $resume->id . '/visibility', [
                'is_public' => false,
            ]);
        $privateResponse->assertStatus(200);
        expect($privateResponse->json('data.is_public'))->toBeFalse();

        // DB check: slug must still be the original value (not null, not changed)
        $resume->refresh();
        expect($resume->public_slug)->toBe($originalSlug,
            "public_slug changed after toggling to private. Expected '{$originalSlug}', got '{$resume->public_slug}'.");
        expect($resume->public_slug)->not->toBeNull();

        // Step 3: Toggle back to public → MUST reuse the same slug
        $secondPublicResponse = $this->actingAs($user)
            ->patchJson('/api/resumes/' . $resume->id . '/visibility', [
                'is_public' => true,
            ]);
        $secondPublicResponse->assertStatus(200);

        $reusedSlug = $secondPublicResponse->json('data.public_slug');
        expect($reusedSlug)->toBe($originalSlug,
            "Slug changed on re-activation. Expected '{$originalSlug}', got '{$reusedSlug}'.");

        // Confirm it is accessible again via public endpoint
        $this->getJson('/api/r/' . $reusedSlug)->assertStatus(200);

        // DB final check
        $resume->refresh();
        expect($resume->public_slug)->toBe($originalSlug);
        expect($resume->is_public)->toBeTrue();
    }
})->group('property-tests');
