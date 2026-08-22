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

class GenerateAISummaryJob implements ShouldQueue
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
            $resume = $job->resume()->with(['education', 'experience', 'skills'])->first();
            $prompt = PromptBuilder::buildSummaryPrompt($resume);
            $result = $aiService->callWithFallback($prompt);

            $job->update([
                'status' => 'completed',
                'result' => $result,
            ]);
        } catch (\Exception $e) {
            $job->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        }
    }
}
