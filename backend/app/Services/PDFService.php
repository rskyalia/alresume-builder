<?php

namespace App\Services;

use App\Exceptions\ForbiddenException;
use App\Models\PdfTemplate;
use App\Models\Resume;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Str;

class PDFService
{
    /**
     * Get PDF templates available for the given user.
     *
     * Free users only see non-pro templates; pro users see all templates.
     *
     * Requirement: 8.2, 8.4
     */
    public function getAvailableTemplates(User $user): Collection
    {
        $query = PdfTemplate::query();

        if (! $user->isPro()) {
            $query->where('is_pro', false);
        }

        return $query->orderBy('name')->get();
    }

    /**
     * Resolve a PDF template by slug for the given user.
     *
     * If the slug is not found, falls back to the 'default' template.
     * Throws ForbiddenException if the template is pro-only and the user is free.
     *
     * Requirement: 8.3, 8.5
     *
     * @throws ForbiddenException
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function resolveTemplate(string $slug, User $user): PdfTemplate
    {
        $template = PdfTemplate::where('slug', $slug)->first();

        // Fallback to default if not found
        if (! $template) {
            return PdfTemplate::where('slug', 'default')->firstOrFail();
        }

        // Free user cannot use pro templates
        if ($template->is_pro && ! $user->isPro()) {
            throw new ForbiddenException('Template ini tersedia untuk akun Pro.');
        }

        return $template;
    }

    /**
     * Generate a PDF binary from a resume using the given template.
     *
     * Steps:
     * 1. Load all resume relations
     * 2. Read the Blade template HTML from resources/pdf-templates/{slug}.html
     * 3. Render HTML via Blade::render()
     * 4. Write rendered HTML to a temp file in storage/app/tmp/
     * 5. Execute Node.js pdf-generator.js script
     * 6. Read the output PDF binary
     * 7. Clean up temp files
     * 8. Return binary PDF string
     *
     * Requirement: 8.1, 8.6
     *
     * @throws \RuntimeException if Node.js command fails or template file not found
     */
    public function generate(Resume $resume, PdfTemplate $template): string
    {
        // 1. Load all resume relations
        $resume->load([
            'education',
            'experience',
            'skills',
            'projects',
            'certificates',
        ]);

        // 2. Read the Blade template HTML file
        $templatePath = resource_path('pdf-templates/' . $template->slug . '.html');

        if (! file_exists($templatePath)) {
            throw new \RuntimeException("PDF template file tidak ditemukan: {$templatePath}");
        }

        $htmlContent = file_get_contents($templatePath);

        // 3. Render the Blade template with resume data
        $renderedHtml = Blade::render($htmlContent, ['resume' => $resume]);

        // 4. Write rendered HTML to a temp file
        $tmpDir = storage_path('app/tmp');
        if (! is_dir($tmpDir)) {
            mkdir($tmpDir, 0755, true);
        }

        $uuid        = Str::uuid()->toString();
        $inputPath   = $tmpDir . '/resume-' . $uuid . '.html';
        $outputPath  = $tmpDir . '/resume-' . $uuid . '.pdf';

        file_put_contents($inputPath, $renderedHtml);

        // 5. Execute the Node.js pdf-generator.js script
        $scriptPath = base_path('scripts/pdf-generator.js');

        $command = sprintf(
            'node %s --input=%s --output=%s',
            escapeshellarg($scriptPath),
            escapeshellarg($inputPath),
            escapeshellarg($outputPath)
        );

        $descriptorSpec = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];

        $process = proc_open($command, $descriptorSpec, $pipes);

        if (! is_resource($process)) {
            @unlink($inputPath);
            throw new \RuntimeException('Gagal menjalankan proses pdf-generator.js.');
        }

        // Close stdin immediately
        fclose($pipes[0]);

        $stdout = stream_get_contents($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);

        fclose($pipes[1]);
        fclose($pipes[2]);

        $exitCode = proc_close($process);

        if ($exitCode !== 0) {
            @unlink($inputPath);
            @unlink($outputPath);
            throw new \RuntimeException(
                'pdf-generator.js gagal (exit code ' . $exitCode . '): ' . $stderr
            );
        }

        // 6. Read the output PDF binary
        if (! file_exists($outputPath)) {
            @unlink($inputPath);
            throw new \RuntimeException('File PDF output tidak ditemukan setelah eksekusi Node.js.');
        }

        $pdfBinary = file_get_contents($outputPath);

        // 7. Clean up temp files
        @unlink($inputPath);
        @unlink($outputPath);

        // 8. Return binary PDF string
        return $pdfBinary;
    }
}
