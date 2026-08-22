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

    public function index(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('view', $resume);

        return response()->json([
            'success' => true,
            'data'    => ['education' => $resume->education],
            'message' => 'Data pendidikan berhasil diambil.',
        ]);
    }

    public function store(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('update', $resume);

        $validated = $request->validate([
            'education_level' => ['nullable', 'string', 'in:sma,perguruan_tinggi'],
            'institution'     => ['required', 'string', 'max:255'],
            'degree'          => ['nullable', 'string', 'max:255'],
            'field_of_study'  => ['nullable', 'string', 'max:255'],
            // gpa bisa string angka atau desimal (nilai SMA bisa > 4)
            'gpa'             => ['nullable', 'string', 'max:20'],
            'start_date'      => ['nullable', 'date'],
            'end_date'        => ['nullable', 'date'],
        ]);

        if (!empty($validated['start_date']) && !empty($validated['end_date'])) {
            $this->resumeService->validateDates($validated['start_date'], $validated['end_date']);
        }

        $education = Education::create([
            ...$validated,
            'resume_id' => $resume->id,
        ]);

        return response()->json([
            'success' => true,
            'data'    => ['education' => $education],
            'message' => 'Pendidikan berhasil ditambahkan.',
        ], 201);
    }

    public function update(Request $request, Resume $resume, Education $education): JsonResponse
    {
        $this->authorize('manageSection', [$resume, $education]);

        $validated = $request->validate([
            'education_level' => ['nullable', 'string', 'in:sma,perguruan_tinggi'],
            'institution'     => ['required', 'string', 'max:255'],
            'degree'          => ['nullable', 'string', 'max:255'],
            'field_of_study'  => ['nullable', 'string', 'max:255'],
            'gpa'             => ['nullable', 'string', 'max:20'],
            'start_date'      => ['nullable', 'date'],
            'end_date'        => ['nullable', 'date'],
        ]);

        if (!empty($validated['start_date']) && !empty($validated['end_date'])) {
            $this->resumeService->validateDates($validated['start_date'], $validated['end_date']);
        }

        $education->update($validated);

        return response()->json([
            'success' => true,
            'data'    => ['education' => $education->fresh()],
            'message' => 'Pendidikan berhasil diperbarui.',
        ]);
    }

    public function destroy(Request $request, Resume $resume, Education $education): JsonResponse
    {
        $this->authorize('manageSection', [$resume, $education]);

        $education->delete();

        return response()->json([
            'success' => true,
            'data'    => [],
            'message' => 'Pendidikan berhasil dihapus.',
        ]);
    }
}
