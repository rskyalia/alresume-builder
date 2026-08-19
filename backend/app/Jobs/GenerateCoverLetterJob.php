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

class GenerateCoverLetterJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 1;
    public $timeout = 60;

    public function __construct(public string $aiJobId) {}

    public function handle(AIService $aiService): void
    {
        $job = AiJob::findOrFail($this->aiJobId);
        $job->update(['status' => 'processing']);

        try {
            $companyName  = $job->payload['company_name']  ?? null;
            $positionName = $job->payload['position_name'] ?? null;

            if (! $companyName || ! $positionName) {
                throw new \Exception('company_name or position_name not found in payload');
            }

            $resume = $job->resume()->with(['experience', 'skills'])->first();
            $prompt = PromptBuilder::buildCoverLetterPrompt($resume, $companyName, $positionName);
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
