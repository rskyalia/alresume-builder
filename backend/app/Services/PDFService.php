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
     * Path ke Chrome executable (Puppeteer cache atau system Chrome).
     */
    private function findChrome(): string
    {
        $candidates = [
            // Puppeteer downloaded chrome
            getenv('USERPROFILE') . '\\.cache\\puppeteer\\chrome\\win64-152.0.7977.42\\chrome-win64\\chrome.exe',
            getenv('HOME') . '/.cache/puppeteer/chrome/win64-152.0.7977.42/chrome-win64/chrome',
            // System Chrome (Windows)
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            // System Chrome (Linux/Mac)
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
        ];

        foreach ($candidates as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }

        throw new \RuntimeException('Chrome/Chromium tidak ditemukan. Install Chrome atau jalankan: npx puppeteer browsers install chrome');
    }

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

        // Convert backslashes to forward slashes for file:// URL
        $inputUrl = 'file:///' . str_replace('\\', '/', $inputPath);

        $chrome = $this->findChrome();

        // Build Chrome CLI command for headless PDF generation
        $cmd = sprintf(
            '"%s" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage ' .
            '"--print-to-pdf=%s" --print-to-pdf-no-header "%s" 2>&1',
            $chrome,
            str_replace('\\', '/', $outputPath),
            $inputUrl
        );

        $output   = shell_exec($cmd);
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
