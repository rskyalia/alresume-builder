<?php

namespace App\Http\Controllers;

use App\Models\Education;
use App\Models\Resume;
use App\Services\ResumeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EducationController extends Controller
{
    public function __construct(private readonly ResumeService $resumeService) {}

    /**
     * List all education entries for a resume.
     *
     * GET /api/resumes/{resume}/education
     * → 200 { success: true, data: { education: [...] } }
     * → 403 if not the owner
     *
     * Requirement: 3.4, 3.5
     */
    public function index(Request $request, Resume $resume): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $education = $resume->education;

        return response()->json([
            'success' => true,
            'data'    => [
                'education' => $education,
            ],
            'message' => 'Data pendidikan berhasil diambil.',
        ]);
    }

    /**
     * Create a new education entry.
     *
     * POST /api/resumes/{resume}/education
     * Body: institution (required), degree/field_of_study/gpa (nullable), start_date/end_date (nullable date)
     * → 201 { success: true, data: { education: {...} } }
     * → 422 if validation fails (including date range)
     * → 403 if not the owner
     *
     * Requirement: 3.5, 3.11
     */
    public function store(Request $request, Resume $resume): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $validated = $request->validate([
            'institution'    => ['required', 'string', 'max:255'],
            'degree'         => ['nullable', 'string', 'max:255'],
            'field_of_study' => ['nullable', 'string', 'max:255'],
            'gpa'            => ['nullable', 'numeric', 'min:0', 'max:4'],
            'start_date'     => ['nullable', 'date'],
            'end_date'       => ['nullable', 'date'],
        ]);

        // Validate date range if both dates are provided
        if (isset($validated['start_date']) && isset($validated['end_date'])) {
            $this->resumeService->validateDates($validated['start_date'], $validated['end_date']);
        }

        $education = Education::create([
            ...$validated,
            'resume_id' => $resume->id,
        ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'education' => $education,
            ],
            'message' => 'Pendidikan berhasil ditambahkan.',
        ], 201);
    }

    /**
     * Update an education entry.
     *
     * PUT/PATCH /api/resumes/{resume}/education/{education}
     * → 200 { success: true, data: { education: {...} } }
     * → 422 if validation fails
     * → 403 if not the owner
     *
     * Requirement: 3.6, 3.11
     */
    public function update(Request $request, Resume $resume, Education $education): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $validated = $request->validate([
            'institution'    => ['required', 'string', 'max:255'],
            'degree'         => ['nullable', 'string', 'max:255'],
            'field_of_study' => ['nullable', 'string', 'max:255'],
            'gpa'            => ['nullable', 'numeric', 'min:0', 'max:4'],
            'start_date'     => ['nullable', 'date'],
            'end_date'       => ['nullable', 'date'],
        ]);

        // Validate date range if both dates are provided
        if (isset($validated['start_date']) && isset($validated['end_date'])) {
            $this->resumeService->validateDates($validated['start_date'], $validated['end_date']);
        }

        $education->update($validated);

        return response()->json([
            'success' => true,
            'data'    => [
                'education' => $education->fresh(),
            ],
            'message' => 'Pendidikan berhasil diperbarui.',
        ]);
    }

    /**
     * Delete an education entry.
     *
     * DELETE /api/resumes/{resume}/education/{education}
     * → 200 { success: true }
     * → 403 if not the owner
     *
     * Requirement: 3.7
     */
    public function destroy(Request $request, Resume $resume, Education $education): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $education->delete();

        return response()->json([
            'success' => true,
            'data'    => [],
            'message' => 'Pendidikan berhasil dihapus.',
        ]);
    }
}
