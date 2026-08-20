<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            // 'keahlian' = Sertifikat Keahlian, 'prestasi' = Sertifikat Prestasi, 'kegiatan' = Sertifikat Kegiatan
            $table->string('certificate_type')->nullable()->default('keahlian')->after('resume_id');
        });
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropColumn('certificate_type');
        });
    }
};
