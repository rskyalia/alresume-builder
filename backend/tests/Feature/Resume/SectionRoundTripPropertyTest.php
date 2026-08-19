<?php

/**
 * Section Round-Trip Property-Based Tests
 *
 * Validates: Requirements 3.4, 3.5, 3.6
 *
 * Run with:
 *   php vendor/bin/pest tests/Feature/Resume/SectionRoundTripPropertyTest.php --group=property-tests
 */

use App\Models\Resume;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;

uses(LazilyRefreshDatabase::class);

/**
 * Property 10: For all valid section entries with random field values,
 * after POST then GET, the returned data must be identical to the stored data.
 *
 * This property tests all 5 section types:
 * education, experience, skill, project, certificate
 *
 * Validates: Requirements 3.4, 3.5, 3.6
 */
test('property 10: education data round-trips correctly through POST and GET', function () {
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

    // Run 5 iterations
    for ($i = 0; $i < 5; $i++) {
        $startDate = fake()->dateTimeBetween('-5 years', '-2 years')->format('Y-m-d');
        $endDate   = fake()->dateTimeBetween($startDate, 'now')->format('Y-m-d');

        $payload = [
            'institution'    => fake()->company(),
            'degree'         => fake()->randomElement(['S.Kom', 'S.T', 'D3', 'S2', 'S3']),
            'field_of_study' => fake()->words(3, true),
            'start_date'     => $startDate,
            'end_date'       => $endDate,
        ];

        // POST - create education
        $postResponse = $this->postJson("/api/resumes/{$resume->id}/education", $payload);
        $postResponse->assertStatus(201);

        // GET - list all education for this resume
        $getResponse = $this->getJson("/api/resumes/{$resume->id}/education");
        $getResponse->assertStatus(200);

        $educationList = $getResponse->json('data.education');

        // Find the just-created entry
        $found = collect($educationList)->firstWhere('institution', $payload['institution']);
        expect($found)->not->toBeNull("Education entry not found in GET response");

        // Verify field values match
        expect($found['institution'])->toBe($payload['institution']);
        expect($found['degree'])->toBe($payload['degree']);
        expect($found['field_of_study'])->toBe($payload['field_of_study']);
        // Dates are cast and returned in ISO format - compare just the date part
        expect(substr($found['start_date'], 0, 10))->toBe($payload['start_date']);
        expect(substr($found['end_date'], 0, 10))->toBe($payload['end_date']);
    }
})->group('property-tests');

test('property 10: experience data round-trips correctly through POST and GET', function () {
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

    // Run 5 iterations
    for ($i = 0; $i < 5; $i++) {
        $startDate = fake()->dateTimeBetween('-5 years', '-2 years')->format('Y-m-d');
        $endDate   = fake()->dateTimeBetween($startDate, 'now')->format('Y-m-d');

        $payload = [
            'company'     => fake()->company(),
            'position'    => fake()->jobTitle(),
            'start_date'  => $startDate,
            'end_date'    => $endDate,
            'is_current'  => false,
            'description' => fake()->paragraph(),
        ];

        // POST - create experience
        $postResponse = $this->postJson("/api/resumes/{$resume->id}/experience", $payload);
        $postResponse->assertStatus(201);

        // GET - list all experience for this resume
        $getResponse = $this->getJson("/api/resumes/{$resume->id}/experience");
        $getResponse->assertStatus(200);

        $experienceList = $getResponse->json('data.experience');

        // Find the just-created entry
        $found = collect($experienceList)->firstWhere('company', $payload['company']);
        expect($found)->not->toBeNull("Experience entry not found in GET response");

        // Verify field values match
        expect($found['company'])->toBe($payload['company']);
        expect($found['position'])->toBe($payload['position']);
        // Dates are cast and returned in ISO format - compare just the date part
        expect(substr($found['start_date'], 0, 10))->toBe($payload['start_date']);
        expect(substr($found['end_date'], 0, 10))->toBe($payload['end_date']);
        expect($found['is_current'])->toBeFalse();
        expect($found['description'])->toBe($payload['description']);
    }
})->group('property-tests');

