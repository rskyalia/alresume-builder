<?php

namespace App\Http\Controllers;

use App\Http\Resources\PublicResumeResource;
use App\Models\Resume;
use App\Services\ShareService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShareController extends Controller
{
    public function __construct(private ShareService $shareService) {}

    /**
     * Toggle the public visibility of a resume.
     *
     * PATCH /api/resumes/{resume}/visibility
     * Auth: auth:sanctum — user must own the resume (via ResumePolicy)
     *
     * Requirements: 9.1, 9.5, 9.6
     */
    public function toggleVisibility(Request $request, Resume $resume): JsonResponse
    {
        // Authorize: only the resume owner may change visibility
        $this->authorize('update', $resume);

        $validated = $request->validate([
            'is_public' => 'required|boolean',
        ]);

        $result = $this->shareService->toggleVisibility($resume, (bool) $validated['is_public']);

        return response()->json(['data' => $result]);
    }

    /**
     * Display a publicly-shared resume by its public slug.
     *
     * GET /api/r/{publicSlug}  (no auth required)
     *
     * Requirements: 9.2, 9.3, 9.4
     */
    public function show(string $publicSlug): JsonResponse
    {
        $resume = Resume::where('public_slug', $publicSlug)
            ->where('is_public', true)
            ->with(['education', 'experience', 'skills', 'projects', 'certificates'])
            ->firstOrFail(); // automatically returns 404 if not found or is_public=false

        return response()->json(['data' => new PublicResumeResource($resume)]);
    }
}
