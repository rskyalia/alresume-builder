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
        PdfTemplate::updateOrCreate(
            ['slug' => 'default'],
            [
                'name'        => 'ATS Friendly',
                'description' => 'Template ATS-friendly satu kolom, cocok untuk semua jenis pekerjaan',
                'is_pro'      => false,
                'html_path'   => 'pdf-templates/default.html',
                'thumbnail'   => null,
            ]
        );

        PdfTemplate::updateOrCreate(
            ['slug' => 'modern'],
            [
                'name'        => 'Modern',
                'description' => 'Dua kolom modern dengan sidebar warna, cocok untuk desainer dan developer',
                'is_pro'      => true,
                'html_path'   => 'pdf-templates/modern.html',
                'thumbnail'   => null,
            ]
        );

        PdfTemplate::updateOrCreate(
            ['slug' => 'minimal'],
            [
                'name'        => 'Minimalis',
                'description' => 'Desain bersih minimalis, elegan dan profesional',
                'is_pro'      => false,
                'html_path'   => 'pdf-templates/minimal.html',
                'thumbnail'   => null,
            ]
        );
    }
}
