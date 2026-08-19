<?php

namespace App\Http\Controllers;

use App\Models\Experience;
use App\Models\Resume;
use App\Services\ResumeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ExperienceController extends Controller
{
    public function __construct(private readonly ResumeService $resumeService) {}

    /**
     * List all experience entries for a resume.
     *
     * GET /api/resumes/{resume}/experience
     * → 200 { success: true, data: { experience: [...] } }
     * → 403 if not the owner
     *
     * Requirement: 3.4, 3.5
     */
    public function index(Request $request, Resume $resume): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $experience = $resume->experience;

        return response()->json([
            'success' => true,
            'data'    => [
                'experience' => $experience,
            ],
            'message' => 'Data pengalaman berhasil diambil.',
        ]);
    }

    /**
     * Create a new experience entry.
     *
     * POST /api/resumes/{resume}/experience
     * Body: company (required), position (required), start_date/end_date (nullable date),
     *       is_current (nullable boolean), description (nullable text)
     * → 201 { success: true, data: { experience: {...} } }
     * → 422 if validation fails
     * → 403 if not the owner
     *
     * Requirement: 3.5, 3.11
     */
    public function store(Request $request, Resume $resume): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $validated = $request->validate([
            'company'     => ['required', 'string', 'max:255'],
            'position'    => ['required', 'string', 'max:255'],
            'start_date'  => ['nullable', 'date'],
            'end_date'    => ['nullable', 'date'],
            'is_current'  => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        // If is_current is true, end_date can be null
        // If is_current is false or not provided, end_date must be present and valid
        $isCurrent = $validated['is_current'] ?? false;

        if ($isCurrent) {
            // Allow end_date to be null when is_current is true
            if (isset($validated['start_date']) && isset($validated['end_date'])) {
                $this->resumeService->validateDates($validated['start_date'], $validated['end_date']);
            }
        } else {
            // When not current, end_date is required
            if (! isset($validated['end_date'])) {
                throw ValidationException::withMessages([
                    'end_date' => ['Tanggal selesai wajib diisi jika pekerjaan sudah berakhir.'],
                ]);
            }

            if (isset($validated['start_date'])) {
                $this->resumeService->validateDates($validated['start_date'], $validated['end_date']);
            }
        }

        $experience = Experience::create([
            ...$validated,
            'resume_id' => $resume->id,
        ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'experience' => $experience,
            ],
            'message' => 'Pengalaman berhasil ditambahkan.',
        ], 201);
    }

    /**
     * Update an experience entry.
     *
     * PUT/PATCH /api/resumes/{resume}/experience/{experience}
     * → 200 { success: true, data: { experience: {...} } }
     * → 422 if validation fails
     * → 403 if not the owner
     *
     * Requirement: 3.6, 3.11
     */
    public function update(Request $request, Resume $resume, Experience $experience): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $validated = $request->validate([
            'company'     => ['required', 'string', 'max:255'],
            'position'    => ['required', 'string', 'max:255'],
            'start_date'  => ['nullable', 'date'],
            'end_date'    => ['nullable', 'date'],
            'is_current'  => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        // Same validation logic as store
        $isCurrent = $validated['is_current'] ?? false;

        if ($isCurrent) {
            if (isset($validated['start_date']) && isset($validated['end_date'])) {
                $this->resumeService->validateDates($validated['start_date'], $validated['end_date']);
            }
        } else {
            if (! isset($validated['end_date'])) {
                throw ValidationException::withMessages([
                    'end_date' => ['Tanggal selesai wajib diisi jika pekerjaan sudah berakhir.'],
                ]);
            }

            if (isset($validated['start_date'])) {
                $this->resumeService->validateDates($validated['start_date'], $validated['end_date']);
            }
        }

        $experience->update($validated);

        return response()->json([
            'success' => true,
            'data'    => [
                'experience' => $experience->fresh(),
            ],
            'message' => 'Pengalaman berhasil diperbarui.',
        ]);
    }

    /**
     * Delete an experience entry.
     *
     * DELETE /api/resumes/{resume}/experience/{experience}
     * → 200 { success: true }
     * → 403 if not the owner
     *
     * Requirement: 3.7
     */
    public function destroy(Request $request, Resume $resume, Experience $experience): JsonResponse
    {
        abort_if($resume->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $experience->delete();

        return response()->json([
            'success' => true,
            'data'    => [],
            'message' => 'Pengalaman berhasil dihapus.',
        ]);
    }
}
