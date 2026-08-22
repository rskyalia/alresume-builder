<?php

namespace App\Http\Controllers;

use App\Jobs\AnalyzeATSScoreJob;
use App\Jobs\GenerateAISummaryJob;
use App\Jobs\GenerateCoverLetterJob;
use App\Jobs\RewriteExperienceJob;
use App\Models\AiJob;
use App\Models\Experience;
use App\Models\Resume;
use App\Services\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIController extends Controller
{
    public function __construct(private readonly AIService $aiService) {}

    /**
     * Trigger AI summary generation.
     * POST /api/resumes/{resume}/ai/summary
     * → 202 { success: true, data: { job_id, status: "pending" } }
     */
    public function triggerSummary(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('update', $resume);

        $job = $this->aiService->dispatchJob('summary', $resume);

        return response()->json([
            'success' => true,
            'data'    => [
                'job_id' => $job->id,
                'status' => $job->status,
            ],
            'message' => 'AI summary job berhasil dibuat.',
        ], 202);
    }

    /**
     * Trigger experience rewrite.
     * POST /api/resumes/{resume}/experiences/{experience}/ai/rewrite
     * → 202 { success: true, data: { job_id, status: "pending" } }
     */
    public function triggerExperienceRewrite(Request $request, Resume $resume, Experience $experience): JsonResponse
    {
        $this->authorize('manageSection', [$resume, $experience]);

        $job = $this->aiService->dispatchJob('experience_rewrite', $resume, [
            'experience_id' => $experience->id,
        ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'job_id' => $job->id,
                'status' => $job->status,
            ],
            'message' => 'AI rewrite job berhasil dibuat.',
        ], 202);
    }

    /**
     * Trigger ATS score analysis.
     * POST /api/resumes/{resume}/ai/ats-score
     * → 202 { success: true, data: { job_id, status: "pending" } }
     */
    public function triggerATSScore(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('update', $resume);

        $job = $this->aiService->dispatchJob('ats_score', $resume);

        return response()->json([
            'success' => true,
            'data'    => [
                'job_id' => $job->id,
                'status' => $job->status,
            ],
            'message' => 'ATS score analysis job berhasil dibuat.',
        ], 202);
    }

    /**
     * Trigger cover letter generation.
     * POST /api/resumes/{resume}/ai/cover-letter
     * Body: company_name, position_name
     * → 202 { success: true, data: { job_id, status: "pending" } }
     * → 422 if validation fails
     */
    public function triggerCoverLetter(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('update', $resume);

        $validated = $request->validate([
            'company_name'  => ['required', 'string', 'max:255'],
            'position_name' => ['required', 'string', 'max:255'],
        ]);

        $job = $this->aiService->dispatchJob('cover_letter', $resume, $validated);

        return response()->json([
            'success' => true,
            'data'    => [
                'job_id' => $job->id,
                'status' => $job->status,
            ],
            'message' => 'Cover letter job berhasil dibuat.',
        ], 202);
    }

    /**
     * Get AI job status (polling endpoint).
     * GET /api/ai/jobs/{aiJob}
     * → 200 { success: true, data: { job_id, type, status, result?, error_message? } }
     * → 403 if not owner
     */
    public function getJobStatus(Request $request, AiJob $aiJob): JsonResponse
    {
        $this->authorize('view', $aiJob);

        return response()->json([
            'success' => true,
            'data'    => [
                'job_id'        => $aiJob->id,
                'type'          => $aiJob->type,
                'status'        => $aiJob->status,
                'result'        => $aiJob->status === 'completed' ? $aiJob->result : null,
                'error_message' => $aiJob->status === 'failed'    ? $aiJob->error_message : null,
            ],
            'message' => 'Status job berhasil diambil.',
        ]);
    }

    /**
     * Confirm AI summary and save to resume.
     * POST /api/resumes/{resume}/ai/summary/confirm
     * Body: summary_text
     * → 200 { success: true, data: { resume: {...} } }
     */
    public function confirmSummary(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('update', $resume);

        $validated = $request->validate([
            'summary_text' => ['required', 'string'],
        ]);

        $resume->update(['summary' => $validated['summary_text']]);

        return response()->json([
            'success' => true,
            'data'    => [
                'resume' => $resume->fresh(),
            ],
            'message' => 'Summary berhasil disimpan.',
        ]);
    }

    /**
     * Confirm experience rewrite and save to experience.
     * POST /api/resumes/{resume}/experiences/{experience}/ai/rewrite/confirm
     * Body: description_text
     * → 200 { success: true, data: { experience: {...} } }
     */
    public function confirmExperienceRewrite(Request $request, Resume $resume, Experience $experience): JsonResponse
    {
        $this->authorize('manageSection', [$resume, $experience]);

        $validated = $request->validate([
            'description_text' => ['required', 'string'],
        ]);

        $experience->update(['description' => $validated['description_text']]);

        return response()->json([
            'success' => true,
            'data'    => [
                'experience' => $experience->fresh(),
            ],
            'message' => 'Deskripsi pengalaman berhasil disimpan.',
        ]);
    }
}
