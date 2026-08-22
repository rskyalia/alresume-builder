<?php

namespace App\Services;

use App\Models\AiJob;
use App\Models\Resume;
use App\Services\AI\AIProviderException;
use App\Services\AI\GeminiProvider;
use App\Services\AI\OpenAIProvider;

class AIService
{
    /**
     * Attempts per provider before giving up on it. Retrying once recovers
     * from transient failures (network blip, momentary 429/5xx, cold start)
     * without requiring the user to manually re-trigger the job.
     */
    private const MAX_PROVIDER_ATTEMPTS = 2;

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
     * Each provider is retried before moving on.
     *
     * @throws AIProviderException when all providers/attempts fail.
     */
    public function callWithFallback(string $prompt): string
    {
        try {
            return $this->withRetries(fn (): string => $this->gemini->generate($prompt));
        } catch (AIProviderException) {
            // Gemini failed after retries — fall through to OpenAI fallback
        }

        return $this->withRetries(fn (): string => $this->openAI->generate($prompt));
    }

    /**
     * Run a provider call, retrying after a short pause so transient
     * failures don't fail the whole AI job.
     *
     * @throws AIProviderException when every attempt fails.
     */
    private function withRetries(callable $call): string
    {
        $lastException = null;

        for ($attempt = 1; $attempt <= self::MAX_PROVIDER_ATTEMPTS; $attempt++) {
            try {
                return $call();
            } catch (AIProviderException $e) {
                $lastException = $e;

                if ($attempt < self::MAX_PROVIDER_ATTEMPTS) {
                    sleep(2); // brief pause before retrying a transient failure
                }
            }
        }

        throw $lastException;
    }
}
