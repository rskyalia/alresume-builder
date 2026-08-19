<?php

namespace Database\Seeders;

use App\Models\PdfTemplate;
use Illuminate\Database\Seeder;

class PdfTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        PdfTemplate::create([
            'name'        => 'ATS Friendly',
            'slug'        => 'default',
            'description' => 'Clean single-column template optimised for Applicant Tracking Systems.',
            'is_pro'      => false,
            'html_path'   => 'pdf-templates/default.html',
            'thumbnail'   => null,
        ]);

        PdfTemplate::create([
            'name'        => 'Modern Visual',
            'slug'        => 'modern',
            'description' => 'Two-column visual template with accent colours. Pro tier.',
            'is_pro'      => true,
            'html_path'   => 'pdf-templates/modern.html',
            'thumbnail'   => null,
        ]);
    }
}