test('property 10: skill data round-trips correctly through POST and GET', function () {
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

    $levels = ['beginner', 'intermediate', 'advanced'];

    // Run 5 iterations
    for ($i = 0; $i < 5; $i++) {
        $payload = [
            'name'  => fake()->unique()->word() . '_skill_' . $i,
            'level' => fake()->randomElement($levels),
        ];

        // POST - create skill
        $postResponse = $this->postJson("/api/resumes/{$resume->id}/skills", $payload);
        $postResponse->assertStatus(201);

        // GET - list all skills for this resume
        $getResponse = $this->getJson("/api/resumes/{$resume->id}/skills");
        $getResponse->assertStatus(200);

        $skillsList = $getResponse->json('data.skills');

        // Find the just-created entry
        $found = collect($skillsList)->firstWhere('name', $payload['name']);
        expect($found)->not->toBeNull("Skill entry not found in GET response");

        // Verify field values match
        expect($found['name'])->toBe($payload['name']);
        expect($found['level'])->toBe($payload['level']);
    }
})->group('property-tests');

test('property 10: project data round-trips correctly through POST and GET', function () {
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

    // Run 5 iterations
    for ($i = 0; $i < 5; $i++) {
        $payload = [
            'name'        => fake()->unique()->sentence(2) . ' Project ' . $i,
            'description' => fake()->paragraph(),
            'url'         => 'https://github.com/' . fake()->userName() . '/project',
            'tech_stack'  => fake()->randomElements(['Laravel', 'Vue', 'React', 'Node.js', 'Python', 'Docker'], 2, false),
        ];

        // tech_stack needs to be a string
        if (is_array($payload['tech_stack'])) {
            $payload['tech_stack'] = implode(', ', $payload['tech_stack']);
        }

        // POST - create project
        $postResponse = $this->postJson("/api/resumes/{$resume->id}/projects", $payload);
        $postResponse->assertStatus(201);

        // GET - list all projects for this resume
        $getResponse = $this->getJson("/api/resumes/{$resume->id}/projects");
        $getResponse->assertStatus(200);

        $projectsList = $getResponse->json('data.projects');

        // Find the just-created entry
        $found = collect($projectsList)->firstWhere('name', $payload['name']);
        expect($found)->not->toBeNull("Project entry not found in GET response");

        // Verify field values match
        expect($found['name'])->toBe($payload['name']);
        expect($found['description'])->toBe($payload['description']);
        expect($found['url'])->toBe($payload['url']);
        expect($found['tech_stack'])->toBe($payload['tech_stack']);
    }
})->group('property-tests');

test('property 10: certificate data round-trips correctly through POST and GET', function () {
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

    // Run 5 iterations
    for ($i = 0; $i < 5; $i++) {
        $payload = [
            'name'           => fake()->unique()->sentence(3) . ' Certificate ' . $i,
            'issuer'         => fake()->company(),
            'issue_date'     => fake()->dateTimeBetween('-5 years', 'now')->format('Y-m-d'),
            'credential_url' => 'https://credential.example.com/' . fake()->uuid(),
        ];

        // POST - create certificate
        $postResponse = $this->postJson("/api/resumes/{$resume->id}/certificates", $payload);
        $postResponse->assertStatus(201);

        // GET - list all certificates for this resume
        $getResponse = $this->getJson("/api/resumes/{$resume->id}/certificates");
        $getResponse->assertStatus(200);

        $certList = $getResponse->json('data.certificates');

        // Find the just-created entry
        $found = collect($certList)->firstWhere('name', $payload['name']);
        expect($found)->not->toBeNull("Certificate entry not found in GET response");

        // Verify field values match
        expect($found['name'])->toBe($payload['name']);
        expect($found['issuer'])->toBe($payload['issuer']);
        // Dates are cast and returned in ISO format - compare just the date part
        expect(substr($found['issue_date'], 0, 10))->toBe($payload['issue_date']);
        expect($found['credential_url'])->toBe($payload['credential_url']);
    }
})->group('property-tests');
