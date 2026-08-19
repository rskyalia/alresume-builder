<?php

/**
 * PDF Template Access Control Property-Based Tests
 *
 * Validates: Requirements 8.3
 *
 * Run with:
 *   php vendor/bin/pest tests/Feature/PDF/PDFTemplatePropertyTest.php --group=property-tests
 */

use App\Models\PdfTemplate;
use App\Models\Resume;
use App\Models\User;
use App\Services\PDFService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(LazilyRefreshDatabase::class);

/**
 * Helper: seed the two default PDF templates required by the application.
 * Using LazilyRefreshDatabase means seeders don't run automatically,
 * so we create the records directly inside each test.
 */
function seedPdfTemplates(): void
{
    if (PdfTemplate::where('slug', 'default')->doesntExist()) {
        PdfTemplate::create([
            'name'      => 'ATS Friendly',
            'slug'      => 'default',
            'is_pro'    => false,
            'html_path' => 'pdf-templates/default.html',
        ]);
    }

    if (PdfTemplate::where('slug', 'modern')->doesntExist()) {
        PdfTemplate::create([
            'name'      => 'Modern Visual',
            'slug'      => 'modern',
            'is_pro'    => true,
            'html_path' => 'pdf-templates/modern.html',
        ]);
    }
}

// ---------------------------------------------------------------------------
// Property 16 — Free user + pro template → always 403
// ---------------------------------------------------------------------------

/**
 * Property 16: For ALL free users requesting PDF export with a pro template,
 * the response MUST always be 403.
 *
 * We mock PDFService::generate() so Puppeteer is never invoked.
 * The 403 is triggered by PDFService::resolveTemplate() throwing
 * ForbiddenException before generate() is even called.
 *
 * Validates: Requirements 8.3
 */
test('property 16: free user requesting pro template always gets 403', function () {
    seedPdfTemplates();

    // Mock PDFService::generate() to avoid Puppeteer; resolveTemplate() is NOT mocked
    // so access-control logic runs for real.
    $this->mock(PDFService::class, function ($mock): void {
        // Partial mock: delegate resolveTemplate to the real implementation
        $realService = new PDFService();

        $mock->shouldReceive('resolveTemplate')
            ->andReturnUsing(fn (string $slug, User $user) => $realService->resolveTemplate($slug, $user));

        // generate() should never be reached for free users with pro templates
        $mock->shouldReceive('generate')->never();

        // getAvailableTemplates not used in export route, but define it for safety
        $mock->shouldReceive('getAvailableTemplates')
            ->andReturnUsing(fn (User $user) => $realService->getAvailableTemplates($user));
    });

    // Run multiple iterations with independently created free users
    for ($iter = 0; $iter < 5; $iter++) {
        $user = User::factory()->create([
            'plan'           => 'free',
            'resume_credits' => 5,
        ]);

        $resume = Resume::create([
            'user_id'  => $user->id,
            'title'    => fake()->sentence(3),
            'template' => 'default',
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/resumes/' . $resume->id . '/export/pdf?template=modern');

        $response->assertStatus(403);

        // Response must contain the pro-template error message
        $response->assertJson([
            'success' => false,
            'message' => 'Template ini tersedia untuk akun Pro.',
        ]);
    }
})->group('property-tests');

// ---------------------------------------------------------------------------
// Complement A — Pro user + pro template → not 403 (access permitted)
// ---------------------------------------------------------------------------

/**
 * Complement: Pro users CAN access pro templates (resolveTemplate does not throw).
 *
 * We mock PDFService::generate() to return a fake PDF binary so no actual
 * Puppeteer process is needed. The real resolveTemplate() logic is kept.
 *
 * Validates: Requirements 8.3 (complement)
 */
test('complement: pro user can access pro template without 403', function () {
    seedPdfTemplates();

    $this->mock(PDFService::class, function ($mock): void {
        $realService = new PDFService();

        $mock->shouldReceive('resolveTemplate')
            ->andReturnUsing(fn (string $slug, User $user) => $realService->resolveTemplate($slug, $user));

        // Return a minimal fake PDF binary so the controller can build the response
        $mock->shouldReceive('generate')
            ->andReturn('%PDF-1.4 fake-binary-content');

        $mock->shouldReceive('getAvailableTemplates')
            ->andReturnUsing(fn (User $user) => $realService->getAvailableTemplates($user));
    });

    for ($iter = 0; $iter < 5; $iter++) {
        $user = User::factory()->create(['plan' => 'pro']);

        $resume = Resume::create([
            'user_id'  => $user->id,
            'title'    => fake()->sentence(3),
            'template' => 'modern',
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/resumes/' . $resume->id . '/export/pdf?template=modern');

        // Must NOT be 403 — pro users are allowed
        $response->assertStatus(200);
    }
})->group('property-tests');

// ---------------------------------------------------------------------------
// Complement B — Free user + non-pro template → not 403 (access permitted)
// ---------------------------------------------------------------------------

/**
 * Complement: Free users CAN access non-pro (default) templates.
 *
 * Validates: Requirements 8.1, 8.3 (complement)
 */
test('complement: free user can access non-pro template without 403', function () {
    seedPdfTemplates();

    $this->mock(PDFService::class, function ($mock): void {
        $realService = new PDFService();

        $mock->shouldReceive('resolveTemplate')
            ->andReturnUsing(fn (string $slug, User $user) => $realService->resolveTemplate($slug, $user));

        $mock->shouldReceive('generate')
            ->andReturn('%PDF-1.4 fake-binary-content');

        $mock->shouldReceive('getAvailableTemplates')
            ->andReturnUsing(fn (User $user) => $realService->getAvailableTemplates($user));
    });

    for ($iter = 0; $iter < 5; $iter++) {
        $user = User::factory()->create([
            'plan'           => 'free',
            'resume_credits' => 5,
        ]);

        $resume = Resume::create([
            'user_id'  => $user->id,
            'title'    => fake()->sentence(3),
            'template' => 'default',
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/resumes/' . $resume->id . '/export/pdf?template=default');

        // Must NOT be 403 — non-pro template is accessible to free users
        $response->assertStatus(200);
    }
})->group('property-tests');
