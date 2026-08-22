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


    public function getAvailableTemplates(User $user): Collection
    {
        $query = PdfTemplate::query();
        if (! $user->isPro()) {
            $query->where('is_pro', false);
        }
        return $query->orderBy('name')->get();
    }

    public function resolveTemplate(string $slug, User $user): PdfTemplate
    {
        $template = PdfTemplate::where('slug', $slug)->first();
        if (! $template) {
            return PdfTemplate::where('slug', 'default')->firstOrFail();
        }
        if ($template->is_pro && ! $user->isPro()) {
            throw new ForbiddenException('Template ini tersedia untuk akun Pro.');
        }
        return $template;
    }

    public function generate(Resume $resume, PdfTemplate $template): string
    {
        // Load all relations
        $resume->load(['education', 'experience', 'skills', 'projects', 'certificates']);

        // Read Blade template
        $templatePath = resource_path('pdf-templates/' . $template->slug . '.html');
        if (! file_exists($templatePath)) {
            throw new \RuntimeException("PDF template tidak ditemukan: {$templatePath}");
        }

        $htmlContent  = file_get_contents($templatePath);
        $renderedHtml = Blade::render($htmlContent, ['resume' => $resume]);

        // Temp files
        $tmpDir = storage_path('app/tmp');
        if (! is_dir($tmpDir)) {
            mkdir($tmpDir, 0755, true);
        }

        $uuid       = Str::uuid()->toString();
        $inputPath  = $tmpDir . DIRECTORY_SEPARATOR . 'resume-' . $uuid . '.html';
        $outputPath = $tmpDir . DIRECTORY_SEPARATOR . 'resume-' . $uuid . '.pdf';

        file_put_contents($inputPath, $renderedHtml);

        $scriptPath = base_path('scripts/pdf-generator.js');
        
        $cmd = sprintf(
            'node "%s" --input="%s" --output="%s" 2>&1',
            $scriptPath,
            $inputPath,
            $outputPath
        );

        $output = shell_exec($cmd);
        $pdfExists = file_exists($outputPath);

        @unlink($inputPath);

        if (! $pdfExists || filesize($outputPath) === 0) {
            @unlink($outputPath);
            throw new \RuntimeException('PDF generation gagal. Output: ' . ($output ?? '(kosong)'));
        }

        $pdfBinary = file_get_contents($outputPath);
        @unlink($outputPath);

        return $pdfBinary;
    }
}
