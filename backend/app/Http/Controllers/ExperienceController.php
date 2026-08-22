<?php

namespace App\Http\Controllers;

use App\Models\Experience;
use App\Models\Resume;
use App\Services\ResumeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExperienceController extends Controller
{
    public function __construct(private readonly ResumeService $resumeService) {}

    public function index(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('view', $resume);

        return response()->json([
            'success' => true,
            'data'    => ['experience' => $resume->experience],
            'message' => 'Data pengalaman berhasil diambil.',
        ]);
    }

    public function store(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('update', $resume);

        $validated = $request->validate([
            'experience_type'   => ['nullable', 'string', 'in:kerja,lomba,organisasi'],
            'competition_level' => ['nullable', 'string', 'max:100'],
            'competition_rank'  => ['nullable', 'string', 'max:255'],
            'organization_scope'=> ['nullable', 'string', 'in:sekolah,kampus,eksternal'],
            'company'           => ['nullable', 'string', 'max:255'],
            'position'          => ['required', 'string', 'max:255'],
            'start_date'        => ['nullable', 'date'],
            'end_date'          => ['nullable', 'date'],
            'is_current'        => ['nullable', 'boolean'],
            'description'       => ['nullable', 'string'],
        ]);

        $isCurrent = $validated['is_current'] ?? false;
        $expType   = $validated['experience_type'] ?? 'kerja';

        // Date validation only for non-lomba types
        if ($expType !== 'lomba' && !$isCurrent) {
            if (!empty($validated['start_date']) && !empty($validated['end_date'])) {
                $this->resumeService->validateDates($validated['start_date'], $validated['end_date']);
            }
        }

        $experience = Experience::create([
            ...$validated,
            'resume_id' => $resume->id,
        ]);

        return response()->json([
            'success' => true,
            'data'    => ['experience' => $experience],
            'message' => 'Pengalaman berhasil ditambahkan.',
        ], 201);
    }

    public function update(Request $request, Resume $resume, Experience $experience): JsonResponse
    {
        $this->authorize('manageSection', [$resume, $experience]);

        $validated = $request->validate([
            'experience_type'   => ['nullable', 'string', 'in:kerja,lomba,organisasi'],
            'competition_level' => ['nullable', 'string', 'max:100'],
            'competition_rank'  => ['nullable', 'string', 'max:255'],
            'organization_scope'=> ['nullable', 'string', 'in:sekolah,kampus,eksternal'],
            'company'           => ['nullable', 'string', 'max:255'],
            'position'          => ['required', 'string', 'max:255'],
            'start_date'        => ['nullable', 'date'],
            'end_date'          => ['nullable', 'date'],
            'is_current'        => ['nullable', 'boolean'],
            'description'       => ['nullable', 'string'],
        ]);

        $isCurrent = $validated['is_current'] ?? false;
        $expType   = $validated['experience_type'] ?? 'kerja';

        if ($expType !== 'lomba' && !$isCurrent) {
            if (!empty($validated['start_date']) && !empty($validated['end_date'])) {
                $this->resumeService->validateDates($validated['start_date'], $validated['end_date']);
            }
        }

        $experience->update($validated);

        return response()->json([
            'success' => true,
            'data'    => ['experience' => $experience->fresh()],
            'message' => 'Pengalaman berhasil diperbarui.',
        ]);
    }

    public function destroy(Request $request, Resume $resume, Experience $experience): JsonResponse
    {
        $this->authorize('manageSection', [$resume, $experience]);

        $experience->delete();

        return response()->json([
            'success' => true,
            'data'    => [],
            'message' => 'Pengalaman berhasil dihapus.',
        ]);
    }
}
