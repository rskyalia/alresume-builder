<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_ai_usage', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->date('usage_date');
            $table->integer('count')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'type', 'usage_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_ai_usage');
    }
};
