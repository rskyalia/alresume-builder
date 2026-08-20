<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('education', function (Blueprint $table) {
            // 'sma' = SMA/SMK/MA Sederajat, 'perguruan_tinggi' = Perguruan Tinggi
            $table->string('education_level')->nullable()->after('resume_id');
        });
    }

    public function down(): void
    {
        Schema::table('education', function (Blueprint $table) {
            $table->dropColumn('education_level');
        });
    }
};
