<?php

/**
 * Resume CRUD Property-Based Tests
 *
 * Validates: Requirements 2.1, 2.2, 2.4, 2.5
 *
 * Run with:
 *   php vendor/bin/pest tests/Feature/Resume/ResumeCrudPropertyTest.php --group=property-tests
 */

use App\Models\Certificate;
use App\Models\Education;
use App\Models\Experience;
use App\Models\Project;
use App\Models\Resume;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Carbon;

uses(LazilyRefreshDatabase::class);

/**
 * Property 3: For a user with N resumes (N = 1..5), the GET /api/resumes response
 * must always contain 'plan' and 'resume_credits' at the data root,
 * and the resumes must be ordered descending by updated_at.
 *
 * Validates: Requirements 2.1, 2.2
 */
test('property 3: dashboard always contains plan, resume_credits and resumes ordered by updated_at desc', function () {
    for ($i = 0; $i < 5; $i++) {
        $resumeCount = fake()->numberBetween(1, 5);
        $plan        = fake()->randomElement(['free', 'pro']);

        $user = User::factory()->create([
            'plan'           => $plan,
            'resume_credits' => fake()->numberBetween(0, 10),
        ]);

        // Create N resumes with deliberate updated_at spacing so order is deterministic
        $resumes = [];
        for ($j = 0; $j < $resumeCount; $j++) {
            $resume = Resume::create([
                'user_id'   => $user->id,
                'title'     => fake()->sentence(3),
                'template'  => 'default',
                'is_public' => fake()->boolean(),
            ]);

            // Assign staggered updated_at timestamps to make ordering predictable
            $resume->updated_at = Carbon::now()->subMinutes($j * 10);
            $resume->save();

            $resumes[] = $resume;
        }

        $this->actingAs($user);

        $response = $this->getJson('/api/resumes');

        $response->assertStatus(200);

        $data = $response->json('data');

        // Root data must contain plan and resume_credits
        expect($data)->toHaveKey('plan');
        expect($data)->toHaveKey('resume_credits');
        expect($data)->toHaveKey('resumes');

        // plan and resume_credits must match user's actual values
        $user->refresh();
        expect($data['plan'])->toBe($user->plan);
        expect($data['resume_credits'])->toBe($user->resume_credits);

        // Resumes must be ordered descending by updated_at
        $returnedResumes = $data['resumes'];
        expect(count($returnedResumes))->toBe($resumeCount);

        for ($k = 0; $k < count($returnedResumes) - 1; $k++) {
            $current  = Carbon::parse($returnedResumes[$k]['updated_at']);
            $next     = Carbon::parse($returnedResumes[$k + 1]['updated_at']);
            expect($current->greaterThanOrEqualTo($next))->toBeTrue();
        }

        // Each resume must also expose is_public
        foreach ($returnedResumes as $r) {
            expect($r)->toHaveKey('is_public');
        }
    }
})->group('property-tests');

/**
 * Property 4: After deleting a resume, all related records (education, experience,
 * skills, projects, certificates) must be deleted from the database (cascade).
 *
 * Validates: Requirements 2.4, 2.5
 */
test('property 4: deleting a resume cascades to all related sections', function () {
    for ($i = 0; $i < 5; $i++) {
        $user = User::factory()->create([
            'plan'           => 'pro',
            'resume_credits' => 0,
        ]);

        $resume = Resume::create([
            'user_id'  => $user->id,
            'title'    => fake()->sentence(3),
            'template' => 'default',
        ]);

        $resumeId = $resume->id;

        // Seed all relation types
        $education = Education::create([
            'resume_id'   => $resumeId,
            'institution' => fake()->company(),
            'degree'      => 'S.Kom',
            'start_date'  => '2018-08-01',
            'end_date'    => '2022-07-31',
        ]);

        $experience = Experience::create([
            'resume_id'  => $resumeId,
            'company'    => fake()->company(),
            'position'   => fake()->jobTitle(),
            'start_date' => '2022-09-01',
            'end_date'   => '2024-01-31',
            'is_current' => false,
        ]);

        $skill = Skill::create([
            'resume_id' => $resumeId,
            'name'      => fake()->word(),
            'level'     => 'intermediate',
        ]);

        $project = Project::create([
            'resume_id'  => $resumeId,
            'name'       => fake()->sentence(2),
            'tech_stack' => 'Laravel, Vue',
        ]);

        $certificate = Certificate::create([
            'resume_id'  => $resumeId,
            'name'       => fake()->sentence(3),
            'issuer'     => fake()->company(),
            'issue_date' => '2023-01-15',
        ]);

        // Verify all records exist before deletion
        $this->assertDatabaseHas('education',    ['id' => $education->id]);
        $this->assertDatabaseHas('experience',   ['id' => $experience->id]);
        $this->assertDatabaseHas('skills',       ['id' => $skill->id]);
        $this->assertDatabaseHas('projects',     ['id' => $project->id]);
        $this->assertDatabaseHas('certificates', ['id' => $certificate->id]);

        // Delete the resume via API
        $this->actingAs($user);
        $response = $this->deleteJson("/api/resumes/{$resumeId}");
        $response->assertStatus(200);

        // All sections must be deleted (cascaded)
        $this->assertDatabaseMissing('resumes',      ['id' => $resumeId]);
        $this->assertDatabaseMissing('education',    ['id' => $education->id]);
        $this->assertDatabaseMissing('experience',   ['id' => $experience->id]);
        $this->assertDatabaseMissing('skills',       ['id' => $skill->id]);
        $this->assertDatabaseMissing('projects',     ['id' => $project->id]);
        $this->assertDatabaseMissing('certificates', ['id' => $certificate->id]);
    }
})->group('property-tests');
