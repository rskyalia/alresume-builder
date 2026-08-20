<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('experience', function (Blueprint $table) {
            // 'kerja' = Pengalaman Kerja, 'lomba' = Lomba, 'organisasi' = Organisasi
            $table->string('experience_type')->nullable()->default('kerja')->after('resume_id');
            // For lomba: tingkat lomba (sekolah/kabupaten/provinsi/nasional/internasional)
            $table->string('competition_level')->nullable()->after('experience_type');
            // For lomba: juara yang diperoleh (e.g. "Juara 1", "Finalis", "Best Paper")
            $table->string('competition_rank')->nullable()->after('competition_level');
            // For organisasi: lingkup organisasi (sekolah/kampus/eksternal)
            $table->string('organization_scope')->nullable()->after('competition_rank');
        });
    }

    public function down(): void
    {
        Schema::table('experience', function (Blueprint $table) {
            $table->dropColumn([
                'experience_type',
                'competition_level',
                'competition_rank',
                'organization_scope',
            ]);
        });
    }
};
