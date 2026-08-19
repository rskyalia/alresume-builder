<?php

namespace App\Services;

use App\Models\AiJob;
use App\Models\Resume;
use App\Services\AI\AIProviderException;
use App\Services\AI\GeminiProvider;
use App\Services\AI\OpenAIProvider;

class AIService
{
    public function __construct(
        private readonly RateLimitService $rateLimitService,
        private readonly GeminiProvider $gemini,
        private readonly OpenAIProvider $openAI,
    ) {}

    /**
     * Check rate limit, create an AiJob record with status=pending,
     * dispatch to the queue, and return the job.
     *
     * Note: Queue job dispatch is commented out pending Task 8 implementation.
     */
    public function dispatchJob(string $type, Resume $resume, array $extra = []): AiJob
    {
        $this->rateLimitService->checkOrFail($resume->user, $type);

        $job = AiJob::create([
            'user_id'   => $resume->user_id,
            'resume_id' => $resume->id,
            'type'      => $type,
            'status'    => 'pending',
            'payload'   => $extra,
        ]);

        // Dispatch sesuai tipe
        match ($type) {
            'summary'            => \App\Jobs\GenerateAISummaryJob::dispatch($job->id),
            'experience_rewrite' => \App\Jobs\RewriteExperienceJob::dispatch($job->id),
            'ats_score'          => \App\Jobs\AnalyzeATSScoreJob::dispatch($job->id),
            'cover_letter'       => \App\Jobs\GenerateCoverLetterJob::dispatch($job->id),
            default              => null,
        };

        return $job;
    }

    /**
     * Call Gemini first; if it fails, fall back to OpenAI.
     * If both providers fail, the last exception is re-thrown.
     *
     * @throws AIProviderException when both providers fail.
     */
    public function callWithFallback(string $prompt): string
    {
        try {
            return $this->gemini->generate($prompt);
        } catch (AIProviderException) {
            // Gemini failed — fall through to OpenAI fallback
        }

        return $this->openAI->generate($prompt);
    }
}
