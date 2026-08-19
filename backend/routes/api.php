<?php

use App\Http\Controllers\AIController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\CreditController;
use App\Http\Controllers\EducationController;
use App\Http\Controllers\ExperienceController;
use App\Http\Controllers\PDFController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ResumeController;
use App\Http\Controllers\ShareController;
use App\Http\Controllers\SkillController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/credits', [CreditController::class, 'status']);
    Route::post('/subscriptions', [CreditController::class, 'createSubscription']);

    Route::apiResource('resumes', ResumeController::class);

    // Resume section routes
    Route::prefix('resumes/{resume}')->group(function (): void {
        Route::apiResource('education', EducationController::class)->shallow();
        Route::apiResource('experience', ExperienceController::class)->shallow();
        Route::apiResource('skills', SkillController::class)->shallow();
        Route::apiResource('projects', ProjectController::class)->shallow();
        Route::apiResource('certificates', CertificateController::class)->shallow();
    });

    // AI endpoints
    Route::post('/resumes/{resume}/ai/summary', [AIController::class, 'triggerSummary']);
    Route::post('/resumes/{resume}/ai/summary/confirm', [AIController::class, 'confirmSummary']);

    Route::post('/resumes/{resume}/experiences/{experience}/ai/rewrite', [AIController::class, 'triggerExperienceRewrite']);
    Route::post('/resumes/{resume}/experiences/{experience}/ai/rewrite/confirm', [AIController::class, 'confirmExperienceRewrite']);

    Route::post('/resumes/{resume}/ai/ats-score', [AIController::class, 'triggerATSScore']);
    Route::post('/resumes/{resume}/ai/cover-letter', [AIController::class, 'triggerCoverLetter']);

    Route::get('/ai/jobs/{aiJob}', [AIController::class, 'getJobStatus']);

    // PDF export
    Route::get('/pdf-templates', [PDFController::class, 'templates']);
    Route::get('/resumes/{resume}/export/pdf', [PDFController::class, 'export']);

    // Share URL — toggle visibility (auth required, must own resume)
    Route::patch('/resumes/{resume}/visibility', [ShareController::class, 'toggleVisibility']);
});

// Public resume view — no auth required (Req 9.2, 9.3, 9.4)
Route::get('/r/{publicSlug}', [ShareController::class, 'show']);
