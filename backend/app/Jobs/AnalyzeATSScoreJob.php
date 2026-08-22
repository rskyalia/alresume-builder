<?php

namespace App\Jobs;

use App\Models\AiJob;
use App\Services\AIService;
use App\Services\PromptBuilder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class AnalyzeATSScoreJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 1;
    public $timeout = 150;

    public function __construct(public string $aiJobId) {}

    public function handle(AIService $aiService): void
    {
        $job = AiJob::findOrFail($this->aiJobId);
        $job->update(['status' => 'processing']);

        try {
            $resume = $job->resume()->with(['education', 'experience', 'skills', 'certificates'])->first();
            $prompt = PromptBuilder::buildATSPrompt($resume);
            $result = $aiService->callWithFallback($prompt);

            // Parse JSON result
            $parsed = json_decode($result, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('AI returned invalid JSON for ATS score');
            }

            $job->update([
                'status' => 'completed',
                'result' => json_encode($parsed), // Store as JSON string
            ]);
        } catch (\Exception $e) {
            $job->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        }
    }
}
