<?php

namespace App\Http\Controllers;

use App\Models\Resume;
use App\Services\ResumeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResumeController extends Controller
{
    public function __construct(private readonly ResumeService $resumeService) {}

    /**
     * List all resumes belonging to the authenticated user.
     *
     * Resumes are ordered by updated_at descending.
     * Also returns the user's current plan and resume_credits.
     *
     * GET /api/resumes (requires auth:sanctum)
     * → 200 { success: true, data: { resumes, plan, resume_credits } }
     *
     * Requirement: 2.1, 2.2
     */
    public function index(Request $request): JsonResponse
    {
        $user    = $request->user();
        $resumes = $user->resumes()->orderByDesc('updated_at')->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'resumes'        => $resumes,
                'plan'           => $user->plan,
                'resume_credits' => $user->resume_credits,
            ],
            'message' => 'Daftar resume berhasil diambil.',
        ]);
    }

    /**
     * Create a new resume for the authenticated user.
     *
     * POST /api/resumes (requires auth:sanctum)
     * Body: title (required), template (nullable)
     * → 201 { success: true, data: { resume: {...} } }
     * → 403 if user has insufficient credits (handled via InsufficientCreditsException)
     *
     * Requirement: 3.1, 3.2, 3.3
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'    => ['required', 'string', 'max:255'],
            'template' => ['nullable', 'string'],
        ]);

        $resume = $this->resumeService->create($request->user(), $validated);

        return response()->json([
            'success' => true,
            'data'    => [
                'resume' => $resume,
            ],
            'message' => 'Resume berhasil dibuat.',
        ], 201);
    }

    /**
     * Retrieve a single resume with all related sections.
     *
     * Authorization: only the resume's owner may access it.
     *
     * GET /api/resumes/{resume} (requires auth:sanctum)
     * → 200 { success: true, data: { resume: { ...+relations } } }
     * → 403 if not authorized
     *
     * Requirement: 2.2, 3.4
     */
    public function show(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('view', $resume);

        $resume->load([
            'education',
            'experience',
            'skills',
            'projects',
            'certificates',
        ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'resume' => $resume,
            ],
            'message' => 'Resume berhasil diambil.',
        ]);
    }

    /**
     * Update personal information or template for a resume.
     *
     * Authorization: only the resume's owner may update it.
     *
     * PUT/PATCH /api/resumes/{resume} (requires auth:sanctum)
     * → 200 { success: true, data: { resume: {...} } }
     * → 403 if not authorized
     *
     * Requirement: 2.3, 3.4
     */
    public function update(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('update', $resume);

        $validated = $request->validate([
            'title'       => ['nullable', 'string', 'max:255'],
            'template'    => ['nullable', 'string'],
            'full_name'   => ['nullable', 'string', 'max:255'],
            'phone'       => ['nullable', 'string', 'max:50'],
            'address'     => ['nullable', 'string', 'max:500'],
            'summary'     => ['nullable', 'string'],
            'is_public'   => ['nullable', 'boolean'],
            'public_slug' => ['nullable', 'string', 'max:255'],
        ]);

        $resume->update($validated);

        return response()->json([
            'success' => true,
            'data'    => [
                'resume' => $resume->fresh(),
            ],
            'message' => 'Resume berhasil diperbarui.',
        ]);
    }

    /**
     * Delete a resume and all its related sections (cascade via DB).
     *
     * Authorization: only the resume's owner may delete it.
     *
     * DELETE /api/resumes/{resume} (requires auth:sanctum)
     * → 200 { success: true, message: "..." }
     * → 403 if not authorized
     *
     * Requirement: 2.4, 2.5
     */
    public function destroy(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('delete', $resume);

        $this->resumeService->delete($resume);

        return response()->json([
            'success' => true,
            'data'    => [],
            'message' => 'Resume berhasil dihapus.',
        ]);
    }
}
