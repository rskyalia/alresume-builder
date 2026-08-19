<?php

/**
 * Section Credit Invariance Property-Based Tests
 *
 * Validates: Requirements 3.10, 10.7
 *
 * Run with:
 *   php vendor/bin/pest tests/Feature/Resume/SectionCreditInvariancePropertyTest.php --group=property-tests
 */

use App\Models\Certificate;
use App\Models\Education;
use App\Models\Experience;
use App\Models\Project;
use App\Models\Resume;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;

uses(LazilyRefreshDatabase::class);

/**
 * Property 8: For all users with credits=N, performing update or delete
 * on section entries does not change resume_credits value.
 *
 * Tests all 5 section types: education, experience, skill, project, certificate
 *
 * Validates: Requirements 3.10, 10.7
 */
test('property 8: updating or deleting sections does not change resume_credits', function () {
    // Run 5 iterations for broader coverage
    for ($i = 0; $i < 5; $i++) {
        $initialCredits = fake()->numberBetween(1, 10);

        $user = User::factory()->create([
            'plan'           => 'free',
            'resume_credits' => $initialCredits,
        ]);

        $resume = Resume::create([
            'user_id'  => $user->id,
            'title'    => 'Test Resume for Credits Invariance ' . $i,
            'template' => 'default',
        ]);

        // Create one entry for each section type
        $education = Education::create([
            'resume_id'   => $resume->id,
            'institution' => fake()->company(),
            'degree'      => 'S.Kom',
            'start_date'  => '2018-01-01',
            'end_date'    => '2022-06-30',
        ]);

        $experience = Experience::create([
            'resume_id'  => $resume->id,
            'company'    => fake()->company(),
            'position'   => fake()->jobTitle(),
            'start_date' => '2022-07-01',
            'end_date'   => '2024-01-31',
            'is_current' => false,
        ]);

        $skill = Skill::create([
            'resume_id' => $resume->id,
            'name'      => fake()->word(),
            'level'     => 'intermediate',
        ]);

        $project = Project::create([
            'resume_id'  => $resume->id,
            'name'       => fake()->sentence(2),
            'tech_stack' => 'Laravel, Vue',
        ]);

        $certificate = Certificate::create([
            'resume_id'  => $resume->id,
            'name'       => fake()->sentence(3),
            'issuer'     => fake()->company(),
            'issue_date' => '2023-01-15',
        ]);

        $this->actingAs($user);

        // --- UPDATE operations --- //

        // Update education
        $this->putJson("/api/resumes/{$resume->id}/education/{$education->id}", [
            'institution' => 'Updated University',
            'start_date'  => '2018-01-01',
            'end_date'    => '2022-06-30',
        ])->assertStatus(200);

        $user->refresh();
        expect($user->resume_credits)->toBe($initialCredits, "Credits changed after updating education (iteration $i)");

        // Update experience
        $this->putJson("/api/resumes/{$resume->id}/experience/{$experience->id}", [
            'company'    => 'Updated Company',
            'position'   => 'Updated Position',
            'start_date' => '2022-07-01',
            'end_date'   => '2024-01-31',
            'is_current' => false,
        ])->assertStatus(200);

        $user->refresh();
        expect($user->resume_credits)->toBe($initialCredits, "Credits changed after updating experience (iteration $i)");

        // Update skill
        $this->putJson("/api/resumes/{$resume->id}/skills/{$skill->id}", [
            'name'  => 'Updated Skill',
            'level' => 'advanced',
        ])->assertStatus(200);

        $user->refresh();
        expect($user->resume_credits)->toBe($initialCredits, "Credits changed after updating skill (iteration $i)");

        // Update project
        $this->putJson("/api/resumes/{$resume->id}/projects/{$project->id}", [
            'name'       => 'Updated Project Name',
            'tech_stack' => 'React, Node.js',
        ])->assertStatus(200);

        $user->refresh();
        expect($user->resume_credits)->toBe($initialCredits, "Credits changed after updating project (iteration $i)");

        // Update certificate
        $this->putJson("/api/resumes/{$resume->id}/certificates/{$certificate->id}", [
            'name'       => 'Updated Certificate Name',
            'issue_date' => '2023-06-01',
        ])->assertStatus(200);

        $user->refresh();
        expect($user->resume_credits)->toBe($initialCredits, "Credits changed after updating certificate (iteration $i)");

        // --- DELETE operations --- //

        // Delete education
        $this->deleteJson("/api/resumes/{$resume->id}/education/{$education->id}")
            ->assertStatus(200);

        $user->refresh();
        expect($user->resume_credits)->toBe($initialCredits, "Credits changed after deleting education (iteration $i)");

        // Delete experience
        $this->deleteJson("/api/resumes/{$resume->id}/experience/{$experience->id}")
            ->assertStatus(200);

        $user->refresh();
        expect($user->resume_credits)->toBe($initialCredits, "Credits changed after deleting experience (iteration $i)");

        // Delete skill
        $this->deleteJson("/api/resumes/{$resume->id}/skills/{$skill->id}")
            ->assertStatus(200);

        $user->refresh();
        expect($user->resume_credits)->toBe($initialCredits, "Credits changed after deleting skill (iteration $i)");

        // Delete project
        $this->deleteJson("/api/resumes/{$resume->id}/projects/{$project->id}")
            ->assertStatus(200);

        $user->refresh();
        expect($user->resume_credits)->toBe($initialCredits, "Credits changed after deleting project (iteration $i)");

        // Delete certificate
        $this->deleteJson("/api/resumes/{$resume->id}/certificates/{$certificate->id}")
            ->assertStatus(200);

        $user->refresh();
        expect($user->resume_credits)->toBe($initialCredits, "Credits changed after deleting certificate (iteration $i)");
    }
})->group('property-tests');

/**
 * Additional verification: Pro users' credits also stay stable when updating/deleting sections.
 */
test('property 8 complement: pro user resume_credits stays stable when updating or deleting sections', function () {
    $user = User::factory()->create([
        'plan'           => 'pro',
        'resume_credits' => 0,
    ]);

    $resume = Resume::create([
        'user_id'  => $user->id,
        'title'    => 'Pro User Resume',
        'template' => 'default',
    ]);

    $skill = Skill::create([
        'resume_id' => $resume->id,
        'name'      => 'Laravel',
        'level'     => 'advanced',
    ]);

    $this->actingAs($user);

    // Update skill
    $this->putJson("/api/resumes/{$resume->id}/skills/{$skill->id}", [
        'name'  => 'Laravel Framework',
        'level' => 'advanced',
    ])->assertStatus(200);

    $user->refresh();
    expect($user->resume_credits)->toBe(0, "Pro user credits changed after update");

    // Delete skill
    $this->deleteJson("/api/resumes/{$resume->id}/skills/{$skill->id}")
        ->assertStatus(200);

    $user->refresh();
    expect($user->resume_credits)->toBe(0, "Pro user credits changed after delete");
})->group('property-tests');
