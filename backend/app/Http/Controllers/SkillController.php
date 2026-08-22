<?php

namespace App\Http\Controllers;

use App\Models\Resume;
use App\Models\Skill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SkillController extends Controller
{
    /**
     * List all skills for a resume.
     *
     * GET /api/resumes/{resume}/skills
     * → 200 { success: true, data: { skills: [...] } }
     * → 403 if not the owner
     *
     * Requirement: 3.4, 3.5
     */
    public function index(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('view', $resume);

        $skills = $resume->skills;

        return response()->json([
            'success' => true,
            'data'    => [
                'skills' => $skills,
            ],
            'message' => 'Data keterampilan berhasil diambil.',
        ]);
    }

    /**
     * Create a new skill entry.
     *
     * POST /api/resumes/{resume}/skills
     * Body: name (required, string, max:255), level (required, in:beginner,intermediate,advanced)
     * → 201 { success: true, data: { skill: {...} } }
     * → 422 if validation fails
     * → 403 if not the owner
     *
     * Requirement: 3.5
     */
    public function store(Request $request, Resume $resume): JsonResponse
    {
        $this->authorize('update', $resume);

        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:255'],
            'level' => ['required', 'string', 'in:beginner,intermediate,advanced'],
        ]);

        $skill = Skill::create([
            ...$validated,
            'resume_id' => $resume->id,
        ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'skill' => $skill,
            ],
            'message' => 'Keterampilan berhasil ditambahkan.',
        ], 201);
    }

    /**
     * Update a skill entry.
     *
     * PUT/PATCH /api/resumes/{resume}/skills/{skill}
     * → 200 { success: true, data: { skill: {...} } }
     * → 422 if validation fails
     * → 403 if not the owner
     *
     * Requirement: 3.6
     */
    public function update(Request $request, Resume $resume, Skill $skill): JsonResponse
    {
        $this->authorize('manageSection', [$resume, $skill]);

        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:255'],
            'level' => ['required', 'string', 'in:beginner,intermediate,advanced'],
        ]);

        $skill->update($validated);

        return response()->json([
            'success' => true,
            'data'    => [
                'skill' => $skill->fresh(),
            ],
            'message' => 'Keterampilan berhasil diperbarui.',
        ]);
    }

    /**
     * Delete a skill entry.
     *
     * DELETE /api/resumes/{resume}/skills/{skill}
     * → 200 { success: true }
     * → 403 if not the owner
     *
     * Requirement: 3.7
     */
    public function destroy(Request $request, Resume $resume, Skill $skill): JsonResponse
    {
        $this->authorize('manageSection', [$resume, $skill]);

        $skill->delete();

        return response()->json([
            'success' => true,
            'data'    => [],
            'message' => 'Keterampilan berhasil dihapus.',
        ]);
    }
}
